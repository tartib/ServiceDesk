import { useState, useCallback, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { io, Socket } from 'socket.io-client';

interface ApiResponse<T> {
  data: T;
}

interface PokerSessionResponse {
  session?: PokerSession;
  data?: { session?: PokerSession };
}

export interface PokerSession {
  _id: string;
  taskId: string;
  sprintId: string;
  facilitator: string;
  status: 'voting' | 'revealed' | 'completed';
  votes: PokerVote[];
  finalEstimate?: number;
  createdAt: string;
  round?: number;
  voteCount?: number;
}

export interface PokerStats {
  average: number;
  median: number;
  min: number;
  max: number;
  consensus: boolean;
  suggestedEstimate: number;
}

export interface PokerVote {
  userId: string;
  userName: string;
  value?: number;
  votedAt?: string;
}

export const POKER_VALUES = [1, 2, 3, 5, 8, 13, 21];

export const usePlanningPoker = (sprintId?: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<PokerSession | null>(null);
  const [voteCount, setVoteCount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [stats, setStats] = useState<PokerStats | null>(null);

  // Use refs for socket and session to avoid re-creating socket on every state change
  const socketRef = useRef<Socket | null>(null);
  const activeSessionRef = useRef<PokerSession | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: {
        token: localStorage.getItem('token') || localStorage.getItem('accessToken'),
      },
    });

    socketRef.current = socketInstance;

    // Session created
    socketInstance.on('poker:session:created', (session: PokerSession) => {
      setActiveSession(session);
      setParticipantCount(session.votes?.length || 0);
    });

    // Participant joined
    socketInstance.on('poker:participant:joined', ({ sessionId, participantCount: count }) => {
      if (activeSessionRef.current?._id === sessionId) {
        if (count) setParticipantCount(count);
      }
    });

    // Participant left
    socketInstance.on('poker:participant:left', ({ sessionId, participantCount: count }) => {
      if (activeSessionRef.current?._id === sessionId) {
        if (count) setParticipantCount(count);
      }
    });

    // Vote submitted (only count, votes hidden)
    socketInstance.on('poker:vote:submitted', ({ voteCount: count, participantCount: pCount }) => {
      setVoteCount(count);
      if (pCount) setParticipantCount(pCount);
      setActiveSession(prev => prev ? { ...prev, voteCount: count } : null);
    });

    // Votes revealed
    socketInstance.on('poker:votes:revealed', ({ session, stats: revealedStats, suggestedEstimate }) => {
      setActiveSession({ ...session, status: 'revealed' });
      // Merge suggestedEstimate into stats so frontend can access stats.suggestedEstimate
      setStats(revealedStats ? { ...revealedStats, suggestedEstimate: suggestedEstimate ?? revealedStats.suggestedEstimate } : null);
    });

    // New round started
    socketInstance.on('poker:round:started', ({ round }) => {
      setActiveSession(prev => prev ? { ...prev, status: 'voting', votes: [], round, voteCount: 0 } : null);
      setVoteCount(0);
      setStats(null);
    });

    // Session completed
    socketInstance.on('poker:session:completed', () => {
      setActiveSession(null);
      setVoteCount(0);
      setParticipantCount(0);
      setStats(null);
    });

    // Session cancelled
    socketInstance.on('poker:session:cancelled', ({ sessionId }) => {
      if (activeSessionRef.current?._id === sessionId) {
        setActiveSession(null);
        setVoteCount(0);
        setParticipantCount(0);
        setStats(null);
      }
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty deps — socket created once

  const createPokerSession = useCallback(async (
    taskId: string, 
    estimationType: 'story_points' | 'hours' = 'story_points'
  ) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎯 Creating poker session:', { taskId, estimationType });
      
      const payload = {
        estimationType
      };
      
      const response = await api.post<PokerSessionResponse>(`/pm/tasks/${taskId}/poker`, payload);
      console.log('🎯 Poker session created:', response);
      const session = response?.session || response?.data?.session || (response as unknown as PokerSession);
      setActiveSession(session);
      setParticipantCount(Math.max(1, session?.votes?.length || 1));
      
      // Join the poker session room
      if (socketRef.current) {
        socketRef.current.emit('join:poker', session._id);
      }
      
      return session;
    } catch (err: unknown) {
      // If there's already an active session, use it instead of failing
      const axiosErr = err as { response?: { status?: number; data?: { session?: PokerSession; data?: { session?: PokerSession } } } };
      const existingSessionData = axiosErr?.response?.data?.session || axiosErr?.response?.data?.data?.session;
      if (axiosErr?.response?.status === 400 && existingSessionData) {
        console.log('🎯 Active session already exists, joining it');
        const existingSession = existingSessionData;
        setActiveSession(existingSession);
        setParticipantCount(Math.max(1, existingSession?.votes?.length || 1));
        if (socketRef.current) {
          socketRef.current.emit('join:poker', existingSession._id);
        }
        return existingSession;
      }
      console.error('❌ Poker session error:', err);
      const message = err instanceof Error ? err.message : 'Failed to create poker session';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPokerSession = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<PokerSession>>(`/pm/poker/${sessionId}`);
      const responseData = response as { session?: PokerSession; data?: { session?: PokerSession } };
      const session = responseData?.session || responseData?.data?.session || (responseData as unknown as PokerSession);
      setActiveSession(session);
      setParticipantCount(Math.max(1, session?.votes?.length || 1));
      
      // Join the poker session room
      if (socketRef.current) {
        socketRef.current.emit('join:poker', sessionId);
      }
      
      return session;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch poker session';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSprintPokerSessions = useCallback(async (sprintId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<ApiResponse<PokerSession[]>>(`/pm/sprints/${sprintId}/poker`);
      const data = response.data as { data?: { sessions?: PokerSession[] }; sessions?: PokerSession[] };
      return data?.data?.sessions || data?.sessions || (Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch poker sessions';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitVote = useCallback(async (sessionId: string, value: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post<ApiResponse<PokerSession>>(`/pm/poker/${sessionId}/vote`, { value });
      // Extract voteCount from HTTP response so Reveal button enables even without socket
      const responseData = response as unknown as { data?: { voteCount?: number }; voteCount?: number };
      const newVoteCount = responseData?.data?.voteCount || responseData?.voteCount;
      if (newVoteCount) {
        setVoteCount(newVoteCount);
        setActiveSession(prev => prev ? { ...prev, voteCount: newVoteCount } : null);
      }
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const revealVotes = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 revealVotes: calling API for session', sessionId);
      const response = await api.post<ApiResponse<PokerSession>>(`/pm/poker/${sessionId}/reveal`);
      console.log('🔍 revealVotes: raw response', JSON.stringify(response).substring(0, 500));
      // Extract session and stats from nested response structure
      // After axios interceptor (response.data), response = { success, data: { session, stats, suggestedEstimate } }
      const responseData = response as unknown as { data?: { session?: PokerSession; stats?: PokerStats; suggestedEstimate?: number }; session?: PokerSession; stats?: PokerStats; suggestedEstimate?: number };
      const session = responseData?.data?.session || responseData?.session;
      const revealedStats = responseData?.data?.stats || responseData?.stats;
      const suggestedEstimate = responseData?.data?.suggestedEstimate || responseData?.suggestedEstimate;
      console.log('🔍 revealVotes: extracted session?', !!session, 'stats?', !!revealedStats, 'suggestedEstimate?', suggestedEstimate);
      if (session) {
        setActiveSession({ ...session, status: 'revealed' });
      } else {
        // Fallback: even if we can't extract session, force status change
        console.warn('🔍 revealVotes: no session in response, forcing status change');
        setActiveSession(prev => prev ? { ...prev, status: 'revealed' } : null);
      }
      if (revealedStats) {
        setStats({ ...revealedStats, suggestedEstimate: suggestedEstimate ?? revealedStats.suggestedEstimate });
      }
      return response.data;
    } catch (err: unknown) {
      console.error('🔍 revealVotes: API error', err);
      const message = err instanceof Error ? err.message : 'Failed to reveal votes';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const startNewRound = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post<ApiResponse<PokerSession>>(`/pm/poker/${sessionId}/new-round`);
      setActiveSession(response.data);
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start new round';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeSession = useCallback(async (sessionId: string, finalEstimate: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post<ApiResponse<PokerSession>>(`/pm/poker/${sessionId}/complete`, { finalEstimate });
      setActiveSession(null);
      return response.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete session';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSession = useCallback(async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Leave the poker session room
      if (socketRef.current) {
        socketRef.current.emit('leave:poker', sessionId);
      }
      
      await api.delete(`/pm/poker/${sessionId}`);
      setActiveSession(null);
      setVoteCount(0);
      setStats(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to cancel session';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateAverage = useCallback((votes: PokerVote[]): number => {
    const validVotes = votes.filter(v => v.value !== undefined).map(v => v.value!);
    if (validVotes.length === 0) return 0;
    const sum = validVotes.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / validVotes.length);
  }, []);

  const calculateConsensus = useCallback((votes: PokerVote[]): { hasConsensus: boolean; value?: number } => {
    const validVotes = votes.filter(v => v.value !== undefined).map(v => v.value!);
    if (validVotes.length === 0) return { hasConsensus: false };
    
    // Match backend logic: consensus if all identical OR spread <= 2
    const allIdentical = validVotes.every(v => v === validVotes[0]);
    if (allIdentical) {
      return { hasConsensus: true, value: validVotes[0] };
    }
    
    const spread = Math.max(...validVotes) - Math.min(...validVotes);
    if (spread <= 2) {
      const avg = validVotes.reduce((a, b) => a + b, 0) / validVotes.length;
      return { hasConsensus: true, value: Math.round(avg) };
    }
    
    return { hasConsensus: false };
  }, []);

  const leaveSession = useCallback((sessionId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave:poker', sessionId);
    }
  }, []);

  return {
    loading,
    error,
    socket: socketRef.current,
    activeSession,
    voteCount,
    participantCount,
    stats,
    createPokerSession,
    getPokerSession,
    getSprintPokerSessions,
    submitVote,
    revealVotes,
    startNewRound,
    completeSession,
    cancelSession,
    leaveSession,
    calculateAverage,
    calculateConsensus,
  };
};
