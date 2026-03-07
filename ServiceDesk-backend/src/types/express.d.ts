import { UserRole } from './index';
import { ItsmRole } from '../models/User';

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
