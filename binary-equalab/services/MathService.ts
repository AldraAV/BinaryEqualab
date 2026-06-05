
// Import eliminado: nerdamer
/**
 * Binary EquaLab - Math Service (Web)
 * Handles Sound Generation and Advanced Math Utilities
 */

// ================= SONIFY =================
let audioContext: AudioContext | null = null;

export class MathService {

    /**
     * Generate audio from a math expression f(t)
     * @param expression Function of t (result implies frequency/amplitude) 
     *                   Examples: 'sin(440*2*pi*t)', 't*100', 'sin(t)*440'
     * @param durationSeconds Duration in seconds
     */
    static async sonify(expression: string, durationSeconds: number = 3.0): Promise<void> {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * durationSeconds;
        const buffer = audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        try {
            // Normalize for JS math
            let expressionJS = expression.replace(/\^/g, '**');

            // Force variables to 't' for nerdamer compatibility if x or other is used
            expressionJS = expressionJS.replace(/\b(x|y|z)\b/gi, 't');

            // Reemplazar funciones trigonométricas comunes
            expressionJS = expressionJS.replace(/\b(sin|cos|tan|exp|log|sqrt|abs)\b/g, 'Math.$1');
            expressionJS = expressionJS.replace(/\b(pi)\b/gi, 'Math.PI');
            expressionJS = expressionJS.replace(/\b(e)\b/gi, 'Math.E');

            // Build function directly using native Function constructor
            const func = new Function('t', `return ${expressionJS};`);

            for (let i = 0; i < length; i++) {
                const t = i / sampleRate;
                const val = func(t);

                // Safety clip and handle potential non-finite values
                data[i] = Math.max(-1, Math.min(1, isFinite(val) ? val : 0));
            }

            // Play
            const source = audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContext.destination);
            source.start();

        } catch (e) {
            console.error("Sonify Error:", e);
            throw new Error("Could not generate audio. Check syntax.");
        }
    }

    // ================= NUMERAL SYSTEMS =================

    static toBinary(n: number | string): string {
        const num = Math.floor(Number(n));
        return `0b${num.toString(2)}`;
    }

    static toOctal(n: number | string): string {
        const num = Math.floor(Number(n));
        return `0o${num.toString(8)}`;
    }

    static toHex(n: number | string): string {
        const num = Math.floor(Number(n));
        return `0x${num.toString(16).toUpperCase()}`;
    }

    static fromBase(n: string, base: number): number {
        return parseInt(n, base);
    }
}
