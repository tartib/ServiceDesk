import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import * as portfolioController from '../../controllers/pm/portfolioAnalytics.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

// Cross-project overview KPIs
router.get('/overview', (req: Request, res: Response) =>
  portfolioController.getPortfolioOverview(req as any, res)
);

// Per-project summary list
router.get('/projects', (req: Request, res: Response) =>
  portfolioController.getPortfolioProjects(req as any, res)
);

// Time-series trends (last N weeks)
router.get(
  '/trends',
  [query('weeks').optional().isNumeric()],
  (req: Request, res: Response) => portfolioController.getPortfolioTrends(req as any, res)
);

// Cross-project team workload
router.get('/team-workload', (req: Request, res: Response) =>
  portfolioController.getPortfolioTeamWorkload(req as any, res)
);

// Per-project drill-down performance
router.get(
  '/projects/:projectId/performance',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  (req: Request, res: Response) => portfolioController.getProjectPerformance(req as any, res)
);

export default router;
