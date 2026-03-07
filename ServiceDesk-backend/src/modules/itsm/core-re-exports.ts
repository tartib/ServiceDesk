/**
 * ITSM Module — Core Re-exports
 *
 * This barrel establishes the ITSM module's ownership over its core entities,
 * services, repositories, and types that currently live in src/core/.
 *
 * New consumers should import from here instead of from core/ directly.
 * Once all consumers are migrated, the physical files can be moved into
 * this module's directory.
 */

// ── Entities (Mongoose models + interfaces) ──────────────────
export {
  default as Incident,
  IIncident,
} from '../../core/entities/Incident';

export {
  default as Problem,
  IProblem,
} from '../../core/entities/Problem';

export {
  default as Change,
  IChange,
} from '../../core/entities/Change';

export {
  default as Release,
  IRelease,
} from '../../core/entities/Release';

export {
  default as SLA,
  ISLA,
} from '../../core/entities/SLA';

export {
  default as ServiceCatalog,
  IServiceCatalogItem,
} from '../../core/entities/ServiceCatalog';

export {
  default as ServiceRequest,
  IServiceRequest,
} from '../../core/entities/ServiceRequest';

export {
  default as Site,
  ISite,
} from '../../core/entities/Site';

export {
  default as ITSMCategory,
  ICategory,
} from '../../core/entities/Category';

export {
  default as ITSMUser,
  IITSMUser,
} from '../../core/entities/User';

// ── Types ────────────────────────────────────────────────────
export * from '../../core/types/itsm.types';

// ── Services ─────────────────────────────────────────────────
export {
  SLAEngine,
} from '../../core/services/SLAEngine';

export {
  IncidentService,
  CreateIncidentDTO,
  UpdateIncidentDTO,
} from '../../core/services/IncidentService';

export {
  ProblemService,
  CreateProblemDTO,
  UpdateProblemDTO,
} from '../../core/services/ProblemService';

export {
  ChangeService,
  CreateChangeDTO,
  UpdateChangeDTO,
} from '../../core/services/ChangeService';

// ── Repositories ─────────────────────────────────────────────
export {
  BaseRepository,
  IBaseRepository,
} from '../../core/repositories/BaseRepository';

export {
  IncidentRepository,
  IIncidentRepository,
} from '../../core/repositories/IncidentRepository';

export { ProblemRepository } from '../../core/repositories/ProblemRepository';
export { ChangeRepository } from '../../core/repositories/ChangeRepository';
export { SLARepository } from '../../core/repositories/SLARepository';

// ── Default service instances ────────────────────────────────
import slaEngine from '../../core/services/SLAEngine';
import incidentService from '../../core/services/IncidentService';
import problemService from '../../core/services/ProblemService';
import changeService from '../../core/services/ChangeService';

export { slaEngine, incidentService, problemService, changeService };

// ── Default repository instances ─────────────────────────────
import incidentRepository from '../../core/repositories/IncidentRepository';
import problemRepository from '../../core/repositories/ProblemRepository';
import changeRepository from '../../core/repositories/ChangeRepository';
import slaRepository from '../../core/repositories/SLARepository';

export { incidentRepository, problemRepository, changeRepository, slaRepository };
