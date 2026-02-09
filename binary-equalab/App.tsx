import React, { useState } from 'react';
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
import Dashboard from './components/Dashboard';
import { AppMode } from './types';
import { Menu } from 'lucide-react';
import { CalculatorProvider } from './CalculatorContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

const App: React.FC = () => {
  const [currentMode, setMode] = useState<AppMode>(AppMode.CONSOLE);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (currentMode) {
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
      case AppMode.DASHBOARD:
        return <Dashboard />;
      default:
        return <ConsoleMode />;
    }
  };

  return (
    <AuthProvider>
      <NotificationProvider>
        <CalculatorProvider>
          <div className="flex h-screen overflow-hidden bg-background text-aurora-text font-sans selection:bg-primary selection:text-white">

            {/* Mobile Sidebar Overlay */}
            <div className={`fixed inset-0 bg-black/50 z-50 lg:hidden transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMobileMenuOpen(false)} />

            {/* Sidebar (Fixed Left) */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:static lg:transform-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <Sidebar currentMode={currentMode} setMode={(m) => { setMode(m); setMobileMenuOpen(false); }} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">

              {/* Mobile Header Trigger */}
              <div className="lg:hidden absolute top-4 left-4 z-40">
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-background-light border border-aurora-border rounded-lg text-white shadow-lg">
                  <Menu size={24} />
                </button>
              </div>

              {/* Global Top Bar */}
              <TopBar onNavigate={(mode) => setMode(mode)} />

              {/* Content View */}
              <main className="flex-1 overflow-hidden relative">
                {renderContent()}
              </main>
            </div>
          </div>
        </CalculatorProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
