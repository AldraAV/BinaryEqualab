import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import ConsoleMode from './components/ConsoleMode';
import GraphingMode from './components/GraphingMode';
import MatrixMode from './components/MatrixMode';
import AccountingMode from './components/AccountingMode';
import EquationsMode from './components/EquationsMode';
import StatisticsMode from './components/StatisticsMode';
import ComplexMode from './components/ComplexMode';
import VectorsMode from './components/VectorsMode';
import ModoElectrico from './components/ModoElectrico';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { AppMode } from './types';
import { Menu } from 'lucide-react';
import { CalculatorProvider } from './CalculatorContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const ContenidoApp: React.FC = () => {
  const [modoActual, setModoActual] = useState<AppMode>(() => {
    const skipped = localStorage.getItem('skipLanding');
    const lastMode = localStorage.getItem('lastMode') as AppMode | null;
    if (skipped === 'true') {
        return lastMode && Object.values(AppMode).includes(lastMode) ? lastMode : AppMode.CONSOLE;
    }
    return AppMode.LANDING;
  });
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const { user, loading } = useAuth();

  // Redirección automática de sesión
  useEffect(() => {
    if (!loading) {
      if (user && modoActual === AppMode.LANDING) {
        setModoActual(AppMode.DASHBOARD);
      }
      // Quitamos la redirección forzada a LANDING cuando no hay usuario, 
      // permitiendo explorar los módulos de forma libre.
    }
  }, [user, loading]);

  const handleNav = (m: AppMode) => {
    setModoActual(m);
    if (m !== AppMode.LANDING) {
      localStorage.setItem('skipLanding', 'true');
      localStorage.setItem('lastMode', m);
    } else {
      localStorage.removeItem('skipLanding');
      localStorage.removeItem('lastMode');
    }
  };

  // Keep-Alive para Render (Ghost requests)
  useEffect(() => {
    if ((import.meta as any).env.PROD) {
      const pingId = setInterval(async () => {
        try {
          console.log('--- Ghost Ping: keeping Render awake ---');
          await fetch(`${API_URL}/health`);
        } catch (e) {
          // Ignorar errores de red para evitar spam o crashes en la consola
        }
      }, 5 * 60 * 1000); // Cada 5 minutos
      
      return () => clearInterval(pingId);
    }
  }, []);

  const obtenerContenidoActivo = () => {
    switch (modoActual) {
      case AppMode.CONSOLE:
        return <ConsoleMode />;
      case AppMode.GRAPHING:
        return <GraphingMode />;
      case AppMode.MATRIX:
        return <MatrixMode />;
      case AppMode.ACCOUNTING:
        return <AccountingMode />;
      case AppMode.EQUATIONS:
        return <EquationsMode />;
      case AppMode.STATISTICS:
        return <StatisticsMode />;
      case AppMode.COMPLEX:
        return <ComplexMode />;
      case AppMode.VECTORS:
        return <VectorsMode />;
      case AppMode.ELECTRICAL:
        return <ModoElectrico />;
      case AppMode.DASHBOARD:
        return <Dashboard />;
      default:
        return <ConsoleMode />;
    }
  };

  // ─── LANDING PAGE: pantalla completa independiente, sin Sidebar ni TopBar ───
  if (modoActual === AppMode.LANDING) {
    return <LandingPage alNavegar={handleNav} />;
  }

  // ─── WORKSPACE: layout con Sidebar + TopBar + contenido del modo activo ───
  return (
    <div className="flex h-screen overflow-hidden bg-background text-aurora-text font-sans selection:bg-primary selection:text-white">

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity ${menuMovilAbierto ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setMenuMovilAbierto(false)} 
      />

      {/* Sidebar — siempre visible en desktop (lg:translate-x-0 para Tailwind v4) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:static lg:translate-x-0 ${menuMovilAbierto ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar currentMode={modoActual} setMode={(m) => { handleNav(m); setMenuMovilAbierto(false); }} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">

        {/* Mobile Header Trigger */}
        <div className="lg:hidden absolute top-4 left-4 z-40">
          <button onClick={() => setMenuMovilAbierto(true)} className="p-2 bg-background-light border border-aurora-border rounded-lg text-white shadow-lg">
            <Menu size={24} />
          </button>
        </div>

        {/* Global Top Bar */}
        <TopBar onNavigate={(modo) => handleNav(modo)} />

        {/* Content View */}
        <main className="flex-1 overflow-hidden relative">
          {obtenerContenidoActivo()}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CalculatorProvider>
          <ContenidoApp />
        </CalculatorProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
