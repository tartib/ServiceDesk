/**
 * SLA Module Routes
 *
 * Mounts all SLA API endpoints under /api/v2/sla
 */

import { Router } from 'express';
import { authenticate, authorize } from '../../../middleware/auth';

// Policy controllers
import {
  listPolicies, getPolicy, createPolicy, updatePolicy, deletePolicy,
  activatePolicy, deactivatePolicy,
  listGoals, createGoal, updateGoal, deleteGoal,
  listEscalationRules, createEscalationRule, deleteEscalationRule,
} from '../controllers/policy.controller';

// Calendar controllers
import {
  listCalendars, getCalendar, createCalendar, updateCalendar, deleteCalendar,
  setWorkingHours, getWorkingHours,
  getHolidays, addHoliday, removeHoliday,
} from '../controllers/calendar.controller';

// Ticket SLA controllers
import { getTicketSla, getTicketSlaEvents } from '../controllers/ticketSla.controller';

// Report controllers
import { getComplianceReport, getBreachSummary, getStats } from '../controllers/report.controller';

const router = Router();

// All SLA routes require authentication
router.use(authenticate);

// ── Policies ─────────────────────────────────────────────────
router.get('/policies', listPolicies);
router.get('/policies/:id', getPolicy);
router.post('/policies', authorize('admin', 'manager', 'supervisor'), createPolicy);
router.patch('/policies/:id', authorize('admin', 'manager', 'supervisor'), updatePolicy);
router.delete('/policies/:id', authorize('admin', 'manager'), deletePolicy);
router.post('/policies/:id/activate', authorize('admin', 'manager', 'supervisor'), activatePolicy);
router.post('/policies/:id/deactivate', authorize('admin', 'manager', 'supervisor'), deactivatePolicy);

// ── Goals (nested under policy) ──────────────────────────────
router.get('/policies/:policyId/goals', listGoals);
router.post('/policies/:policyId/goals', authorize('admin', 'manager', 'supervisor'), createGoal);
router.patch('/goals/:goalId', authorize('admin', 'manager', 'supervisor'), updateGoal);
router.delete('/goals/:goalId', authorize('admin', 'manager'), deleteGoal);

// ── Escalation Rules (nested under goal) ─────────────────────
router.get('/goals/:goalId/escalation-rules', listEscalationRules);
router.post('/goals/:goalId/escalation-rules', authorize('admin', 'manager', 'supervisor'), createEscalationRule);
router.delete('/escalation-rules/:ruleId', authorize('admin', 'manager'), deleteEscalationRule);

// ── Calendars ────────────────────────────────────────────────
router.get('/calendars', listCalendars);
router.get('/calendars/:id', getCalendar);
router.post('/calendars', authorize('admin', 'manager', 'supervisor'), createCalendar);
router.patch('/calendars/:id', authorize('admin', 'manager', 'supervisor'), updateCalendar);
router.delete('/calendars/:id', authorize('admin', 'manager'), deleteCalendar);

// Calendar working hours
router.get('/calendars/:id/hours', getWorkingHours);
router.put('/calendars/:id/hours', authorize('admin', 'manager', 'supervisor'), setWorkingHours);

// Calendar holidays
router.get('/calendars/:id/holidays', getHolidays);
router.post('/calendars/:id/holidays', authorize('admin', 'manager', 'supervisor'), addHoliday);
router.delete('/calendars/:id/holidays/:date', authorize('admin', 'manager', 'supervisor'), removeHoliday);

// ── Ticket SLA View ──────────────────────────────────────────
router.get('/tickets/:ticketId', getTicketSla);
router.get('/tickets/:ticketId/events', getTicketSlaEvents);

// ── Reports ──────────────────────────────────────────────────
router.get('/reports/compliance', getComplianceReport);
router.get('/reports/breaches', getBreachSummary);
router.get('/reports/stats', getStats);

export default router;
