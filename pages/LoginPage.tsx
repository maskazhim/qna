
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Lock, Building2, Calendar, ChevronDown } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, joinEvent, isLoading, availableEvents } = useApp();
  
  // User Inputs
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  
  // Admin Inputs
  const [adminName, setAdminName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Event Logic
  const [selectedEventCode, setSelectedEventCode] = useState<string>('');
  const [manualEventCode, setManualEventCode] = useState('');
  const [isPrivateEvent, setIsPrivateEvent] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill from local storage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('lastLoginName');
    const savedBusiness = localStorage.getItem('lastLoginBusiness');
    if (savedName) setName(savedName);
    if (savedBusiness) setBusinessName(savedBusiness);
  }, []);

  // Handle Dropdown Change
  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'PRIVATE_CODE') {
      setIsPrivateEvent(true);
      setSelectedEventCode('');
    } else {
      setIsPrivateEvent(false);
      setSelectedEventCode(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- ADMIN LOGIN ---
    if (isAdmin) {
      if (!adminName.trim() || !adminPassword) {
        setError('Username dan password wajib diisi');
        return;
      }
      const success = await login(adminName, UserRole.ADMIN, undefined, adminPassword);
      if (!success) setError('Username atau password admin salah!');
      return;
    }

    // --- USER LOGIN ---
    if (!name.trim()) return;
    if (!businessName.trim()) { setError('Nama bisnis wajib diisi'); return; }

    // Validate Event Selection
    let finalCode = selectedEventCode;
    if (isPrivateEvent) {
       if (!manualEventCode.trim()) { setError('Kode event wajib diisi'); return; }
       finalCode = manualEventCode.trim();
    } else if (!selectedEventCode) {
       setError('Silahkan pilih event yang tersedia');
       return;
    }

    // 1. Try to Join Event first
    const joinSuccess = await joinEvent(finalCode);
    if (!joinSuccess) {
      setError('Kode event tidak ditemukan atau tidak valid.');
      return;
    }

    // 2. If Event OK, Log user in
    localStorage.setItem('lastLoginName', name);
    localStorage.setItem('lastLoginBusiness', businessName);
    
    await login(name, UserRole.USER, businessName);
  };

  // Filter only public events for the dropdown
  const publicEvents = availableEvents.filter(evt => evt.is_public);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-8 text-center flex flex-col items-center">
        <img 
          src="https://i.ibb.co.com/0j6BxHqC/download.png" 
          alt="Logo" 
          className="h-28 w-auto mb-6 drop-shadow-lg"
        />
        <h1 className="text-4xl font-bold tracking-tight mb-2 drop-shadow-sm text-slate-800">Aksoro</h1>
        <p className="text-slate-500 font-medium tracking-wide">Live Q&A Platform</p>
      </div>

      <GlassCard className="w-full max-w-md bg-white/80 border-white/60">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4 pt-2">
            {!isAdmin ? (
              <>
                {/* Event Selector - The Key Feature */}
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <label className="block text-sm font-semibold text-slate-700 ml-1 mb-1">
                    Pilih Acara / Event
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar size={18} />
                    </div>
                    <select
                      value={isPrivateEvent ? 'PRIVATE_CODE' : selectedEventCode}
                      onChange={handleEventChange}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all shadow-sm appearance-none"
                    >
                      <option value="" disabled>-- Pilih Event --</option>
                      {publicEvents.length > 0 ? (
                        publicEvents.map(evt => (
                          <option key={evt.id} value={evt.event_code}>
                             {evt.event_name}
                          </option>
                        ))
                      ) : (
                        <option disabled>Tidak ada event publik aktif</option>
                      )}
                      <option disabled>----------------</option>
                      <option value="PRIVATE_CODE">🔑 Masukan Kode Privat...</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                {/* Conditional Private Code Input */}
                {isPrivateEvent && (
                   <div className="animate-[fadeIn_0.3s_ease-out]">
                      <label className="block text-sm font-semibold text-slate-700 ml-1 mb-1">
                        Kode Event
                      </label>
                      <input
                        type="text"
                        value={manualEventCode}
                        onChange={(e) => setManualEventCode(e.target.value.toUpperCase())}
                        placeholder="Contoh: SEMINAR-JKT"
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono tracking-wider"
                      />
                   </div>
                )}

                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700 ml-1 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masukan nama anda..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all shadow-sm"
                    required={!isAdmin}
                    disabled={isLoading}
                  />
                </div>

                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <label htmlFor="business" className="block text-sm font-semibold text-slate-700 ml-1 mb-1">
                    Nama Bisnis / Usaha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 size={18} />
                    </div>
                    <input
                      id="business"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Contoh: PT. Maju Jaya"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all shadow-sm"
                      required={!isAdmin}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            ) : (
              // Admin Inputs
              <>
                 <div className="animate-[fadeIn_0.3s_ease-out]">
                  <label htmlFor="adminName" className="block text-sm font-semibold text-slate-700 ml-1 mb-1">
                    Username Admin
                  </label>
                  <input
                    id="adminName"
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Username..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all shadow-sm"
                    required={isAdmin}
                    disabled={isLoading}
                  />
                </div>
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <label htmlFor="pass" className="block text-sm font-semibold text-slate-700 ml-1 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      id="pass"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Masukan password..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all shadow-sm"
                      required={isAdmin}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 cursor-pointer mt-4" onClick={() => { setIsAdmin(!isAdmin); setError(''); }}>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${isAdmin ? 'bg-amber-500' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${isAdmin ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-slate-600 select-none font-medium">Masuk sebagai Admin</span>
          </div>

          <Button type="submit" fullWidth disabled={isLoading} variant={isAdmin ? 'primary' : 'secondary'} className={isAdmin ? '!bg-amber-600 !border-amber-500 hover:!bg-amber-700' : '!bg-slate-800 !text-white hover:!bg-slate-900'}>
            {isLoading ? 'Memproses...' : (isAdmin ? 'Masuk Dashboard Admin' : 'Masuk ke Event')}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};
