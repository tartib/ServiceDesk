import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '../utils/logger';
import env from './env';
import { verifyToken } from '../utils/jwt';
import User from '../models/User';

let io: Server | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  organizationId?: string;
}

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        const allowedOrigins = [env.CORS_ORIGIN, 'http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin) || (env.NODE_ENV === 'development' && origin.endsWith(':3000'))) {
          callback(null, origin || true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware: Authenticate socket connection
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = verifyToken(token);
      const userId = decoded.id || (decoded as any).userId;
      const user = await User.findById(userId).select('-password');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      if (!user.isActive) {
        return next(new Error('Authentication error: User account is deactivated'));
      }

      socket.userId = userId;
      socket.userRole = user.role;
      
      // Check for organization context
      const organizationId = socket.handshake.headers['x-organization-id'];
      if (organizationId && typeof organizationId === 'string') {
        const isMember = user.organizations.some(
          (org) => org.organizationId.toString() === organizationId
        );
        if (isMember) {
          socket.organizationId = organizationId;
        }
      }

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`🔌 Client connected: ${socket.id} | User: ${socket.userId}`);

    // Join rooms based on authenticated user role
    socket.on('join:itsm', () => {
      if (!socket.userId) {
        socket.emit('error', 'Not authenticated');
        return;
      }
      socket.join('itsm-dashboard');
      socket.join(`user:${socket.userId}`);
      if (socket.userRole === 'manager' || socket.userRole === 'supervisor') {
        socket.join('itsm-managers');
      }
      logger.info(`User ${socket.userId} (${socket.userRole}) joined ITSM dashboard`);
    });

    socket.on('join:self-service', () => {
      if (!socket.userId) {
        socket.emit('error', 'Not authenticated');
        return;
      }
      socket.join('self-service');
      socket.join(`user:${socket.userId}`);
      logger.info(`User ${socket.userId} joined self-service portal`);
    });

    // Leave rooms
    socket.on('leave:itsm', () => {
      socket.leave('itsm-dashboard');
      socket.leave('itsm-managers');
    });

    socket.on('leave:self-service', () => {
      socket.leave('self-service');
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  logger.info('🔌 WebSocket server initialized');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Type definitions for events
interface ITSMEvent {
  id?: string;
  requester?: { id: string };
  assigned_to?: { technician_id: string };
}

interface ServiceRequestEvent {
  id?: string;
  requester?: { id: string };
  assigned_to?: { technician_id: string };
}

interface ProblemEvent {
  id?: string;
}

interface ChangeEvent {
  id?: string;
}

interface StatsEvent {
  [key: string]: unknown;
}

interface NotificationEvent {
  [key: string]: unknown;
}

// Event emitters for different ITSM events
export const emitIncidentCreated = (incident: ITSMEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('incident:created', incident);
    if (incident.requester?.id) {
      io.to(`user:${incident.requester.id}`).emit('incident:created', incident);
    }
  }
};

export const emitIncidentUpdated = (incident: ITSMEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('incident:updated', incident);
    if (incident.requester?.id) {
      io.to(`user:${incident.requester.id}`).emit('incident:updated', incident);
    }
    if (incident.assigned_to?.technician_id) {
      io.to(`user:${incident.assigned_to.technician_id}`).emit('incident:updated', incident);
    }
  }
};

export const emitServiceRequestCreated = (request: ServiceRequestEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('service-request:created', request);
    io.to('itsm-managers').emit('service-request:pending-approval', request);
    if (request.requester?.id) {
      io.to(`user:${request.requester.id}`).emit('service-request:created', request);
    }
  }
};

export const emitServiceRequestUpdated = (request: ServiceRequestEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('service-request:updated', request);
    if (request.requester?.id) {
      io.to(`user:${request.requester.id}`).emit('service-request:updated', request);
    }
    if (request.assigned_to?.technician_id) {
      io.to(`user:${request.assigned_to.technician_id}`).emit('service-request:updated', request);
    }
  }
};

export const emitServiceRequestApproved = (request: ServiceRequestEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('service-request:approved', request);
    if (request.requester?.id) {
      io.to(`user:${request.requester.id}`).emit('service-request:approved', request);
    }
  }
};

export const emitServiceRequestRejected = (request: ServiceRequestEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('service-request:rejected', request);
    if (request.requester?.id) {
      io.to(`user:${request.requester.id}`).emit('service-request:rejected', request);
    }
  }
};

export const emitProblemCreated = (problem: ProblemEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('problem:created', problem);
  }
};

export const emitProblemUpdated = (problem: ProblemEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('problem:updated', problem);
  }
};

export const emitChangeCreated = (change: ChangeEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('change:created', change);
    io.to('itsm-managers').emit('change:pending-approval', change);
  }
};

export const emitChangeUpdated = (change: ChangeEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('change:updated', change);
  }
};

export const emitStatsUpdated = (stats: StatsEvent): void => {
  if (io) {
    io.to('itsm-dashboard').emit('stats:updated', stats);
  }
};

export const emitNotification = (userId: string, notification: NotificationEvent): void => {
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }
};

export default {
  initializeSocket,
  getIO,
  emitIncidentCreated,
  emitIncidentUpdated,
  emitServiceRequestCreated,
  emitServiceRequestUpdated,
  emitServiceRequestApproved,
  emitServiceRequestRejected,
  emitProblemCreated,
  emitProblemUpdated,
  emitChangeCreated,
  emitChangeUpdated,
  emitStatsUpdated,
  emitNotification,
};
