// Service exports
export { SLAEngine } from './SLAEngine';
export { IncidentService, CreateIncidentDTO, UpdateIncidentDTO } from './IncidentService';
export { ProblemService, CreateProblemDTO, UpdateProblemDTO } from './ProblemService';
export { ChangeService, CreateChangeDTO, UpdateChangeDTO } from './ChangeService';

// Default instances
import slaEngine from './SLAEngine';
import incidentService from './IncidentService';
import problemService from './ProblemService';
import changeService from './ChangeService';

export {
  slaEngine,
  incidentService,
  problemService,
  changeService,
};
