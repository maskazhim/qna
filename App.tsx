import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LoginPage } from './pages/LoginPage';
import { UserDashboard } from './pages/UserDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { UserRole } from './types';

// Component to handle routing based on auth state
const MainLayout: React.FC = () => {
  const { user } = useApp();

  if (!user) {
    return <LoginPage />;
  }

  if (user.role === UserRole.ADMIN) {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
};

function App() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Background - Elegant Simple Gradient */}
      <div className="fixed inset-0 z-0">
        {/* Soft Amber Glow (Top Right) */}
        <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-b from-amber-100/40 to-orange-50/20 blur-[120px]" />
        
        {/* Soft Slate/Blue Tone (Bottom Left) */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-gradient-to-t from-slate-200/40 to-blue-50/20 blur-[120px]" />
        
        {/* Very subtle center highlight */}
        <div className="absolute top-[30%] left-[20%] w-[60%] h-[40%] bg-white/60 blur-[100px]" />
        
        {/* Subtle Noise Texture Overlay for texture */}
        <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <AppProvider>
          <MainLayout />
        </AppProvider>
      </div>
    </div>
  );
}

export default App;