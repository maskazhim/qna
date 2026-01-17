import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppContextType, QueueItem, SessionHistory, User, UserRole } from '../types';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [answeredUsers, setAnsweredUsers] = useState<QueueItem[]>([]); // Track answered users in current session
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);

  // Load history, user session, and active session state from local storage on mount
  useEffect(() => {
    // Load History
    const savedHistory = localStorage.getItem('raiseHandHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }

    // Load Persisted User (To prevent logout on refresh)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }

    // Load Active Session State (Persistence to fix history loss on refresh)
    const savedSessionState = localStorage.getItem('activeSessionState');
    if (savedSessionState) {
      try {
        const state = JSON.parse(savedSessionState);
        if (state.isSessionActive) {
          setIsSessionActive(true);
          setQueue(state.queue || []);
          setAnsweredUsers(state.answeredUsers || []);
          setSessionStartTime(state.sessionStartTime);
          setActiveSpeakerId(state.activeSpeakerId);
        }
      } catch (e) {
        console.error("Failed to parse session state", e);
      }
    }
  }, []);

  // Save active session state whenever it changes
  useEffect(() => {
    if (isSessionActive) {
      const stateToSave = {
        isSessionActive,
        queue,
        answeredUsers,
        sessionStartTime,
        activeSpeakerId
      };
      localStorage.setItem('activeSessionState', JSON.stringify(stateToSave));
    } else {
      // Clear session state if not active (wait until session is properly stopped)
      // We handle clearing in stopSession, but here we ensure we don't save "inactive" state as active
    }
  }, [isSessionActive, queue, answeredUsers, sessionStartTime, activeSpeakerId]);

  const login = (name: string, role: UserRole, businessName?: string) => {
    const newUser = { name, role, businessName };
    setUser(newUser);
    // Persist login
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const startSession = () => {
    setIsSessionActive(true);
    setQueue([]);
    setAnsweredUsers([]);
    setActiveSpeakerId(null);
    setSessionStartTime(Date.now());
    // Clear legacy/stale state from storage immediately
    localStorage.removeItem('activeSessionState');
  };

  const stopSession = () => {
    if (isSessionActive) {
      // Create history item
      const newHistoryItem: SessionHistory = {
        id: crypto.randomUUID(),
        startTime: sessionStartTime || Date.now(),
        endTime: Date.now(),
        participants: [...answeredUsers], // Save only those who got a turn
      };
      
      const updatedHistory = [newHistoryItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('raiseHandHistory', JSON.stringify(updatedHistory));
      
      // Clear Active Session Persistence
      localStorage.removeItem('activeSessionState');
    }
    
    setIsSessionActive(false);
    setSessionStartTime(null);
    setActiveSpeakerId(null);
    setQueue([]);
    setAnsweredUsers([]);
  };

  const raiseHand = (): number => {
    if (!user || !isSessionActive) return -1;
    
    const existingIndex = queue.findIndex(q => q.name === user.name);
    if (existingIndex !== -1) {
      return existingIndex + 1;
    }

    const newItem: QueueItem = {
      id: crypto.randomUUID(),
      name: user.name,
      businessName: user.businessName,
      timestamp: Date.now(),
    };

    const newQueue = [...queue, newItem].sort((a, b) => a.timestamp - b.timestamp);
    setQueue(newQueue);
    return newQueue.length;
  };

  const selectSpeaker = (id: string) => {
    setActiveSpeakerId(id);
  };

  const markAsAnswered = (id: string) => {
    const item = queue.find(q => q.id === id);
    if (item) {
      // Add to answered list
      setAnsweredUsers(prev => [...prev, item]);
      // Remove from queue
      setQueue(prev => prev.filter(q => q.id !== id));
      
      // If the removed user was the active speaker, clear active speaker or set next
      if (activeSpeakerId === id) {
        setActiveSpeakerId(null);
      }
    }
  };

  const getParticipantCount = (name: string): number => {
    let count = 0;
    // Count from past history
    history.forEach(session => {
      session.participants.forEach(p => {
        if (p.name === name) count++;
      });
    });
    // Add current session answered count
    answeredUsers.forEach(p => {
      if (p.name === name) count++;
    });
    
    return count;
  };

  const currentUserRank = user && queue.length > 0 
    ? queue.findIndex(q => q.name === user.name) + 1 
    : null;

  const safeRank = currentUserRank === 0 ? null : currentUserRank;

  return (
    <AppContext.Provider value={{
      user,
      login,
      logout,
      isSessionActive,
      startSession,
      stopSession,
      raiseHand,
      queue,
      history,
      currentUserRank: safeRank,
      activeSpeakerId,
      selectSpeaker,
      markAsAnswered,
      getParticipantCount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};