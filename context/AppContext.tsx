import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppContextType, QueueItem, SessionHistory, User, UserRole } from '../types';
import { supabase } from '../services/supabaseClient';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- Local User State ---
  const [user, setUser] = useState<User | null>(null);
  
  // --- Synced State (Supabase) ---
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [answeredUsers, setAnsweredUsers] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  
  // --- UI States ---
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load User from LocalStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

  // --- INITIAL DATA FETCH ---
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);

      // 1. Get App State
      let { data: stateData, error: stateError } = await supabase
        .from('app_state')
        .select('*')
        .eq('id', 1)
        .maybeSingle(); // Use maybeSingle to avoid error if row doesn't exist
      
      // SELF HEALING: If app_state row doesn't exist, create it.
      if (!stateData) {
        console.log("App state missing, initializing...");
        const { data: newData, error: initError } = await supabase
          .from('app_state')
          .insert([{ id: 1, is_session_active: false, current_session_id: null, active_speaker_id: null }])
          .select()
          .single();
        
        if (initError) {
            console.error("Critical: Failed to initialize app_state. Check API Key/RLS.", initError);
            throw initError;
        }
        stateData = newData;
      }
      
      if (stateError) throw stateError;
      
      if (stateData) {
        setIsSessionActive(stateData.is_session_active);
        setCurrentSessionId(stateData.current_session_id);
        setActiveSpeakerId(stateData.active_speaker_id);

        // 2. Get Queue (Waiting) for current session
        if (stateData.current_session_id) {
          const { data: queueData, error: queueError } = await supabase
            .from('queue')
            .select('*')
            .eq('session_id', stateData.current_session_id)
            .eq('status', 'waiting')
            .order('created_at', { ascending: true });

          if (!queueError && queueData) {
            const mappedQueue: QueueItem[] = queueData.map(item => ({
               id: item.id,
               name: item.name,
               businessName: item.business_name,
               timestamp: new Date(item.created_at).getTime()
            }));
            setQueue(mappedQueue);
          }

          // 3. Get Answered for current session
          const { data: ansData } = await supabase
            .from('queue')
            .select('*')
            .eq('session_id', stateData.current_session_id)
            .eq('status', 'answered');
            
          if (ansData) {
             const mappedAns: QueueItem[] = ansData.map(item => ({
               id: item.id,
               name: item.name,
               businessName: item.business_name,
               timestamp: new Date(item.created_at).getTime()
            }));
            setAnsweredUsers(mappedAns);
          }
        }
      }

      // 4. Load History (Sessions that ended)
      await fetchHistory();

    } catch (error) {
      console.error("Error fetching initial data:", error);
      // alert("Gagal memuat data. Periksa koneksi internet atau API Key Supabase Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select(`
        id, created_at, ended_at,
        queue (id, name, business_name, created_at, status)
      `)
      .not('ended_at', 'is', null)
      .order('created_at', { ascending: false });

    if (sessionData) {
      const mappedHistory: SessionHistory[] = sessionData.map(s => ({
        id: s.id,
        startTime: new Date(s.created_at).getTime(),
        endTime: new Date(s.ended_at).getTime(),
        participants: Array.isArray(s.queue) 
          ? s.queue.map((q: any) => ({
              id: q.id,
              name: q.name,
              businessName: q.business_name,
              timestamp: new Date(q.created_at).getTime()
            }))
          : []
      }));
      setHistory(mappedHistory);
    }
  };

  // --- SUPABASE REALTIME SUBSCRIPTIONS ---
  useEffect(() => {
    fetchInitialData();

    // Channel for App State (Active Session, Speaker)
    const stateChannel = supabase.channel('public:app_state')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state', filter: 'id=eq.1' }, (payload) => {
        const newData = payload.new as any;
        if (newData) {
            setIsSessionActive(newData.is_session_active);
            setCurrentSessionId(newData.current_session_id);
            setActiveSpeakerId(newData.active_speaker_id);
            
            // If session turned off, clear local queue visually
            if (!newData.is_session_active) {
              setQueue([]);
              setAnsweredUsers([]);
              fetchHistory(); 
            }
        }
      })
      .subscribe();

    // Channel for Queue (Insertions, Updates)
    const queueChannel = supabase.channel('public:queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue' }, async (payload) => {
        
        // If it's an INSERT (Raise Hand)
        if (payload.eventType === 'INSERT') {
           const newItem = payload.new;
           // Only add if it belongs to current active session and is waiting
           if (newItem.status === 'waiting' && newItem.session_id === currentSessionIdRef.current) {
              setQueue(prev => {
                // Prevent duplicate addition from realtime if we already added it optimistically
                if (prev.some(p => p.id === newItem.id)) return prev;
                
                return [...prev, {
                  id: newItem.id,
                  name: newItem.name,
                  businessName: newItem.business_name,
                  timestamp: new Date(newItem.created_at).getTime()
                }];
              });
           }
        }

        // If it's an UPDATE (Marked Answered)
        if (payload.eventType === 'UPDATE') {
          const updatedItem = payload.new;
          if (updatedItem.status === 'answered') {
             // Remove from queue
             setQueue(prev => prev.filter(q => q.id !== updatedItem.id));
             // Add to answered (optional, for count consistency)
             setAnsweredUsers(prev => {
                 if (prev.some(p => p.id === updatedItem.id)) return prev;
                 return [...prev, {
                    id: updatedItem.id,
                    name: updatedItem.name,
                    businessName: updatedItem.business_name,
                    timestamp: new Date(updatedItem.created_at).getTime()
                 }];
             });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(stateChannel);
      supabase.removeChannel(queueChannel);
    };
  }, []); // Run once on mount

  // Ref to access currentSessionId inside realtime callback closure
  const currentSessionIdRef = useRef(currentSessionId);
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
  }, [currentSessionId]);


  // --- ACTIONS ---

  const login = (name: string, role: UserRole, businessName?: string) => {
    const newUser = { name, role, businessName };
    setUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const startSession = async () => {
    setIsLoading(true);
    try {
      console.log("Starting session...");
      // 1. Create new session row
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .insert([{ created_at: new Date().toISOString() }])
        .select()
        .single();

      if (sessionError) {
          console.error("Error creating session:", sessionError);
          alert(`Gagal membuat sesi: ${sessionError.message}`);
          throw sessionError;
      }

      // 2. Update App State
      // Using update instead of upsert for safety, assuming row 1 exists (handled by fetchInitialData)
      const { error: stateError } = await supabase
        .from('app_state')
        .update({ 
          is_session_active: true, 
          current_session_id: sessionData.id,
          active_speaker_id: null
        })
        .eq('id', 1);

      if (stateError) {
          console.error("Error updating app_state:", stateError);
          alert(`Gagal mengupdate status: ${stateError.message}`);
          throw stateError;
      }

      console.log("Session started successfully");
      // Local update handles by Realtime, but let's reset queue locally just in case
      setQueue([]);
      setAnsweredUsers([]);

    } catch (e: any) {
      console.error("Failed to start session Exception", e);
      if (e?.code === 'PGRST301' || e?.message?.includes('JWT')) {
          alert("Koneksi ditolak. Mohon cek 'Anon Key' Supabase Anda di services/supabaseClient.ts");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const stopSession = async () => {
    setIsLoading(true);
    try {
      // 1. Close current session
      if (currentSessionId) {
        const { error: sessionError } = await supabase
          .from('sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', currentSessionId);
          
        if (sessionError) throw sessionError;
      }

      // 2. Update App State (Using UPDATE with EQ is safer than UPSERT for modifying existing state)
      const { error: stateError } = await supabase
        .from('app_state')
        .update({ 
          is_session_active: false, 
          active_speaker_id: null 
          // We keep current_session_id for reference until new one starts
        })
        .eq('id', 1);

      if (stateError) throw stateError;

    } catch (e: any) {
      console.error("Failed to stop session", e);
      alert(`Gagal menghentikan sesi: ${e.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const raiseHand = async () => {
    if (!user || !isSessionActive || !currentSessionId) return;

    // OPTIMISTIC UI: Add to local queue immediately
    const tempId = crypto.randomUUID();
    const newItem: QueueItem = {
      id: tempId,
      name: user.name,
      businessName: user.businessName,
      timestamp: Date.now(),
    };
    
    // Check duplicate locally
    if (queue.some(q => q.name === user.name && q.businessName === user.businessName)) return;

    setQueue(prev => [...prev, newItem]);

    try {
      const { data, error } = await supabase
        .from('queue')
        .insert([{
          session_id: currentSessionId,
          name: user.name,
          business_name: user.businessName,
          status: 'waiting'
        }])
        .select()
        .single();

      if (error) throw error;

      // Replace temp item with real item from DB (ID correction)
      setQueue(prev => prev.map(q => q.id === tempId ? { ...q, id: data.id } : q));

    } catch (e) {
      console.error("Failed to raise hand", e);
      // Rollback
      setQueue(prev => prev.filter(q => q.id !== tempId));
      alert("Gagal mengangkat tangan. Cek koneksi.");
    }
  };

  const selectSpeaker = async (id: string) => {
    // Optimistic
    setActiveSpeakerId(id);
    try {
      await supabase
        .from('app_state')
        .update({ active_speaker_id: id })
        .eq('id', 1);
    } catch (e) {
      console.error("Failed to select speaker", e);
    }
  };

  const markAsAnswered = async (id: string) => {
    // Optimistic
    setActiveSpeakerId(null);
    setQueue(prev => prev.filter(q => q.id !== id));
    
    try {
      // 1. Update queue item status
      await supabase
        .from('queue')
        .update({ status: 'answered' })
        .eq('id', id);

      // 2. Reset speaker in global state
      await supabase
        .from('app_state')
        .update({ active_speaker_id: null })
        .eq('id', 1);

    } catch (e) {
       console.error("Failed to mark answered", e);
    }
  };

  // Helper to count total questions across history + current answered
  const getParticipantCount = (name: string, businessName?: string): number => {
    let count = 0;
    const compare = (itemName: string, itemBusiness?: string) => {
      const isNameMatch = itemName.toLowerCase() === name.toLowerCase();
      const isBusinessMatch = businessName 
        ? (itemBusiness || '').toLowerCase() === (businessName || '').toLowerCase()
        : true; 
      return isNameMatch && isBusinessMatch;
    };

    // Check History
    history.forEach(session => {
      if (Array.isArray(session.participants)) {
        session.participants.forEach(p => {
          if (compare(p.name, p.businessName)) count++;
        });
      }
    });

    // Check Current Answered (Realtime)
    answeredUsers.forEach(p => {
      if (compare(p.name, p.businessName)) count++;
    });

    return count;
  };

  const currentUserRank = user && queue.length > 0 
    ? queue.findIndex(q => 
        q.name === user.name && 
        q.businessName === user.businessName
      ) + 1 
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
      getParticipantCount,
      isLoading
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
