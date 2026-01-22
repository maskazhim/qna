
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { 
  LogOut, Play, Square, Users, History, Clock, ListOrdered, 
  Building2, Mic, CheckCircle, Trophy, Settings, X, Save, UserPlus, 
  PlusCircle, FolderOpen, Eye, EyeOff
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { 
    user, logout, isSessionActive, startSession, stopSession, 
    queue, history, selectSpeaker, markAsAnswered, activeSpeakerId, 
    getParticipantCount, eventName, updateEventName, addNewAdmin,
    currentEvent, availableEvents, createEvent, adminSelectEvent, toggleEventVisibility
  } = useApp();

  // If no event is selected yet, show Event Selection Screen
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCode, setNewEventCode] = useState('');
  const [isNewEventPublic, setIsNewEventPublic] = useState(true);
  const [existingCodeInput, setExistingCodeInput] = useState('');
  
  // Dashboard Local State
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [showSettings, setShowSettings] = useState(false);
  const [updatedEventName, setUpdatedEventName] = useState(eventName);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);

  // Common Input Style for Visibility
  const inputStyle = "w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm font-medium";

  // --- 1. EVENT SELECTION VIEW ---
  if (!currentEvent) {
    return (
      <div className="min-h-screen p-6 flex flex-col items-center justify-center bg-slate-50/50">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Create New */}
            <GlassCard className="bg-white/90 border-blue-100 flex flex-col h-full">
               <div className="mb-6">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                   <PlusCircle className="text-blue-600" /> Buat Event Baru
                 </h2>
                 <p className="text-slate-500 text-sm">Mulai sesi baru dengan kode unik.</p>
               </div>
               
               <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Nama Event</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Seminar Digital 2024"
                      value={newEventTitle}
                      onChange={e => setNewEventTitle(e.target.value)}
                      className={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-slate-700 block mb-1">Kode Unik (Tanpa Spasi)</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: SEMINAR24"
                      value={newEventCode}
                      onChange={e => setNewEventCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                      className={`${inputStyle} font-mono uppercase tracking-wider`}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <input 
                       type="checkbox" 
                       checked={isNewEventPublic} 
                       onChange={e => setIsNewEventPublic(e.target.checked)}
                       className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
                    />
                    <label className="text-sm font-medium text-slate-700">Tampilkan di Menu Publik (Dropdown)</label>
                  </div>
               </div>

               <Button 
                 fullWidth 
                 className="mt-6" 
                 onClick={() => {
                   if(newEventTitle && newEventCode) createEvent(newEventTitle, newEventCode, isNewEventPublic);
                 }}
               >
                 Buat Event
               </Button>
            </GlassCard>

            {/* Right: Select Existing */}
            <GlassCard className="bg-white/60 border-slate-100 flex flex-col h-full">
               <div className="mb-6">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                   <FolderOpen className="text-amber-600" /> Kelola Event Ada
                 </h2>
                 <p className="text-slate-500 text-sm">Masuk ke dashboard event yang sudah dibuat.</p>
               </div>

               <div className="space-y-4 flex-1 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                  {availableEvents.map(evt => (
                    <div 
                      key={evt.id} 
                      onClick={() => adminSelectEvent(evt.event_code)}
                      className={`p-3 border rounded-xl cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden ${evt.is_public ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md' : 'bg-slate-100 border-slate-200/60'}`}
                    >
                       <div className="flex-1 min-w-0 pr-2">
                         <div className="flex items-center gap-2 mb-1">
                            <p className={`font-bold text-sm md:text-base truncate ${evt.is_public ? 'text-slate-800' : 'text-slate-500'}`}>{evt.event_name}</p>
                            {!evt.is_public && (
                                <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/50 border border-slate-300/50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    <EyeOff size={10} /> Hidden
                                </span>
                            )}
                         </div>
                         <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">{evt.event_code}</span>
                         </p>
                       </div>
                       
                       <div className="flex items-center gap-1 shrink-0">
                            {/* Toggle Visibility Button */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEventVisibility(evt.id, evt.is_public);
                                }}
                                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all z-10 ${evt.is_public ? 'text-green-600 hover:bg-green-100' : 'text-slate-400 hover:bg-slate-200'}`}
                                title={evt.is_public ? "Sembunyikan dari Publik" : "Tampilkan ke Publik"}
                            >
                                {evt.is_public ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>

                            <Button variant="ghost" className="!p-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Buka</Button>
                       </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-slate-200 mt-4">
                     <label className="text-sm font-bold text-slate-700 block mb-2">Atau Masukan Kode Private:</label>
                     <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="KODE EVENT..."
                          value={existingCodeInput}
                          onChange={e => setExistingCodeInput(e.target.value.toUpperCase())}
                          className={`${inputStyle} font-mono uppercase`}
                        />
                        <Button variant="secondary" className="whitespace-nowrap" onClick={() => adminSelectEvent(existingCodeInput)}>Masuk</Button>
                     </div>
                  </div>
               </div>
               
               <div className="mt-8 text-center border-t border-slate-200 pt-4">
                 <button onClick={logout} className="text-red-500 text-sm hover:underline font-medium">Logout Admin</button>
               </div>
            </GlassCard>
        </div>
      </div>
    );
  }

  // --- 2. MAIN DASHBOARD (Same as before but filtered) ---

  const formatTime = (timestamp: number | string) => {
    try {
      return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) { return '-'; }
  };
  const formatDate = (timestamp: number | string) => {
    try { return new Date(timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return '-'; }
  };

  const handleUpdateEventName = async () => {
      setIsUpdatingSettings(true);
      await updateEventName(updatedEventName);
      setIsUpdatingSettings(false);
      alert("Nama event berhasil diubah!");
  };

  const handleAddAdmin = async () => {
      if (!newAdminUser || !newAdminPass) return alert("Isi username dan password");
      setIsUpdatingSettings(true);
      try {
          await addNewAdmin(newAdminUser, newAdminPass);
          setNewAdminUser(''); setNewAdminPass(''); alert("Admin baru berhasil ditambahkan!");
      } catch (e: any) { alert("Gagal: " + e.message); } 
      finally { setIsUpdatingSettings(false); }
  };

  return (
    <div className="min-h-screen p-3 md:p-6 lg:p-8 bg-slate-50/50">
      {/* Header */}
      <header className="flex flex-row justify-between items-center gap-4 mb-4 md:mb-8">
        <div className="flex items-center gap-3">
          <img src="https://i.ibb.co.com/0j6BxHqC/download.png" alt="Logo" className="h-8 md:h-12 w-auto drop-shadow-sm" />
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="hidden md:inline bg-amber-100 p-2 rounded-lg border border-amber-200 text-amber-600 text-sm md:text-base">Admin Panel</span>
              <span className="md:hidden text-slate-700">Admin</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium md:ml-1">
               {currentEvent.event_name} <span className="font-mono bg-slate-200 px-1 rounded ml-1 text-slate-700">{currentEvent.event_code}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
           <span className="text-slate-500 font-medium hidden md:block">Halo, {user?.name}</span>
           <Button variant="secondary" onClick={() => { setUpdatedEventName(eventName); setShowSettings(true); }} className="!p-2 md:!px-4 !text-slate-600 hover:!bg-slate-100">
             <Settings size={18} className="md:mr-2" /> <span className="hidden md:inline">Pengaturan</span>
           </Button>
          <Button variant="ghost" onClick={logout} className="!p-2 md:!px-4 !text-red-600 hover:!bg-red-50">
            <LogOut size={18} className="md:mr-2" /> <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Dynamic Grid Layout */}
      <div className={`grid grid-cols-1 gap-4 md:gap-8 transition-all duration-500 ${isSessionActive ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        
        {/* Control Panel */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <GlassCard className="bg-white/80 border-white/60 !p-4 md:!p-6">
            <h2 className="text-base md:text-lg font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-500" /> Kontrol Sesi</h2>
            <div className="grid grid-cols-2 lg:flex lg:flex-col items-center gap-3 md:gap-6">
              <div className={`hidden lg:flex w-36 h-36 rounded-full items-center justify-center border-4 transition-all duration-500 shadow-sm ${isSessionActive ? 'border-green-400 bg-green-50 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-red-400 bg-red-50'}`}>
                {isSessionActive ? (
                  <div className="text-center animate-pulse"><span className="text-green-600 font-bold text-2xl block">ON AIR</span><span className="text-green-600/70 text-sm font-medium">Aktif</span></div>
                ) : (
                  <div className="text-center"><span className="text-red-500 font-bold text-2xl block">OFF</span><span className="text-red-500/70 text-sm font-medium">Tertutup</span></div>
                )}
              </div>
              <div className={`lg:hidden col-span-2 p-2 rounded-lg text-center text-sm font-bold border ${isSessionActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>Status: {isSessionActive ? 'ON AIR' : 'OFF'}</div>
              <div className="col-span-1 w-full lg:w-full">
                {isSessionActive ? (
                  <Button fullWidth variant="danger" onClick={stopSession} className="shadow-red-200 !py-2 md:!py-3 text-xs md:text-sm h-full"><Square size={16} fill="currentColor" className="md:w-5 md:h-5" /> <span className="ml-1">Stop</span></Button>
                ) : (
                  <Button fullWidth variant="primary" onClick={startSession} className="!bg-green-600 hover:!bg-green-700 shadow-green-200 !py-2 md:!py-3 text-xs md:text-sm h-full"><Play size={16} fill="currentColor" className="md:w-5 md:h-5" /> <span className="ml-1">Mulai</span></Button>
                )}
              </div>
            </div>
          </GlassCard>

          <GlassCard className="hidden lg:flex justify-between items-center bg-white/80 border-white/60">
            <div><p className="text-slate-500 text-sm font-medium">Antrian</p><p className="text-3xl font-bold text-slate-800">{queue.length}</p></div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Users size={24} /></div>
          </GlassCard>
        </div>

        {/* Queue Content */}
        <div className={`transition-all duration-500 ${isSessionActive ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
          <div className="flex gap-2 md:gap-4 mb-4 md:mb-6 bg-white/40 p-1 rounded-xl w-fit backdrop-blur-md border border-white/50">
            <button onClick={() => setActiveTab('live')} className={`py-2 px-4 md:px-6 rounded-lg font-semibold text-xs md:text-sm flex items-center gap-2 ${activeTab === 'live' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500'}`}><ListOrdered size={14} /> Antrian Live</button>
            <button onClick={() => setActiveTab('history')} className={`py-2 px-4 md:px-6 rounded-lg font-semibold text-xs md:text-sm flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-md scale-105' : 'text-slate-500'}`}><History size={14} /> Riwayat</button>
          </div>

          <div className="relative pb-20 md:pb-0">
            {activeTab === 'live' && (
              <div className="space-y-3 animate-[fadeIn_0.3s_ease-out]">
                 {queue.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-12 md:py-24 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/30">
                     <ListOrdered size={32} className="md:w-12 md:h-12 mb-4 opacity-20" />
                     <p className="text-base md:text-lg font-medium">{isSessionActive ? "Daftar antrian kosong" : "Sesi ditutup, antrian dikosongkan"}</p>
                   </div>
                 ) : (
                   <div className="grid gap-2 md:gap-3">
                     {queue.map((item, index) => {
                       const isActiveSpeaker = activeSpeakerId === item.id;
                       return (
                         <div key={item.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 rounded-xl border transition-all duration-300 shadow-sm ${isActiveSpeaker ? 'bg-green-50 border-green-500 ring-2 ring-green-200 scale-[1.01]' : 'bg-white/80 border-white/60 hover:border-blue-200 hover:bg-white'}`}>
                           <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-0">
                             <div className={`w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm md:text-xl shadow-sm relative flex-shrink-0 ${isActiveSpeaker ? 'bg-green-500 text-white' : index === 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500'}`}>{isActiveSpeaker ? <Mic size={16} className="md:w-6 md:h-6 animate-pulse" /> : index + 1}</div>
                             <div className="min-w-0">
                               <div className="flex items-center gap-2 flex-wrap">
                                 <h3 className={`font-bold text-base md:text-lg truncate ${isActiveSpeaker ? 'text-green-800' : 'text-slate-800'}`}>{item.name}</h3>
                                 <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] md:text-xs font-semibold text-slate-600 flex-shrink-0"><Trophy size={10} className="text-amber-500" /><span>{getParticipantCount(item.name, item.businessName)}x</span></div>
                               </div>
                               <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 truncate"><Building2 size={12} className="flex-shrink-0" /><span className="truncate">{item.businessName}</span></div>
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-2 justify-end mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                             <div className="text-slate-600 font-mono font-medium text-xs bg-slate-100 px-2 py-1 rounded-full border border-slate-200 md:hidden block">{formatTime(item.timestamp)}</div>
                             {isSessionActive && (
                               <div className="flex gap-2 w-full md:w-auto justify-end">
                                 {!isActiveSpeaker ? (
                                   <Button onClick={() => selectSpeaker(item.id)} variant="secondary" className="!py-1.5 md:!py-2 !px-3 md:!px-4 text-xs bg-white hover:bg-green-50 hover:text-green-600 border-slate-200 flex-1 md:flex-none"><Mic size={14} className="mr-1" /> Pilih</Button>
                                 ) : (
                                   <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-200 flex items-center flex-1 md:flex-none justify-center"><Mic size={14} className="mr-2 animate-pulse" /> <span className="md:hidden">Bicara</span><span className="hidden md:inline">Sedang Bicara</span></div>
                                 )}
                                 <Button onClick={() => markAsAnswered(item.id)} variant="primary" className={`!py-1.5 md:!py-2 !px-3 md:!px-4 text-xs flex-1 md:flex-none ${isActiveSpeaker ? '!bg-green-600' : '!bg-blue-600'}`}><CheckCircle size={14} className="mr-1" /> Selesai</Button>
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
                  {/* Reuse existing history logic */}
                  {history.length === 0 ? <div className="text-center py-20 text-slate-400 border-2 border-dashed bg-white/30">Belum ada riwayat</div> : 
                    history.map(session => (
                        <GlassCard key={session.id} className="!p-0 overflow-hidden group bg-white border-white/50">
                             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-100">
                                <div><h3 className="text-slate-800 font-bold">{formatDate(session.startTime)}</h3><p className="text-slate-500 text-xs">{formatTime(session.startTime)} - {formatTime(session.endTime)}</p></div>
                                <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">{session.participants.length} Penanya</div>
                             </div>
                             <div className="max-h-0 group-hover:max-h-96 transition-all duration-500 overflow-y-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <tbody className="divide-y divide-slate-100">
                                        {session.participants.map((p, idx) => (
                                            <tr key={p.id} className="hover:bg-slate-50/80"><td className="px-5 py-3 text-slate-900 font-medium">{idx+1}. {p.name}</td><td className="px-5 py-3 text-right text-xs">{formatTime(p.timestamp)}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </GlassCard>
                    ))
                  }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
           <GlassCard className="relative w-full max-w-md bg-white animate-[zoomIn_0.2s_ease-out]">
             <button onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>
             <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings className="text-blue-600" /> Pengaturan</h2>
             <div className="space-y-6">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nama Event</label>
                  <div className="flex gap-2">
                    <input type="text" value={updatedEventName} onChange={(e) => setUpdatedEventName(e.target.value)} className={inputStyle} />
                    <Button onClick={handleUpdateEventName} disabled={isUpdatingSettings} className="!py-2 !px-3"><Save size={18} /></Button>
                  </div>
               </div>
               <hr className="border-slate-100" />
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><UserPlus size={16} /> Tambah Admin Baru</label>
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <input type="text" value={newAdminUser} onChange={(e) => setNewAdminUser(e.target.value)} className={inputStyle} placeholder="Username Baru" />
                    <input type="password" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} className={inputStyle} placeholder="Password Baru" />
                    <Button onClick={handleAddAdmin} disabled={isUpdatingSettings} fullWidth variant="primary" className="!py-2 mt-2">Tambah Admin</Button>
                  </div>
               </div>
             </div>
           </GlassCard>
        </div>
      )}
    </div>
  );
};
