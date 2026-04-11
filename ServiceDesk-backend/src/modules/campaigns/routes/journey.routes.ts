import { Router } from 'express';
import * as ctrl from '../controllers/journey.controller';

const router = Router();

router.get('/', ctrl.listJourneys);
router.get('/:id', ctrl.getJourney);
router.post('/', ctrl.createJourney);
router.patch('/:id', ctrl.updateJourney);
router.delete('/:id', ctrl.deleteJourney);

// Actions
router.post('/:id/publish', ctrl.publishJourney);
router.post('/:id/pause', ctrl.pauseJourney);
router.post('/:id/archive', ctrl.archiveJourney);

// Instances
router.get('/:id/instances', ctrl.getJourneyInstances);

export default router;
