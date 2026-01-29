import React from 'react';
import { AppMode } from '../types';
import { Calculator, LineChart, LayoutGrid, Wallet, GraduationCap, Equal, BarChart3, Atom, ArrowRightLeft } from 'lucide-react';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {
  const navItems = [
    { mode: AppMode.CONSOLE, icon: Calculator, label: 'Calculadora CAS' },
    { mode: AppMode.GRAPHING, icon: LineChart, label: 'Gráficas' },
    { mode: AppMode.EQUATIONS, icon: Equal, label: 'Ecuaciones' },
    { mode: AppMode.MATRIX, icon: LayoutGrid, label: 'Matrices' },
    { mode: AppMode.STATISTICS, icon: BarChart3, label: 'Estadística' },
    { mode: AppMode.COMPLEX, icon: Atom, label: 'Complejos' },
    { mode: AppMode.VECTORS, icon: ArrowRightLeft, label: 'Vectores' },
    { mode: AppMode.ACCOUNTING, icon: Wallet, label: 'Contador' },
  ];

  return (
    <aside className="w-16 lg:w-64 bg-background/95 border-r border-aurora-border flex flex-col py-6 shrink-0 backdrop-blur-md z-40">
      {/* Logo Area */}
      <div className="flex items-center gap-3 px-4 lg:px-6 mb-10 text-primary">
        <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <span className="font-serif text-2xl italic font-bold">∫</span>
        </div>
        <div className="hidden lg:block">
          <h1 className="text-lg font-bold tracking-tight text-aurora-text leading-none">Binary</h1>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">EquaLab</h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-1 px-2 lg:px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentMode === item.mode;
          return (
            <button
              key={item.mode}
              onClick={() => setMode(item.mode)}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden text-left ${isActive
                ? 'bg-background-light text-primary border border-aurora-border shadow-inner'
                : 'text-aurora-secondary hover:bg-white/5 hover:text-aurora-text'
                }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-sm font-medium hidden lg:block">{item.label}</span>

              {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-l-full"></div>}
            </button>
          );
        })}
      </div>

      {/* Feedback Button */}
      <div className="mt-auto px-2 lg:px-4 mb-4">
        <button
          onClick={() => window.open('https://github.com/Malexnnn/BinaryEqualab', '_blank')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-aurora-secondary hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
        >
          <div className="relative">
            <GraduationCap size={20} className="group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </div>
          </div>
          <span className="text-sm font-medium hidden lg:block">Feedback & Soporte</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;