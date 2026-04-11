import { Request, Response } from 'express';
import KnowledgeArticle, { ArticleStatus, ArticleVisibility } from '../../../models/KnowledgeArticle';

export const createArticle = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || 'System';
    const userEmail = req.user?.email || 'system@servicedesk.local';

    const { title, title_ar, content, content_ar, summary, summary_ar, category_id, subcategory_id, tags, visibility, is_featured, site_id } = req.body;

    if (!title || !content || !category_id) {
      return res.status(400).json({ success: false, error: 'Title, content, and category are required' });
    }

    const article = new KnowledgeArticle({
      title: title.trim(),
      title_ar: title_ar?.trim() || title.trim(),
      content,
      content_ar: content_ar || content,
      summary: summary?.trim(),
      summary_ar: summary_ar?.trim(),
      category_id,
      subcategory_id,
      tags: tags || [],
      visibility: visibility || ArticleVisibility.INTERNAL,
      is_featured: is_featured || false,
      site_id,
      author: { id: userId || 'system', name: userName, email: userEmail },
      status: ArticleStatus.DRAFT,
    });

    await article.save();
    res.status(201).json({ success: true, data: article, message: 'Article created successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getArticles = async (req: Request, res: Response) => {
  try {
    const { status, category_id, visibility, search, tags, is_featured, page = 1, limit = 20, sort = '-created_at' } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (category_id) query.category_id = category_id;
    if (visibility) query.visibility = visibility;
    if (is_featured !== undefined) query.is_featured = is_featured === 'true';
    if (tags) query.tags = { $in: (tags as string).split(',') };
    if (search) query.$text = { $search: search as string };

    const skip = (Number(page) - 1) * Number(limit);
    const [articles, total] = await Promise.all([
      KnowledgeArticle.find(query).sort(sort as string).skip(skip).limit(Number(limit)).select('-content -content_ar'),
      KnowledgeArticle.countDocuments(query),
    ]);

    res.json({ success: true, data: articles, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const searchArticles = async (req: Request, res: Response) => {
  try {
    const { q, category_id, limit = 10 } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Search query is required' });

    const query: any = { $text: { $search: q as string }, status: ArticleStatus.PUBLISHED };
    if (category_id) query.category_id = category_id;

    const articles = await KnowledgeArticle.find(query, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(Number(limit))
      .select('article_id title title_ar summary summary_ar category_id tags metrics.views');

    res.json({ success: true, data: articles, count: articles.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getArticleById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { increment_views } = req.query;

    let article = await KnowledgeArticle.findOne({ article_id: id });
    if (!article) article = await KnowledgeArticle.findById(id);
    if (!article) article = await KnowledgeArticle.findOne({ slug: id });
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });

    if (increment_views === 'true') {
      article.metrics.views += 1;
      await article.save();
    }

    res.json({ success: true, data: article });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let article = await KnowledgeArticle.findOne({ article_id: id });
    if (!article) article = await KnowledgeArticle.findById(id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });

    const allowedUpdates = ['title', 'title_ar', 'content', 'content_ar', 'summary', 'summary_ar', 'category_id', 'subcategory_id', 'tags', 'visibility', 'is_featured', 'expires_at'];
    allowedUpdates.forEach(field => { if (updates[field] !== undefined) (article as any)[field] = updates[field]; });
    if (updates.content || updates.content_ar) article.version += 1;

    await article.save();
    res.json({ success: true, data: article, message: 'Article updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const publishArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let article = await KnowledgeArticle.findOne({ article_id: id });
    if (!article) article = await KnowledgeArticle.findById(id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });

    article.status = ArticleStatus.PUBLISHED;
    article.published_at = new Date();
    await article.save();
    res.json({ success: true, data: article, message: 'Article published successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const archiveArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let article = await KnowledgeArticle.findOne({ article_id: id });
    if (!article) article = await KnowledgeArticle.findById(id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });

    article.status = ArticleStatus.ARCHIVED;
    await article.save();
    res.json({ success: true, data: article, message: 'Article archived successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let article = await KnowledgeArticle.findOneAndDelete({ article_id: id });
    if (!article) article = await KnowledgeArticle.findByIdAndDelete(id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });
    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { helpful, rating } = req.body;

    let article = await KnowledgeArticle.findOne({ article_id: id });
    if (!article) article = await KnowledgeArticle.findById(id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });

    if (helpful === true) article.metrics.helpful_count += 1;
    else if (helpful === false) article.metrics.not_helpful_count += 1;

    if (rating !== undefined && rating >= 1 && rating <= 5) {
      const currentTotal = article.metrics.avg_rating * article.metrics.rating_count;
      article.metrics.rating_count += 1;
      article.metrics.avg_rating = (currentTotal + rating) / article.metrics.rating_count;
    }

    await article.save();
    res.json({ success: true, data: article.metrics, message: 'Feedback submitted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const linkIncident = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { incident_id } = req.body;
    if (!incident_id) return res.status(400).json({ success: false, error: 'Incident ID is required' });

    let article = await KnowledgeArticle.findOne({ article_id: id });
    if (!article) article = await KnowledgeArticle.findById(id);
    if (!article) return res.status(404).json({ success: false, error: 'Article not found' });

    if (!article.linked_incidents) article.linked_incidents = [];
    if (!article.linked_incidents.includes(incident_id)) {
      article.linked_incidents.push(incident_id);
      await article.save();
    }

    res.json({ success: true, data: article, message: 'Incident linked successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFeaturedArticles = async (req: Request, res: Response) => {
  try {
    const { limit = 5 } = req.query;
    const articles = await KnowledgeArticle.find({ status: ArticleStatus.PUBLISHED, is_featured: true })
      .sort('-published_at').limit(Number(limit))
      .select('article_id title title_ar summary summary_ar category_id metrics.views');
    res.json({ success: true, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPopularArticles = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const articles = await KnowledgeArticle.find({ status: ArticleStatus.PUBLISHED })
      .sort('-metrics.views').limit(Number(limit))
      .select('article_id title title_ar summary summary_ar category_id metrics.views');
    res.json({ success: true, data: articles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getKnowledgeStats = async (req: Request, res: Response) => {
  try {
    const [totalArticles, publishedArticles, draftArticles, totalViews, avgRating] = await Promise.all([
      KnowledgeArticle.countDocuments(),
      KnowledgeArticle.countDocuments({ status: ArticleStatus.PUBLISHED }),
      KnowledgeArticle.countDocuments({ status: ArticleStatus.DRAFT }),
      KnowledgeArticle.aggregate([{ $group: { _id: null, total: { $sum: '$metrics.views' } } }]),
      KnowledgeArticle.aggregate([{ $match: { 'metrics.rating_count': { $gt: 0 } } }, { $group: { _id: null, avg: { $avg: '$metrics.avg_rating' } } }]),
    ]);
    res.json({ success: true, data: { total_articles: totalArticles, published_articles: publishedArticles, draft_articles: draftArticles, total_views: totalViews[0]?.total || 0, avg_rating: avgRating[0]?.avg || 0 } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
