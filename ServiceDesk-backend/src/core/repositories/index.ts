// Repository exports
export { BaseRepository, IBaseRepository } from './BaseRepository';
export { IncidentRepository, IIncidentRepository } from './IncidentRepository';
export { ProblemRepository } from './ProblemRepository';
export { ChangeRepository } from './ChangeRepository';
export { SLARepository } from './SLARepository';

// Default instances
import incidentRepository from './IncidentRepository';
import problemRepository from './ProblemRepository';
import changeRepository from './ChangeRepository';
import slaRepository from './SLARepository';

export {
  incidentRepository,
  problemRepository,
  changeRepository,
  slaRepository,
};
