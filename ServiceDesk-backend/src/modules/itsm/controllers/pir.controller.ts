import { Request, Response } from 'express';
import asyncHandler from '../../../utils/asyncHandler';
import pirService from '../../../core/services/PostIncidentReviewService';
import incidentService from '../../../core/services/IncidentService';
import { PIRStatus, MajorIncidentSeverity } from '../../../core/types/itsm.types';

export class PIRController {
  declareMajorIncident = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { severity, reason, bridge } = req.body;
    const user = (req as any).user!;
    if (!severity || !reason) { res.status(400).json({ success: false, error: 'severity and reason are required' }); return; }
    if (!Object.values(MajorIncidentSeverity).includes(severity)) {
      res.status(400).json({ success: false, error: `severity must be one of: ${Object.values(MajorIncidentSeverity).join(', ')}` }); return;
    }
    const incident = await incidentService.declareMajorIncident(id, severity, reason, user.id, user.name, bridge);
    res.status(200).json({ success: true, data: { incident }, message: `Incident declared as major (${severity})` });
  });

  addCommsUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { message, audience } = req.body;
    const user = (req as any).user!;
    if (!message || !audience) { res.status(400).json({ success: false, error: 'message and audience are required' }); return; }
    if (!['internal', 'external', 'all'].includes(audience)) {
      res.status(400).json({ success: false, error: 'audience must be one of: internal, external, all' }); return;
    }
    const incident = await incidentService.addCommsUpdate(id, message, audience, user.id, user.name);
    res.status(201).json({ success: true, data: { incident }, message: 'Communications update added' });
  });

  updateBridge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = (req as any).user!;
    const incident = await incidentService.updateMajorBridge(id, req.body, user.id, user.name);
    res.status(200).json({ success: true, data: { incident }, message: 'Bridge roles updated' });
  });

  createPIR = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { incident_summary, impact_summary, timeline_summary, participants } = req.body;
    const user = (req as any).user!;
    if (!incident_summary || !impact_summary) {
      res.status(400).json({ success: false, error: 'incident_summary and impact_summary are required' }); return;
    }
    const pir = await pirService.createPIR({ incident_id: id, owner: user.id, owner_name: user.name, incident_summary, impact_summary, timeline_summary, participants });
    res.status(201).json({ success: true, data: { pir }, message: 'Post-Incident Review created' });
  });

  getPIRByIncident = asyncHandler(async (req: Request, res: Response) => {
    const pir = await pirService.getPIR(req.params.id);
    res.json({ success: true, data: { pir } });
  });

  listPIRs = asyncHandler(async (req: Request, res: Response) => {
    const { status, owner, page, limit } = req.query;
    const result = await pirService.listPIRs({
      status: status as PIRStatus | undefined, owner: owner as string | undefined,
      page: page ? parseInt(page as string) : undefined, limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json({ success: true, ...result });
  });

  getPIR = asyncHandler(async (req: Request, res: Response) => {
    const pir = await pirService.getPIR(req.params.pirId);
    res.json({ success: true, data: { pir } });
  });

  updatePIR = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user!;
    const pir = await pirService.updatePIR(req.params.pirId, req.body, user.id);
    res.json({ success: true, data: { pir }, message: 'PIR updated' });
  });

  addFollowUpAction = asyncHandler(async (req: Request, res: Response) => {
    const { pirId } = req.params;
    const { description, owner, owner_name, due_date } = req.body;
    const user = (req as any).user!;
    if (!description || !owner || !owner_name) {
      res.status(400).json({ success: false, error: 'description, owner, and owner_name are required' }); return;
    }
    const pir = await pirService.addFollowUpAction(pirId, { description, owner, owner_name, due_date: due_date ? new Date(due_date) : undefined }, user.id);
    res.status(201).json({ success: true, data: { pir }, message: 'Follow-up action added' });
  });

  completeFollowUpAction = asyncHandler(async (req: Request, res: Response) => {
    const { pirId, actionId } = req.params;
    const user = (req as any).user!;
    const pir = await pirService.completeFollowUpAction(pirId, actionId, user.id);
    res.json({ success: true, data: { pir }, message: 'Follow-up action completed' });
  });

  submitForReview = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user!;
    const pir = await pirService.submitForReview(req.params.pirId, user.id);
    res.json({ success: true, data: { pir }, message: 'PIR submitted for review' });
  });

  completePIR = asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user!;
    const pir = await pirService.completePIR(req.params.pirId, user.id);
    res.json({ success: true, data: { pir }, message: 'PIR completed' });
  });
}

export default new PIRController();
