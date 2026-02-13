'use client';

import { useState, useEffect } from 'react';
import { Clock, Timer, CheckCircle } from 'lucide-react';
import { TaskStatus } from '@/types';

interface LiveTimerProps {
  scheduledAt: string;
  status: TaskStatus;
  startedAt?: string;
  completedAt?: string;
  prepTimeMinutes: number;
}

export default function LiveTimer({ 
  scheduledAt, 
  status, 
  startedAt, 
  completedAt,
  prepTimeMinutes 
}: LiveTimerProps) {
  const [timeDisplay, setTimeDisplay] = useState('');
  const [colorClass, setColorClass] = useState('text-gray-600');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      
      if (status === 'completed' && completedAt) {
        // Show completion time
        const completed = new Date(completedAt);
        const started = startedAt ? new Date(startedAt) : new Date(scheduledAt);
        const duration = Math.floor((completed.getTime() - started.getTime()) / 1000);
        setTimeDisplay('✓ ' + formatDuration(duration));
        setColorClass('text-green-600');
        return;
      }

      if (status === 'in_progress' && startedAt) {
        // Show elapsed time since started
        const started = new Date(startedAt);
        const elapsed = Math.floor((now.getTime() - started.getTime()) / 1000);
        const expected = prepTimeMinutes * 60;
        
        if (elapsed > expected) {
          setColorClass('text-red-600 font-bold animate-pulse');
        } else if (elapsed > expected * 0.8) {
          setColorClass('text-orange-600');
        } else {
          setColorClass('text-blue-600');
        }
        
        setTimeDisplay('▶ ' + formatDuration(elapsed));
        return;
      }

      // For scheduled or late tasks, show time until/since scheduled time
      const scheduled = new Date(scheduledAt);
      const diff = Math.floor((scheduled.getTime() - now.getTime()) / 1000);
      
      if (diff > 0) {
        // Future task - countdown
        setTimeDisplay('⏰ ' + formatDuration(diff));
        setColorClass('text-gray-600');
      } else {
        // Overdue task
        setTimeDisplay('⚠ ' + formatDuration(Math.abs(diff)));
        setColorClass('text-red-600 font-bold animate-pulse');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [scheduledAt, status, startedAt, completedAt, prepTimeMinutes]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const getIcon = () => {
    if (status === 'in_progress') {
      return <Timer className="h-4 w-4 animate-pulse" />;
    }
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  return (
    <div className={`flex items-center gap-1.5 text-sm font-mono ${colorClass} bg-gray-50 px-2 py-1 rounded-md border`}>
      {getIcon()}
      <span className="font-bold tracking-wide">{timeDisplay}</span>
    </div>
  );
}
