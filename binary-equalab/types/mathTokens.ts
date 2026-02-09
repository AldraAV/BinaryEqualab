/**
 * Binary EquaLab - Math Token System
 * 
 * Sistema de tokens para expresiones matemáticas estilo Photomath.
 * Permite construir expresiones con placeholders editables.
 */

// ==================== TIPOS BASE ====================

/**
 * Un placeholder vacío que el usuario debe llenar
 * content es ahora un array para soportar expresiones como 2+3
 */
export interface Placeholder {
    id: string;
    filled: boolean;
    content: MathToken[];  // Cambié de MathToken | null a MathToken[]
}

/**
 * Tipos de tokens matemáticos
 */
export type TokenType =
    | 'action'     // Operaciones CAS (derivar, integrar)
    | 'function'   // Funciones (sin, cos, sqrt)
    | 'operator'   // Operadores (+, -, *, /)
    | 'number'     // Números (1, 2.5, π)
    | 'variable'   // Variables (x, y, θ)
    | 'group';     // Paréntesis y agrupadores

/**
 * Token matemático individual
 */
export interface MathToken {
    id: string;
    type: TokenType;

    // Representación visual (LaTeX)
    latex: string;

    // Comando para backend (SymPy)
    sympy: string;

    // Placeholders dentro del token (ej: integral tiene 3)
    placeholders: Placeholder[];

    // Valor numérico si es number
    value?: number;

    // Nombre de variable si es variable
    name?: string;
}

// ==================== EXPRESIÓN COMPLETA ====================

/**
 * Estado de la expresión completa
 */
export interface MathExpression {
    /** Lista de tokens en la expresión */
    tokens: MathToken[];

    /** ID del placeholder actualmente seleccionado */
    activePlaceholderId: string | null;

    /** Posición del cursor (índice del token) */
    cursorPosition: number;

    /** LaTeX renderizado (vista) */
    latex: string;

    /** Expresión SymPy (backend) */
    sympy: string;

    /** Si hay errores de sintaxis */
    hasError: boolean;

    /** Mensaje de error si existe */
    errorMessage?: string;
}

// ==================== ACTIONS CONFIG ====================

/**
 * Definición de una acción matemática (derivar, integrar, etc.)
 */
export interface MathActionDef {
    id: string;

    /** Label corto para botón */
    label: string;

    /** Label en español */
    labelEs: string;

    /** Template LaTeX con □ como placeholders */
    latex: string;

    /** Template SymPy con {0}, {1}... como placeholders */
    sympy: string;

    /** Número de placeholders */
    placeholderCount: number;

    /** Slash command asociado */
    slashCmd: string;

    /** Categoría para organización */
    category: 'calculus' | 'algebra' | 'trig' | 'misc';

    /** Descripción en español */
    description: string;

    /** Atajo de teclado (opcional) */
    shortcut?: string;
}

// ==================== UTILIDADES ====================

/**
 * Genera un ID único para tokens y placeholders
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Crea un placeholder vacío
 */
export function createPlaceholder(): Placeholder {
    return {
        id: generateId(),
        filled: false,
        content: []
    };
}

/**
 * Crea un token numérico
 */
export function createNumberToken(value: number): MathToken {
    return {
        id: generateId(),
        type: 'number',
        latex: String(value),
        sympy: String(value),
        placeholders: [],
        value
    };
}

/**
 * Crea un token de variable
 */
export function createVariableToken(name: string): MathToken {
    return {
        id: generateId(),
        type: 'variable',
        latex: name,
        sympy: name,
        placeholders: [],
        name
    };
}

/**
 * Crea un token de operador
 */
export function createOperatorToken(op: '+' | '-' | '*' | '/' | '^'): MathToken {
    const latexMap: Record<string, string> = {
        '+': '+',
        '-': '-',
        '*': '\\cdot',
        '/': '\\div',
        '^': '^'
    };

    return {
        id: generateId(),
        type: 'operator',
        latex: latexMap[op] || op,
        sympy: op === '^' ? '**' : op,
        placeholders: []
    };
}

export default MathToken;
