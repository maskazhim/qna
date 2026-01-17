
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  name: string;
  role: UserRole;
  businessName?: string;
}

export interface QueueItem {
  id: string;
  name: string;
  businessName?: string;
  timestamp: number;
}

export interface SessionHistory {
  id: string;
  startTime: number;
  endTime: number;
  participants: QueueItem[]; // List of users who got a turn (answered)
}

// Data shape returned from Google Apps Script
export interface ApiState {
  isSessionActive: boolean;
  activeSpeakerId: string | null;
  queue: QueueItem[];
  history: SessionHistory[];
  answeredUsers: QueueItem[];
}

export interface AppContextType {
  user: User | null;
  login: (name: string, role: UserRole, businessName?: string) => void;
  logout: () => void;
  isSessionActive: boolean;
  startSession: () => Promise<void>;
  stopSession: () => Promise<void>;
  raiseHand: () => Promise<void>;
  queue: QueueItem[];
  history: SessionHistory[];
  currentUserRank: number | null;
  activeSpeakerId: string | null;
  selectSpeaker: (id: string) => Promise<void>;
  markAsAnswered: (id: string) => Promise<void>;
  getParticipantCount: (name: string, businessName?: string) => number;
  isLoading: boolean; // Added for UI feedback
}