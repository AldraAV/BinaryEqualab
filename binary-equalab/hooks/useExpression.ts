/**
 * Binary EquaLab - useExpression Hook
 * 
 * Hook para manejar el estado de expresiones matemáticas con tokens.
 * Maneja inserción, navegación de placeholders y conversión a LaTeX/SymPy.
 */

import { useState, useCallback, useMemo } from 'react';
import {
    MathToken,
    MathExpression,
    Placeholder,
    generateId,
    createPlaceholder,
    createNumberToken,
    createVariableToken,
    createOperatorToken
} from '../types/mathTokens';
import {
    MathActionDef,
    createTokenFromAction,
    tokenToLatex,
    tokenToSympy
} from '../config/mathActions';

// ==================== INITIAL STATE ====================

const createInitialExpression = (): MathExpression => ({
    tokens: [],
    activePlaceholderId: null,
    cursorPosition: 0,
    latex: '',
    sympy: '',
    hasError: false
});

// ==================== HOOK ====================

export function useExpression() {
    const [expression, setExpression] = useState<MathExpression>(createInitialExpression);

    /**
     * Recalcula LaTeX y SymPy de toda la expresión
     */
    const recalculate = useCallback((tokens: MathToken[]): { latex: string; sympy: string } => {
        const latex = tokens.map(tokenToLatex).join(' ');
        const sympy = tokens.map(tokenToSympy).join('');
        return { latex, sympy };
    }, []);

    /**
     * Inserta una acción matemática (derivar, integrar, etc.)
     */
    const insertAction = useCallback((action: MathActionDef) => {
        setExpression(prev => {
            const newToken = createTokenFromAction(action);
            const newTokens = [...prev.tokens];

            // Si hay un placeholder activo, insertamos ahí
            if (prev.activePlaceholderId) {
                const result = insertIntoPlaceholder(newTokens, prev.activePlaceholderId, newToken);
                if (result.success) {
                    const { latex, sympy } = recalculate(result.tokens);
                    return {
                        ...prev,
                        tokens: result.tokens,
                        activePlaceholderId: newToken.placeholders[0]?.id || null,
                        latex,
                        sympy
                    };
                }
            }

            // Si no, insertamos al final
            newTokens.splice(prev.cursorPosition, 0, newToken);
            const { latex, sympy } = recalculate(newTokens);

            return {
                ...prev,
                tokens: newTokens,
                cursorPosition: prev.cursorPosition + 1,
                activePlaceholderId: newToken.placeholders[0]?.id || null,
                latex,
                sympy
            };
        });
    }, [recalculate]);

    /**
     * Inserta un número
     */
    const insertNumber = useCallback((value: number) => {
        setExpression(prev => {
            const newToken = createNumberToken(value);
            return insertToken(prev, newToken, recalculate);
        });
    }, [recalculate]);

    /**
     * Inserta una variable (x, y, etc.)
     */
    const insertVariable = useCallback((name: string) => {
        setExpression(prev => {
            const newToken = createVariableToken(name);
            return insertToken(prev, newToken, recalculate);
        });
    }, [recalculate]);

    /**
     * Inserta un operador (+, -, *, /, ^)
     */
    const insertOperator = useCallback((op: '+' | '-' | '*' | '/' | '^') => {
        setExpression(prev => {
            const newToken = createOperatorToken(op);
            return insertToken(prev, newToken, recalculate);
        });
    }, [recalculate]);

    /**
     * Navega al siguiente placeholder (Tab)
     */
    const nextPlaceholder = useCallback(() => {
        setExpression(prev => {
            const allPlaceholders = getAllPlaceholders(prev.tokens);
            if (allPlaceholders.length === 0) return prev;

            const currentIndex = allPlaceholders.findIndex(p => p.id === prev.activePlaceholderId);
            const nextIndex = (currentIndex + 1) % allPlaceholders.length;

            return {
                ...prev,
                activePlaceholderId: allPlaceholders[nextIndex].id
            };
        });
    }, []);

    /**
     * Navega al placeholder anterior (Shift+Tab)
     */
    const prevPlaceholder = useCallback(() => {
        setExpression(prev => {
            const allPlaceholders = getAllPlaceholders(prev.tokens);
            if (allPlaceholders.length === 0) return prev;

            const currentIndex = allPlaceholders.findIndex(p => p.id === prev.activePlaceholderId);
            const prevIndex = (currentIndex - 1 + allPlaceholders.length) % allPlaceholders.length;

            return {
                ...prev,
                activePlaceholderId: allPlaceholders[prevIndex].id
            };
        });
    }, []);

    /**
     * Borra el último token o limpia el placeholder activo
     */
    const backspace = useCallback(() => {
        setExpression(prev => {
            // Si hay placeholder activo, limpiarlo
            if (prev.activePlaceholderId) {
                const result = clearPlaceholder(prev.tokens, prev.activePlaceholderId);
                if (result.cleared) {
                    const { latex, sympy } = recalculate(result.tokens);
                    return { ...prev, tokens: result.tokens, latex, sympy };
                }
            }

            // Si no, borrar el último token
            if (prev.tokens.length === 0) return prev;

            const newTokens = prev.tokens.slice(0, -1);
            const { latex, sympy } = recalculate(newTokens);

            return {
                ...prev,
                tokens: newTokens,
                cursorPosition: Math.max(0, prev.cursorPosition - 1),
                latex,
                sympy
            };
        });
    }, [recalculate]);

    /**
     * Limpia toda la expresión
     */
    const clear = useCallback(() => {
        setExpression(createInitialExpression());
    }, []);

    /**
     * Obtiene la expresión SymPy lista para enviar al backend
     */
    const getSympy = useCallback((): string => {
        return expression.sympy;
    }, [expression.sympy]);

    /**
     * Obtiene el LaTeX para renderizar
     */
    const getLatex = useCallback((): string => {
        return expression.latex || '□';
    }, [expression.latex]);

    /**
     * Verifica si hay placeholders vacíos
     */
    const hasEmptyPlaceholders = useMemo(() => {
        const all = getAllPlaceholders(expression.tokens);
        return all.some(p => !p.filled);
    }, [expression.tokens]);

    return {
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
    };
}

// ==================== HELPERS ====================

/**
 * Obtiene todos los placeholders de forma recursiva
 */
function getAllPlaceholders(tokens: MathToken[]): Placeholder[] {
    const result: Placeholder[] = [];

    for (const token of tokens) {
        for (const ph of token.placeholders) {
            result.push(ph);
            if (ph.content) {
                result.push(...getAllPlaceholders([ph.content]));
            }
        }
    }

    return result;
}

/**
 * Inserta un token en un placeholder específico
 */
function insertIntoPlaceholder(
    tokens: MathToken[],
    placeholderId: string,
    newToken: MathToken
): { success: boolean; tokens: MathToken[] } {
    const newTokens = tokens.map(token => {
        const newPlaceholders = token.placeholders.map(ph => {
            if (ph.id === placeholderId) {
                return { ...ph, filled: true, content: newToken };
            }
            if (ph.content) {
                const result = insertIntoPlaceholder([ph.content], placeholderId, newToken);
                if (result.success) {
                    return { ...ph, content: result.tokens[0] };
                }
            }
            return ph;
        });
        return { ...token, placeholders: newPlaceholders };
    });

    const found = JSON.stringify(newTokens) !== JSON.stringify(tokens);
    return { success: found, tokens: newTokens };
}

/**
 * Limpia un placeholder específico
 */
function clearPlaceholder(
    tokens: MathToken[],
    placeholderId: string
): { cleared: boolean; tokens: MathToken[] } {
    const newTokens = tokens.map(token => {
        const newPlaceholders = token.placeholders.map(ph => {
            if (ph.id === placeholderId) {
                return { ...ph, filled: false, content: null };
            }
            if (ph.content) {
                const result = clearPlaceholder([ph.content], placeholderId);
                if (result.cleared) {
                    return { ...ph, content: result.tokens[0] };
                }
            }
            return ph;
        });
        return { ...token, placeholders: newPlaceholders };
    });

    const cleared = JSON.stringify(newTokens) !== JSON.stringify(tokens);
    return { cleared, tokens: newTokens };
}

/**
 * Helper para insertar token en la posición correcta
 */
function insertToken(
    prev: MathExpression,
    newToken: MathToken,
    recalculate: (tokens: MathToken[]) => { latex: string; sympy: string }
): MathExpression {
    // Si hay placeholder activo, insertar ahí
    if (prev.activePlaceholderId) {
        const result = insertIntoPlaceholder(prev.tokens, prev.activePlaceholderId, newToken);
        if (result.success) {
            const { latex, sympy } = recalculate(result.tokens);
            // Mover al siguiente placeholder vacío
            const allPhs = getAllPlaceholders(result.tokens);
            const nextEmpty = allPhs.find(p => !p.filled);
            return {
                ...prev,
                tokens: result.tokens,
                activePlaceholderId: nextEmpty?.id || null,
                latex,
                sympy
            };
        }
    }

    // Insertar al final
    const newTokens = [...prev.tokens, newToken];
    const { latex, sympy } = recalculate(newTokens);

    return {
        ...prev,
        tokens: newTokens,
        cursorPosition: newTokens.length,
        latex,
        sympy
    };
}

export default useExpression;
