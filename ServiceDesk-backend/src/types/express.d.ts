import { UserRole } from './index';
import { ItsmRole } from '../models/User';

// Express 5 widens req.query values via qs ParsedQs (string | string[] | ParsedQs | ...).
// Narrow ParsedQs so existing controllers that treat query values as `string` compile unchanged.
declare module 'qs' {
  interface ParsedQs {
    [key: string]: string | undefined;
  }
}

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      itsmRole: ItsmRole;
      phone?: string;
      department?: string;
      teamIds: string[];
      isActive: boolean;
      organizations: Array<{
        organizationId: string;
        role: string;
        joinedAt: Date;
      }>;
      organizationId?: string;
      site_id?: string;
      createdAt: Date;
      updatedAt: Date;
    };
    correlationId?: string;
  }
}
