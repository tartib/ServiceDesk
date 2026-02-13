import { UserRole } from './index';

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      phone?: string;
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
