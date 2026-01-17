import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Hand, LogOut, Clock, Building2, Mic, PartyPopper, CheckCircle, Loader2, Hourglass } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, logout, isSessionActive, raiseHand, currentUserRank, activeSpeakerId, queue, isLoading } = useApp();
  
  // States for Popup Logic
  const [showRankPopup, setShowRankPopup] = useState(false);
  const [showSelectedPopup, setShowSelectedPopup] = useState(false);
  
  // State for "Checking Order" flow
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingRank, setIsValidatingRank] = useState(false);

  // Determine if current user is the active speaker
  const currentUserId = queue.find(q => 
    q.name === user?.name && 
    q.businessName === user?.businessName
  )?.id;

  const isActiveSpeaker = currentUserId && activeSpeakerId === currentUserId;

  // EFFECT: Handle Rank Popup
  useEffect(() => {
    // Show Rank popup ONLY if:
    // 1. We are validating rank (user just clicked button) AND rank is now available
    // 2. OR rank changes significantly (optional, but requested behavior focuses on post-click)
    
    if (currentUserRank && isValidatingRank) {
       // Stop validating state
       setIsValidatingRank(false);
       // Show popup
       setShowRankPopup(true);
    }
    
    // Safety: If for some reason user is in queue but popup was closed, don't reopen unless validation flow triggers it.
    // However, if speaker becomes active, close rank popup.
    if (activeSpeakerId) {
      setShowRankPopup(false);
    }

  }, [currentUserRank, isValidatingRank, activeSpeakerId]);

  // EFFECT: Handle Selected Speaker Popup
  useEffect(() => {
    if (isActiveSpeaker) {
      setShowSelectedPopup(true);
      setShowRankPopup(false);
      setIsValidatingRank(false); // Ensure validation UI is closed if suddenly selected
    } else {
      setShowSelectedPopup(false);
    }
  }, [isActiveSpeaker]);

  const handleRaiseHand = async () => {
    if (isSessionActive && !currentUserRank && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await raiseHand();
        // After await finishes (data sent to server & fetch triggered), set Validating state
        setIsValidatingRank(true);
      } catch (error) {
        console.error("Error raising hand", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className={`min-h-screen p-6 flex flex-col items-center relative transition-colors duration-500 ${isActiveSpeaker ? 'bg-green-50/50' : ''}`}>
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <img 
            src="https://i.ibb.co.com/0j6BxHqC/download.png" 
            alt="Logo" 
            className="h-10 w-auto mr-2" 
          />
          <div className="h-8 w-px bg-slate-300 mx-1"></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-colors ${isActiveSpeaker ? 'bg-green-100 border-green-300 text-green-700' : 'bg-blue-100 border-blue-200 text-blue-700'}`}>
            <span className="font-bold text-lg">{user?.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="text-slate-800 font-bold text-lg leading-tight">{user?.name}</h2>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm">
              <Building2 size={12} />
              <span>{user?.businessName}</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={logout} className="!px-3 !text-slate-500 hover:!text-red-600 hover:!bg-red-50">
          <LogOut size={18} />
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        
        {/* Status Indicator */}
        <div className="mb-8 text-center">
          {isActiveSpeaker ? (
             <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 border border-green-600 text-white animate-pulse font-bold shadow-lg shadow-green-500/30 scale-110 transition-all">
                <Mic size={20} />
                SILAHKAN BICARA
             </div>
          ) : isSessionActive ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200 text-green-700 animate-pulse font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
              Sesi Tanya Jawab Aktif
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 border border-red-200 text-red-700 font-medium shadow-sm">
              <Clock size={16} />
              Menunggu Admin Memulai Sesi...
            </div>
          )}
        </div>

        {/* Raise Hand Button Container */}
        <div className="relative group">
          {/* Animated Glow behind button */}
          <div className={`absolute -inset-4 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-xl opacity-0 transition-opacity duration-1000 ${isSessionActive && !isActiveSpeaker && !currentUserRank ? 'group-hover:opacity-40' : ''}`}></div>
          
          <button
            onClick={handleRaiseHand}
            disabled={!isSessionActive || currentUserRank !== null || isSubmitting || isValidatingRank}
            className={`
              relative w-64 h-64 rounded-full flex flex-col items-center justify-center gap-4
              transition-all duration-500 border-4 shadow-[0_10px_40px_rgba(0,0,0,0.1)]
              ${isActiveSpeaker 
                ? 'bg-green-500 border-green-400 text-white scale-110 shadow-green-500/50 ring-4 ring-green-200'
                : !isSessionActive 
                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed grayscale' 
                  : (currentUserRank || isValidatingRank)
                    ? 'bg-green-50 border-green-400 text-green-600 cursor-default ring-4 ring-green-100'
                    : 'bg-white hover:bg-slate-50 border-white text-blue-600 hover:scale-105 active:scale-95'
              }
            `}
          >
            {/* UI STATES INSIDE BUTTON */}
            {isActiveSpeaker ? (
              <>
                 <Mic size={80} className="animate-bounce" />
                 <span className="text-xl font-bold tracking-wider uppercase">GILIRAN ANDA</span>
              </>
            ) : isValidatingRank ? (
              <div className="flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
                 <Loader2 size={60} className="animate-spin text-green-500 mb-2" />
                 <span className="text-lg font-bold text-green-700">Berhasil!</span>
                 <span className="text-xs font-medium text-green-600/80 mt-1">Verifikasi antrian...</span>
              </div>
            ) : isSubmitting ? (
              <div className="flex flex-col items-center">
                 <Loader2 size={60} className="animate-spin text-blue-500 mb-2" />
                 <span className="text-base font-semibold text-slate-500">Mengirim...</span>
              </div>
            ) : currentUserRank ? (
              <div className="flex flex-col items-center animate-[fadeIn_0.5s_ease-out]">
                <Hourglass size={80} className="animate-pulse text-green-500" />
                <span className="text-xl font-bold tracking-wider uppercase text-green-700 mt-2">DALAM ANTRIAN</span>
              </div>
            ) : (
              <>
                <Hand size={80} strokeWidth={1.5} className={isSessionActive ? "animate-bounce drop-shadow-md" : ""} />
                <span className="text-xl font-bold tracking-wider uppercase text-slate-700">
                  {isSessionActive ? 'Angkat Tangan' : 'Sesi Belum Mulai'}
                </span>
              </>
            )}
          </button>
        </div>

        <p className="mt-8 text-slate-500 text-center text-sm max-w-xs font-medium min-h-[40px]">
          {isActiveSpeaker 
            ? "Admin telah memilih Anda. Silahkan ajukan pertanyaan Anda sekarang."
            : isValidatingRank
              ? "Permintaan Anda telah diterima. Mohon tunggu sebentar..."
              : isSessionActive 
                ? currentUserRank 
                  ? "Anda sudah masuk dalam daftar antrian. Mohon tunggu giliran Anda dipanggil." 
                  : "Tekan tombol di atas untuk masuk ke dalam antrian pertanyaan."
                : "Admin belum memulai sesi tanya jawab. Tombol akan aktif secara otomatis saat sesi dimulai."}
        </p>
      </div>

      {/* Rank Popup / Notification - Changed animation to tada */}
      {showRankPopup && !isActiveSpeaker && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRankPopup(false)}></div>
          <div className="relative transform transition-all animate-tada">
            <GlassCard className="text-center p-8 border-green-200 bg-white shadow-2xl max-w-sm w-full">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Berhasil Masuk</h3>
              <p className="text-slate-600 mb-6">
                Nama Anda telah tercatat di dalam antrian penanya. Admin akan memanggil Anda sesuai urutan.
              </p>
              
              <Button className="w-full" variant="primary" onClick={() => setShowRankPopup(false)}>
                Baik, Saya Tunggu
              </Button>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Selected Speaker Popup */}
      {showSelectedPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-green-900/40 backdrop-blur-sm" onClick={() => setShowSelectedPopup(false)}></div>
          <div className="relative transform transition-all animate-[zoomIn_0.5s_ease-out]">
            <GlassCard className="text-center p-8 border-green-400 bg-white shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
                <PartyPopper size={48} className="text-white" />
              </div>
              <div className="mt-10">
                <h3 className="text-3xl font-bold text-slate-800 mb-2">Selamat!</h3>
                <p className="text-lg text-green-600 font-semibold mb-2">Anda terpilih sebagai penanya</p>
                <div className="my-4 p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-slate-600 text-sm">
                    Admin telah mempersilahkan Anda untuk berbicara. <br/>
                    <span className="font-bold">Silahkan ajukan pertanyaan Anda sekarang.</span>
                  </p>
                </div>
                <Button className="mx-auto w-full !bg-green-600 hover:!bg-green-700 shadow-green-500/30" variant="primary" onClick={() => setShowSelectedPopup(false)}>
                  Siap Bertanya
                </Button>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
};