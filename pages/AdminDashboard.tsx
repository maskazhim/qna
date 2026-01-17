import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { 
  LogOut, 
  Play, 
  Square, 
  Users, 
  History, 
  Clock,
  ListOrdered,
  Building2,
  Mic,
  CheckCircle,
  Trophy
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    user, 
    logout, 
    isSessionActive, 
    startSession, 
    stopSession, 
    queue, 
    history,
    selectSpeaker,
    markAsAnswered,
    activeSpeakerId,
    getParticipantCount
  } = useApp();

  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8 bg-slate-50/50">
      {/* Header - Compact on Mobile */}
      <header className="flex flex-row justify-between items-center gap-4 mb-4 md:mb-8">
        <div className="flex items-center gap-3">
          <img 
            src="https://i.ibb.co.com/0j6BxHqC/download.png" 
            alt="Logo" 
            className="h-8 md:h-12 w-auto drop-shadow-sm" 
          />
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="hidden md:inline bg-amber-100 p-2 rounded-lg border border-amber-200 text-amber-600 text-sm md:text-base">
                Admin Panel
              </span>
              <span className="md:hidden text-slate-700">Admin</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <span className="text-slate-500 font-medium hidden md:block">Halo, {user?.name}</span>
          <Button variant="ghost" onClick={logout} className="!p-2 md:!px-4 !text-red-600 hover:!bg-red-50">
            <LogOut size={18} className="md:mr-2" /> <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Dynamic Grid Layout - Adjusted for Mobile Compactness */}
      <div className={`grid grid-cols-1 gap-4 md:gap-8 transition-all duration-500 ${isSessionActive ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        
        {/* Control Panel (Left Column) - Responsive Changes */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <GlassCard className="bg-white/80 border-white/60 !p-4 md:!p-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Kontrol Sesi
            </h2>
            
            {/* Mobile: Grid 2 cols, Desktop: Flex Column */}
            <div className="grid grid-cols-2 lg:flex lg:flex-col items-center gap-3 md:gap-6">
              
              {/* Status Circle - Hidden on Mobile to save space */}
              <div className={`hidden lg:flex w-36 h-36 rounded-full items-center justify-center border-4 transition-all duration-500 shadow-sm ${isSessionActive ? 'border-green-400 bg-green-50 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-red-400 bg-red-50'}`}>
                {isSessionActive ? (
                  <div className="text-center animate-pulse">
                    <span className="text-green-600 font-bold text-2xl block">ON AIR</span>
                    <span className="text-green-600/70 text-sm font-medium">Aktif</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-red-500 font-bold text-2xl block">OFF</span>
                    <span className="text-red-500/70 text-sm font-medium">Tertutup</span>
                  </div>
                )}
              </div>

              {/* Mobile Status Indicator (Small Bar) */}
              <div className={`lg:hidden col-span-2 p-2 rounded-lg text-center text-sm font-bold border ${isSessionActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  Status: {isSessionActive ? 'ON AIR (Sesi Aktif)' : 'OFF (Sesi Tertutup)'}
              </div>

              <div className="col-span-1 w-full lg:w-full">
                 {/* Antrian Count - Moved here for mobile compact layout */}
                 <div className="h-full flex flex-col justify-center items-center bg-slate-50 border border-slate-200 rounded-xl p-2 md:p-4 lg:hidden">
                    <span className="text-xs text-slate-500 font-medium">Antrian</span>
                    <div className="flex items-center gap-1 text-blue-600">
                       <Users size={16} />
                       <span className="text-xl font-bold">{queue.length}</span>
                    </div>
                 </div>
                 
                 {/* Desktop Stats Card (Hidden on mobile inside this grid, shown below in original layout if needed, but we merged it for mobile) */}
              </div>

              <div className="col-span-1 w-full lg:w-full">
                {isSessionActive ? (
                  <Button 
                    fullWidth 
                    variant="danger" 
                    onClick={stopSession}
                    className="shadow-red-200 !py-2 md:!py-3 text-xs md:text-sm h-full"
                  >
                    <Square size={16} fill="currentColor" className="md:w-5 md:h-5" /> <span className="ml-1">Stop</span>
                  </Button>
                ) : (
                  <Button 
                    fullWidth 
                    variant="primary" 
                    onClick={startSession}
                    className="!bg-green-600 hover:!bg-green-700 shadow-green-200 !py-2 md:!py-3 text-xs md:text-sm h-full"
                  >
                    <Play size={16} fill="currentColor" className="md:w-5 md:h-5" /> <span className="ml-1">Mulai</span>
                  </Button>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Stats Card - Visible only on Desktop, on mobile it's merged above */}
          <GlassCard className="hidden lg:flex justify-between items-center bg-white/80 border-white/60">
            <div>
              <p className="text-slate-500 text-sm font-medium">Antrian</p>
              <p className="text-3xl font-bold text-slate-800">{queue.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Users size={24} />
            </div>
          </GlassCard>
        </div>

        {/* Main Content Area (Right Column) */}
        <div className={`transition-all duration-500 ${isSessionActive ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          {/* Tabs */}
          <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 bg-white/40 p-1 rounded-xl w-fit backdrop-blur-md border border-white/50">
            <button
              onClick={() => setActiveTab('live')}
              className={`py-2 px-4 md:px-6 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 flex items-center gap-2
                ${activeTab === 'live' 
                  ? 'bg-white text-blue-600 shadow-md scale-105' 
                  : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ListOrdered size={14} className="md:w-4 md:h-4" /> Antrian Live
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-4 md:px-6 rounded-lg md:rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 flex items-center gap-2
                ${activeTab === 'history' 
                  ? 'bg-white text-blue-600 shadow-md scale-105' 
                  : 'text-slate-500 hover:text-slate-700'}`}
            >
              <History size={14} className="md:w-4 md:h-4" /> Riwayat
            </button>
          </div>

          <div className="relative pb-20 md:pb-0">
            {activeTab === 'live' && (
              <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
                 {queue.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-12 md:py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/30">
                     <ListOrdered size={32} className="md:w-12 md:h-12 mb-4 opacity-20" />
                     <p className="text-base md:text-lg font-medium">Daftar antrian kosong</p>
                     {isSessionActive && <p className="text-xs md:text-sm mt-2 text-slate-500 animate-pulse">Menunggu peserta mengangkat tangan...</p>}
                   </div>
                 ) : (
                   <div className="grid gap-2 md:gap-3">
                     {queue.map((item, index) => {
                       const isActiveSpeaker = activeSpeakerId === item.id;
                       const questionCount = getParticipantCount(item.name);
                       
                       return (
                         <div 
                           key={item.id} 
                           className={`group flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 rounded-xl border transition-all duration-300 shadow-sm
                             ${isActiveSpeaker 
                               ? 'bg-green-50 border-green-500 ring-2 ring-green-200 scale-[1.01] shadow-lg' 
                               : 'bg-white/80 border-white/60 hover:border-blue-200 hover:bg-white'}
                           `}
                         >
                           <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-0">
                             <div className={`
                               w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-xl shadow-sm relative flex-shrink-0
                               ${isActiveSpeaker ? 'bg-green-500 text-white' : 
                                 index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                                 'bg-slate-100 text-slate-500'}
                             `}>
                               {isActiveSpeaker ? <Mic size={16} className="md:w-6 md:h-6 animate-pulse" /> : index + 1}
                             </div>
                             <div className="min-w-0">
                               <div className="flex items-center gap-2 flex-wrap">
                                 <h3 className={`font-bold text-base md:text-lg truncate ${isActiveSpeaker ? 'text-green-800' : 'text-slate-800'}`}>
                                   {item.name}
                                 </h3>
                                 <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] md:text-xs font-semibold text-slate-600 flex-shrink-0">
                                    <Trophy size={10} className="text-amber-500" />
                                    <span>{questionCount}x</span>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 truncate">
                                  <Building2 size={12} className="flex-shrink-0" />
                                  <span className="truncate">{item.businessName}</span>
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-2 justify-end mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                             <div className="text-slate-600 font-mono font-medium text-xs bg-slate-100 px-2 py-1 rounded-full border border-slate-200 md:hidden block">
                               {formatTime(item.timestamp)}
                             </div>
                             
                             {isSessionActive && (
                               <div className="flex gap-2 w-full md:w-auto justify-end">
                                 {!isActiveSpeaker ? (
                                   <Button 
                                     onClick={() => selectSpeaker(item.id)}
                                     variant="secondary"
                                     className="!py-1.5 md:!py-2 !px-3 md:!px-4 text-xs bg-white hover:bg-green-50 hover:text-green-600 border-slate-200 flex-1 md:flex-none"
                                   >
                                     <Mic size={14} className="mr-1" /> Pilih
                                   </Button>
                                 ) : (
                                   <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-200 flex items-center flex-1 md:flex-none justify-center">
                                     <Mic size={14} className="mr-2 animate-pulse" /> <span className="md:hidden">Bicara</span><span className="hidden md:inline">Sedang Bicara</span>
                                   </div>
                                 )}
                                 
                                 <Button 
                                   onClick={() => markAsAnswered(item.id)}
                                   variant="primary"
                                   className={`!py-1.5 md:!py-2 !px-3 md:!px-4 text-xs flex-1 md:flex-none ${isActiveSpeaker ? '!bg-green-600' : '!bg-blue-600'}`}
                                 >
                                   <CheckCircle size={14} className="mr-1" /> Selesai
                                 </Button>
                               </div>
                             )}
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                {history.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/30">
                    <p>Belum ada riwayat sesi</p>
                  </div>
                ) : (
                  history.map((session) => (
                    <GlassCard key={session.id} className="!p-0 overflow-hidden group bg-white border-white/50">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                        <div>
                          <h3 className="text-slate-800 font-bold text-sm md:text-base">{formatDate(session.startTime)}</h3>
                          <p className="text-slate-500 text-xs">
                            {formatTime(session.startTime)} - {formatTime(session.endTime)}
                          </p>
                        </div>
                        <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
                          {session.participants.length} Penanya
                        </div>
                      </div>
                      <div className="max-h-0 group-hover:max-h-96 transition-all duration-500 overflow-y-auto custom-scrollbar">
                        {session.participants.length > 0 ? (
                          <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-slate-400 uppercase text-xs font-semibold">
                              <tr>
                                <th className="px-3 py-2 md:px-5 md:py-3">No</th>
                                <th className="px-3 py-2 md:px-5 md:py-3">Nama</th>
                                <th className="hidden md:table-cell px-5 py-3">Bisnis</th>
                                <th className="hidden md:table-cell px-5 py-3">Total</th>
                                <th className="px-3 py-2 md:px-5 md:py-3 text-right">Waktu</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {session.participants.map((p, idx) => (
                                <tr key={p.id} className="hover:bg-slate-50/80">
                                  <td className="px-3 py-2 md:px-5 md:py-3 font-medium text-slate-900">{idx + 1}</td>
                                  <td className="px-3 py-2 md:px-5 md:py-3 text-slate-800">
                                    {p.name}
                                    <div className="md:hidden text-xs text-slate-500">{p.businessName}</div>
                                  </td>
                                  <td className="hidden md:table-cell px-5 py-3 text-slate-500">{p.businessName}</td>
                                  <td className="hidden md:table-cell px-5 py-3">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                      <Trophy size={10} className="text-amber-500" />
                                      {getParticipantCount(p.name)}x
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 md:px-5 md:py-3 text-right font-mono text-slate-500 text-xs md:text-sm">{formatTime(p.timestamp)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="p-4 text-center text-slate-400 text-sm">Tidak ada yang bertanya di sesi ini.</div>
                        )}
                      </div>
                    </GlassCard>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};