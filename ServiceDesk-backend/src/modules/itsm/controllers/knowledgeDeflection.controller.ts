import { Request, Response } from 'express';
import asyncHandler from '../../../utils/asyncHandler';
import deflectionService from '../../../core/services/KnowledgeDeflectionService';
import { ArticleVisibility } from '../../../models/KnowledgeArticle';

export class KnowledgeDeflectionController {
  suggest = asyncHandler(async (req: Request, res: Response) => {
    const { title, description, category_id, tags, visibility } = req.body;
    if (!title) { res.status(400).json({ success: false, error: 'title is required' }); return; }
    const result = await deflectionService.suggestForTicket(title, description || '', category_id, tags, visibility as ArticleVisibility | undefined);
    res.json({ success: true, data: result });
  });

  markHelpful = asyncHandler(async (req: Request, res: Response) => {
    await deflectionService.recordDeflection(req.params.articleId);
    res.json({ success: true, message: 'Deflection recorded' });
  });

  markNotHelpful = asyncHandler(async (req: Request, res: Response) => {
    await deflectionService.recordNonDeflection(req.params.articleId);
    res.json({ success: true, message: 'Non-deflection recorded' });
  });

  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await deflectionService.getDeflectionStats();
    res.json({ success: true, data: stats });
  });
}

export default new KnowledgeDeflectionController();
