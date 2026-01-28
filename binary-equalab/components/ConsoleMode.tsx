import React, { useState, useEffect, useRef } from 'react';
import { HistoryItem } from '../types';
import MathDisplay from './MathDisplay';
// @ts-ignore
import nerdamer from 'nerdamer';
import ScientificKeypad from './ScientificKeypad';
import { Eraser, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import apiService from '../services/apiService';
import { parseExpression, ParseResult } from '../services/mathParser';

const ConsoleMode: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Variables storage (user-defined + ANS)
  const [variables, setVariables] = useState<Record<string, string>>({
    'ans': '0'
  });

  // Substitute variables in expression
  const substituteVariables = (expr: string): string => {
    let result = expr;
    // Sort by length desc to avoid partial matches (e.g., 'ans' before 'an')
    const sortedVars = Object.entries(variables).sort((a, b) => b[0].length - a[0].length);
    for (const [name, value] of sortedVars) {
      const regex = new RegExp(`\\b${name}\\b`, 'gi');
      result = result.replace(regex, `(${value})`);
    }
    return result;
  };

  // Check if expression is an assignment (var = expr)
  const parseAssignment = (expr: string): { isAssignment: boolean; varName?: string; valueExpr?: string } => {
    const match = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (match) {
      return { isAssignment: true, varName: match[1].toLowerCase(), valueExpr: match[2] };
    }
    return { isAssignment: false };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Initialize Physics & Math Constants in the CAS engine
    try {
      nerdamer.setConstant('c', 299792458);         // Speed of Light
      nerdamer.setConstant('g', 9.80665);           // Standard Gravity
      nerdamer.setConstant('G', 6.67430e-11);       // Gravitational Constant
      nerdamer.setConstant('h', 6.62607015e-34);    // Planck Constant
      nerdamer.setConstant('k', 1.380649e-23);      // Boltzmann Constant
      nerdamer.setConstant('Na', 6.02214076e23);    // Avogadro Constant
      nerdamer.setConstant('R', 8.314462618);       // Gas Constant
      nerdamer.setConstant('me', 9.10938356e-31);   // Electron Mass
      nerdamer.setConstant('mp', 1.6726219e-27);    // Proton Mass
    } catch (e) {
      console.warn("Nerdamer constants initialization warning:", e);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  // Clear parse error when input changes
  useEffect(() => {
    if (parseError) setParseError(null);
  }, [input]);

  // Fallback: Client-side Nerdamer evaluation
  const evaluateWithNerdamer = (expr: string): string => {
    try {
      // Preprocess expression with our parser
      const parsed = parseExpression(expr);
      if (!parsed.success) {
        throw new Error(parsed.error || 'Parse error');
      }

      let processedExpr = parsed.expression;
      processedExpr = processedExpr.replace(/\binf\b/g, 'Infinity');

      // Helper: auto-detect variable in expression (x, y, t, etc.)
      const detectVariable = (exprStr: string): string => {
        const vars = exprStr.match(/\b([a-z])\b/gi);
        if (vars) {
          // Prefer x, then y, then t, then first found
          if (vars.includes('x')) return 'x';
          if (vars.includes('y')) return 'y';
          if (vars.includes('t')) return 't';
          return vars[0];
        }
        return 'x'; // default
      };

      // Fix integrate() - convert to Nerdamer syntax
      // integrate(f) → integrate(f, x)
      // integrate(f, x) → integrate(f, x) 
      // integrate(f, x, a, b) → defint(f, a, b, x)
      processedExpr = processedExpr.replace(/\bintegrate\s*\(([^)]+)\)/gi, (match, argsStr) => {
        const args = argsStr.split(',').map((s: string) => s.trim());
        if (args.length === 1) {
          // Indefinite integral with auto-detected variable
          const variable = detectVariable(args[0]);
          return `integrate(${args[0]}, ${variable})`;
        } else if (args.length === 2) {
          // Indefinite with specified variable
          return `integrate(${args[0]}, ${args[1]})`;
        } else if (args.length === 3) {
          // Definite: integrate(f, a, b) - assume x
          return `defint(${args[0]}, ${args[1]}, ${args[2]}, x)`;
        } else if (args.length === 4) {
          // Definite: integrate(f, x, a, b)
          return `defint(${args[0]}, ${args[2]}, ${args[3]}, ${args[1]})`;
        }
        return match;
      });

      // Fix diff() / derivative() - convert to Nerdamer syntax
      // diff(f) → diff(f, x)
      // diff(f, x) → diff(f, x)
      // diff(f, x, n) → diff(f, x, n)
      processedExpr = processedExpr.replace(/\b(diff|derivative)\s*\(([^)]+)\)/gi, (match, funcName, argsStr) => {
        const args = argsStr.split(',').map((s: string) => s.trim());
        if (args.length === 1) {
          // Auto-detect variable
          const variable = detectVariable(args[0]);
          return `diff(${args[0]}, ${variable})`;
        } else if (args.length === 2) {
          return `diff(${args[0]}, ${args[1]})`;
        } else if (args.length === 3) {
          // Higher order derivative
          return `diff(${args[0]}, ${args[1]}, ${args[2]})`;
        }
        return match;
      });

      // Fix d/dx notation → diff(expr, x)
      processedExpr = processedExpr.replace(/d\/d([a-z])\s*\(([^)]+)\)/gi, (match, variable, expr) => {
        return `diff(${expr}, ${variable})`;
      });

      const resultObj = nerdamer(processedExpr);
      const symbolicLatex = resultObj.toTeX();
      return symbolicLatex;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Syntax error';
      return `\\text{${errorMsg.replace(/_/g, '\\_')}}`;
    }
  };
  // Helper: Extract content inside function call (handles nested parens)
  const extractFunctionContent = (expr: string, funcName: string): string => {
    const start = funcName.length + 1; // after "funcName("
    let depth = 1;
    let i = start;
    while (i < expr.length && depth > 0) {
      if (expr[i] === '(') depth++;
      if (expr[i] === ')') depth--;
      i++;
    }
    return expr.slice(start, i - 1);
  };

  // Primary: Backend API evaluation (SymPy)
  const evaluateWithBackend = async (expr: string): Promise<string> => {
    try {
      // Preprocess expression with our parser first
      const parsed = parseExpression(expr);
      if (!parsed.success) {
        setParseError(parsed.error || 'Parse error');
        return `\\text{${parsed.error?.replace(/_/g, '\\_') || 'Error'}}`;
      }
      const processedExpr = parsed.expression;

      // Detect operation type from expression
      if (processedExpr.startsWith('simplify(')) {
        const inner = extractFunctionContent(processedExpr, 'simplify');
        const res = await apiService.simplify(inner);
        return res.latex || res.result;
      } else if (processedExpr.startsWith('expand(')) {
        const inner = extractFunctionContent(processedExpr, 'expand');
        const res = await apiService.expand(inner);
        return res.result;
      } else if (processedExpr.startsWith('factor(')) {
        const inner = extractFunctionContent(processedExpr, 'factor');
        const res = await apiService.factor(inner);
        return res.result;
      } else if (processedExpr.startsWith('diff(') || processedExpr.startsWith('derivative(')) {
        const funcName = processedExpr.startsWith('diff(') ? 'diff' : 'derivative';
        const inner = extractFunctionContent(processedExpr, funcName);
        const parts = inner.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const res = await apiService.derivative(parts[0], parts[1]);
          return res.latex || res.result;
        }
      } else if (processedExpr.startsWith('integrate(')) {
        const inner = extractFunctionContent(processedExpr, 'integrate');
        const parts = inner.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          const res = await apiService.integral(parts[0], parts[1]);
          return res.latex || res.result;
        }
      } else if (processedExpr.startsWith('solve(')) {
        const inner = extractFunctionContent(processedExpr, 'solve');
        const parts = inner.split(',').map(s => s.trim());
        const res = await apiService.solve(parts[0], parts[1] || 'x');
        return res.result;
      } else if (processedExpr.startsWith('limit(')) {
        const inner = extractFunctionContent(processedExpr, 'limit');
        const parts = inner.split(',').map(s => s.trim());
        const res = await apiService.limit(parts[0], parts[1] || 'x', parseFloat(parts[2]) || 0);
        return res.result;
      } else if (processedExpr.startsWith('taylor(')) {
        const inner = extractFunctionContent(processedExpr, 'taylor');
        const parts = inner.split(',').map(s => s.trim());
        const res = await apiService.taylor(parts[0], parts[1] || 'x', parseFloat(parts[2]) || 0, parseInt(parts[3]) || 5);
        return res.latex || res.result;
      }
      // Default: simplify
      const res = await apiService.simplify(processedExpr);
      return res.latex || res.result;
    } catch (error) {
      console.warn('Backend failed, falling back to Nerdamer:', error);
      setUseBackend(false);
      return evaluateWithNerdamer(expr);
    }
  };

  // Main evaluation function with preprocessing
  const evaluateExpression = async (expr: string): Promise<{ latex: string; rawValue: string }> => {
    setParseError(null);  // Clear previous errors

    // Substitute user variables (including ans)
    const substitutedExpr = substituteVariables(expr);

    let latex: string;
    let rawValue: string;

    if (useBackend && apiService.isAvailable) {
      latex = await evaluateWithBackend(substitutedExpr);
    } else {
      latex = evaluateWithNerdamer(substitutedExpr);
    }

    // Try to get a clean numeric/symbolic value for ANS
    // Remove LaTeX formatting for storage
    rawValue = latex
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')  // \frac{a}{b} → (a)/(b)
      .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')              // \sqrt{x} → sqrt(x)
      .replace(/\\left|\\right/g, '')                         // Remove \left \right
      .replace(/\\[a-zA-Z]+/g, '')                             // Remove other LaTeX commands
      .replace(/[{}]/g, '')                                     // Remove braces
      .trim();

    // If it looks like a simple number, use that
    const numMatch = latex.match(/^-?\d+\.?\d*$/);
    if (numMatch) rawValue = numMatch[0];

    return { latex, rawValue: rawValue || '0' };
  };

  const handleKeyClick = async (val: string) => {
    if (val === 'AC') {
      setInput('');
    } else if (val === 'DEL') {
      setInput(input.slice(0, -1));
    } else if (val === '=') {
      if (!input.trim() || isLoading) return;
      setIsLoading(true);
      try {
        const assignment = parseAssignment(input);
        let displayExpr = input;
        let resultLatex: string;
        let rawValue: string;

        if (assignment.isAssignment && assignment.varName && assignment.valueExpr) {
          // Evaluate the value expression
          const evalResult = await evaluateExpression(assignment.valueExpr);
          resultLatex = evalResult.latex;
          rawValue = evalResult.rawValue;
          displayExpr = `${assignment.varName} = ${assignment.valueExpr}`;

          // Store the variable
          setVariables(prev => ({
            ...prev,
            [assignment.varName!]: rawValue,
            'ans': rawValue
          }));
        } else {
          // Normal calculation
          const evalResult = await evaluateExpression(input);
          resultLatex = evalResult.latex;
          rawValue = evalResult.rawValue;

          // Update ANS
          setVariables(prev => ({ ...prev, 'ans': rawValue }));
        }

        const newItem: HistoryItem = {
          id: Date.now().toString(),
          expression: displayExpr,
          result: resultLatex,
          timestamp: new Date()
        };
        setHistory([...history, newItem]);
        setInput('');
      } finally {
        setIsLoading(false);
      }
    } else {
      let append = val;
      if (['sin', 'cos', 'tan', 'ln', 'log', 'sqrt'].includes(val)) {
        append = val + '(';
      }
      setInput(input + append);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full bg-background overflow-hidden">

      {/* Left: Console Output & Input Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">

        {/* History Log */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4">
          <div className="flex justify-between items-end mb-4 border-b border-aurora-border pb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-aurora-muted text-sm font-bold uppercase tracking-widest">Calculation History</h2>
              {useBackend ? (
                <Cloud size={14} className="text-green-500" title="Connected to SymPy backend" />
              ) : (
                <CloudOff size={14} className="text-aurora-muted" title="Using client-side Nerdamer" />
              )}
            </div>
            <button onClick={() => setHistory([])} className="text-aurora-secondary hover:text-aurora-danger transition-colors p-1" title="Clear History">
              <Eraser size={16} />
            </button>
          </div>

          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-aurora-secondary opacity-50">
              <span className="text-4xl mb-2">∫</span>
              <p>Start calculating...</p>
            </div>
          )}

          {history.map((item) => (
            <div key={item.id} className="group flex flex-col gap-2 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              <div className="text-right text-aurora-secondary text-lg font-mono tracking-wide">
                <MathDisplay expression={item.expression} />
              </div>
              <div className="text-right">
                <span className="text-primary text-2xl font-bold font-mono">
                  = <MathDisplay expression={item.result} isResult inline />
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Big Input Field */}
        <div className="bg-background-dark p-6 border-t border-aurora-border shrink-0">
          <div className="relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold font-serif italic ${parseError ? 'text-red-500' : 'text-primary'}`}>ƒ</div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleKeyClick('=');
              }}
              className={`w-full bg-background-light border rounded-2xl py-4 pl-12 pr-4 text-xl lg:text-2xl font-mono text-white placeholder:text-aurora-muted focus:ring-2 focus:border-transparent transition-all shadow-inner ${parseError
                ? 'border-red-500 focus:ring-red-500/50'
                : 'border-aurora-border focus:ring-primary'
                }`}
              placeholder="Enter expression..."
              autoFocus
            />
            {input && !parseError && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <MathDisplay expression={input} className="text-aurora-secondary/50 text-sm" />
              </div>
            )}
          </div>

          {/* Parse Error Display */}
          {parseError && (
            <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/30">
              <AlertCircle size={16} className="shrink-0" />
              <span>{parseError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Scientific Keypad Panel */}
      <div className="w-full md:w-[320px] lg:w-[380px] shrink-0 h-[40vh] md:h-full border-t md:border-t-0 md:border-l border-aurora-border z-10 shadow-xl">
        <ScientificKeypad onKeyClick={handleKeyClick} />
      </div>

    </div>
  );
};

export default ConsoleMode;