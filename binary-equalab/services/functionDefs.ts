/**
 * Binary EquaLab - Function Definitions (Spanish-first)
 * 
 * Funciones matemáticas con nombres en español como idioma primario.
 * Mapeo: español → inglés (para backend/nerdamer)
 */

export interface FunctionDef {
    name: string;           // Nombre en español
    english: string;        // Nombre en inglés (para backend)
    syntax: string;         // Sintaxis de uso
    description: {
        es: string;
        en: string;
    };
    category: 'calculus' | 'algebra' | 'trig' | 'stats' | 'misc';
}

export const FUNCTION_DEFINITIONS: FunctionDef[] = [
    // ==================== CÁLCULO ====================
    {
        name: 'derivar',
        english: 'diff',
        syntax: 'derivar(f, x)',
        description: {
            es: 'Calcula la derivada de f respecto a x',
            en: 'Computes the derivative of f with respect to x'
        },
        category: 'calculus'
    },
    {
        name: 'integrar',
        english: 'integrate',
        syntax: 'integrar(f, x) o integrar(f, x, a, b)',
        description: {
            es: 'Calcula la integral indefinida o definida',
            en: 'Computes indefinite or definite integral'
        },
        category: 'calculus'
    },
    {
        name: 'limite',
        english: 'limit',
        syntax: 'limite(f, x, a)',
        description: {
            es: 'Calcula el límite de f cuando x tiende a a',
            en: 'Computes the limit of f as x approaches a'
        },
        category: 'calculus'
    },
    {
        name: 'taylor',
        english: 'taylor',
        syntax: 'taylor(f, x, a, n)',
        description: {
            es: 'Serie de Taylor de orden n alrededor de a',
            en: 'Taylor series of order n around point a'
        },
        category: 'calculus'
    },
    {
        name: 'sumatoria',
        english: 'sum',
        syntax: 'sumatoria(f, n, a, b)',
        description: {
            es: 'Suma de f(n) desde n=a hasta n=b',
            en: 'Sum of f(n) from n=a to n=b'
        },
        category: 'calculus'
    },
    {
        name: 'productoria',
        english: 'product',
        syntax: 'productoria(f, n, a, b)',
        description: {
            es: 'Producto de f(n) desde n=a hasta n=b',
            en: 'Product of f(n) from n=a to n=b'
        },
        category: 'calculus'
    },

    // ==================== ÁLGEBRA ====================
    {
        name: 'simplificar',
        english: 'simplify',
        syntax: 'simplificar(expr)',
        description: {
            es: 'Simplifica la expresión algebraica',
            en: 'Simplifies the algebraic expression'
        },
        category: 'algebra'
    },
    {
        name: 'expandir',
        english: 'expand',
        syntax: 'expandir(expr)',
        description: {
            es: 'Expande productos y potencias',
            en: 'Expands products and powers'
        },
        category: 'algebra'
    },
    {
        name: 'factorizar',
        english: 'factor',
        syntax: 'factorizar(expr)',
        description: {
            es: 'Factoriza la expresión',
            en: 'Factors the expression'
        },
        category: 'algebra'
    },
    {
        name: 'resolver',
        english: 'solve',
        syntax: 'resolver(ecuacion, x)',
        description: {
            es: 'Resuelve la ecuación para x',
            en: 'Solves the equation for x'
        },
        category: 'algebra'
    },
    {
        name: 'sustituir',
        english: 'subs',
        syntax: 'sustituir(expr, x, valor)',
        description: {
            es: 'Sustituye x por valor en la expresión',
            en: 'Substitutes x with value in expression'
        },
        category: 'algebra'
    },

    // ==================== TRIGONOMETRÍA ====================
    {
        name: 'sen',
        english: 'sin',
        syntax: 'sen(x)',
        description: {
            es: 'Seno de x',
            en: 'Sine of x'
        },
        category: 'trig'
    },
    {
        name: 'cos',
        english: 'cos',
        syntax: 'cos(x)',
        description: {
            es: 'Coseno de x',
            en: 'Cosine of x'
        },
        category: 'trig'
    },
    {
        name: 'tan',
        english: 'tan',
        syntax: 'tan(x)',
        description: {
            es: 'Tangente de x',
            en: 'Tangent of x'
        },
        category: 'trig'
    },
    {
        name: 'arcsen',
        english: 'asin',
        syntax: 'arcsen(x)',
        description: {
            es: 'Arco seno (seno inverso)',
            en: 'Arc sine (inverse sine)'
        },
        category: 'trig'
    },
    {
        name: 'arccos',
        english: 'acos',
        syntax: 'arccos(x)',
        description: {
            es: 'Arco coseno',
            en: 'Arc cosine'
        },
        category: 'trig'
    },
    {
        name: 'arctan',
        english: 'atan',
        syntax: 'arctan(x)',
        description: {
            es: 'Arco tangente',
            en: 'Arc tangent'
        },
        category: 'trig'
    },

    // ==================== MISC ====================
    {
        name: 'raiz',
        english: 'sqrt',
        syntax: 'raiz(x) o raiz(x, n)',
        description: {
            es: 'Raíz cuadrada o n-ésima',
            en: 'Square root or nth root'
        },
        category: 'misc'
    },
    {
        name: 'abs',
        english: 'abs',
        syntax: 'abs(x)',
        description: {
            es: 'Valor absoluto',
            en: 'Absolute value'
        },
        category: 'misc'
    },
    {
        name: 'ln',
        english: 'ln',
        syntax: 'ln(x)',
        description: {
            es: 'Logaritmo natural',
            en: 'Natural logarithm'
        },
        category: 'misc'
    },
    {
        name: 'log',
        english: 'log',
        syntax: 'log(x) o log(x, base)',
        description: {
            es: 'Logaritmo base 10 o base n',
            en: 'Base 10 or base n logarithm'
        },
        category: 'misc'
    },
    {
        name: 'exp',
        english: 'exp',
        syntax: 'exp(x)',
        description: {
            es: 'Función exponencial e^x',
            en: 'Exponential function e^x'
        },
        category: 'misc'
    },
    {
        name: 'factorial',
        english: 'factorial',
        syntax: 'factorial(n) o n!',
        description: {
            es: 'Factorial de n',
            en: 'Factorial of n'
        },
        category: 'misc'
    },
    {
        name: 'piso',
        english: 'floor',
        syntax: 'piso(x)',
        description: {
            es: 'Redondea hacia abajo',
            en: 'Rounds down'
        },
        category: 'misc'
    },
    {
        name: 'techo',
        english: 'ceil',
        syntax: 'techo(x)',
        description: {
            es: 'Redondea hacia arriba',
            en: 'Rounds up'
        },
        category: 'misc'
    },

    // ==================== INDUSTRIAL / AI ====================
    {
        name: 'fourier',
        english: 'fourier',
        syntax: 'fourier(f(t))',
        description: {
            es: 'Transformada de Fourier',
            en: 'Fourier Transform'
        },
        category: 'calculus'
    },
    {
        name: 'laplace',
        english: 'laplace',
        syntax: 'laplace(f(t))',
        description: {
            es: 'Transformada de Laplace',
            en: 'Laplace Transform'
        },
        category: 'calculus'
    },
    {
        name: 'sonify',
        english: 'sonify',
        syntax: 'sonify(expr)',
        description: {
            es: 'Genera audio de la función',
            en: 'Generates audio from function'
        },
        category: 'misc'
    },
    {
        name: 'explain',
        english: 'explain',
        syntax: 'explain("Tema")',
        description: {
            es: 'Explica un concepto con IA',
            en: 'Explains a concept using AI'
        },
        category: 'misc'
    },
    {
        name: 'explicar',
        english: 'explain',
        syntax: 'explicar("Tema")',
        description: {
            es: 'Explica un concepto con IA',
            en: 'Explains a concept using AI'
        },
        category: 'misc'
    }
];

/**
 * Mapeo rápido español → inglés para el parser
 */
export const SPANISH_TO_ENGLISH: Record<string, string> = {};
FUNCTION_DEFINITIONS.forEach(fn => {
    SPANISH_TO_ENGLISH[fn.name] = fn.english;
});

/**
 * Obtiene sugerencias de autocompletado basadas en input parcial
 */
export function getAutocompleteSuggestions(
    partial: string,
    lang: 'es' | 'en' = 'es',
    limit: number = 5
): FunctionDef[] {
    const search = partial.toLowerCase();
    return FUNCTION_DEFINITIONS
        .filter(fn => {
            const name = lang === 'es' ? fn.name : fn.english;
            return name.toLowerCase().startsWith(search);
        })
        .slice(0, limit);
}

/**
 * Traduce funciones en español a inglés para el backend
 */
export function translateToEnglish(expr: string): string {
    let result = expr;
    // Ordenar por longitud descendente para evitar reemplazos parciales
    const sortedFns = Object.entries(SPANISH_TO_ENGLISH)
        .sort((a, b) => b[0].length - a[0].length);

    for (const [spanish, english] of sortedFns) {
        const regex = new RegExp(`\\b${spanish}\\s*\\(`, 'gi');
        result = result.replace(regex, `${english}(`);
    }
    return result;
}
