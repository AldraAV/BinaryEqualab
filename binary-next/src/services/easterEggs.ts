/**
 * Binary EquaLab - Easter Eggs 🥚
 * 
 * Hidden surprises for special expressions that embody the philosophy:
 * "El álgebra también siente" - "The algebra also feels"
 * 
 * Triggers:
 * - 1+1 → Unity message
 * - (-1)*(-1) → "Two negatives make a positive" / Redemption
 * - Binary expressions (0b1010) → Binary philosophy
 * - Special equations → Hidden messages
 */

export interface EasterEggResult {
    triggered: boolean;
    message?: string;
    emoji?: string;
    animation?: 'sparkle' | 'glow' | 'shake' | 'rainbow';
    sound?: 'chime' | 'secret' | 'magic';
    theme?: string; // Special UI theme to apply temporarily
}

// The wisdom messages
const EASTER_EGG_MESSAGES = {
    unity: [
        "∞ Uno + Uno = Todo. La unión de lo igual crea más que la suma.",
        "🌟 1+1 = 2, pero también = ∞ cuando hay amor.",
        "✨ En binario, 1+1 = 10. Un nuevo orden emerge.",
        "🔮 La simplicidad esconde profundidad infinita.",
    ],
    redemption: [
        "⚡ Dos negativos crean luz. La sombra × sombra = día.",
        "🌙 (-1) × (-1) = 1. De la oscuridad nace la unidad.",
        "🔥 Lo que parece negativo, multiplicado, revela su verdad positiva.",
        "💫 Las fuerzas opuestas en armonía generan equilibrio.",
    ],
    binary: [
        "🔢 En Binary EquaLab, todo es 1 y 0. Encendido y apagado. Ser y no ser.",
        "💾 El universo computa en binario. Tú también eres información.",
        "🖥️ 01000001 01001100 01000100 01010010 01000001 = ALDRA",
        "⚡ Cada bit es una decisión. Cada byte, un destino.",
    ],
    golden: [
        "φ = 1.618... La proporción áurea conecta todo.",
        "🌻 φ aparece en galaxias, conchas, flores, rostros. Eres matemáticas.",
        "✨ La belleza tiene una fórmula: (1 + √5) / 2",
    ],
    euler: [
        "e^(iπ) + 1 = 0. La identidad más bella de las matemáticas.",
        "🌌 Euler unió e, i, π, 1 y 0 en una sola ecuación. Perfección.",
        "∞ Cinco constantes fundamentales, una verdad universal.",
    ],
    zero: [
        "0 = Todo y Nada. El vacío que contiene posibilidades infinitas.",
        "🕳️ Del cero nació el universo. Del vacío, la creación.",
        "⭕ Zero es el origen y el destino.",
    ],
    infinity: [
        "∞ El infinito no es un número, es un concepto. Como el amor.",
        "∞ Lemniscata: el símbolo del eterno retorno.",
        "∞ Algunos infinitos son más grandes que otros. — Cantor",
    ]
};

// Get random message from category
function getRandomMessage(category: keyof typeof EASTER_EGG_MESSAGES): string {
    const messages = EASTER_EGG_MESSAGES[category];
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Check if an expression triggers an easter egg
 */
export function checkEasterEgg(expression: string, result?: string): EasterEggResult {
    const expr = expression.trim().toLowerCase().replace(/\s+/g, '');
    const res = result?.trim().toLowerCase();

    // ===== 1+1 - Unity =====
    if (expr === '1+1' || expr === '1.0+1.0') {
        return {
            triggered: true,
            message: getRandomMessage('unity'),
            emoji: '✨',
            animation: 'sparkle',
        };
    }

    // ===== (-1)*(-1) or (-1)×(-1) - Redemption =====
    if (expr.includes('(-1)*(-1)') || expr.includes('(-1)×(-1)') ||
        expr === '-1*-1' || expr === '-1*(-1)' || expr === '(-1)*-1') {
        return {
            triggered: true,
            message: getRandomMessage('redemption'),
            emoji: '⚡',
            animation: 'glow',
        };
    }

    // ===== Binary literals (0b...) =====
    if (/^0b[01]+$/.test(expr)) {
        const decimal = parseInt(expr, 2);
        return {
            triggered: true,
            message: `${getRandomMessage('binary')}\n\n📊 ${expr} = ${decimal} en decimal`,
            emoji: '🔢',
            animation: 'rainbow',
        };
    }

    // ===== Euler's Identity =====
    if (expr.includes('e^(i*pi)') || expr.includes('e^(iπ)') ||
        expr.includes('exp(i*pi)') || (res && (res === '-1' || res === '-1+0*i'))) {
        if (expr.includes('e^') && expr.includes('i') && (expr.includes('pi') || expr.includes('π'))) {
            return {
                triggered: true,
                message: getRandomMessage('euler'),
                emoji: '🌌',
                animation: 'glow',
            };
        }
    }

    // ===== Golden Ratio =====
    if (expr.includes('phi') || expr.includes('φ') ||
        expr === '(1+sqrt(5))/2' || expr === '(1+raiz(5))/2') {
        return {
            triggered: true,
            message: getRandomMessage('golden'),
            emoji: '🌻',
            animation: 'sparkle',
        };
    }

    // ===== Zero =====
    if (res === '0' && (expr.includes('+') || expr.includes('-') || expr.includes('*'))) {
        // Only trigger sometimes for zero results from operations
        if (Math.random() < 0.2) {
            return {
                triggered: true,
                message: getRandomMessage('zero'),
                emoji: '⭕',
                animation: 'glow',
            };
        }
    }

    // ===== Infinity =====
    if (res === 'infinity' || res === '∞' || expr.includes('1/0')) {
        return {
            triggered: true,
            message: getRandomMessage('infinity'),
            emoji: '∞',
            animation: 'rainbow',
        };
    }

    // ===== Secret: 42 (Answer to Everything) =====
    if (res === '42') {
        return {
            triggered: true,
            message: "🌌 42: La Respuesta a la Vida, el Universo y Todo lo Demás.\n— Douglas Adams, The Hitchhiker's Guide to the Galaxy",
            emoji: '🌌',
            animation: 'rainbow',
        };
    }

    // ===== Secret: 69 or 420 (Just for fun) =====
    if (res === '69' || res === '420') {
        return {
            triggered: true,
            message: "😏 Nice.",
            emoji: '😏',
            animation: 'shake',
        };
    }

    // ===== Binary number sequence 1010 =====
    if (expr === '1010' || expr === '0b1010') {
        return {
            triggered: true,
            message: "🔟 1010 en binario = 10 en decimal. La base del sistema.\nEl 10 es perfección: 1 + 2 + 3 + 4 = 10 (Tetractys pitagórica).",
            emoji: '🔟',
            animation: 'sparkle',
        };
    }

    return { triggered: false };
}

/**
 * Parse binary number literals (0b1010 → 10)
 */
export function parseBinaryLiteral(expression: string): string {
    return expression.replace(/\b0b([01]+)\b/gi, (match, binary) => {
        return parseInt(binary, 2).toString();
    });
}

/**
 * Parse hexadecimal literals (0xFF → 255)
 */
export function parseHexLiteral(expression: string): string {
    return expression.replace(/\b0x([0-9a-fA-F]+)\b/gi, (match, hex) => {
        return parseInt(hex, 16).toString();
    });
}

/**
 * Parse octal literals (0o17 → 15)
 */
export function parseOctalLiteral(expression: string): string {
    return expression.replace(/\b0o([0-7]+)\b/gi, (match, octal) => {
        return parseInt(octal, 8).toString();
    });
}

/**
 * Parse all number system literals
 */
export function parseNumberSystems(expression: string): string {
    let result = expression;
    result = parseBinaryLiteral(result);
    result = parseHexLiteral(result);
    result = parseOctalLiteral(result);
    return result;
}

/**
 * Convert decimal to different bases
 */
export function toBase(num: number, base: number): string {
    if (base < 2 || base > 36) throw new Error('Base must be 2-36');
    return num.toString(base).toUpperCase();
}

export function toBinary(num: number): string { return `0b${num.toString(2)}`; }
export function toHex(num: number): string { return `0x${num.toString(16).toUpperCase()}`; }
export function toOctal(num: number): string { return `0o${num.toString(8)}`; }
