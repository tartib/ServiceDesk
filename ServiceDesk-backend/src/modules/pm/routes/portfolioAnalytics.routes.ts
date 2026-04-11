import { Router, Request, Response } from 'express';
import { param, query } from 'express-validator';
import * as portfolioController from '../controllers/portfolioAnalytics.controller';
import { authenticate } from '../../../middleware/auth';
import { handleValidation } from '../../../shared/middleware/validate';

const router = Router();

router.use(authenticate);

// Cross-project overview KPIs
router.get('/overview', (req: Request, res: Response) =>
  portfolioController.getPortfolioOverview(req, res)
);

// Per-project summary list
router.get('/projects', (req: Request, res: Response) =>
  portfolioController.getPortfolioProjects(req, res)
);

// Time-series trends (last N weeks)
router.get(
  '/trends',
  [query('weeks').optional().isNumeric()],
  handleValidation,
  (req: Request, res: Response) => portfolioController.getPortfolioTrends(req, res)
);

// Cross-project team workload
router.get('/team-workload', (req: Request, res: Response) =>
  portfolioController.getPortfolioTeamWorkload(req, res)
);

// Per-project drill-down performance
router.get(
  '/projects/:projectId/performance',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => portfolioController.getProjectPerformance(req, res)
);

// Generate project report
router.get(
  '/projects/:projectId/report',
  [param('projectId').isMongoId().withMessage('Invalid project ID')],
  handleValidation,
  (req: Request, res: Response) => portfolioController.generateProjectReport(req, res)
);

export default router;
