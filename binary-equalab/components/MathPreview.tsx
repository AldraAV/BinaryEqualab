/**
 * Binary EquaLab - MathPreview Component
 * 
 * Renderiza expresiones LaTeX en tiempo real con KaTeX.
 * Resalta el placeholder activo con un color distintivo.
 */

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathPreviewProps {
    /** Expresión LaTeX a renderizar */
    latex: string;

    /** ID del placeholder activo (para highlighting) */
    activePlaceholderId?: string | null;

    /** Tamaño del texto */
    size?: 'sm' | 'md' | 'lg' | 'xl';

    /** Mostrar borde/contenedor */
    showBorder?: boolean;

    /** Callback cuando se hace click */
    onClick?: () => void;

    /** Mensaje cuando está vacío */
    emptyMessage?: string;
}

const MathPreview: React.FC<MathPreviewProps> = ({
    latex,
    activePlaceholderId,
    size = 'lg',
    showBorder = true,
    onClick,
    emptyMessage = 'Escribe una expresión...'
}) => {

    // Reemplaza □ con versión coloreada si está activo
    const processedLatex = useMemo(() => {
        if (!latex) return '';

        // Reemplazar el primer □ con uno coloreado (placeholder activo)
        // En una implementación real, trackearíamos cuál □ corresponde al ID activo
        let result = latex;
        let first = true;

        result = result.replace(/□/g, () => {
            if (first && activePlaceholderId) {
                first = false;
                return '\\textcolor{#f97316}{\\boxed{\\phantom{x}}}'; // Orange highlight
            }
            return '\\boxed{\\phantom{x}}'; // Normal box
        });

        return result;
    }, [latex, activePlaceholderId]);

    // Renderiza KaTeX
    const renderedHtml = useMemo(() => {
        if (!processedLatex) return '';

        try {
            return katex.renderToString(processedLatex, {
                throwOnError: false,
                displayMode: true,
                trust: true,
                strict: false
            });
        } catch (error) {
            console.error('KaTeX render error:', error);
            return `<span class="text-red-500">Error de sintaxis</span>`;
        }
    }, [processedLatex]);

    // Tamaños de fuente
    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-xl',
        lg: 'text-2xl',
        xl: 'text-4xl'
    };

    return (
        <div
            onClick={onClick}
            className={`
        ${showBorder ? 'border border-aurora-border rounded-xl bg-background-light/50' : ''}
        ${onClick ? 'cursor-pointer hover:border-primary/50' : ''}
        ${sizeClasses[size]}
        p-4 min-h-[80px] flex items-center justify-center
        transition-all duration-200
      `}
        >
            {latex ? (
                <div
                    dangerouslySetInnerHTML={{ __html: renderedHtml }}
                    className="katex-preview"
                />
            ) : (
                <span className="text-aurora-muted italic text-base">
                    {emptyMessage}
                </span>
            )}
        </div>
    );
};

// ==================== MINI PREVIEW ====================

interface MiniPreviewProps {
    latex: string;
    label?: string;
}

/**
 * Preview pequeño para botones y tooltips
 */
export const MiniPreview: React.FC<MiniPreviewProps> = ({ latex, label }) => {
    const html = useMemo(() => {
        try {
            return katex.renderToString(latex.replace(/□/g, '\\square'), {
                throwOnError: false,
                displayMode: false
            });
        } catch {
            return latex;
        }
    }, [latex]);

    return (
        <div className="flex flex-col items-center gap-1">
            <div dangerouslySetInnerHTML={{ __html: html }} className="text-sm" />
            {label && <span className="text-[10px] text-aurora-muted">{label}</span>}
        </div>
    );
};

// ==================== LIVE EDITOR ====================

interface LiveEditorProps {
    latex: string;
    activePlaceholderId: string | null;
    onPlaceholderClick?: (id: string) => void;
}

/**
 * Editor interactivo donde los placeholders son clickeables
 */
export const LiveEditor: React.FC<LiveEditorProps> = ({
    latex,
    activePlaceholderId,
    onPlaceholderClick
}) => {
    // En una implementación completa, parseamos el LaTeX
    // y renderizamos cada placeholder como un elemento clickeable

    return (
        <div className="relative">
            <MathPreview
                latex={latex}
                activePlaceholderId={activePlaceholderId}
                size="xl"
                showBorder
            />

            {/* Indicador de placeholder activo */}
            {activePlaceholderId && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-primary flex items-center gap-1">
                    <span className="animate-pulse">●</span>
                    <span>Tab para siguiente □</span>
                </div>
            )}
        </div>
    );
};

export default MathPreview;
