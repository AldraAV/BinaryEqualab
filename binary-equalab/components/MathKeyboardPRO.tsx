/**
 * Binary EquaLab - MathKeyboardPRO
 * 
 * Teclado matemático estilo Photomath con:
 * - Preview LaTeX en tiempo real
 * - Botones de acciones CAS (derivar, integrar, etc.)
 * - Numpad y operadores
 * - Navegación de placeholders con Tab
 */

import React, { useCallback, useEffect } from 'react';
import { Delete, CornerDownLeft, ArrowRight, Trash2 } from 'lucide-react';
import useExpression from '../hooks/useExpression';
import { LiveEditor } from './MathPreview';
import MATH_ACTIONS, { getActionsByCategory, MathActionDef } from '../config/mathActions';

interface MathKeyboardPROProps {
    /** Callback cuando el usuario evalúa la expresión */
    onEvaluate?: (sympy: string, latex: string) => void;

    /** Placeholder inicial */
    initialExpression?: string;

    /** Mostrar en modo compacto */
    compact?: boolean;
}

const MathKeyboardPRO: React.FC<MathKeyboardPROProps> = ({
    onEvaluate,
    initialExpression,
    compact = false
}) => {
    const {
        expression,
        insertAction,
        insertNumber,
        insertVariable,
        insertOperator,
        nextPlaceholder,
        prevPlaceholder,
        backspace,
        clear,
        getSympy,
        getLatex,
        hasEmptyPlaceholders
    } = useExpression();

    // Manejo de teclado físico
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Tab para siguiente placeholder
            if (e.key === 'Tab') {
                e.preventDefault();
                if (e.shiftKey) {
                    prevPlaceholder();
                } else {
                    nextPlaceholder();
                }
                return;
            }

            // Enter para evaluar
            if (e.key === 'Enter' && !hasEmptyPlaceholders) {
                e.preventDefault();
                onEvaluate?.(getSympy(), getLatex());
                return;
            }

            // Backspace
            if (e.key === 'Backspace') {
                e.preventDefault();
                backspace();
                return;
            }

            // Escape para limpiar
            if (e.key === 'Escape') {
                clear();
                return;
            }

            // Números
            if (/^[0-9]$/.test(e.key)) {
                insertNumber(parseInt(e.key));
                return;
            }

            // Variables comunes
            if (/^[a-z]$/i.test(e.key)) {
                insertVariable(e.key.toLowerCase());
                return;
            }

            // Operadores
            if (['+', '-', '*', '/', '^'].includes(e.key)) {
                insertOperator(e.key as any);
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [insertNumber, insertVariable, insertOperator, nextPlaceholder, prevPlaceholder, backspace, clear, hasEmptyPlaceholders, getSympy, getLatex, onEvaluate]);

    // Renderiza un botón de acción
    const ActionButton: React.FC<{ action: MathActionDef }> = ({ action }) => (
        <button
            onClick={() => insertAction(action)}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-gradient-to-b from-background-light to-background border border-aurora-border hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95 min-h-[48px]"
            title={action.description}
        >
            <span className="text-sm font-mono text-primary">{action.label}</span>
            <span className="text-[10px] text-aurora-muted">{action.labelEs}</span>
        </button>
    );

    // Renderiza botón genérico
    const Key: React.FC<{
        label: React.ReactNode;
        onClick: () => void;
        variant?: 'default' | 'primary' | 'secondary';
        wide?: boolean;
    }> = ({ label, onClick, variant = 'default', wide = false }) => (
        <button
            onClick={onClick}
            className={`
        flex items-center justify-center rounded-xl font-medium text-lg
        transition-all active:scale-95 select-none h-12
        ${wide ? 'col-span-2' : ''}
        ${variant === 'primary'
                    ? 'bg-primary hover:bg-primary/80 text-white'
                    : variant === 'secondary'
                        ? 'bg-aurora-secondary/20 text-aurora-secondary hover:bg-aurora-secondary/30'
                        : 'bg-background-light border border-aurora-border text-aurora-text hover:bg-white/5'
                }
      `}
        >
            {label}
        </button>
    );

    return (
        <div className={`flex flex-col gap-4 ${compact ? 'p-2' : 'p-4'}`}>

            {/* Preview de LaTeX */}
            <LiveEditor
                latex={getLatex()}
                activePlaceholderId={expression.activePlaceholderId}
            />

            {/* Grid principal */}
            <div className="grid grid-cols-12 gap-2">

                {/* Columna izquierda: Acciones CAS */}
                <div className="col-span-4 space-y-2">
                    <div className="text-xs font-bold text-aurora-muted uppercase tracking-wider mb-1">
                        Cálculo
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <ActionButton action={MATH_ACTIONS.DERIVATIVE} />
                        <ActionButton action={MATH_ACTIONS.INTEGRAL} />
                        <ActionButton action={MATH_ACTIONS.LIMIT} />
                        <ActionButton action={MATH_ACTIONS.SUMMATION} />
                        <ActionButton action={MATH_ACTIONS.TAYLOR} />
                        <ActionButton action={MATH_ACTIONS.PARTIAL_DERIV} />
                    </div>

                    <div className="text-xs font-bold text-aurora-muted uppercase tracking-wider mt-3 mb-1">
                        Álgebra
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <ActionButton action={MATH_ACTIONS.SOLVE} />
                        <ActionButton action={MATH_ACTIONS.SIMPLIFY} />
                        <ActionButton action={MATH_ACTIONS.EXPAND} />
                        <ActionButton action={MATH_ACTIONS.FACTOR} />
                    </div>
                </div>

                {/* Columna central: Funciones comunes */}
                <div className="col-span-4 space-y-2">
                    <div className="text-xs font-bold text-aurora-muted uppercase tracking-wider mb-1">
                        Funciones
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <ActionButton action={MATH_ACTIONS.SQRT} />
                        <ActionButton action={MATH_ACTIONS.POWER} />
                        <ActionButton action={MATH_ACTIONS.FRACTION} />
                        <ActionButton action={MATH_ACTIONS.SIN} />
                        <ActionButton action={MATH_ACTIONS.COS} />
                        <ActionButton action={MATH_ACTIONS.TAN} />
                        <ActionButton action={MATH_ACTIONS.LN} />
                        <ActionButton action={MATH_ACTIONS.LOG} />
                        <ActionButton action={MATH_ACTIONS.NROOT} />
                    </div>

                    {/* Variables comunes */}
                    <div className="text-xs font-bold text-aurora-muted uppercase tracking-wider mt-3 mb-1">
                        Variables
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                        {['x', 'y', 'z', 't', 'n', 'θ'].map(v => (
                            <Key
                                key={v}
                                label={v}
                                onClick={() => insertVariable(v)}
                            />
                        ))}
                    </div>
                </div>

                {/* Columna derecha: Numpad */}
                <div className="col-span-4 space-y-2">
                    <div className="text-xs font-bold text-aurora-muted uppercase tracking-wider mb-1">
                        Numpad
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {/* Fila 1 */}
                        <Key label="7" onClick={() => insertNumber(7)} />
                        <Key label="8" onClick={() => insertNumber(8)} />
                        <Key label="9" onClick={() => insertNumber(9)} />
                        <Key label="÷" onClick={() => insertOperator('/')} variant="secondary" />

                        {/* Fila 2 */}
                        <Key label="4" onClick={() => insertNumber(4)} />
                        <Key label="5" onClick={() => insertNumber(5)} />
                        <Key label="6" onClick={() => insertNumber(6)} />
                        <Key label="×" onClick={() => insertOperator('*')} variant="secondary" />

                        {/* Fila 3 */}
                        <Key label="1" onClick={() => insertNumber(1)} />
                        <Key label="2" onClick={() => insertNumber(2)} />
                        <Key label="3" onClick={() => insertNumber(3)} />
                        <Key label="−" onClick={() => insertOperator('-')} variant="secondary" />

                        {/* Fila 4 */}
                        <Key label="0" onClick={() => insertNumber(0)} />
                        <Key label="." onClick={() => insertVariable('.')} />
                        <Key label="^" onClick={() => insertOperator('^')} variant="secondary" />
                        <Key label="+" onClick={() => insertOperator('+')} variant="secondary" />
                    </div>

                    {/* Controles */}
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <Key
                            label={<Trash2 size={18} />}
                            onClick={clear}
                            variant="secondary"
                        />
                        <Key
                            label={<Delete size={18} />}
                            onClick={backspace}
                            variant="secondary"
                        />
                        <Key
                            label={<ArrowRight size={18} />}
                            onClick={nextPlaceholder}
                            variant="secondary"
                        />
                    </div>

                    {/* Botón de evaluar */}
                    <button
                        onClick={() => onEvaluate?.(getSympy(), getLatex())}
                        disabled={hasEmptyPlaceholders}
                        className={`
              w-full py-3 rounded-xl font-bold text-lg transition-all
              ${hasEmptyPlaceholders
                                ? 'bg-aurora-muted/20 text-aurora-muted cursor-not-allowed'
                                : 'bg-gradient-to-r from-primary to-orange-500 text-white hover:opacity-90 active:scale-[0.98]'
                            }
            `}
                    >
                        {hasEmptyPlaceholders ? 'Completa los □' : 'Calcular'}
                    </button>
                </div>
            </div>

            {/* Hint de navegación */}
            <div className="text-center text-xs text-aurora-muted">
                <kbd className="px-1.5 py-0.5 bg-background-light rounded border border-aurora-border">Tab</kbd>
                {' '}siguiente □ •
                <kbd className="px-1.5 py-0.5 bg-background-light rounded border border-aurora-border ml-2">Shift+Tab</kbd>
                {' '}anterior
            </div>
        </div>
    );
};

export default MathKeyboardPRO;
