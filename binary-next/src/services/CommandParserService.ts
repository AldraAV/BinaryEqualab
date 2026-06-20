import { MathParser, parseExpression } from './mathParser';
import { checkEasterEgg, EasterEggResult } from './easterEggs';
import { translateToEnglish } from './functionDefs';

export interface CommandAST {
    type: 'math' | 'sonify' | 'plot' | 'plotsonify' | 'advanced_cas' | 'ai_explain' | 'base_conversion' | 'assignment' | 'equality';
    action: string;
    args: string[];
    rawExpression: string;
    processedExpression: string;
    baseOrigin?: number;
    baseDest?: number;
}

export class CommandParserService {
    public static async parse(input: string): Promise<{ ast: CommandAST | null, error: string | null }> {
        const trimmed = input.trim();
        if (!trimmed) return { ast: null, error: 'Empty expression' };

        // 1. Audio Generation
        const sonifyMatch = trimmed.match(/^(sonify|sonificar)\s*\((.+)\)$/i);
        if (sonifyMatch) {
            let inner = translateToEnglish(sonifyMatch[2]).replace(/\bx\b/g, 't');
            return {
                ast: { type: 'sonify', action: 'sonify', args: [inner], rawExpression: trimmed, processedExpression: inner },
                error: null
            };
        }

        // 2. Graph Generation
        const plotMatch = trimmed.match(/^(plot|graficar)\s*\((.+)\)$/i);
        if (plotMatch) {
            return {
                ast: { type: 'plot', action: 'plot', args: [plotMatch[2]], rawExpression: trimmed, processedExpression: plotMatch[2] },
                error: null
            };
        }

        // 3. Graph + Sonify
        const plotsonifyMatch = trimmed.match(/^(plotsonify|graficar_y_sonar|sonificar)\s*\((.+)\)$/i);
        if (plotsonifyMatch) {
            return {
                ast: { type: 'plotsonify', action: 'plotsonify', args: [plotsonifyMatch[2]], rawExpression: trimmed, processedExpression: plotsonifyMatch[2] },
                error: null
            };
        }

        // 4. Advanced CAS
        const advancedMatch = trimmed.match(/^(laplace|fourier|ilaplace|ifourier|inverse_laplace|inverse_fourier|taylor)\s*\((.+)\)$/i);
        if (advancedMatch) {
            const funcName = advancedMatch[1].toLowerCase();
            const inner = translateToEnglish(advancedMatch[2]);
            return {
                ast: { type: 'advanced_cas', action: funcName, args: [inner], rawExpression: trimmed, processedExpression: inner },
                error: null
            };
        }

        // 5. AI Explanation
        const explainMatch = trimmed.match(/^(explain|explicar)\s*\((.+)\)$/i);
        const aiPrefixMatch = trimmed.match(/^ai\s+(.+)$/i);
        if (explainMatch || aiPrefixMatch) {
            let inner = aiPrefixMatch ? aiPrefixMatch[1] : explainMatch![2];
            inner = inner.replace(/^["'](.+)["']$/, '$1');
            return {
                ast: { type: 'ai_explain', action: 'explain', args: [inner], rawExpression: trimmed, processedExpression: inner },
                error: null
            };
        }

        // 6. Base Conversion
        const baseConvMatch = trimmed.match(/^(bin|hex|oct|dec)\s*\((.+)\)$/i);
        if (baseConvMatch) {
            return {
                ast: { type: 'base_conversion', action: baseConvMatch[1].toLowerCase(), args: [baseConvMatch[2]], rawExpression: trimmed, processedExpression: baseConvMatch[2] },
                error: null
            };
        }

        // 7. Math Parsing
        const parsed = parseExpression(trimmed);
        if (!parsed.success) {
            return { ast: null, error: parsed.error || 'Parse error' };
        }

        // Equality check
        if (parsed.expression.includes('==')) {
            const parts = parsed.expression.split('==');
            return {
                ast: { type: 'equality', action: 'equals', args: [parts[0].trim(), parts[1].trim()], rawExpression: trimmed, processedExpression: parsed.expression },
                error: null
            };
        }

        return {
            ast: { type: 'math', action: 'evaluate', args: [parsed.expression], rawExpression: trimmed, processedExpression: parsed.expression },
            error: null
        };
    }
}
