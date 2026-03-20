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
        syntax: 'taylor(sin(x), x, 0, 5)',
        description: {
            es: 'Serie de Taylor: f, var, punto, orden',
            en: 'Taylor series: f, var, point, order'
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

    // ==================== TRIG EXTENDIDA ====================
    {
        name: 'csc',
        english: 'csc',
        syntax: 'csc(x)',
        description: {
            es: 'Cosecante de x',
            en: 'Cosecant of x'
        },
        category: 'trig'
    },
    {
        name: 'sec',
        english: 'sec',
        syntax: 'sec(x)',
        description: {
            es: 'Secante de x',
            en: 'Secant of x'
        },
        category: 'trig'
    },
    {
        name: 'cot',
        english: 'cot',
        syntax: 'cot(x)',
        description: {
            es: 'Cotangente de x',
            en: 'Cotangent of x'
        },
        category: 'trig'
    },
    {
        name: 'acsc',
        english: 'acsc',
        syntax: 'acsc(x)',
        description: {
            es: 'Arco cosecante (inversa)',
            en: 'Arc cosecant (inverse)'
        },
        category: 'trig'
    },
    {
        name: 'asec',
        english: 'asec',
        syntax: 'asec(x)',
        description: {
            es: 'Arco secante (inversa)',
            en: 'Arc secant (inverse)'
        },
        category: 'trig'
    },
    {
        name: 'acot',
        english: 'acot',
        syntax: 'acot(x)',
        description: {
            es: 'Arco cotangente (inversa)',
            en: 'Arc cotangent (inverse)'
        },
        category: 'trig'
    },

    // ==================== HIPERBÓLICAS ====================
    {
        name: 'senh',
        english: 'sinh',
        syntax: 'senh(x)',
        description: {
            es: 'Seno hiperbólico',
            en: 'Hyperbolic sine'
        },
        category: 'trig'
    },
    {
        name: 'cosh',
        english: 'cosh',
        syntax: 'cosh(x)',
        description: {
            es: 'Coseno hiperbólico',
            en: 'Hyperbolic cosine'
        },
        category: 'trig'
    },
    {
        name: 'tanh',
        english: 'tanh',
        syntax: 'tanh(x)',
        description: {
            es: 'Tangente hiperbólica',
            en: 'Hyperbolic tangent'
        },
        category: 'trig'
    },

    // ==================== ARITMÉTICA EXTENDIDA ====================
    {
        name: 'mod',
        english: 'Mod',
        syntax: 'mod(a, b)',
        description: {
            es: 'Módulo (residuo de a/b)',
            en: 'Modulo (remainder of a/b)'
        },
        category: 'misc'
    },
    {
        name: 'maximo',
        english: 'Max',
        syntax: 'maximo(a, b)',
        description: {
            es: 'El mayor de dos valores',
            en: 'Maximum of two values'
        },
        category: 'misc'
    },
    {
        name: 'minimo',
        english: 'Min',
        syntax: 'minimo(a, b)',
        description: {
            es: 'El menor de dos valores',
            en: 'Minimum of two values'
        },
        category: 'misc'
    },
    {
        name: 'redondear',
        english: 'round',
        syntax: 'redondear(x, n)',
        description: {
            es: 'Redondea x a n decimales',
            en: 'Round x to n decimals'
        },
        category: 'misc'
    },
    {
        name: 'signo',
        english: 'sign',
        syntax: 'signo(x)',
        description: {
            es: 'Signo de x (-1, 0, o 1)',
            en: 'Sign of x (-1, 0, or 1)'
        },
        category: 'misc'
    },
    {
        name: 'raizcub',
        english: 'cbrt',
        syntax: 'raizcub(x)',
        description: {
            es: 'Raíz cúbica de x',
            en: 'Cube root of x'
        },
        category: 'misc'
    },

    // ==================== ÁLGEBRA AVANZADA ====================
    {
        name: 'parciales',
        english: 'apart',
        syntax: 'parciales(expr, x)',
        description: {
            es: 'Descomposición en fracciones parciales',
            en: 'Partial fraction decomposition'
        },
        category: 'algebra'
    },
    {
        name: 'mcd',
        english: 'gcd',
        syntax: 'mcd(a, b)',
        description: {
            es: 'Máximo común divisor',
            en: 'Greatest common divisor'
        },
        category: 'algebra'
    },
    {
        name: 'mcm',
        english: 'lcm',
        syntax: 'mcm(a, b)',
        description: {
            es: 'Mínimo común múltiplo',
            en: 'Least common multiple'
        },
        category: 'algebra'
    },
    {
        name: 'esPrimo',
        english: 'isprime',
        syntax: 'esPrimo(n)',
        description: {
            es: '¿Es n un número primo?',
            en: 'Is n a prime number?'
        },
        category: 'algebra'
    },
    {
        name: 'combinar',
        english: 'binomial',
        syntax: 'combinar(n, k)',
        description: {
            es: 'Combinaciones C(n,k)',
            en: 'Binomial coefficient C(n,k)'
        },
        category: 'algebra'
    },
    {
        name: 'permutar',
        english: 'permutations',
        syntax: 'permutar(n, k)',
        description: {
            es: 'Permutaciones P(n,k) = n!/(n-k)!',
            en: 'Permutations P(n,k) = n!/(n-k)!'
        },
        category: 'algebra'
    },
    {
        name: 'factoresPrimos',
        english: 'factorint',
        syntax: 'factoresPrimos(n)',
        description: {
            es: 'Factorización en números primos',
            en: 'Prime factorization'
        },
        category: 'algebra'
    },

    // ==================== ÁLGEBRA LINEAL (MATRICES) ====================
    {
        name: 'det',
        english: 'det',
        syntax: 'det([[a,b],[c,d]])',
        description: {
            es: 'Determinante de una matriz',
            en: 'Determinant of a matrix'
        },
        category: 'algebra'
    },
    {
        name: 'inversa',
        english: 'inv',
        syntax: 'inversa([[a,b],[c,d]])',
        description: {
            es: 'Inversa de una matriz',
            en: 'Inverse of a matrix'
        },
        category: 'algebra'
    },
    {
        name: 'transpuesta',
        english: 'transpose',
        syntax: 'transpuesta([[a,b],[c,d]])',
        description: {
            es: 'Transpuesta de una matriz',
            en: 'Transpose of a matrix'
        },
        category: 'algebra'
    },
    {
        name: 'identidad',
        english: 'eye',
        syntax: 'identidad(n)',
        description: {
            es: 'Matriz identidad nxn',
            en: 'Identity matrix nxn'
        },
        category: 'algebra'
    },
    {
        name: 'ceros',
        english: 'zeros',
        syntax: 'ceros(n)',
        description: {
            es: 'Matriz de ceros nxn',
            en: 'Zeros matrix nxn'
        },
        category: 'algebra'
    },
    {
        name: 'unos',
        english: 'ones',
        syntax: 'unos(n)',
        description: {
            es: 'Matriz de unos nxn',
            en: 'Ones matrix nxn'
        },
        category: 'algebra'
    },

    // ==================== ESTADÍSTICA ====================
    {
        name: 'media',
        english: 'Mean',
        syntax: 'media([a, b, c])',
        description: {
            es: 'Media aritmética',
            en: 'Arithmetic mean'
        },
        category: 'statistics'
    },
    {
        name: 'mediana',
        english: 'Median',
        syntax: 'mediana([a, b, c])',
        description: {
            es: 'Mediana',
            en: 'Median'
        },
        category: 'statistics'
    },
    {
        name: 'varianza',
        english: 'Variance',
        syntax: 'varianza([a, b, c])',
        description: {
            es: 'Varianza de una muestra',
            en: 'Sample variance'
        },
        category: 'statistics'
    },
    {
        name: 'desviacion',
        english: 'Std',
        syntax: 'desviacion([a, b, c])',
        description: {
            es: 'Desviación estándar',
            en: 'Standard deviation'
        },
        category: 'statistics'
    },

    // ==================== INDUSTRIAL / AI ====================
    {
        name: 'fourier',
        english: 'fourier',
        syntax: 'fourier(exp(-t^2))',
        description: {
            es: 'Transformada de Fourier de f(t)',
            en: 'Fourier Transform of f(t)'
        },
        category: 'calculus'
    },
    {
        name: 'resolver',
        english: 'solve',
        syntax: 'resolver([x+y=1, x-y=2], [x, y])',
        description: {
            es: 'Resuelve ecuaciones o sistemas',
            en: 'Solves equations or systems'
        },
        category: 'algebra'
    },
    {
        name: 'Eq',
        english: 'Eq',
        syntax: 'Eq(x+y, 1)',
        description: {
            es: 'Crea una ecuación matemática',
            en: 'Creates a mathematical equation'
        },
        category: 'algebra'
    },
    {
        name: 'covarianza',
        english: 'covariance',
        syntax: 'covarianza(L1, L2)',
        description: {
            es: 'Covarianza muestral de dos listas',
            en: 'Sample covariance of two lists'
        },
        category: 'stats'
    },
    {
        name: 'correlacion',
        english: 'correlation',
        syntax: 'correlacion(L1, L2)',
        description: {
            es: 'Coeficiente de correlación de Pearson',
            en: 'Pearson correlation coefficient'
        },
        category: 'stats'
    },
    {
        name: 'regresion',
        english: 'regression',
        syntax: 'regresion(X, Y)',
        description: {
            es: 'Regresión lineal (m*x + b)',
            en: 'Linear regression (m*x + b)'
        },
        category: 'stats'
    },
    {
        name: 'normalpdf',
        english: 'normalpdf',
        syntax: 'normalpdf(x, \u03bc, \u03c3)',
        description: {
            es: 'Función de densidad Normal',
            en: 'Normal distribution PDF'
        },
        category: 'stats'
    },
    {
        name: 'binomialpmf',
        english: 'binomialpmf',
        syntax: 'binomialpmf(k, n, p)',
        description: {
            es: 'Probabilidad Binomial puntual',
            en: 'Binomial distribution PMF'
        },
        category: 'stats'
    },
    {
        name: 'laplace',
        english: 'laplace',
        syntax: 'laplace(sin(t))',
        description: {
            es: 'Transformada de Laplace: ℒ{f(t)} → F(s)',
            en: 'Laplace Transform: ℒ{f(t)} → F(s)'
        },
        category: 'calculus'
    },
    {
        name: 'ilaplace',
        english: 'ilaplace',
        syntax: 'ilaplace(1/(s^2+1))',
        description: {
            es: 'Inversa de Laplace: F(s) → f(t)',
            en: 'Inverse Laplace: F(s) → f(t)'
        },
        category: 'calculus'
    },
    {
        name: 'graficar',
        english: 'plot',
        syntax: 'graficar(sin(x))',
        description: {
            es: 'Grafica una función en 2D',
            en: 'Plots a 2D function'
        },
        category: 'misc'
    },
    {
        name: 'sonificar',
        english: 'sonify',
        syntax: 'sonificar(sin(x))',
        description: {
            es: 'Convierte una función en sonido',
            en: 'Converts a function to sound'
        },
        category: 'misc'
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
