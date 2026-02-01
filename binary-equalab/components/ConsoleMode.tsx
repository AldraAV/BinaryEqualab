import React, { useState, useEffect, useRef } from 'react';
import { HistoryItem } from '../types';
import MathDisplay from './MathDisplay';
// @ts-ignore
import nerdamer from 'nerdamer';
import ScientificKeypad from './ScientificKeypad';
import { Eraser, Cloud, CloudOff, AlertCircle, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import apiService from '../services/apiService';
import { checkEasterEgg, parseNumberSystems, EasterEggResult } from '../services/easterEggs';
import { useCalculator } from '../CalculatorContext';
import { MathService } from '../services/MathService';
import { parseExpression, ParseResult } from '../services/mathParser';
import { getAutocompleteSuggestions, FunctionDef } from '../services/functionDefs';
import { FINANCE_FUNCTIONS, FINANCE_FUNCTION_DEFS, FinanceResult } from '../services/financeFunctions';
const ConsoleMode: React.FC = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use Global Calculator Context
  const { variables, setVariable, ans, setAns, isExact, toggleExact } = useCalculator();

  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<FunctionDef[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

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

  // Check if expression is a finance function call
  const evaluateFinanceFunction = (expr: string): FinanceResult | null => {
    const trimmed = expr.trim().toLowerCase();

    // Match function pattern: funcName(args)
    const match = trimmed.match(/^(\w+)\s*\(([^)]*)\)$/);
    if (!match) return null;

    const [, funcName, argsStr] = match;

    if (!(funcName in FINANCE_FUNCTIONS)) return null;

    // Parse arguments (can be negative numbers, decimals)
    const args = argsStr
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => parseFloat(s));

    if (args.some(isNaN)) return null;

    try {
      const func = FINANCE_FUNCTIONS[funcName];
      return func(...args);
    } catch (e) {
      return null;
    }
  };

  // Fallback: Client-side Nerdamer evaluation
  const evaluateWithNerdamer = (expr: string): string => {
    // First, check if it's a finance function
    const financeResult = evaluateFinanceFunction(expr);
    if (financeResult) {
      return financeResult.latex;
    }

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

      // Fix factorial(n) → (n)! for Nerdamer
      // Handles nested parentheses: factorial(2+3) → (2+3)!
      processedExpr = processedExpr.replace(/\bfactorial\s*\(([^()]+|\([^()]*\))+\)/gi, (match) => {
        // Extract content inside factorial(...)
        const start = match.indexOf('(') + 1;
        let depth = 1;
        let i = start;
        while (i < match.length && depth > 0) {
          if (match[i] === '(') depth++;
          if (match[i] === ')') depth--;
          i++;
        }
        const inner = match.slice(start, i - 1);
        return `(${inner})!`;
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
        if (parts.length >= 4) {
          // Definite Integral: integrate(f, x, a, b)
          const res = await apiService.integral(parts[0], parts[1], parseFloat(parts[2]), parseFloat(parts[3]));
          return res.latex || res.result;
        } else if (parts.length >= 2) {
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
      } else if (processedExpr.startsWith('laplace(')) {
        const inner = extractFunctionContent(processedExpr, 'laplace');
        const res = await apiService.laplace(inner);
        return res.result;
      } else if (processedExpr.startsWith('fourier(')) {
        const inner = extractFunctionContent(processedExpr, 'fourier');
        const res = await apiService.fourier(inner);
        return res.result;
      } else if (processedExpr.startsWith('explain(') || processedExpr.startsWith('explicar(')) {
        // AI Explain Mode
        const funcName = processedExpr.startsWith('explain') ? 'explain' : 'explicar';
        const inner = extractFunctionContent(processedExpr, funcName);
        try {
          // Use the existing apiService if we add explain method, or fetch directly
          // Assuming apiService doesn't have explain yet, we'll fetch direct for now
          const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}/api/ai/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: inner })
          });
          const data = await response.json();
          // Format explanation as text
          return {
            latex: `\\text{AI Analysis}`,
            rawValue: data.explanation || 'No explanation',
            approxResult: 'AI',
            easterEgg: { triggered: true, message: data.explanation, emoji: '🤖', animation: 'glow' }
          } as any;
        } catch (e) {
          return `\\text{AI Service Unavailable}`;
        }
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
  const evaluateExpression = async (expr: string): Promise<{ latex: string; rawValue: string; approxResult: string; easterEgg?: EasterEggResult }> => {
    setParseError(null);  // Clear previous errors

    // Check for "sonify" command
    if (expr.startsWith('sonify(') || expr.startsWith('sonificar(')) {
      const inner = extractFunctionContent(expr, expr.startsWith('sonify') ? 'sonify' : 'sonificar');
      try {
        await MathService.sonify(inner);
        return { latex: '\\text{🎵 Audio Playing...}', rawValue: 'Audio', approxResult: 'Audio' };
      } catch (e) {
        return { latex: '\\text{❌ Audio Error}', rawValue: 'Error', approxResult: 'Error' };
      }
    }

    // Parse binary/hex/octal literals (0b1010 → 10, 0xFF → 255)
    let processedExpr = parseNumberSystems(expr);

    // Substitute user variables (including ans)
    const substitutedExpr = substituteVariables(processedExpr);

    let latex: string;
    let rawValue: string;
    let approxResult: string = '';

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

    // Try to compute numeric approximation
    try {
      const parsed = parseExpression(substitutedExpr);
      if (parsed.success) {
        const numericResult = nerdamer(parsed.expression).evaluate();
        approxResult = parseFloat(numericResult.text()).toPrecision(10);
        // Clean up trailing zeros
        approxResult = parseFloat(approxResult).toString();
      }
    } catch (e) {
      // If evaluation fails, try to extract number from rawValue
      const num = parseFloat(rawValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) approxResult = num.toString();
    }

    // Check for easter eggs
    const easterEgg = checkEasterEgg(expr, approxResult || rawValue);

    return { latex, rawValue: rawValue || '0', approxResult: approxResult || rawValue || '0', easterEgg: easterEgg.triggered ? easterEgg : undefined };
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
        let approxResult: string;
        let easterEggResult: EasterEggResult | undefined;

        if (assignment.isAssignment && assignment.varName && assignment.valueExpr) {
          // Evaluate the value expression
          const evalResult = await evaluateExpression(assignment.valueExpr);
          resultLatex = evalResult.latex;
          rawValue = evalResult.rawValue;
          approxResult = evalResult.approxResult;
          easterEggResult = evalResult.easterEgg;
          displayExpr = `${assignment.varName} = ${assignment.valueExpr}`;

          // Store the variable
          setVariable(assignment.varName!, rawValue);
          setAns(rawValue);
        } else {
          // Normal calculation
          const evalResult = await evaluateExpression(input);
          resultLatex = evalResult.latex;
          rawValue = evalResult.rawValue;
          approxResult = evalResult.approxResult;
          easterEggResult = evalResult.easterEgg;

          // Update ANS
          setAns(rawValue);
        }

        const newItem: HistoryItem = {
          id: Date.now().toString(),
          expression: displayExpr,
          result: resultLatex,
          approxResult: approxResult,
          timestamp: new Date(),
          easterEgg: easterEggResult
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
            <div className="flex items-center gap-2">
              {/* EXACT/APPROX Toggle */}
              <button
                onClick={toggleExact}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${isExact
                  ? 'bg-aurora-secondary/20 text-aurora-secondary'
                  : 'bg-primary/20 text-primary'
                  }`}
                title={isExact ? 'Showing exact (symbolic)' : 'Showing approximate (numeric)'}
              >
                {isExact ? (
                  <><ToggleLeft size={14} /> EXACT</>
                ) : (
                  <><ToggleRight size={14} /> ≈ APPROX</>
                )}
              </button>
              <button onClick={() => setHistory([])} className="text-aurora-secondary hover:text-aurora-danger transition-colors p-1" title="Clear History">
                <Eraser size={16} />
              </button>
            </div>
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

              {/* Easter Egg Display */}
              {item.easterEgg && (
                <div className={`
                  my-2 p-3 rounded-lg border text-sm whitespace-pre-line animate-in fade-in zoom-in duration-500
                  ${item.easterEgg.animation === 'rainbow' ? 'bg-gradient-to-r from-red-500/10 via-green-500/10 to-blue-500/10 border-white/20' : ''}
                  ${item.easterEgg.animation === 'glow' ? 'bg-aurora-primary/10 border-aurora-primary/30 shadow-[0_0_15px_rgba(255,107,53,0.2)]' : ''}
                  ${item.easterEgg.animation === 'sparkle' ? 'bg-yellow-500/10 border-yellow-500/30' : ''}
                  ${!item.easterEgg.animation ? 'bg-white/5 border-white/10' : ''}
                `}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl pt-1">{item.easterEgg.emoji || '✨'}</span>
                    <div className="text-aurora-text font-medium leading-relaxed">
                      {item.easterEgg.message}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-right">
                <span className="text-primary text-2xl font-bold font-mono">
                  = {isExact ? (
                    <MathDisplay expression={item.result} isResult inline />
                  ) : (
                    <span className="text-primary">≈ {item.approxResult || item.result}</span>
                  )}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Big Input Field with Autocomplete */}
        <div className="bg-background-dark p-6 border-t border-aurora-border shrink-0">
          <div className="relative">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold font-serif italic ${parseError ? 'text-red-500' : 'text-primary'}`}>ƒ</div>
            <input
              value={input}
              onChange={(e) => {
                const val = e.target.value;
                setInput(val);
                // Trigger autocomplete on last word
                const words = val.split(/[\s()+\-*/=,]+/);
                const lastWord = words[words.length - 1];
                if (lastWord && lastWord.length >= 2) {
                  const matches = getAutocompleteSuggestions(lastWord, 'es', 5);
                  setSuggestions(matches);
                  setShowSuggestions(matches.length > 0);
                  setSelectedSuggestion(0);
                } else {
                  setShowSuggestions(false);
                }
              }}
              onKeyDown={(e) => {
                if (showSuggestions && suggestions.length > 0) {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedSuggestion(prev => (prev + 1) % suggestions.length);
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedSuggestion(prev => (prev - 1 + suggestions.length) % suggestions.length);
                  } else if (e.key === 'Tab' || e.key === 'Enter') {
                    if (showSuggestions && suggestions[selectedSuggestion]) {
                      e.preventDefault();
                      // Replace last partial word with selected function
                      const words = input.split(/[\s()+\-*/=,]+/);
                      const lastWord = words[words.length - 1];
                      const fnName = suggestions[selectedSuggestion].name;
                      const newInput = input.slice(0, input.length - lastWord.length) + fnName + '(';
                      setInput(newInput);
                      setShowSuggestions(false);
                      return;
                    }
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }
                if (e.key === 'Enter' && !showSuggestions) {
                  handleKeyClick('=');
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className={`w-full bg-background-light border rounded-2xl py-4 pl-12 pr-4 text-xl lg:text-2xl font-mono text-white placeholder:text-aurora-muted focus:ring-2 focus:border-transparent transition-all shadow-inner ${parseError
                ? 'border-red-500 focus:ring-red-500/50'
                : 'border-aurora-border focus:ring-primary'
                }`}
              placeholder="Escribe una expresión... (ej: derivar(x^2, x))"
              autoFocus
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 bottom-full mb-2 bg-background-light border border-aurora-border rounded-xl shadow-xl overflow-hidden z-50">
                {suggestions.map((fn, idx) => (
                  <div
                    key={fn.name}
                    className={`px-4 py-3 cursor-pointer flex justify-between items-center ${idx === selectedSuggestion ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'
                      }`}
                    onMouseDown={() => {
                      const words = input.split(/[\s()+\-*/=,]+/);
                      const lastWord = words[words.length - 1];
                      const newInput = input.slice(0, input.length - lastWord.length) + fn.name + '(';
                      setInput(newInput);
                      setShowSuggestions(false);
                    }}
                  >
                    <div>
                      <span className="font-bold font-mono">{fn.name}</span>
                      <span className="text-aurora-muted ml-2 text-sm">{fn.syntax}</span>
                    </div>
                    <span className="text-xs text-aurora-secondary">{fn.description.es}</span>
                  </div>
                ))}
              </div>
            )}

            {input && !parseError && !showSuggestions && (
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