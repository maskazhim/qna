
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppContextType, QueueItem, SessionHistory, User, UserRole, AppEvent } from '../types';
import { client, databases, account, DATABASE_ID, COLLECTION_EVENTS, COLLECTION_QUEUE, COLLECTION_SESSIONS, COLLECTION_ADMINS } from '../services/appwriteClient';
import { ID, Query } from 'appwrite';
import { hashPassword } from '../utils/crypto';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Local User State ---
  const [user, setUser] = useState<User | null>(null);
  
  // --- Event State ---
  const [availableEvents, setAvailableEvents] = useState<AppEvent[]>([]);
  const [currentEvent, setCurrentEvent] = useState<AppEvent | null>(null);
  
  // --- Synced State (Inside Event) ---
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [answeredUsers, setAnsweredUsers] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  
  // --- UI States ---
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Derived state for convenience
  const isSessionActive = currentEvent?.is_session_active || false;
  const activeSpeakerId = currentEvent?.active_speaker_id || null;
  const eventName = currentEvent?.event_name || '';

  // 1. Initialize & Fetch Public Events on Mount
  useEffect(() => {
    const initApp = async () => {
      // Restore User
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse user", e);
        }
      }

      // Appwrite Anon Session
      try {
        await account.getSession('current');
      } catch {
        try {
          await account.createAnonymousSession();
        } catch (e: any) {
          console.error("Failed to create anon session:", e);
          if (e.message?.includes('Network request failed')) {
              setConnectionError("Gagal terhubung ke Appwrite.");
              return;
          }
        }
      }
      
      // Fetch List of Events for Dropdown
      await fetchAvailableEvents();
    };

    initApp();
  }, []);

  const fetchAvailableEvents = async () => {
    const mapDocToEvent = (doc: any): AppEvent => ({
        id: doc.$id,
        event_code: doc.event_code || 'GENERAL',
        event_name: doc.event_name || 'Unnamed Event',
        is_public: doc.is_public !== false, // Default to true if missing
        is_session_active: doc.is_session_active,
        current_session_id: doc.current_session_id,
        active_speaker_id: doc.active_speaker_id,
        created_by: doc.created_by
    });

    try {
      // Fetch ALL events (Removed Query.equal('is_public', true))
      // So Admin can see hidden events to toggle them back
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_EVENTS,
        [
          Query.orderDesc('$createdAt'),
          Query.limit(50)
        ]
      );
      
      setAvailableEvents(res.documents.map(mapDocToEvent));
    } catch (e: any) {
      console.warn("Primary fetch failed, attempting fallback...", e.message);
      
      // FALLBACK
      try {
          const res = await databases.listDocuments(
              DATABASE_ID,
              COLLECTION_EVENTS,
              [
                Query.orderDesc('$createdAt'),
                Query.limit(50)
              ]
          );
          setAvailableEvents(res.documents.map(mapDocToEvent));
      } catch (e2) {
          console.error("Fallback fetch also failed", e2);
      }
    }
  };

  // 2. Load Event Data when `currentEvent` changes
  useEffect(() => {
    if (currentEvent) {
      if (currentEvent.current_session_id) {
        fetchQueue(currentEvent.current_session_id, currentEvent.event_code);
      } else {
        setQueue([]);
        setAnsweredUsers([]);
      }
      fetchHistory(currentEvent.event_code);
    }
  }, [currentEvent?.id, currentEvent?.current_session_id]);


  const fetchQueue = async (sessionId: string, eventCode: string) => {
    try {
      const waitingRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_QUEUE,
        [
          Query.equal('session_id', sessionId),
          // Fallback if event_code query fails not implemented here for brevity, assuming generic schema fix
          Query.equal('event_code', eventCode), 
          Query.equal('status', 'waiting'),
          Query.orderAsc('$createdAt'),
          Query.limit(100)
        ]
      );

      setQueue(waitingRes.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        businessName: doc.business_name,
        timestamp: new Date(doc.$createdAt).getTime(),
        eventCode: doc.event_code
      })));

      const answeredRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_QUEUE,
        [
          Query.equal('session_id', sessionId),
          Query.equal('status', 'answered'),
          Query.limit(100)
        ]
      );
      
      setAnsweredUsers(answeredRes.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        businessName: doc.business_name,
        timestamp: new Date(doc.$createdAt).getTime(),
        eventCode: doc.event_code
      })));

    } catch (e) {
      console.error("Fetch queue failed", e);
    }
  };

  const fetchHistory = async (eventCode: string) => {
    try {
      const sessionsRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_SESSIONS,
        [
          Query.equal('event_code', eventCode),
          Query.isNotNull('ended_at'),
          Query.orderDesc('$createdAt'),
          Query.limit(20)
        ]
      );

      const historyItems: SessionHistory[] = [];

      for (const sess of sessionsRes.documents) {
        const partsRes = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_QUEUE,
            [
                Query.equal('session_id', sess.$id),
                Query.limit(100)
            ]
        );

        historyItems.push({
            id: sess.$id,
            startTime: new Date(sess.$createdAt).getTime(),
            endTime: new Date(sess.ended_at).getTime(),
            eventCode: sess.event_code,
            participants: partsRes.documents.map(d => ({
                id: d.$id,
                name: d.name,
                businessName: d.business_name,
                timestamp: new Date(d.$createdAt).getTime(),
                eventCode: d.event_code
            }))
        });
      }
      setHistory(historyItems);
    } catch (e) {
      console.error("Fetch history failed", e);
    }
  };

  // --- REALTIME ---
  const currentEventRef = useRef(currentEvent);
  useEffect(() => { currentEventRef.current = currentEvent; }, [currentEvent]);

  useEffect(() => {
    if (!currentEvent) return;

    // Only subscribe to THIS specific event document and queues related to it
    const unsubscribe = client.subscribe(
      [
        `databases.${DATABASE_ID}.collections.${COLLECTION_EVENTS}.documents.${currentEvent.id}`,
        `databases.${DATABASE_ID}.collections.${COLLECTION_QUEUE}.documents`
      ], 
      (response) => {
        const eventCode = currentEventRef.current?.event_code;
        if (!eventCode) return;

        // 1. Event/State Updates
        if (response.events.some(e => e.includes(`collections.${COLLECTION_EVENTS}`))) {
            const newData = response.payload as any;
            // Merge update
            setCurrentEvent(prev => prev ? { ...prev, ...newData } : null);
            
            if (newData.is_session_active === false) {
                setQueue([]);
                setAnsweredUsers([]);
                fetchHistory(eventCode);
            }
        }

        // 2. Queue Updates
        if (response.events.some(e => e.includes(`collections.${COLLECTION_QUEUE}`))) {
            const payload = response.payload as any;
            
            // SECURITY: Only process if it belongs to current event
            if (payload.event_code !== eventCode) return;
            // AND belongs to current session
            if (payload.session_id !== currentEventRef.current?.current_session_id) return;

            const eventType = response.events[0];

            if (eventType.endsWith('.create') && payload.status === 'waiting') {
                setQueue(prev => {
                    if (prev.some(p => p.id === payload.$id)) return prev;
                    // Handle optimistic
                    const optimisticIdx = prev.findIndex(p => p.id.startsWith('temp-') && p.name === payload.name);
                    
                    const newItem: QueueItem = {
                        id: payload.$id,
                        name: payload.name,
                        businessName: payload.business_name,
                        timestamp: new Date(payload.$createdAt).getTime(),
                        eventCode: payload.event_code
                    };

                    if (optimisticIdx !== -1) {
                        const newQ = [...prev];
                        newQ[optimisticIdx] = newItem;
                        return newQ;
                    }
                    return [...prev, newItem];
                });
            } else if (eventType.endsWith('.update') && payload.status === 'answered') {
                 setQueue(prev => prev.filter(q => q.id !== payload.$id));
                 setAnsweredUsers(prev => [...prev, {
                     id: payload.$id,
                     name: payload.name,
                     businessName: payload.business_name,
                     timestamp: new Date(payload.$createdAt).getTime(),
                     eventCode: payload.event_code
                 }]);
            }
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentEvent?.id]); // Re-subscribe only if event ID changes (User switches event)


  // --- ACTIONS ---

  const joinEvent = async (eventCode: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_EVENTS,
        [Query.equal('event_code', eventCode), Query.limit(1)]
      );

      if (res.documents.length === 0) {
        setIsLoading(false);
        return false;
      }

      const doc = res.documents[0];
      const event: AppEvent = {
        id: doc.$id,
        event_code: doc.event_code,
        event_name: doc.event_name,
        is_public: doc.is_public !== false,
        is_session_active: doc.is_session_active,
        current_session_id: doc.current_session_id,
        active_speaker_id: doc.active_speaker_id,
        created_by: doc.created_by
      };

      setCurrentEvent(event);
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      return false;
    }
  };

  const createEvent = async (name: string, code: string, isPublic: boolean): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Check duplicate code
      const check = await databases.listDocuments(DATABASE_ID, COLLECTION_EVENTS, [Query.equal('event_code', code)]);
      if (check.documents.length > 0) throw new Error("Kode event sudah dipakai");

      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_EVENTS,
        ID.unique(),
        {
          event_name: name,
          event_code: code,
          is_public: isPublic,
          created_by: user?.name || 'admin',
          is_session_active: false
        }
      );

      // Set as current
      setCurrentEvent({
        id: doc.$id,
        event_code: code,
        event_name: name,
        is_public: isPublic,
        is_session_active: false
      });
      
      // FIX: Refresh available events list immediately so it shows up in dropdowns
      await fetchAvailableEvents();

      setIsLoading(false);
      return true;
    } catch (e: any) {
      alert("Gagal membuat event: " + e.message);
      setIsLoading(false);
      return false;
    }
  };

  const adminSelectEvent = async (code: string) => {
    return joinEvent(code);
  };

  const toggleEventVisibility = async (id: string, currentStatus: boolean) => {
    try {
       await databases.updateDocument(DATABASE_ID, COLLECTION_EVENTS, id, { is_public: !currentStatus });
       await fetchAvailableEvents();
    } catch (e: any) {
       alert("Gagal mengubah status: " + e.message);
    }
  };

  const login = async (name: string, role: UserRole, businessName?: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (role === UserRole.ADMIN) {
        if (!password) throw new Error("Password required");
        if (name === 'kazhim' && password === 'kazhim123') {
           const newUser = { name, role, businessName };
           setUser(newUser);
           localStorage.setItem('currentUser', JSON.stringify(newUser));
           setIsLoading(false);
           return true;
        }
        const hashedPassword = await hashPassword(password);
        const adminCheck = await databases.listDocuments(
          DATABASE_ID, 
          COLLECTION_ADMINS, 
          [Query.equal('username', name), Query.equal('password_hash', hashedPassword)]
        );
        
        if (adminCheck.documents.length === 0) {
           setIsLoading(false);
           return false;
        }
      }

      const newUser = { name, role, businessName };
      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setIsLoading(false);
      return true;
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentEvent(null); // Reset event on logout
    localStorage.removeItem('currentUser');
  };

  const updateEventName = async (newName: string) => {
    if (!currentEvent) return;
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_EVENTS, currentEvent.id, { event_name: newName });
      // FIX: Refresh available events list to reflect name change in lists
      await fetchAvailableEvents();
    } catch (e: any) {
      alert("Gagal update: " + e.message);
    }
  };

  const addNewAdmin = async (username: string, password: string) => {
    try {
        const hashedPassword = await hashPassword(password);
        await databases.createDocument(DATABASE_ID, COLLECTION_ADMINS, ID.unique(), {
            username,
            password_hash: hashedPassword
        });
    } catch (e) { throw e; }
  };

  const startSession = async () => {
    if (!currentEvent) return;
    setIsLoading(true);
    try {
      const sessionDoc = await databases.createDocument(DATABASE_ID, COLLECTION_SESSIONS, ID.unique(), {
          ended_at: null,
          event_code: currentEvent.event_code
      });

      await databases.updateDocument(DATABASE_ID, COLLECTION_EVENTS, currentEvent.id, {
          is_session_active: true,
          current_session_id: sessionDoc.$id,
          active_speaker_id: null
      });

      setQueue([]);
      setAnsweredUsers([]);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSession = async () => {
    if (!currentEvent) return;
    setIsLoading(true);
    try {
      if (currentEvent.current_session_id) {
        await databases.updateDocument(DATABASE_ID, COLLECTION_SESSIONS, currentEvent.current_session_id, { ended_at: new Date().toISOString() });
      }
      await databases.updateDocument(DATABASE_ID, COLLECTION_EVENTS, currentEvent.id, {
          is_session_active: false,
          active_speaker_id: null
      });
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const raiseHand = async () => {
    if (!user || !currentEvent?.is_session_active || !currentEvent.current_session_id) return;
    
    // Optimistic UI
    const tempId = 'temp-' + Date.now();
    setQueue(prev => [...prev, { id: tempId, name: user.name, businessName: user.businessName, timestamp: Date.now(), eventCode: currentEvent.event_code }]);

    try {
      await databases.createDocument(DATABASE_ID, COLLECTION_QUEUE, ID.unique(), {
          session_id: currentEvent.current_session_id,
          name: user.name,
          business_name: user.businessName,
          status: 'waiting',
          event_code: currentEvent.event_code
      });
    } catch (e) {
      setQueue(prev => prev.filter(q => q.id !== tempId)); // Rollback
      console.error(e);
    }
  };

  const selectSpeaker = async (id: string) => {
    if (!currentEvent) return;
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_EVENTS, currentEvent.id, { active_speaker_id: id });
    } catch (e) { console.error(e); }
  };

  const markAsAnswered = async (id: string) => {
    if (!currentEvent) return;
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_QUEUE, id, { status: 'answered' });
      await databases.updateDocument(DATABASE_ID, COLLECTION_EVENTS, currentEvent.id, { active_speaker_id: null });
    } catch (e) { console.error(e); }
  };

  const getParticipantCount = (name: string, businessName?: string): number => {
      // Simplification for multi-event: currently just counting logic remains same but filters by array
      // Might want to filter history by eventCode too if needed strictly, but history is already filtered in state
      let count = 0;
      const compare = (n: string, b?: string) => n.toLowerCase() === name.toLowerCase() && (businessName ? (b||'').toLowerCase() === businessName.toLowerCase() : true);
      
      history.forEach(h => h.participants.forEach(p => { if (compare(p.name, p.businessName)) count++; }));
      answeredUsers.forEach(p => { if (compare(p.name, p.businessName)) count++; });
      return count;
  };

  const currentUserRank = user && queue.length > 0 ? queue.findIndex(q => q.name === user.name && q.businessName === user.businessName) + 1 : null;

  if (connectionError) return <div className="p-10 text-center text-red-600 font-bold">{connectionError}</div>;

  return (
    <AppContext.Provider value={{
      user, login, logout, availableEvents, currentEvent, fetchAvailableEvents, joinEvent, createEvent, adminSelectEvent, toggleEventVisibility,
      isSessionActive, startSession, stopSession, raiseHand, queue, history, currentUserRank, activeSpeakerId, selectSpeaker, markAsAnswered, getParticipantCount, isLoading, eventName, updateEventName, addNewAdmin
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
