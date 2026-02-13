import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  organizationId?: string;
}

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, Set<string>> = new Map();

  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:3001',
          'http://127.0.0.1:3001',
        ],
        credentials: true,
      },
    });

    this.io.use((socket: AuthenticatedSocket, next) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
          userId: string;
          organizationId: string;
        };
        socket.userId = decoded.userId;
        socket.organizationId = decoded.organizationId;
        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId}`);

      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)!.add(socket.id);

        // Join organization room
        if (socket.organizationId) {
          socket.join(`org:${socket.organizationId}`);
        }
      }

      // Join project room
      socket.on('join:project', (projectId: string) => {
        socket.join(`project:${projectId}`);
        console.log(`User ${socket.userId} joined project ${projectId}`);
      });

      // Leave project room
      socket.on('leave:project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
      });

      // Join task room (for real-time task updates)
      socket.on('join:task', (taskId: string) => {
        socket.join(`task:${taskId}`);
      });

      socket.on('leave:task', (taskId: string) => {
        socket.leave(`task:${taskId}`);
      });

      // Join Planning Poker session room
      socket.on('join:poker', async (sessionId: string) => {
        socket.join(`poker:${sessionId}`);
        console.log(`User ${socket.userId} joined poker session ${sessionId}`);
        // Get room size for participant count
        const room = this.io?.sockets.adapter.rooms.get(`poker:${sessionId}`);
        const participantCount = room?.size || 1;
        // Notify ALL in room (including self) with participant count
        this.io?.to(`poker:${sessionId}`).emit('poker:participant:joined', {
          sessionId,
          userId: socket.userId,
          participantCount,
        });
      });

      // Leave Planning Poker session room
      socket.on('leave:poker', (sessionId: string) => {
        socket.leave(`poker:${sessionId}`);
        // Get room size after leaving
        const room = this.io?.sockets.adapter.rooms.get(`poker:${sessionId}`);
        const participantCount = room?.size || 0;
        // Notify others that someone left
        socket.to(`poker:${sessionId}`).emit('poker:participant:left', {
          sessionId,
          userId: socket.userId,
          participantCount,
        });
      });

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        if (socket.userId) {
          const sockets = this.userSockets.get(socket.userId);
          if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              this.userSockets.delete(socket.userId);
            }
          }
        }
      });
    });
  }

  // Emit to specific user
  emitToUser(userId: string, event: string, data: unknown): void {
    const sockets = this.userSockets.get(userId);
    if (sockets && this.io) {
      sockets.forEach((socketId) => {
        this.io!.to(socketId).emit(event, data);
      });
    }
  }

  // Emit to organization
  emitToOrganization(organizationId: string, event: string, data: unknown): void {
    if (this.io) {
      this.io.to(`org:${organizationId}`).emit(event, data);
    }
  }

  // Emit to project
  emitToProject(projectId: string, event: string, data: unknown): void {
    if (this.io) {
      this.io.to(`project:${projectId}`).emit(event, data);
    }
  }

  // Emit to task viewers
  emitToTask(taskId: string, event: string, data: unknown): void {
    if (this.io) {
      this.io.to(`task:${taskId}`).emit(event, data);
    }
  }

  // Task events
  taskCreated(projectId: string, task: unknown): void {
    this.emitToProject(projectId, 'task:created', task);
  }

  taskUpdated(projectId: string, taskId: string, task: unknown): void {
    this.emitToProject(projectId, 'task:updated', task);
    this.emitToTask(taskId, 'task:updated', task);
  }

  taskDeleted(projectId: string, taskId: string): void {
    this.emitToProject(projectId, 'task:deleted', { taskId });
  }

  taskMoved(projectId: string, task: unknown): void {
    this.emitToProject(projectId, 'task:moved', task);
  }

  // Comment events
  commentAdded(taskId: string, comment: unknown): void {
    this.emitToTask(taskId, 'comment:added', comment);
  }

  commentUpdated(taskId: string, comment: unknown): void {
    this.emitToTask(taskId, 'comment:updated', comment);
  }

  commentDeleted(taskId: string, commentId: string): void {
    this.emitToTask(taskId, 'comment:deleted', { commentId });
  }

  // Sprint events
  sprintUpdated(projectId: string, sprint: unknown): void {
    this.emitToProject(projectId, 'sprint:updated', sprint);
  }

  // Notification
  sendNotification(userId: string, notification: unknown): void {
    this.emitToUser(userId, 'notification', notification);
  }

  // ==================== PLANNING POKER EVENTS ====================

  // Emit to poker session
  emitToPokerSession(sessionId: string, event: string, data: unknown): void {
    if (this.io) {
      this.io.to(`poker:${sessionId}`).emit(event, data);
    }
  }

  // New poker session created
  pokerSessionCreated(projectId: string, session: unknown): void {
    this.emitToProject(projectId, 'poker:session:created', session);
  }

  // Vote submitted (broadcast vote count, not actual vote)
  pokerVoteSubmitted(sessionId: string, data: { voteCount: number; oderId: string; participantCount?: number }): void {
    this.emitToPokerSession(sessionId, 'poker:vote:submitted', data);
  }

  // Votes revealed
  pokerVotesRevealed(sessionId: string, data: unknown): void {
    this.emitToPokerSession(sessionId, 'poker:votes:revealed', data);
  }

  // New round started
  pokerNewRound(sessionId: string, data: { round: number }): void {
    this.emitToPokerSession(sessionId, 'poker:round:started', data);
  }

  // Session completed
  pokerSessionCompleted(sessionId: string, data: unknown): void {
    this.emitToPokerSession(sessionId, 'poker:session:completed', data);
  }

  // Session cancelled
  pokerSessionCancelled(sessionId: string): void {
    this.emitToPokerSession(sessionId, 'poker:session:cancelled', { sessionId });
  }
}

export default new SocketService();
