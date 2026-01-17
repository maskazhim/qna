import { ApiState, QueueItem } from '../types';

// ==============================================================================
// ⚠️ PENTING: GANTI URL DI BAWAH INI DENGAN URL WEB APP HASIL DEPLOY GAS ANDA
// ==============================================================================
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbwg-hsm09Fbe9bRssFQSq3mAfnlYxGqMkOo5AkTGR2YcttkGtg5l2C-aIEGWSpdhO3b/exec'; 

export const api = {
  // Fetch current state from Spreadsheet
  fetchState: async (): Promise<ApiState> => {
    // Mencegah error 'Failed to fetch' jika URL belum diganti
    if (GAS_API_URL.includes('YOUR_SCRIPT_ID_HERE')) {
      console.warn("⚠️ API URL belum dikonfigurasi. Mohon ganti GAS_API_URL di services/googleSheetApi.ts");
      // Return mock data agar aplikasi tidak crash
      return {
        isSessionActive: false,
        activeSpeakerId: null,
        queue: [],
        history: [],
        answeredUsers: []
      };
    }

    try {
      // credentials: 'omit' penting untuk request GAS agar tidak error saat redirect (302)
      // TAMBAHAN PENTING: '&t=' + Date.now() untuk mencegah caching browser
      const noCacheUrl = `${GAS_API_URL}?action=getState&t=${Date.now()}`;
      
      const response = await fetch(noCacheUrl, {
        method: 'GET',
        credentials: 'omit',
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      // DEBUG: Uncomment baris di bawah ini untuk melihat data asli dari server di Console
      // console.log("🔥 Server Data:", data.isSessionActive, typeof data.isSessionActive);
      
      return data;
    } catch (error) {
      // Re-throw agar bisa ditangani di AppContext
      throw error;
    }
  },

  // Helper untuk POST request
  // Menggunakan text/plain untuk menghindari CORS Preflight (Options) request yang sering gagal di GAS
  _post: async (action: string, payload: any) => {
    if (GAS_API_URL.includes('YOUR_SCRIPT_ID_HERE')) {
       console.warn(`⚠️ Cannot execute '${action}': API URL not configured.`);
       return;
    }

    // Menggunakan POST, timestamp tidak wajib di URL tapi baik untuk konsistensi
    const targetUrl = `${GAS_API_URL}?action=${action}`;

    await fetch(targetUrl, {
      method: 'POST',
      credentials: 'omit', // Penting untuk fix CORS redirect
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify({ action, payload }),
    });
  },

  startSession: async () => {
    await api._post('startSession', {});
  },

  stopSession: async () => {
    await api._post('stopSession', {});
  },

  raiseHand: async (user: { id: string, name: string, businessName?: string, timestamp: number }) => {
    await api._post('raiseHand', user);
  },

  selectSpeaker: async (id: string) => {
    await api._post('selectSpeaker', { id });
  },

  markAnswered: async (id: string) => {
    await api._post('markAnswered', { id });
  }
};