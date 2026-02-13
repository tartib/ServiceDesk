'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, RotateCcw, Check, Users, CheckCircle, AlertCircle, Loader2, Trophy, TrendingUp } from 'lucide-react';
import { usePlanningPoker, POKER_VALUES, PokerVote } from '@/hooks/usePlanningPoker';

interface PlanningPokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  sprintId: string;
  onEstimateComplete: (estimate: number) => void;
}

export default function PlanningPokerModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  sprintId,
  onEstimateComplete,
}: PlanningPokerModalProps) {
  const {
    loading,
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
  } = usePlanningPoker(sprintId);

  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [hasVotedLocal, setHasVotedLocal] = useState(false);
  const [estimationType, setEstimationType] = useState<'story_points' | 'hours'>('story_points');
  const initializingRef = useRef(false);

  // Derive hasVoted from local state
  const hasVoted = hasVotedLocal;

  const initializeSession = useCallback(async () => {
    try {
      // Validate sprintId before making API calls
      if (!sprintId || sprintId === '') {
        console.error('❌ Cannot initialize session: sprintId is empty');
        // Create session without checking for existing ones
        await createPokerSession(taskId, estimationType);
        return;
      }

      // First, check if there's an existing session for this task
      const sessionsResult = await getSprintPokerSessions(sprintId);
      const sessions = Array.isArray(sessionsResult) ? sessionsResult : [];
      const existingSession = sessions.find(
        (s) => {
          const sessionTaskId = typeof s.taskId === 'object' ? (s.taskId as { _id: string })?._id : s.taskId;
          return sessionTaskId === taskId && (s.status === 'voting' || s.status === 'revealed');
        }
      );

      if (existingSession) {
        console.log('🎯 Found existing session, joining:', existingSession._id);
        await getPokerSession(existingSession._id);
      } else {
        console.log('🎯 No existing session, creating new one');
        await createPokerSession(taskId, estimationType);
      }
    } catch (error) {
      console.error('Failed to initialize poker session:', error);
    }
  }, [sprintId, taskId, estimationType, createPokerSession, getSprintPokerSessions, getPokerSession]);

  useEffect(() => {
    if (isOpen && !activeSession && !initializingRef.current) {
      initializingRef.current = true;
      initializeSession().finally(() => {
        initializingRef.current = false;
      });
    }
    
    // Cleanup: leave session when modal closes
    return () => {
      if (activeSession && !isOpen) {
        leaveSession(activeSession._id);
      }
    };
  }, [isOpen, activeSession, leaveSession, initializeSession]);

  const handleVote = async (value: number) => {
    if (!activeSession || hasVoted) return;

    try {
      setSelectedValue(value);
      await submitVote(activeSession._id, value);
      setHasVotedLocal(true);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  const handleReveal = async () => {
    console.log('🔍 handleReveal called, activeSession:', activeSession?._id, 'status:', activeSession?.status);
    if (!activeSession) {
      console.error('🔍 handleReveal: no activeSession!');
      return;
    }

    try {
      const result = await revealVotes(activeSession._id);
      console.log('🔍 handleReveal result:', result);
    } catch (error) {
      console.error('🔍 handleReveal FAILED:', error);
    }
  };

  const handleNewRound = async () => {
    if (!activeSession) return;

    try {
      await startNewRound(activeSession._id);
      setSelectedValue(null);
      setHasVotedLocal(false);
    } catch (error) {
      console.error('Failed to start new round:', error);
    }
  };

  const handleComplete = async (estimate: number) => {
    if (!activeSession) return;

    try {
      await completeSession(activeSession._id, estimate);
      onEstimateComplete(estimate);
      onClose();
    } catch (error) {
      const axiosErr = error as { response?: { data?: { error?: string } } };
      const msg = axiosErr?.response?.data?.error || 'Failed to complete session';
      alert(`❌ ${msg}`);
      console.error('Failed to complete session:', error);
    }
  };

  const handleCancel = async () => {
    if (activeSession) {
      try {
        leaveSession(activeSession._id);
        await cancelSession(activeSession._id);
      } catch (error) {
        console.error('Failed to cancel session:', error);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  const isRevealed = activeSession?.status === 'revealed';
  // Use participantCount from hook (updated via socket) or fall back to votes array length
  const totalParticipants = participantCount || activeSession?.votes?.length || 0;
  const currentVoteCount = activeSession?.voteCount || voteCount || 0;
  // Allow reveal: either all participants voted, or at least 1 vote exists (handles 1-member case)
  const allVoted = (currentVoteCount > 0 && currentVoteCount >= totalParticipants) || (currentVoteCount > 0 && totalParticipants === 0);
  
  const average = isRevealed && stats 
    ? stats.average 
    : activeSession?.votes 
    ? calculateAverage(activeSession.votes) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer"></div>
          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-300" />
              <h2 className="text-xl font-semibold text-white">Planning Poker</h2>
            </div>
            <p className="text-sm text-purple-100 mt-1 truncate">{taskTitle}</p>
            {activeSession && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-purple-200">Round {activeSession.round || 1}</span>
                <span className="w-1 h-1 rounded-full bg-purple-300"></span>
                <span className="text-xs text-purple-200 capitalize">{activeSession.status}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-all hover:rotate-90 duration-300 relative z-10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Estimation Type Selector */}
          {!activeSession && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="text-sm font-medium text-gray-700 mb-3 block">
                Estimation Type:
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setEstimationType('story_points')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    estimationType === 'story_points'
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                  }`}
                >
                  📊 Story Points
                </button>
                <button
                  onClick={() => setEstimationType('hours')}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                    estimationType === 'hours'
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                  }`}
                >
                  ⏱️ Hours
                </button>
              </div>
            </div>
          )}

          {/* Voting Cards */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">
                Select your estimate {estimationType === 'hours' ? '(hours)' : '(story points)'}
              </h3>
              {loading && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-7 gap-3">
              {POKER_VALUES.map((value) => (
                <button
                  key={value}
                  onClick={() => handleVote(value)}
                  disabled={hasVoted || isRevealed || !activeSession || loading}
                  className={`
                    aspect-[3/4] rounded-xl border-2 flex items-center justify-center text-2xl font-bold
                    transition-all transform hover:scale-110 hover:-translate-y-1 active:scale-95
                    relative overflow-hidden group
                    ${
                      selectedValue === value
                        ? 'border-purple-600 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl scale-105 ring-4 ring-purple-200'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400 hover:shadow-lg hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50'
                    }
                    ${hasVoted || isRevealed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {selectedValue === value && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                  )}
                  <span className="relative z-10">{value}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Participants */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants ({totalParticipants})
              </h3>
              <div className="flex items-center gap-3">
                {!isRevealed && (
                  <span className="text-xs text-gray-600">
                    {currentVoteCount} / {totalParticipants} voted
                  </span>
                )}
                {!isRevealed && allVoted && (
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    All votes in!
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {activeSession?.votes.map((vote: PokerVote, index: number) => {
                // Handle backend field mapping: backend uses oderId (populated to user object)
                const voteUser = (vote as unknown as Record<string, unknown>).oderId as { name?: string; profile?: { firstName?: string; lastName?: string } } | string | undefined;
                const displayName = vote.userName 
                  || (typeof voteUser === 'object' && voteUser?.name)
                  || (typeof voteUser === 'object' && voteUser?.profile && `${voteUser.profile.firstName || ''} ${voteUser.profile.lastName || ''}`.trim())
                  || 'Participant';
                const uniqueKey = vote.userId || (typeof voteUser === 'string' ? voteUser : (voteUser as { _id?: string })?._id) || `vote-${index}`;
                return (
                <div
                  key={uniqueKey}
                  className="flex items-center justify-between p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold shadow-md ring-2 ring-purple-200">
                      {String(displayName).charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{String(displayName)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {vote.value !== undefined ? (
                      isRevealed ? (
                        <span className="px-3 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-full text-sm font-semibold shadow-sm animate-in zoom-in duration-300">
                          {vote.value}
                        </span>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md animate-pulse">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )
                    ) : (
                      <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded-lg animate-pulse" />
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>

          {/* Results */}
          {isRevealed && stats && (
            <div className="bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-purple-200 shadow-lg animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Results</h3>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs text-gray-600 mb-1 font-medium">Average</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{stats.average}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs text-gray-600 mb-1 font-medium">Median</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{stats.median}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-xs text-gray-600 mb-1 font-medium">Range</div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{stats.min}-{stats.max}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow ring-2 ring-green-100">
                  <div className="text-xs text-gray-600 mb-1 font-medium flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-green-600" />
                    Suggested
                  </div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.suggestedEstimate}</div>
                </div>
              </div>
              {stats.consensus ? (
                <div className="text-sm text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200 flex items-center gap-3 shadow-sm animate-in slide-in-from-left duration-500">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">🎉 Team reached consensus! Suggested estimate: <strong className="text-green-800">{stats.suggestedEstimate}</strong> points</span>
                </div>
              ) : (
                <div className="text-sm text-yellow-700 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border-2 border-yellow-200 flex items-center gap-3 shadow-sm animate-in slide-in-from-left duration-500">
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium">No consensus. Server suggests <strong className="text-yellow-800">{stats.suggestedEstimate}</strong> points based on {stats.average} average.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-all hover:scale-105 active:scale-95"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {isRevealed ? (
              <>
                <button
                  onClick={handleNewRound}
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  New Round
                </button>
                {(stats?.suggestedEstimate === 21 || (!stats?.suggestedEstimate && average >= 21)) ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Estimate of 21 is too large. Decompose this story into smaller tasks or start a new round.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleComplete(stats?.suggestedEstimate || average)}
                    disabled={loading}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Accept {stats?.suggestedEstimate || average} Points
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleReveal}
                disabled={currentVoteCount === 0 || loading}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Reveal Votes {currentVoteCount > 0 ? `(${currentVoteCount})` : ''}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
