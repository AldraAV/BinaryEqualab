/**
 * Binary EquaLab - Math Actions Config
 * 
 * Configuración de todas las acciones matemáticas disponibles.
 * Cada acción define su representación LaTeX y comando SymPy.
 */

import { MathActionDef, MathToken, createPlaceholder, generateId } from '../types/mathTokens';

// Re-export for convenience
export type { MathActionDef } from '../types/mathTokens';

// ==================== ACCIONES DE CÁLCULO ====================

export const MATH_ACTIONS: Record<string, MathActionDef> = {
    // Derivadas
    DERIVATIVE: {
        id: 'deriv',
        label: 'd/dx',
        labelEs: 'Derivar',
        latex: '\\frac{d}{dx}\\left(□\\right)',
        sympy: 'diff({0}, x)',
        placeholderCount: 1,
        slashCmd: '/derivar',
        category: 'calculus',
        description: 'Calcula la derivada respecto a x',
        shortcut: 'Ctrl+D'
    },

    DERIVATIVE_N: {
        id: 'deriv_n',
        label: 'd²/dx²',
        labelEs: 'Derivada n-ésima',
        latex: '\\frac{d^{□}}{dx^{□}}\\left(□\\right)',
        sympy: 'diff({2}, x, {0})',
        placeholderCount: 3,
        slashCmd: '/derivar2',
        category: 'calculus',
        description: 'Calcula la derivada de orden n'
    },

    PARTIAL_DERIV: {
        id: 'partial',
        label: '∂/∂x',
        labelEs: 'Derivada parcial',
        latex: '\\frac{\\partial}{\\partial □}\\left(□\\right)',
        sympy: 'diff({1}, {0})',
        placeholderCount: 2,
        slashCmd: '/parcial',
        category: 'calculus',
        description: 'Calcula la derivada parcial'
    },

    // Integrales
    INTEGRAL: {
        id: 'int',
        label: '∫',
        labelEs: 'Integral indefinida',
        latex: '\\int □ \\,d□',
        sympy: 'integrate({0}, {1})',
        placeholderCount: 2,
        slashCmd: '/integrar',
        category: 'calculus',
        description: 'Calcula la integral indefinida',
        shortcut: 'Ctrl+I'
    },

    INTEGRAL_DEF: {
        id: 'int_def',
        label: '∫ₐᵇ',
        labelEs: 'Integral definida',
        latex: '\\int_{□}^{□} □ \\,d□',
        sympy: 'integrate({2}, ({3}, {0}, {1}))',
        placeholderCount: 4,
        slashCmd: '/intdef',
        category: 'calculus',
        description: 'Calcula la integral definida de a a b'
    },

    // Límites
    LIMIT: {
        id: 'lim',
        label: 'lím',
        labelEs: 'Límite',
        latex: '\\lim_{□ \\to □} □',
        sympy: 'limit({2}, {0}, {1})',
        placeholderCount: 3,
        slashCmd: '/limite',
        category: 'calculus',
        description: 'Calcula el límite cuando x tiende a un valor',
        shortcut: 'Ctrl+L'
    },

    LIMIT_LEFT: {
        id: 'lim_left',
        label: 'lím⁻',
        labelEs: 'Límite izquierdo',
        latex: '\\lim_{□ \\to □^{-}} □',
        sympy: "limit({2}, {0}, {1}, '-')",
        placeholderCount: 3,
        slashCmd: '/limizq',
        category: 'calculus',
        description: 'Límite por la izquierda'
    },

    LIMIT_RIGHT: {
        id: 'lim_right',
        label: 'lím⁺',
        labelEs: 'Límite derecho',
        latex: '\\lim_{□ \\to □^{+}} □',
        sympy: "limit({2}, {0}, {1}, '+')",
        placeholderCount: 3,
        slashCmd: '/limder',
        category: 'calculus',
        description: 'Límite por la derecha'
    },

    // Series
    SUMMATION: {
        id: 'sum',
        label: 'Σ',
        labelEs: 'Sumatoria',
        latex: '\\sum_{□=□}^{□} □',
        sympy: 'Sum({3}, ({0}, {1}, {2}))',
        placeholderCount: 4,
        slashCmd: '/suma',
        category: 'calculus',
        description: 'Sumatoria desde n=a hasta b'
    },

    PRODUCT: {
        id: 'prod',
        label: 'Π',
        labelEs: 'Productoria',
        latex: '\\prod_{□=□}^{□} □',
        sympy: 'Product({3}, ({0}, {1}, {2}))',
        placeholderCount: 4,
        slashCmd: '/producto',
        category: 'calculus',
        description: 'Productoria desde n=a hasta b'
    },

    TAYLOR: {
        id: 'taylor',
        label: 'Taylor',
        labelEs: 'Serie de Taylor',
        latex: '\\text{Taylor}\\left(□, □, □, □\\right)',
        sympy: 'series({0}, {1}, {2}, {3})',
        placeholderCount: 4,
        slashCmd: '/taylor',
        category: 'calculus',
        description: 'Serie de Taylor: f(x), var, punto, orden'
    },

    // ==================== ÁLGEBRA ====================

    SOLVE: {
        id: 'solve',
        label: 'Resolver',
        labelEs: 'Resolver ecuación',
        latex: '\\text{resolver}\\left(□ = □, □\\right)',
        sympy: 'solve(Eq({0}, {1}), {2})',
        placeholderCount: 3,
        slashCmd: '/resolver',
        category: 'algebra',
        description: 'Resuelve la ecuación para x'
    },

    SIMPLIFY: {
        id: 'simplify',
        label: 'Simplificar',
        labelEs: 'Simplificar',
        latex: '\\text{simplificar}\\left(□\\right)',
        sympy: 'simplify({0})',
        placeholderCount: 1,
        slashCmd: '/simplificar',
        category: 'algebra',
        description: 'Simplifica la expresión'
    },

    EXPAND: {
        id: 'expand',
        label: 'Expandir',
        labelEs: 'Expandir',
        latex: '\\text{expandir}\\left(□\\right)',
        sympy: 'expand({0})',
        placeholderCount: 1,
        slashCmd: '/expandir',
        category: 'algebra',
        description: 'Expande productos y potencias'
    },

    FACTOR: {
        id: 'factor',
        label: 'Factorizar',
        labelEs: 'Factorizar',
        latex: '\\text{factorizar}\\left(□\\right)',
        sympy: 'factor({0})',
        placeholderCount: 1,
        slashCmd: '/factorizar',
        category: 'algebra',
        description: 'Factoriza el polinomio'
    },

    // ==================== RAÍCES Y POTENCIAS ====================

    SQRT: {
        id: 'sqrt',
        label: '√',
        labelEs: 'Raíz cuadrada',
        latex: '\\sqrt{□}',
        sympy: 'sqrt({0})',
        placeholderCount: 1,
        slashCmd: '/raiz',
        category: 'misc',
        description: 'Raíz cuadrada'
    },

    NROOT: {
        id: 'nroot',
        label: 'ⁿ√',
        labelEs: 'Raíz n-ésima',
        latex: '\\sqrt[□]{□}',
        sympy: 'root({1}, {0})',
        placeholderCount: 2,
        slashCmd: '/raizn',
        category: 'misc',
        description: 'Raíz n-ésima'
    },

    POWER: {
        id: 'power',
        label: 'xⁿ',
        labelEs: 'Potencia',
        latex: '{□}^{□}',
        sympy: '({0})**({1})',
        placeholderCount: 2,
        slashCmd: '/potencia',
        category: 'misc',
        description: 'Eleva a una potencia'
    },

    FRACTION: {
        id: 'frac',
        label: 'a/b',
        labelEs: 'Fracción',
        latex: '\\frac{□}{□}',
        sympy: '({0})/({1})',
        placeholderCount: 2,
        slashCmd: '/fraccion',
        category: 'misc',
        description: 'Crea una fracción'
    },

    // ==================== TRIGONOMETRÍA ====================

    SIN: {
        id: 'sin',
        label: 'sen',
        labelEs: 'Seno',
        latex: '\\sin\\left(□\\right)',
        sympy: 'sin({0})',
        placeholderCount: 1,
        slashCmd: '/sen',
        category: 'trig',
        description: 'Función seno'
    },

    COS: {
        id: 'cos',
        label: 'cos',
        labelEs: 'Coseno',
        latex: '\\cos\\left(□\\right)',
        sympy: 'cos({0})',
        placeholderCount: 1,
        slashCmd: '/cos',
        category: 'trig',
        description: 'Función coseno'
    },

    TAN: {
        id: 'tan',
        label: 'tan',
        labelEs: 'Tangente',
        latex: '\\tan\\left(□\\right)',
        sympy: 'tan({0})',
        placeholderCount: 1,
        slashCmd: '/tan',
        category: 'trig',
        description: 'Función tangente'
    },

    // ==================== LOGARITMOS ====================

    LN: {
        id: 'ln',
        label: 'ln',
        labelEs: 'Logaritmo natural',
        latex: '\\ln\\left(□\\right)',
        sympy: 'log({0})',
        placeholderCount: 1,
        slashCmd: '/ln',
        category: 'misc',
        description: 'Logaritmo natural (base e)'
    },

    LOG: {
        id: 'log',
        label: 'log',
        labelEs: 'Logaritmo base 10',
        latex: '\\log\\left(□\\right)',
        sympy: 'log({0}, 10)',
        placeholderCount: 1,
        slashCmd: '/log',
        category: 'misc',
        description: 'Logaritmo base 10'
    },

    LOG_BASE: {
        id: 'log_base',
        label: 'logₐ',
        labelEs: 'Logaritmo base n',
        latex: '\\log_{□}\\left(□\\right)',
        sympy: 'log({1}, {0})',
        placeholderCount: 2,
        slashCmd: '/logbase',
        category: 'misc',
        description: 'Logaritmo con base personalizada'
    }
};

// ==================== UTILIDADES ====================

/**
 * Obtiene todas las acciones de una categoría
 */
export function getActionsByCategory(category: MathActionDef['category']): MathActionDef[] {
    return Object.values(MATH_ACTIONS).filter(a => a.category === category);
}

/**
 * Busca acción por slash command
 */
export function getActionBySlashCmd(cmd: string): MathActionDef | undefined {
    return Object.values(MATH_ACTIONS).find(a => a.slashCmd === cmd);
}

/**
 * Obtiene todos los slash commands disponibles
 */
export function getAllSlashCommands(): { cmd: string; description: string; label: string }[] {
    return Object.values(MATH_ACTIONS).map(a => ({
        cmd: a.slashCmd,
        description: a.description,
        label: a.labelEs
    }));
}

/**
 * Crea un token desde una acción
 */
export function createTokenFromAction(action: MathActionDef): MathToken {
    const placeholders = Array.from({ length: action.placeholderCount }, () => createPlaceholder());

    return {
        id: generateId(),
        type: 'action',
        latex: action.latex,
        sympy: action.sympy,
        placeholders
    };
}

/**
 * Convierte un token a LaTeX con placeholders resueltos
 */
export function tokenToLatex(token: MathToken): string {
    let latex = token.latex;

    token.placeholders.forEach((ph, index) => {
        // ph.content ahora es un array de tokens
        const content = ph.filled && ph.content.length > 0
            ? ph.content.map(tokenToLatex).join(' ')
            : '□';
        latex = latex.replace('□', content);
    });

    return latex;
}

/**
 * Convierte un token a SymPy con placeholders resueltos
 */
export function tokenToSympy(token: MathToken): string {
    let sympy = token.sympy;

    token.placeholders.forEach((ph, index) => {
        // ph.content ahora es un array de tokens
        const content = ph.filled && ph.content.length > 0
            ? ph.content.map(tokenToSympy).join('')
            : '_';
        sympy = sympy.replace(`{${index}}`, content);
    });

    return sympy;
}

export default MATH_ACTIONS;

