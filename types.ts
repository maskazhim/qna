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

export interface AppContextType {
  user: User | null;
  login: (name: string, role: UserRole, businessName?: string) => void;
  logout: () => void;
  isSessionActive: boolean;
  startSession: () => void;
  stopSession: () => void;
  raiseHand: () => number;
  queue: QueueItem[];
  history: SessionHistory[];
  currentUserRank: number | null;
  activeSpeakerId: string | null;
  selectSpeaker: (id: string) => void;
  markAsAnswered: (id: string) => void;
  getParticipantCount: (name: string) => number;
}