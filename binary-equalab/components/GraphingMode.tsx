/**
 * Binary EquaLab - Graphing Mode
 * 
 * Wrapper component with mode toggle between:
 * - Standard: Traditional function graphing
 * - Epicycles PRO: Fourier visualization with drawing support
 */

import React, { useState } from 'react';
import { LineChart, CircleDot, Sparkles } from 'lucide-react';
import StandardGraphing from './StandardGraphing';
import EpicyclesPRO from './EpicyclesPRO';

type GraphMode = 'standard' | 'epicycles';

const GraphingMode: React.FC = () => {
  const [mode, setMode] = useState<GraphMode>('standard');

  return (
    <div className="h-full flex flex-col">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-3 bg-background-light border-b border-aurora-border shrink-0">
        <span className="text-xs text-aurora-muted uppercase tracking-wider mr-2">Modo:</span>
        <button
          onClick={() => setMode('standard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'standard'
            ? 'bg-primary text-white shadow-lg'
            : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
            }`}
        >
          <LineChart size={16} />
          Gráficas
        </button>
        <button
          onClick={() => setMode('epicycles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'epicycles'
            ? 'bg-primary text-white shadow-lg'
            : 'bg-background hover:bg-background-light text-aurora-text border border-aurora-border'
            }`}
        >
          <Sparkles size={16} />
          Epicycles PRO
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'standard' ? <StandardGraphing /> : <EpicyclesPRO />}
      </div>
    </div>
  );
};

export default GraphingMode;