import { Router } from 'express';
import { authenticate } from '../../../middleware/auth';
import * as leaderboardCtrl from '../controllers/leaderboard.controller';

const router = Router();

router.use(authenticate);

router.get('/', leaderboardCtrl.getLeaderboard);
router.get('/:month/:year', leaderboardCtrl.getLeaderboardByMonth);
router.get('/department/:department', leaderboardCtrl.getLeaderboardByDepartment);

export default router;
