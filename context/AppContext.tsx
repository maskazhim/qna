import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { AppContextType, QueueItem, SessionHistory, User, UserRole } from '../types';
import { api } from '../services/googleSheetApi';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Local state for User Identity (Still stored locally)
  const [user, setUser] = useState<User | null>(null);
  
  // Synced state from Spreadsheet
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [answeredUsers, setAnsweredUsers] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<SessionHistory[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  
  // UI States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState<boolean>(true); // Untuk mencegah flicker "Sesi Tertutup" saat awal buka

  // Refs to track state inside interval closure without re-triggering it
  const isSessionActiveRef = useRef(isSessionActive);
  const falseReadingCountRef = useRef(0);

  // Update ref whenever state changes
  useEffect(() => {
    isSessionActiveRef.current = isSessionActive;
  }, [isSessionActive]);

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

  // POLLING MECHANISM: Fetch data from GAS every 3 seconds
  useEffect(() => {
    let isMounted = true;
    let failCount = 0;

    const fetchData = async () => {
      try {
        const data = await api.fetchState();
        if (isMounted && data) {
          
          // --- STABILITY LOGIC START ---
          // Mencegah sesi 'tertutup sendiri' karena glitch sesaat dari Google Sheets.
          // Kita hanya menutup sesi jika menerima status FALSE sebanyak 2x berturut-turut.
          
          let stableIsSessionActive = data.isSessionActive;

          if (data.isSessionActive) {
            // Jika server bilang TRUE, langsung percaya & reset counter error
            falseReadingCountRef.current = 0;
            stableIsSessionActive = true;
          } else {
            // Jika server bilang FALSE...
            if (isSessionActiveRef.current === true) {
              // ...tapi status lokal kita masih TRUE, curigai ini glitch
              falseReadingCountRef.current += 1;
              
              if (falseReadingCountRef.current < 3) { // Naikkan toleransi ke 3 kali poll (sekitar 9 detik)
                 // Abaikan pembacaan FALSE sementara (anggap glitch jaringan/sheet)
                 stableIsSessionActive = true; 
              } else {
                 // Jika sudah 3x berturut-turut FALSE, baru anggap valid tertutup
                 stableIsSessionActive = false;
              }
            } else {
              // Jika lokal sudah FALSE, ya biarkan FALSE
              stableIsSessionActive = false;
            }
          }
          // --- STABILITY LOGIC END ---

          setIsSessionActive(stableIsSessionActive);
          
          // LOGIKA BARU: Jika sesi tertutup, paksa antrian kosong di UI
          if (!stableIsSessionActive) {
            setQueue([]);
          } else {
            setQueue(data.queue || []);
          }

          setAnsweredUsers(data.answeredUsers || []);
          setHistory(data.history || []);
          setActiveSpeakerId(data.activeSpeakerId);
          
          setIsFirstLoad(false);
          failCount = 0; // Reset fail count on success
        }
      } catch (error) {
        failCount++;
        // Hanya log error jika gagal berturut-turut
        if (failCount < 3) {
          console.warn("Sync warning (retrying...):", error);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Poll every 3 seconds
    const intervalId = setInterval(fetchData, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

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
    // Optimistic Update
    setIsSessionActive(true);
    falseReadingCountRef.current = 0; // Reset glitch counter
    try {
      await api.startSession();
      // Force immediate refresh
      const data = await api.fetchState();
      setQueue(data.queue || []);
    } catch (e) {
      console.error("Failed to start session", e);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSession = async () => {
    // Hanya fungsi ini yang boleh menutup sesi di server
    setIsLoading(true);
    setIsSessionActive(false); // Optimistic close
    setQueue([]); // Langsung kosongkan antrian di UI
    
    try {
      await api.stopSession();
      
      // PENTING: Tunggu sebentar (1.5 detik) agar Script GAS selesai memindahkan data ke History
      // sebelum kita fetch data terbaru. Ini memperbaiki masalah "History belum muncul".
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const data = await api.fetchState();
      setHistory(data.history || []);
      // Pastikan queue benar-benar kosong sesuai data server juga
      if (!data.isSessionActive) setQueue([]);
    } catch (e) {
      console.error("Failed to stop session", e);
    } finally {
      setIsLoading(false);
    }
  };

  const raiseHand = async () => {
    if (!user || !isSessionActive) return;

    // CEK DUPLIKAT: Pastikan user dengan Nama & Bisnis yang sama belum ada di antrian
    const isDuplicate = queue.some(q => 
      q.name.toLowerCase() === user.name.toLowerCase() && 
      (q.businessName || '').toLowerCase() === (user.businessName || '').toLowerCase()
    );

    if (isDuplicate) {
      console.warn("User already in queue (Duplicate prevention)");
      return; 
    }

    setIsLoading(true);

    const newItem: QueueItem = {
      id: crypto.randomUUID(),
      name: user.name,
      businessName: user.businessName,
      timestamp: Date.now(),
    };

    // Optimistic UI update
    setQueue(prev => [...prev, newItem]);

    try {
      await api.raiseHand(newItem);
    } catch (e) {
      console.error("Failed to raise hand", e);
      setQueue(prev => prev.filter(q => q.id !== newItem.id));
    } finally {
      setIsLoading(false);
    }
  };

  const selectSpeaker = async (id: string) => {
    setIsLoading(true);
    setActiveSpeakerId(id); // Optimistic
    try {
      await api.selectSpeaker(id);
    } catch (e) {
      console.error("Failed to select speaker", e);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsAnswered = async (id: string) => {
    setIsLoading(true);
    // Optimistic
    setActiveSpeakerId(null);
    setQueue(prev => prev.filter(q => q.id !== id));
    
    try {
      await api.markAnswered(id);
      const data = await api.fetchState();
      setAnsweredUsers(data.answeredUsers || []);
    } catch (e) {
       console.error("Failed to mark answered", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getParticipantCount = (name: string, businessName?: string): number => {
    let count = 0;
    const compare = (itemName: string, itemBusiness?: string) => {
      const isNameMatch = itemName.toLowerCase() === name.toLowerCase();
      // Jika businessName disediakan, cek juga. Jika tidak, cukup cek nama (backward compatibility/loose check)
      const isBusinessMatch = businessName 
        ? (itemBusiness || '').toLowerCase() === businessName.toLowerCase()
        : true; 
      return isNameMatch && isBusinessMatch;
    };

    history.forEach(session => {
      // Safety check for participants
      if (Array.isArray(session.participants)) {
        session.participants.forEach(p => {
          if (compare(p.name, p.businessName)) count++;
        });
      }
    });
    answeredUsers.forEach(p => {
      if (compare(p.name, p.businessName)) count++;
    });
    return count;
  };

  // Logic Rank: Harus match Nama DAN Bisnis untuk menghindari salah identifikasi
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