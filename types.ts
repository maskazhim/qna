

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export interface User {
  name: string;
  role: UserRole;
  businessName?: string;
}

export interface AppEvent {
  id: string; // Document ID
  event_code: string;
  event_name: string;
  is_public: boolean;
  is_session_active: boolean;
  current_session_id?: string | null;
  active_speaker_id?: string | null;
  created_by?: string;
}

export interface QueueItem {
  id: string;
  name: string;
  businessName?: string;
  timestamp: number;
  eventCode: string;
}

export interface SessionHistory {
  id: string;
  startTime: number;
  endTime: number;
  participants: QueueItem[]; 
  eventCode: string;
}

export interface AppContextType {
  user: User | null;
  // Login sets the user profile
  login: (name: string, role: UserRole, businessName?: string, password?: string) => Promise<boolean>;
  logout: () => void;
  
  // Event Management
  availableEvents: AppEvent[]; // List of all events (Admin sees all, User sees filtered)
  currentEvent: AppEvent | null;
  eventName: string;
  fetchAvailableEvents: () => Promise<void>;
  joinEvent: (eventCode: string) => Promise<boolean>; // For User
  createEvent: (name: string, code: string, isPublic: boolean) => Promise<boolean>; // For Admin
  adminSelectEvent: (eventCode: string) => Promise<boolean>; // For Admin selecting existing
  toggleEventVisibility: (id: string, currentStatus: boolean) => Promise<void>; // New Toggle Function
  
  updateEventName: (name: string) => Promise<void>;
  addNewAdmin: (username: string, password: string) => Promise<void>;

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
  isLoading: boolean;
}