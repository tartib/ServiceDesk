import KnowledgeArticle, { ArticleStatus, ArticleVisibility } from '../../models/KnowledgeArticle';
import logger from '../../utils/logger';

export interface DeflectionSuggestion {
  article_id: string;
  title: string;
  summary?: string;
  slug?: string;
  relevance_score: number;
  views: number;
  helpful_count: number;
}

export interface DeflectionResult {
  suggestions: DeflectionSuggestion[];
  deflection_possible: boolean;
  search_terms: string[];
}

export class KnowledgeDeflectionService {
  /**
   * Suggest KB articles to deflect a ticket before submission
   * Uses MongoDB text search + tag matching
   */
  async suggestForTicket(
    title: string,
    description: string,
    categoryId?: string,
    tags?: string[],
    visibility: ArticleVisibility = ArticleVisibility.INTERNAL,
    limit: number = 5
  ): Promise<DeflectionResult> {
    const searchTerms = this.extractKeywords(title, description);

    if (searchTerms.length === 0) {
      return { suggestions: [], deflection_possible: false, search_terms: [] };
    }

    const searchQuery = searchTerms.join(' ');
    const baseFilter: any = {
      status: ArticleStatus.PUBLISHED,
      visibility: { $in: [visibility, ArticleVisibility.PUBLIC] },
    };

    try {
      // Primary: full-text search
      const textResults = await KnowledgeArticle.find(
        {
          ...baseFilter,
          $text: { $search: searchQuery },
        },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit);

      // Secondary: category + tag match if text results are insufficient
      let tagResults: any[] = [];
      if (textResults.length < limit && (categoryId || tags?.length)) {
        const tagFilter: any = { ...baseFilter };
        if (categoryId) tagFilter.category_id = categoryId;
        if (tags?.length) tagFilter.tags = { $in: tags };

        tagResults = await KnowledgeArticle.find(tagFilter)
          .sort({ 'metrics.views': -1, 'metrics.helpful_count': -1 })
          .limit(limit - textResults.length);
      }

      // Merge and deduplicate
      const seen = new Set<string>();
      const merged: DeflectionSuggestion[] = [];

      for (const art of [...textResults, ...tagResults]) {
        if (seen.has(art.article_id)) continue;
        seen.add(art.article_id);

        const score = (art as any)._doc?.score ?? (art as any).score ?? 1;

        merged.push({
          article_id: art.article_id,
          title: art.title,
          summary: art.summary,
          slug: art.slug,
          relevance_score: Math.round(score * 10) / 10,
          views: art.metrics?.views ?? 0,
          helpful_count: art.metrics?.helpful_count ?? 0,
        });
      }

      // Track deflection attempt by incrementing views
      if (merged.length > 0) {
        await KnowledgeArticle.updateMany(
          { article_id: { $in: merged.slice(0, 3).map((s) => s.article_id) } },
          { $inc: { 'metrics.views': 1 } }
        );
      }

      logger.debug(`Knowledge deflection: ${merged.length} suggestions for "${title.substring(0, 50)}"`, {
        searchTerms,
        categoryId,
      });

      return {
        suggestions: merged.slice(0, limit),
        deflection_possible: merged.length > 0,
        search_terms: searchTerms,
      };
    } catch (error: any) {
      logger.warn('Knowledge deflection search failed', { error: error.message });
      return { suggestions: [], deflection_possible: false, search_terms: searchTerms };
    }
  }

  /**
   * Record that a user found an article helpful (avoided creating a ticket)
   */
  async recordDeflection(articleId: string): Promise<void> {
    await KnowledgeArticle.updateOne(
      { article_id: articleId },
      { $inc: { 'metrics.helpful_count': 1 } }
    );
    logger.info(`Deflection recorded for article: ${articleId}`);
  }

  /**
   * Record that a user did NOT find the article helpful (ticket still submitted)
   */
  async recordNonDeflection(articleId: string): Promise<void> {
    await KnowledgeArticle.updateOne(
      { article_id: articleId },
      { $inc: { 'metrics.not_helpful_count': 1 } }
    );
  }

  /**
   * Get deflection rate stats: how many views led to helpful vs not
   */
  async getDeflectionStats(): Promise<{
    total_articles: number;
    total_views: number;
    total_helpful: number;
    total_not_helpful: number;
    deflection_rate: number;
    top_deflecting: { article_id: string; title: string; helpful_count: number }[];
  }> {
    const [stats, topDeflecting] = await Promise.all([
      KnowledgeArticle.aggregate([
        { $match: { status: ArticleStatus.PUBLISHED } },
        {
          $group: {
            _id: null,
            total_articles: { $sum: 1 },
            total_views: { $sum: '$metrics.views' },
            total_helpful: { $sum: '$metrics.helpful_count' },
            total_not_helpful: { $sum: '$metrics.not_helpful_count' },
          },
        },
      ]),
      KnowledgeArticle.find({ status: ArticleStatus.PUBLISHED })
        .sort({ 'metrics.helpful_count': -1 })
        .limit(10)
        .select('article_id title metrics.helpful_count'),
    ]);

    const s = stats[0] || {
      total_articles: 0,
      total_views: 0,
      total_helpful: 0,
      total_not_helpful: 0,
    };
    const totalRated = s.total_helpful + s.total_not_helpful;
    const deflectionRate = totalRated > 0 ? Math.round((s.total_helpful / totalRated) * 100) : 0;

    return {
      ...s,
      deflection_rate: deflectionRate,
      top_deflecting: topDeflecting.map((a) => ({
        article_id: a.article_id,
        title: a.title,
        helpful_count: a.metrics?.helpful_count ?? 0,
      })),
    };
  }

  /**
   * Extract meaningful keywords from title + description
   */
  private extractKeywords(title: string, description: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
      'should', 'may', 'might', 'must', 'can', 'could', 'not', 'and', 'or',
      'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
      'up', 'about', 'into', 'through', 'during', 'i', 'my', 'we', 'our',
      'you', 'your', 'it', 'its', 'this', 'that', 'how', 'what', 'when',
    ]);

    const combined = `${title} ${description.substring(0, 300)}`;
    const words = combined
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    // Deduplicate and take top 10 most frequent
    const freq: Record<string, number> = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([w]) => w);
  }
}

export default new KnowledgeDeflectionService();
