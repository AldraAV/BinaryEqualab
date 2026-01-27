import React, { useState } from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';

interface ScientificKeypadProps {
  onKeyClick: (val: string) => void;
}

type TabType = 'MAIN' | 'ABC' | 'FUNC' | 'CONST';

const ScientificKeypad: React.FC<ScientificKeypadProps> = ({ onKeyClick }) => {
  const [activeTab, setActiveTab] = useState<TabType>('MAIN');

  // Button Component
  const Key = ({ label, val, primary = false, wide = false, secondary = false, action = false }:
    { label: React.ReactNode, val?: string, primary?: boolean, wide?: boolean, secondary?: boolean, action?: boolean }) => (
    <button
      onClick={() => onKeyClick(val || (typeof label === 'string' ? label : ''))}
      className={`
        relative overflow-hidden rounded-xl font-medium text-lg transition-all active:scale-95 select-none
        flex items-center justify-center
        ${wide ? 'col-span-2' : 'col-span-1'}
        ${primary
          ? 'bg-primary hover:bg-primary-hover text-white shadow-[0_4px_0_rgba(154,52,18,0.5)] active:shadow-none active:translate-y-[2px]'
          : secondary
            ? 'bg-background-light border border-aurora-border text-primary hover:bg-white/5 shadow-[0_3px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[2px]'
            : 'bg-background-light border border-white/5 text-aurora-text hover:bg-white/5 hover:text-white shadow-[0_3px_0_rgba(0,0,0,0.3)] active:shadow-none active:translate-y-[2px]'
        }
        h-12 lg:h-14
      `}
    >
      {label}
    </button>
  );

  const renderMainTab = () => (
    <div className="grid grid-cols-4 gap-3 h-full content-start">
      {/* Row 1: CAS & Controls */}
      <Key label="∫" val="integrate" secondary />
      <Key label="d/dx" secondary />
      <Key label="Σ" val="sum" secondary />
      <Key label="lim" secondary />

      {/* Row 2: Trig + Roots */}
      <Key label="sin" />
      <Key label="cos" />
      <Key label="tan" />
      <Key label="√" val="sqrt" />

      {/* Row 3: Powers & Log */}
      <Key label="x²" val="^2" />
      <Key label="xⁿ" val="^" />
      <Key label="ln" />
      <Key label="log" />

      {/* Row 4: Numpad start */}
      <Key label="7" />
      <Key label="8" />
      <Key label="9" />
      <Key label="÷" val="/" action />

      {/* Row 5 */}
      <Key label="4" />
      <Key label="5" />
      <Key label="6" />
      <Key label="×" val="*" action />

      {/* Row 6 */}
      <Key label="1" />
      <Key label="2" />
      <Key label="3" />
      <Key label="-" action />

      {/* Row 7 */}
      <Key label="0" />
      <Key label="." />
      <Key label="π" val="pi" />
      <Key label="+" action />

      {/* Row 8: Bottom Actions */}
      <Key label="(" />
      <Key label=")" />
      <Key label={<Delete size={20} />} val="DEL" action />
      <Key label={<CornerDownLeft size={22} />} val="=" primary />
    </div>
  );

  const renderAbcTab = () => {
    const letters = 'xyzwabcdefghijk'.split('');
    return (
      <div className="grid grid-cols-4 gap-3 h-full content-start">
        {letters.map(l => <Key key={l} label={l} />)}
        <Key label="," />
        <Key label="(" />
        <Key label=")" />
        <Key label="=" primary />
      </div>
    );
  };

  const renderFuncTab = () => (
    <div className="grid grid-cols-3 gap-3 h-full content-start overflow-y-auto custom-scrollbar">
      {/* Hyperbolic */}
      <Key label="sinh" /> <Key label="cosh" /> <Key label="tanh" />
      <Key label="asinh" /> <Key label="acosh" /> <Key label="atanh" />
      {/* Inverse Trig */}
      <Key label="asin" /> <Key label="acos" /> <Key label="atan" />
      {/* Logs & Powers */}
      <Key label="log" /> <Key label="exp" /> <Key label="sqrt" />
      <Key label="cbrt" val="cbrt" /> <Key label="abs" /> <Key label="floor" />
      {/* Combinatorics */}
      <Key label="nPr" val="permutations(" secondary />
      <Key label="nCr" val="combinations(" secondary />
      <Key label="n!" val="factorial(" />
      {/* Number Theory */}
      <Key label="GCD" val="gcd(" secondary />
      <Key label="LCM" val="lcm(" secondary />
      <Key label="mod" val="mod(" />
      {/* Matrix */}
      <Key label="det" val="determinant(" />
      <Key label="inv" val="invert(" />
      <Key label="Aᵀ" val="transpose(" />
    </div>
  );

  const renderConstTab = () => (
    <div className="grid grid-cols-3 gap-3 h-full content-start overflow-y-auto custom-scrollbar">
      {/* Math */}
      <Key val="pi" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">π</span><span className="text-[9px] opacity-50">Pi</span></div>} secondary />
      <Key val="e" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">e</span><span className="text-[9px] opacity-50">Euler</span></div>} secondary />
      <Key val="i" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">i</span><span className="text-[9px] opacity-50">Imaginary</span></div>} secondary />

      {/* Physics */}
      <Key val="c" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">c</span><span className="text-[9px] opacity-50">Light</span></div>} />
      <Key val="g" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">g</span><span className="text-[9px] opacity-50">Gravity</span></div>} />
      <Key val="G" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">G</span><span className="text-[9px] opacity-50">Newton</span></div>} />

      <Key val="h" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">h</span><span className="text-[9px] opacity-50">Planck</span></div>} />
      <Key val="k" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">k</span><span className="text-[9px] opacity-50">Boltzmann</span></div>} />
      <Key val="Na" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">Nₐ</span><span className="text-[9px] opacity-50">Avogadro</span></div>} />

      <Key val="R" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">R</span><span className="text-[9px] opacity-50">Gas Const</span></div>} />
      <Key val="me" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">mₑ</span><span className="text-[9px] opacity-50">Electron</span></div>} />
      <Key val="mp" label={<div className="flex flex-col items-center"><span className="font-serif italic text-lg leading-none">mₚ</span><span className="text-[9px] opacity-50">Proton</span></div>} />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background-light border-l border-aurora-border">
      {/* Tabs */}
      <div className="flex p-2 gap-2 border-b border-aurora-border bg-background">
        {(['MAIN', 'ABC', 'FUNC', 'CONST'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${activeTab === tab
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'text-aurora-secondary hover:bg-white/5'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Keypad Grid */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {activeTab === 'MAIN' && renderMainTab()}
        {activeTab === 'ABC' && renderAbcTab()}
        {activeTab === 'FUNC' && renderFuncTab()}
        {activeTab === 'CONST' && renderConstTab()}
      </div>
    </div>
  );
};

export default ScientificKeypad;