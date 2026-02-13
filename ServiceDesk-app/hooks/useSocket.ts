'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SocketCallback = (data: any) => void;

export interface SocketEvents {
  'incident:created': SocketCallback;
  'incident:updated': SocketCallback;
  'service-request:created': SocketCallback;
  'service-request:updated': SocketCallback;
  'service-request:approved': SocketCallback;
  'service-request:rejected': SocketCallback;
  'service-request:pending-approval': SocketCallback;
  'problem:created': SocketCallback;
  'problem:updated': SocketCallback;
  'change:created': SocketCallback;
  'change:updated': SocketCallback;
  'change:pending-approval': SocketCallback;
  'stats:updated': SocketCallback;
  'notification': SocketCallback;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Create socket connection with auth token
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      auth: {
        token,
      },
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 WebSocket connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 WebSocket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinITSM = useCallback(() => {
    if (socketRef.current && user) {
      socketRef.current.emit('join:itsm', {
        userId: user._id || user.id,
        role: user.role,
      });
    }
  }, [user]);

  const leaveITSM = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave:itsm');
    }
  }, []);

  const joinSelfService = useCallback(() => {
    if (socketRef.current && user) {
      socketRef.current.emit('join:self-service', {
        userId: user._id || user.id,
      });
    }
  }, [user]);

  const leaveSelfService = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('leave:self-service');
    }
  }, []);

  const on = useCallback((event: string, callback: SocketCallback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event: string, callback?: SocketCallback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinITSM,
    leaveITSM,
    joinSelfService,
    leaveSelfService,
    on,
    off,
  };
}

export function useITSMSocket(options?: {
  onIncidentCreated?: SocketCallback;
  onIncidentUpdated?: SocketCallback;
  onServiceRequestCreated?: SocketCallback;
  onServiceRequestUpdated?: SocketCallback;
  onServiceRequestApproved?: SocketCallback;
  onServiceRequestRejected?: SocketCallback;
  onServiceRequestPendingApproval?: SocketCallback;
  onProblemCreated?: SocketCallback;
  onProblemUpdated?: SocketCallback;
  onChangeCreated?: SocketCallback;
  onChangeUpdated?: SocketCallback;
  onChangePendingApproval?: SocketCallback;
  onStatsUpdated?: SocketCallback;
  onNotification?: SocketCallback;
}) {
  const { isConnected, joinITSM, leaveITSM, on, off } = useSocket();

  useEffect(() => {
    if (isConnected) {
      joinITSM();
    }

    return () => {
      leaveITSM();
    };
  }, [isConnected, joinITSM, leaveITSM]);

  useEffect(() => {
    if (!isConnected) return;

    if (options?.onIncidentCreated) {
      on('incident:created', options.onIncidentCreated);
    }
    if (options?.onIncidentUpdated) {
      on('incident:updated', options.onIncidentUpdated);
    }
    if (options?.onServiceRequestCreated) {
      on('service-request:created', options.onServiceRequestCreated);
    }
    if (options?.onServiceRequestUpdated) {
      on('service-request:updated', options.onServiceRequestUpdated);
    }
    if (options?.onServiceRequestApproved) {
      on('service-request:approved', options.onServiceRequestApproved);
    }
    if (options?.onServiceRequestRejected) {
      on('service-request:rejected', options.onServiceRequestRejected);
    }
    if (options?.onServiceRequestPendingApproval) {
      on('service-request:pending-approval', options.onServiceRequestPendingApproval);
    }
    if (options?.onProblemCreated) {
      on('problem:created', options.onProblemCreated);
    }
    if (options?.onProblemUpdated) {
      on('problem:updated', options.onProblemUpdated);
    }
    if (options?.onChangeCreated) {
      on('change:created', options.onChangeCreated);
    }
    if (options?.onChangeUpdated) {
      on('change:updated', options.onChangeUpdated);
    }
    if (options?.onChangePendingApproval) {
      on('change:pending-approval', options.onChangePendingApproval);
    }
    if (options?.onStatsUpdated) {
      on('stats:updated', options.onStatsUpdated);
    }
    if (options?.onNotification) {
      on('notification', options.onNotification);
    }

    return () => {
      off('incident:created');
      off('incident:updated');
      off('service-request:created');
      off('service-request:updated');
      off('service-request:approved');
      off('service-request:rejected');
      off('service-request:pending-approval');
      off('problem:created');
      off('problem:updated');
      off('change:created');
      off('change:updated');
      off('change:pending-approval');
      off('stats:updated');
      off('notification');
    };
  }, [isConnected, on, off, options]);

  return { isConnected };
}

export function useSelfServiceSocket(options?: {
  onServiceRequestCreated?: SocketCallback;
  onServiceRequestUpdated?: SocketCallback;
  onServiceRequestApproved?: SocketCallback;
  onServiceRequestRejected?: SocketCallback;
  onIncidentCreated?: SocketCallback;
  onIncidentUpdated?: SocketCallback;
  onNotification?: SocketCallback;
}) {
  const { isConnected, joinSelfService, leaveSelfService, on, off } = useSocket();

  useEffect(() => {
    if (isConnected) {
      joinSelfService();
    }

    return () => {
      leaveSelfService();
    };
  }, [isConnected, joinSelfService, leaveSelfService]);

  useEffect(() => {
    if (!isConnected) return;

    if (options?.onServiceRequestCreated) {
      on('service-request:created', options.onServiceRequestCreated);
    }
    if (options?.onServiceRequestUpdated) {
      on('service-request:updated', options.onServiceRequestUpdated);
    }
    if (options?.onServiceRequestApproved) {
      on('service-request:approved', options.onServiceRequestApproved);
    }
    if (options?.onServiceRequestRejected) {
      on('service-request:rejected', options.onServiceRequestRejected);
    }
    if (options?.onIncidentCreated) {
      on('incident:created', options.onIncidentCreated);
    }
    if (options?.onIncidentUpdated) {
      on('incident:updated', options.onIncidentUpdated);
    }
    if (options?.onNotification) {
      on('notification', options.onNotification);
    }

    return () => {
      off('service-request:created');
      off('service-request:updated');
      off('service-request:approved');
      off('service-request:rejected');
      off('incident:created');
      off('incident:updated');
      off('notification');
    };
  }, [isConnected, on, off, options]);

  return { isConnected };
}
