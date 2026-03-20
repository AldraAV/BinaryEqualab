import React from 'react';
import { AppMode } from '../types';
import {
  Calculator, LineChart, LayoutGrid, Wallet,
  GraduationCap, Equal, BarChart3, Atom, ArrowRightLeft,
  Waves, Sparkles
} from 'lucide-react';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {

  // Navigation Groups
  const groups = [
    {
      title: 'Núcleo',
      items: [
        { mode: AppMode.CONSOLE, icon: Calculator, label: 'Consola CAS' },
      ]
    },
    {
      title: 'Visualización',
      items: [
        {
          mode: AppMode.GRAPHING,
          icon: LineChart,
          label: 'Gráficas & Fourier',
          highlight: true
        },
      ]
    },
    {
      title: 'Álgebra Lineal',
      items: [
        { mode: AppMode.EQUATIONS, icon: Equal, label: 'Ecuaciones' },
        { mode: AppMode.MATRIX, icon: LayoutGrid, label: 'Matrices' },
        { mode: AppMode.VECTORS, icon: ArrowRightLeft, label: 'Vectores' },
      ]
    },
    {
      title: 'Herramientas',
      items: [
        { mode: AppMode.STATISTICS, icon: BarChart3, label: 'Estadística' },
        { mode: AppMode.COMPLEX, icon: Atom, label: 'Complejos' },
        { mode: AppMode.ACCOUNTING, icon: Wallet, label: 'Contador PRO' },
      ]
    }
  ];

  return (
    <aside className="w-16 lg:w-64 glass-panel border-r border-white/5 flex flex-col py-6 shrink-0 z-40 h-full overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-3 px-4 lg:px-6 mb-8 text-primary shrink-0 group cursor-pointer" onClick={() => setMode(AppMode.CONSOLE)}>
        <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,90,31,0.4)] group-hover:shadow-[0_0_30px_rgba(255,123,76,0.6)] transition-shadow">
          <span className="font-serif text-2xl italic font-bold">∫</span>
        </div>
        <div className="hidden lg:block relative">
          <h1 className="text-lg font-bold tracking-tight text-white/90 leading-none group-hover:text-white transition-colors">Binary</h1>
          <h1 className="text-lg font-bold tracking-tight text-primary leading-none drop-shadow-[0_0_8px_rgba(255,90,31,0.5)]">EquaLab</h1>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 px-3 space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.title && group.title !== 'Núcleo' && (
              <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-aurora-muted hidden lg:block">
                {group.title}
              </h3>
            )}

            <div className="flex flex-col gap-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentMode === item.mode;
                const isHighlight = item.highlight;

                return (
                  <button
                    key={item.mode}
                    onClick={() => setMode(item.mode)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden text-left
                      ${isActive
                        ? 'bg-white/10 text-primary border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                        : isHighlight
                          ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary hover:bg-primary/20 border border-primary/20'
                          : 'text-aurora-secondary hover:bg-white/5 hover:text-white border border-transparent hover:border-white/5'
                      }
                    `}
                  >
                    <div className={`relative ${isActive || isHighlight ? 'text-primary' : ''}`}>
                      <Icon
                        size={20}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                      />
                      {isHighlight && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                    </div>

                    <span className={`text-sm font-medium hidden lg:block ${isActive ? 'font-bold' : ''}`}>
                      {item.label}
                    </span>

                    {isActive && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-l-full shadow-[0_0_10px_rgba(255,90,31,0.8)]"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Button */}
      <div className="mt-6 px-3 shrink-0">
        <button
          onClick={() => window.open('https://github.com/AldraAV/BinaryEqualab', '_blank')}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-aurora-secondary glass-button hover:text-secondary group border border-transparent shadow-inner"
        >
          <div className="relative">
            <GraduationCap size={20} className="group-hover:scale-110 group-hover:text-secondary transition-all duration-300" />
            <div className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary animate-pulse-slow shadow-[0_0_8px_rgba(0,234,211,0.8)]"></span>
            </div>
          </div>
          <span className="text-sm font-medium hidden lg:block group-hover:text-white transition-colors">Feedback & Docs</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;