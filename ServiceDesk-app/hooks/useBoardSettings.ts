'use client';

import { useState, useEffect } from 'react';

interface BoardSettings {
  groupBy: 'status' | 'assignee' | 'type' | 'priority';
  compactView: boolean;
  showSubtasks: boolean;
  showLabels: boolean;
  showStoryPoints: boolean;
}

const DEFAULT_SETTINGS: BoardSettings = {
  groupBy: 'status',
  compactView: false,
  showSubtasks: true,
  showLabels: true,
  showStoryPoints: true,
};

export function useBoardSettings(projectId: string) {
  const [settings, setSettings] = useState<BoardSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storageKey = `board-settings-${projectId}`;
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
          setSettings(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load board settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [projectId]);

  const updateSettings = (newSettings: Partial<BoardSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    const storageKey = `board-settings-${projectId}`;
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    const storageKey = `board-settings-${projectId}`;
    localStorage.removeItem(storageKey);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
  };
}
