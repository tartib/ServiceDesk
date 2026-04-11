/**
 * Gamification Module Routes
 */

import { Router } from 'express';
import * as profileCtrl from '../controllers/profile.controller';
import * as leaderboardCtrl from '../controllers/leaderboard.controller';
import * as achievementCtrl from '../controllers/achievement.controller';
import * as adminCtrl from '../controllers/admin.controller';
import * as analyticsCtrl from '../controllers/analytics.controller';

const router = Router();

// ── Profile ──────────────────────────────────────────────────
router.get('/profile/me', profileCtrl.getMyProfile);
router.get('/profile/:userId', profileCtrl.getUserProfile);

// ── Leaderboard ──────────────────────────────────────────────
router.get('/leaderboard', leaderboardCtrl.getLeaderboard);
router.get('/leaderboard/my-rank', leaderboardCtrl.getMyRank);
router.get('/leaderboard/team', leaderboardCtrl.getTeamLeaderboard);

// ── Achievements ─────────────────────────────────────────────
router.get('/achievements/me', achievementCtrl.getMyAchievements);
router.get('/achievements/definitions', achievementCtrl.getAchievementDefinitions);
router.get('/achievements/:userId', achievementCtrl.getUserAchievements);

// ── Admin ────────────────────────────────────────────────────
router.get('/admin/rules', adminCtrl.listRules);
router.post('/admin/rules', adminCtrl.createRule);
router.patch('/admin/rules/:id', adminCtrl.updateRule);
router.delete('/admin/rules/:id', adminCtrl.deleteRule);

router.get('/admin/achievements', adminCtrl.listAchievementDefs);
router.post('/admin/achievements', adminCtrl.createAchievementDef);
router.patch('/admin/achievements/:id', adminCtrl.updateAchievementDef);
router.delete('/admin/achievements/:id', adminCtrl.deleteAchievementDef);

router.get('/admin/growth-states', adminCtrl.listGrowthStates);
router.put('/admin/growth-states', adminCtrl.upsertGrowthStates);

router.get('/admin/org-config', adminCtrl.getOrgConfig);
router.put('/admin/org-config', adminCtrl.updateOrgConfig);

router.get('/admin/audit-log', adminCtrl.getAuditLog);

// ── Analytics ────────────────────────────────────────────────
router.get('/analytics/points-over-time', analyticsCtrl.getPointsOverTime);
router.get('/analytics/streaks', analyticsCtrl.getStreakAnalytics);
router.get('/analytics/engagement', analyticsCtrl.getEngagementAnalytics);
router.get('/analytics/achievements-unlocked', analyticsCtrl.getAchievementsUnlocked);

export default router;
