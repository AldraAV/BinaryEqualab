/**
 * Binary EquaLab - Math Expression Parser
 * 
 * Robust expression preprocessing and error handling like Photomath.
 * Handles common user input patterns and provides helpful error messages.
 */

export interface ParseResult {
    success: boolean;
    expression: string;      // Preprocessed expression ready for evaluation
    displayExpression: string; // Cleaned up for display
    error?: string;          // User-friendly error message
    suggestions?: string[];  // Fix suggestions
}

/**
 * Smart Math Parser with preprocessing and error detection
 */
export class MathParser {
    // Common function names
    private static readonly FUNCTIONS = [
        'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
        'asin', 'acos', 'atan', 'acot', 'asec', 'acsc',
        'sinh', 'cosh', 'tanh', 'coth',
        'arcsin', 'arccos', 'arctan',
        'sqrt', 'cbrt', 'abs', 'floor', 'ceil', 'round',
        'log', 'ln', 'exp', 'log10', 'log2',
        'factorial', 'gamma', 'sign', 'mod'
    ];

    // Greek letters and constants
    private static readonly CONSTANTS: Record<string, string> = {
        'pi': 'pi',
        'π': 'pi',
        'e': 'e',
        'i': 'i',
        'inf': 'Infinity',
        '∞': 'Infinity',
        'phi': '((1+sqrt(5))/2)',
        'φ': '((1+sqrt(5))/2)',
    };

    /**
     * Main parse function - preprocesses and validates expression
     */
    static parse(input: string): ParseResult {
        if (!input || !input.trim()) {
            return {
                success: false,
                expression: '',
                displayExpression: '',
                error: 'Empty expression',
            };
        }

        let expr = input.trim();
        const original = expr;

        try {
            // Step 1: Basic cleanup
            expr = this.normalizeWhitespace(expr);

            // Step 2: Replace Unicode symbols
            expr = this.replaceUnicodeSymbols(expr);

            // Step 3: Fix common coefficient patterns (2x → 2*x, i3 → 3*i)
            expr = this.fixImplicitMultiplication(expr);

            // Step 4: Fix imaginary number patterns
            expr = this.fixImaginaryNumbers(expr);

            // Step 5: Fix function calls (sinx → sin(x))
            expr = this.fixFunctionCalls(expr);

            // Step 6: Balance parentheses
            const balanced = this.balanceParentheses(expr);
            if (!balanced.success) {
                return {
                    success: false,
                    expression: expr,
                    displayExpression: original,
                    error: balanced.error,
                    suggestions: balanced.suggestions,
                };
            }
            expr = balanced.expression;

            // Step 7: Validate operators
            const validated = this.validateOperators(expr);
            if (!validated.success) {
                return {
                    success: false,
                    expression: expr,
                    displayExpression: original,
                    error: validated.error,
                    suggestions: validated.suggestions,
                };
            }

            return {
                success: true,
                expression: expr,
                displayExpression: this.formatForDisplay(expr),
            };

        } catch (e) {
            return {
                success: false,
                expression: input,
                displayExpression: input,
                error: `Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Normalize whitespace and trim
     */
    private static normalizeWhitespace(expr: string): string {
        return expr.replace(/\s+/g, ' ').trim();
    }

    /**
     * Replace Unicode math symbols with ASCII equivalents
     */
    private static replaceUnicodeSymbols(expr: string): string {
        const replacements: Record<string, string> = {
            '×': '*',
            '÷': '/',
            '−': '-',
            '·': '*',
            '²': '^2',
            '³': '^3',
            '⁴': '^4',
            '√': 'sqrt',
            '∫': 'integrate',
            '∑': 'sum',
            '∏': 'product',
            '≤': '<=',
            '≥': '>=',
            '≠': '!=',
            '±': '+-',
            'α': 'alpha',
            'β': 'beta',
            'θ': 'theta',
            'λ': 'lambda',
            'μ': 'mu',
            'σ': 'sigma',
            'ω': 'omega',
        };

        for (const [unicode, ascii] of Object.entries(replacements)) {
            expr = expr.split(unicode).join(ascii);
        }

        // Replace constants
        for (const [symbol, value] of Object.entries(this.CONSTANTS)) {
            const regex = new RegExp(`\\b${symbol}\\b`, 'gi');
            expr = expr.replace(regex, value);
        }

        return expr;
    }

    /**
     * Fix implicit multiplication patterns
     * Examples: 2x → 2*x, xy → x*y, 3(x+1) → 3*(x+1), (2)(3) → (2)*(3)
     */
    private static fixImplicitMultiplication(expr: string): string {
        // Number followed by letter (except e for scientific notation): 2x → 2*x
        expr = expr.replace(/(\d)([a-df-zA-Z])/g, '$1*$2');

        // Letter followed by number (but not function names): x2 → x*2
        // Avoid breaking sin2 as it should stay (will be fixed in function calls)
        expr = expr.replace(/([a-zA-Z])(\d)/g, (match, letter, num) => {
            // Check if it's part of a known function name
            const before = expr.substring(0, expr.indexOf(match));
            for (const func of this.FUNCTIONS) {
                if (before.endsWith(func.slice(0, -1)) && letter === func.slice(-1)) {
                    return match; // Don't split function names
                }
            }
            return `${letter}*${num}`;
        });

        // Number followed by opening paren: 3(x) → 3*(x)
        expr = expr.replace(/(\d)\(/g, '$1*(');

        // Closing paren followed by opening paren: )(  → )*(
        expr = expr.replace(/\)\(/g, ')*(');

        // Closing paren followed by letter: )x → )*x
        expr = expr.replace(/\)([a-zA-Z])/g, ')*$1');

        // Letter followed by opening paren (if not a function): x(y) → x*(y)
        expr = expr.replace(/([a-zA-Z])\(/g, (match, letter) => {
            const pos = expr.indexOf(match);
            // Check if it's a known function
            for (const func of this.FUNCTIONS) {
                if (expr.substring(pos - func.length + 1, pos + 1) === func) {
                    return match; // Keep function call
                }
            }
            return `${letter}*(`;
        });

        return expr;
    }

    /**
     * Fix imaginary number notations
     * Examples: i3 → 3*i, 3i → 3*i, i*3 → 3*i
     */
    private static fixImaginaryNumbers(expr: string): string {
        // i followed by number: i3 → 3*i
        expr = expr.replace(/\bi(\d+)/g, '$1*i');

        // Number followed by i: 3i → 3*i (only if not already multiplied)
        expr = expr.replace(/(\d)i\b/g, '$1*i');

        // Handle i*number patterns: i*3 → 3*i for consistency
        expr = expr.replace(/\bi\*(\d+)/g, '$1*i');

        return expr;
    }

    /**
     * Fix function call patterns
     * Examples: sinx → sin(x), sin2x → sin(2*x), lnx → ln(x)
     */
    private static fixFunctionCalls(expr: string): string {
        for (const func of this.FUNCTIONS) {
            // Function followed by variable without parens: sinx → sin(x)
            const pattern = new RegExp(`\\b${func}([a-zA-Z])(?!\\()`, 'g');
            expr = expr.replace(pattern, `${func}($1)`);

            // Function followed by number and variable: sin2x → sin(2*x)
            const patternNumVar = new RegExp(`\\b${func}(\\d+)([a-zA-Z])`, 'g');
            expr = expr.replace(patternNumVar, `${func}($1*$2)`);
        }

        return expr;
    }

    /**
     * Balance and validate parentheses
     */
    private static balanceParentheses(expr: string): ParseResult {
        let open = 0;
        let close = 0;

        for (const char of expr) {
            if (char === '(') open++;
            if (char === ')') close++;
            if (close > open) {
                return {
                    success: false,
                    expression: expr,
                    displayExpression: expr,
                    error: 'Unmatched closing parenthesis',
                    suggestions: ['Remove extra ) or add opening ('],
                };
            }
        }

        if (open > close) {
            // Auto-close missing parentheses
            const missing = open - close;
            expr = expr + ')'.repeat(missing);
            return {
                success: true,
                expression: expr,
                displayExpression: expr,
            };
        }

        return {
            success: true,
            expression: expr,
            displayExpression: expr,
        };
    }

    /**
     * Validate operator usage
     */
    private static validateOperators(expr: string): ParseResult {
        // Check for consecutive operators (except unary minus)
        const badPatterns = [
            { pattern: /[+*/]{2,}/, error: 'Consecutive operators', suggestion: 'Remove duplicate operators' },
            { pattern: /^[*/]/, error: 'Expression starts with operator', suggestion: 'Add a number or variable before the operator' },
            { pattern: /[+\-*/]$/, error: 'Expression ends with operator', suggestion: 'Complete the expression' },
            { pattern: /\(\)/, error: 'Empty parentheses', suggestion: 'Add content inside ()' },
            { pattern: /[+*/]\)/, error: 'Operator before closing paren', suggestion: 'Complete the expression or remove operator' },
            { pattern: /\([+*/]/, error: 'Operator after opening paren (except minus)', suggestion: 'Add operand after (' },
        ];

        for (const check of badPatterns) {
            if (check.pattern.test(expr)) {
                // Special case: allow (- for negative
                if (check.pattern.toString().includes('[+*/]') && /\(-/.test(expr)) {
                    continue;
                }
                return {
                    success: false,
                    expression: expr,
                    displayExpression: expr,
                    error: check.error,
                    suggestions: [check.suggestion],
                };
            }
        }

        return {
            success: true,
            expression: expr,
            displayExpression: expr,
        };
    }

    /**
     * Format expression for nice display
     */
    private static formatForDisplay(expr: string): string {
        // Convert back to nicer notation for display
        return expr
            .replace(/\*\*/g, '^')
            .replace(/\*/g, '·')
            .replace(/sqrt/g, '√')
            .replace(/pi\b/g, 'π');
    }

    /**
     * Quick fix suggestions for common errors
     */
    static getSuggestions(input: string, error: string): string[] {
        const suggestions: string[] = [];

        if (error.includes('parenthes')) {
            const open = (input.match(/\(/g) || []).length;
            const close = (input.match(/\)/g) || []).length;
            if (open > close) {
                suggestions.push(`Add ${open - close} closing parenthesis`);
            } else if (close > open) {
                suggestions.push(`Remove ${close - open} closing parenthesis`);
            }
        }

        if (input.includes('i') && /i\d+/.test(input)) {
            suggestions.push('For imaginary: use 3i instead of i3');
        }

        return suggestions;
    }
}

// Convenience function for quick parsing
export function parseExpression(input: string): ParseResult {
    return MathParser.parse(input);
}

export default MathParser;
