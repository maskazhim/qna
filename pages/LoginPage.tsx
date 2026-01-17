import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { GlassCard } from '../components/GlassCard';
import { Button } from '../components/Button';
import { Lock, Building2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill from local storage on mount (Remember Me functionality)
  useEffect(() => {
    const savedName = localStorage.getItem('lastLoginName');
    const savedBusiness = localStorage.getItem('lastLoginBusiness');
    
    if (savedName) setName(savedName);
    if (savedBusiness) setBusinessName(savedBusiness);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isAdmin) {
      if (password === 'kazhim123') {
        login('Administrator', UserRole.ADMIN);
      } else {
        setError('Password admin salah!');
      }
    } else {
      if (!name.trim()) return;
      if (!businessName.trim()) {
        setError('Nama bisnis wajib diisi');
        return;
      }
      
      // Save inputs for next time
      localStorage.setItem('lastLoginName', name);
      localStorage.setItem('lastLoginBusiness', businessName);
      
      login(name, UserRole.USER, businessName);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="mb-8 text-center flex flex-col items-center">
        <img 
          src="https://i.ibb.co.com/0j6BxHqC/download.png" 
          alt="Logo" 
          className="h-28 w-auto mb-6 drop-shadow-lg"
        />
        <h1 className="text-4xl font-bold tracking-tight mb-2 drop-shadow-sm text-slate-800">Aksoro</h1>
        <p className="text-slate-500 font-medium tracking-wide">Tracking QnA Scale Up 2.0</p>
      </div>

      <GlassCard className="w-full max-w-md bg-white/80 border-white/60">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4 pt-2">
            {!isAdmin && (
              <>
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
                    />
                  </div>
                </div>
              </>
            )}

            {isAdmin && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <label htmlFor="pass" className="block text-sm font-semibold text-slate-700 ml-1 mb-1">
                  Password Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    id="pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukan password..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all shadow-sm"
                    required={isAdmin}
                  />
                </div>
              </div>
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

          <Button type="submit" fullWidth variant={isAdmin ? 'primary' : 'secondary'} className={isAdmin ? '!bg-amber-600 !border-amber-500 hover:!bg-amber-700' : '!bg-slate-800 !text-white hover:!bg-slate-900'}>
            {isAdmin ? 'Masuk Dashboard Admin' : 'Bergabung ke Sesi'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
};