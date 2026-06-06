import React, { useState, useEffect, useRef } from 'react';
import { HistoryItem } from '../types';
import MathDisplay from './MathDisplay';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
// @ts-ignore
import apiService from '../services/apiService';
import ScientificKeypad from './ScientificKeypad';
import { Eraser, Cloud, CloudOff, AlertCircle, ToggleLeft, ToggleRight, Sparkles, ChevronUp, ChevronDown, Save, ShieldAlert, CheckCircle, X } from 'lucide-react';
import { checkEasterEgg, parseNumberSystems, EasterEggResult } from '../services/easterEggs';
import { useCalculator } from '../CalculatorContext';
import { useNotifications } from '../contexts/NotificationContext';
import { MathService } from '../services/MathService';
import { parseExpression, ParseResult } from '../services/mathParser';
import { getAutocompleteSuggestions, FunctionDef } from '../services/functionDefs';
import { FINANCE_FUNCTIONS, FINANCE_FUNCTION_DEFS, FinanceResult } from '../services/financeFunctions';
import { ERRORES, SLASH_COMMANDS, LABELS } from '../locales/es-MX';
import { supabase } from '../contexts/AuthContext';
import AIResponseRenderer from './AIResponseRenderer';
import { CONSTANTES_INGENIERIA, PREFIJOS_INGENIERIA } from '../services/constantesIngenieria';
import { usarAutocompletado } from '../hooks/usarAutocompletado';

const ConsoleMode: React.FC = () => {
  const { angleMode } = useCalculator();
  const { addNotification } = useNotifications();
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(true);
  const [parseError, setParseError] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarTab, setToolbarTab] = useState<'FUNC' | 'ABC' | 'GREEK' | 'CONST'>('FUNC');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Módulos locales de memoria y variables mutables/inmutables
  const [panelMemoriaAbierto, setPanelMemoriaAbierto] = useState(true);
  const [variableAGuardar, setVariableAGuardar] = useState<{ valor: string; mostrarModal: boolean }>({ valor: '', mostrarModal: false });
  const [nombreNuevaVariable, setNombreNuevaVariable] = useState('');

  // Use Global Calculator Context
  const { 
    variablesScripting, 
    definirVariableScripting, 
    memoriasCalculadora, 
    guardarEnMemoria,
    matricesCalculadora,
    guardarEnMatriz,
    ans, 
    setAns, 
    isExact, 
    toggleExact, 
    defineFunction, 
    getUserFunction, 
    userFunctions 
  } = useCalculator();

  // Autocomplete UI hook
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompletado = usarAutocompletado(input, cursorPos);

  // Obtener variables que actúan como símbolos de cálculo en funciones especiales y no deben sustituirse por memorias
  const obtenerVariablesProtegidas = (expresion: string): Set<string> => {
    const varsProtegidas = new Set<string>();
    const funcionesSimbolicas = [
      'integrate', 'integrar', 'diff', 'derivar', 'derivative', 
      'solve', 'resolver', 'limit', 'limite', 'taylor'
    ];

    funcionesSimbolicas.forEach(func => {
      const regex = new RegExp(`\\b${func}\\s*\\(`, 'gi');
      let coincidencia;
      
      while ((coincidencia = regex.exec(expresion)) !== null) {
        const indiceInicio = coincidencia.index;
        const inicioArgumentos = indiceInicio + coincidencia[0].length;
        let profundidad = 1;
        let i = inicioArgumentos;
        
        while (i < expresion.length && profundidad > 0) {
          if (expresion[i] === '(') profundidad++;
          if (expresion[i] === ')') profundidad--;
          i++;
        }
        
        if (profundidad === 0) {
          const cadenaArgumentos = expresion.slice(inicioArgumentos, i - 1);
          const argumentos = splitArgsSafe(cadenaArgumentos);
          
          if (argumentos.length >= 2) {
            const varSimbolica = argumentos[1].trim();
            if (/^[a-zA-Z]$/.test(varSimbolica)) {
              varsProtegidas.add(varSimbolica.toUpperCase());
            }
          } else if (argumentos.length === 1) {
            varsProtegidas.add('X');
          }
        }
      }
    });

    return varsProtegidas;
  };

  // Sustituir variables de scripting (con $), memorias de Casio (A-M, X, Y) y constantes en la expresión antes de resolver
  const sustituirVariablesYConstantes = (expresion: string): string => {
    let resultado = expresion;
    const varsProtegidas = obtenerVariablesProtegidas(expresion);

    // 1. Mapa de variables de scripting (con $)
    const mapaVariablesScripting = { ...variablesScripting };

    // 2. Mapa de constantes de ingeniería y ans
    const mapaConstantes: Record<string, string> = {};
    CONSTANTES_INGENIERIA.forEach(constante => {
      mapaConstantes[constante.simbolo] = constante.valor.toString();
    });
    if (ans) {
      mapaConstantes['ans'] = ans;
    }

    // 3. Mapa de memorias Casio que no estén protegidas simbólicamente
    const mapaMemoriasCasio: Record<string, string> = {};
    Object.entries(memoriasCalculadora).forEach(([celda, valor]) => {
      if (!varsProtegidas.has(celda.toUpperCase())) {
        mapaMemoriasCasio[celda] = valor as string;
      }
    });

    // 4. Mapa de Matrices (A, B, C, D, E)
    const mapaMatrices: Record<string, string> = {};
    Object.entries(matricesCalculadora).forEach(([celda, matriz]) => {
      // Las matrices que existan y no estén llenas de puros ceros (opcional, pero para no sobrescribir escalares de memoria)
      // O le damos prioridad a la matriz si tiene algún valor distinto de cero.
      // Aquí priorizaremos: Si se escribe A, y la matriz A fue modificada por el usuario (no todo es cero), se sustituye por la matriz.
      // Como esto puede ser complejo, simplemente añadiremos la matriz al mapa si no es la identidad trivial que inicializamos.
      // Por simplicidad, agregamos todas las matrices que el usuario ha modificado.
      if (!varsProtegidas.has(celda.toUpperCase())) {
          mapaMatrices[celda] = `Matrix(${JSON.stringify(matriz)})`;
      }
    });

    // Sustituir variables de scripting ($miVar)
    const scriptingOrdenadas = Object.entries(mapaVariablesScripting).sort((a, b) => b[0].length - a[0].length);
    for (const [nombre, valor] of scriptingOrdenadas) {
      const regexNombre = new RegExp('\\' + nombre + '\\b', 'gi');
      resultado = resultado.replace(regexNombre, `(${valor})`);
    }

    // Sustituir constantes e histórico ans
    const constantesOrdenadas = Object.entries(mapaConstantes).sort((a, b) => b[0].length - a[0].length);
    for (const [nombre, valor] of constantesOrdenadas) {
      const regexNombre = new RegExp('\\b' + nombre + '\\b', 'gi');
      resultado = resultado.replace(regexNombre, `(${valor})`);
    }

    // Sustituir memorias de Casio (A, B, C, D, E, F, X, Y, M)
    const memoriasOrdenadas = Object.entries(mapaMemoriasCasio).sort((a, b) => b[0].length - a[0].length);
    for (const [nombre, valor] of memoriasOrdenadas) {
      const regexNombre = new RegExp('\\b' + nombre + '\\b', 'gi');
      // Si la matriz correspondiente tiene un valor no cero, usar la matriz. De lo contrario, usar la memoria escalar.
      const isMatrixActive = matricesCalculadora[nombre] && matricesCalculadora[nombre].flat().some(v => v !== 0);
      if (isMatrixActive) {
          resultado = resultado.replace(regexNombre, mapaMatrices[nombre]);
      } else {
          resultado = resultado.replace(regexNombre, `(${valor})`);
      }
    }

    return resultado;
  };

  // Analizar asignaciones o definiciones de funciones
  const analizarAsignacion = (expresion: string): { 
    esAsignacion: boolean; 
    esDefinicionFuncion?: boolean; 
    esMemoriaCasio?: boolean;
    nombreVar?: string; 
    parametros?: string[]; 
    expresionValor?: string;
  } => {
    const expresionLimpia = expresion.trim();

    // 1. Definición de función: f(x) := expr o f(x, y) := expr
    const regexFuncion = expresionLimpia.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]+)\)\s*:=\s*(.+)$/);
    if (regexFuncion) {
      const parametros = regexFuncion[2].split(',').map(s => s.trim());
      return { 
        esAsignacion: true, 
        esDefinicionFuncion: true, 
        nombreVar: regexFuncion[1].toLowerCase(), 
        parametros, 
        expresionValor: regexFuncion[3] 
      };
    }

    // 2. Asignación de memoria Casio con flecha: expr -> A (o --> o => o to)
    const regexFlechaCasio = expresionLimpia.match(/^(.+?)\s*(?:-->|->|=>|to)\s*([a-fA-FxyXYmM])$/);
    if (regexFlechaCasio) {
      return {
        esAsignacion: true,
        esMemoriaCasio: true,
        nombreVar: regexFlechaCasio[2].toUpperCase(),
        expresionValor: regexFlechaCasio[1].trim()
      };
    }

    // 3. Asignación de memoria Casio directa: A = expr
    const regexIgualCasio = expresionLimpia.match(/^([a-fA-FxyXYmM])\s*=\s*(.+)$/);
    if (regexIgualCasio) {
      return {
        esAsignacion: true,
        esMemoriaCasio: true,
        nombreVar: regexIgualCasio[1].toUpperCase(),
        expresionValor: regexIgualCasio[2].trim()
      };
    }

    // 4. Asignación de variable mutable de scripting: $mi_var = expr
    const regexVariableScripting = expresionLimpia.match(/^(\$[a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
    if (regexVariableScripting) {
      return { 
        esAsignacion: true, 
        nombreVar: regexVariableScripting[1], 
        expresionValor: regexVariableScripting[2].trim() 
      };
    }

    return { esAsignacion: false };
  };

  // Substitute user-defined functions in expression
  const substituteUserFunctions = (expr: string): string => {
    let result = expr;
    // Iterate over user functions and expand calls
    for (const [name, fnObj] of Object.entries(userFunctions)) {
      const fn = fnObj as any;
      // Match function calls like f(3) or g(x+1, 2)
      const regex = new RegExp(`\\b${name}\\s*\\(`, 'g');
      let match;
      while ((match = regex.exec(result)) !== null) {
        const startStr = match.index;
        const startArgs = startStr + match[0].length;
        let depth = 1;
        let i = startArgs;
        while (i < result.length && depth > 0) {
          if (result[i] === '(') depth++;
          if (result[i] === ')') depth--;
          i++;
        }
        if (depth === 0) {
          const argsStr = result.slice(startArgs, i - 1);
          const args = splitArgsSafe(argsStr);
          // Substitute params with args in the function body
          let expanded = fn.body;
          fn.params.forEach((param: string, idx: number) => {
            const argVal = args[idx] || '0';
            expanded = expanded.replace(new RegExp(`\\b${param}\\b`, 'g'), `(${argVal})`);
          });
          result = result.slice(0, startStr) + `(${expanded})` + result.slice(i);
          regex.lastIndex = startStr + expanded.length + 2;
        }
      }
    }
    return result;
  };

  const scrollToBottom = () => {
    // Dar tiempo a los useEffect de MathDisplay/KaTeX para que inyecten el DOM
    // antes de calcular la posición final de scroll
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
  };

  // Persistence: Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('binary_equalab_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic validation: ensure it's an array
        if (Array.isArray(parsed)) {
          setHistory(parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp) // Restore date objects
          })));
        }
      } catch (e) {
        console.error('Error loading history from localStorage:', e);
      }
    }
  }, []);

  // Persistence: Save to localStorage when history changes
  useEffect(() => {
    localStorage.setItem('binary_equalab_history', JSON.stringify(history));
    // Siempre hacer scroll al fondo cuando cambie el historial
    scrollToBottom();
  }, [history]);

  // Las constantes ahora viven en el Backend (FastAPI)

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

  // Helper: split arguments respecting nested parentheses
  const splitArgsSafe = (argsStr: string): string[] => {
    const args: string[] = [];
    let current = '';
    let depth = 0;
    for (let i = 0; i < argsStr.length; i++) {
      if (argsStr[i] === '(') depth++;
      if (argsStr[i] === ')') depth--;
      if (argsStr[i] === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += argsStr[i];
      }
    }
    if (current.trim()) args.push(current.trim());
    return args;
  };

  // Helper: Extract content inside function call (handles nested parens)
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
  const evaluateWithBackend = async (expr: string): Promise<{ latex: string; rawValue: string; approxResult?: string }> => {
    try {
      // Preprocess expression with our parser first
      const parsed = parseExpression(expr);
      if (!parsed.success) {
        setParseError(parsed.error || 'Parse error');
        return {
          latex: `\\text{${parsed.error?.replace(/_/g, '\\_') || 'Error'}}`,
          rawValue: 'Error',
          approxResult: 'Error'
        };
      }
      const processedExpr = parsed.expression;

      let res;
      // Detect operation type from expression
      if (processedExpr.startsWith('simplify(')) {
        const inner = extractFunctionContent(processedExpr, 'simplify');
        res = await apiService.simplify(inner);
      } else if (processedExpr.startsWith('expand(')) {
        const inner = extractFunctionContent(processedExpr, 'expand');
        res = await apiService.expand(inner);
      } else if (processedExpr.startsWith('factor(')) {
        const inner = extractFunctionContent(processedExpr, 'factor');
        res = await apiService.factor(inner);
      } else if (processedExpr.startsWith('diff(') || processedExpr.startsWith('derivative(')) {
        const funcName = processedExpr.startsWith('diff(') ? 'diff' : 'derivative';
        const inner = extractFunctionContent(processedExpr, funcName);
        const parts = splitArgsSafe(inner);
        if (parts.length >= 2) {
          res = await apiService.derivative(parts[0], parts[1]);
        } else {
          res = await apiService.derivative(parts[0], 'x');
        }
      } else if (processedExpr.startsWith('integrate(')) {
        const inner = extractFunctionContent(processedExpr, 'integrate');
        const parts = splitArgsSafe(inner);
        if (parts.length >= 4) {
          res = await apiService.integral(parts[0], parts[1], parseFloat(parts[2]), parseFloat(parts[3]));
        } else if (parts.length === 3) {
          res = await apiService.integral(parts[0], 'x', parseFloat(parts[1]), parseFloat(parts[2]));
        } else if (parts.length >= 2) {
          res = await apiService.integral(parts[0], parts[1]);
        } else {
          res = await apiService.integral(parts[0], 'x');
        }
      } else if (processedExpr.startsWith('solve(')) {
        const inner = extractFunctionContent(processedExpr, 'solve');
        const parts = inner.split(',').map(s => s.trim());
        res = await apiService.solveEquation(parts[0], parts[1] || 'x');
      } else if (processedExpr.startsWith('limit(')) {
        const inner = extractFunctionContent(processedExpr, 'limit');
        const parts = splitArgsSafe(inner);
        if (parts.length === 2) {
          res = await apiService.limit(parts[0], 'x', parts[1]);
        } else {
          res = await apiService.limit(parts[0], parts[1] || 'x', parts[2] || '0');
        }
      } else if (processedExpr.startsWith('taylor(')) {
        const inner = extractFunctionContent(processedExpr, 'taylor');
        const parts = splitArgsSafe(inner);
        res = await apiService.taylor(parts[0], parts[1] || 'x', parts[2] || '0', parseInt(parts[3]) || 5);
      } else if (processedExpr.startsWith('laplace(')) {
        const inner = extractFunctionContent(processedExpr, 'laplace');
        res = await apiService.laplace(inner);
      } else if (processedExpr.startsWith('fourier(')) {
        const inner = extractFunctionContent(processedExpr, 'fourier');
        res = await apiService.fourier(inner);
      } else if (processedExpr.startsWith('ilaplace(') || processedExpr.startsWith('inverse_laplace(')) {
        const funcName = processedExpr.startsWith('ilaplace(') ? 'ilaplace' : 'inverse_laplace';
        const inner = extractFunctionContent(processedExpr, funcName);
        res = await apiService.ilaplace(inner);
      } else if (processedExpr.startsWith('ifourier(') || processedExpr.startsWith('inverse_fourier(')) {
        const funcName = processedExpr.startsWith('ifourier(') ? 'ifourier' : 'inverse_fourier';
        const inner = extractFunctionContent(processedExpr, funcName);
        res = await apiService.ifourier(inner);
      } else if (processedExpr.startsWith('explain(') || processedExpr.startsWith('explicar(')) {
        const funcName = processedExpr.startsWith('explain') ? 'explain' : 'explicar';
        const inner = extractFunctionContent(processedExpr, funcName);
        try {
          const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}/api/ai/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: inner })
          });
          const data = await response.json();
          return {
            latex: `\\text{AI Analysis}`,
            rawValue: data.explanation || 'No explanation',
            approxResult: 'AI'
          } as any;
        } catch (e) {
          return {
            latex: `\\text{AI Service Unavailable}`,
            rawValue: 'Error',
            approxResult: 'Error'
          };
        }
      } else {
        // Default: evaluate universal (SymPy with full namespace)
        res = await apiService.evaluate(processedExpr);
      }

      return {
        latex: res.latex || res.result,
        rawValue: res.result || '',
        approxResult: res.approx
      };
    } catch (error) {
      console.warn('Backend failed:', error);
      setUseBackend(false);
      return {
        latex: `\\text{Error de Backend: Verifique conexión o sintaxis}`,
        rawValue: 'Error',
        approxResult: 'Error'
      };
    }
  };

  // Main evaluation function with preprocessing
  const evaluateExpression = async (expr: string): Promise<{ latex: string; rawValue: string; approxResult: string; easterEgg?: EasterEggResult; plotData?: {x: number, y: number}[] }> => {
    setParseError(null);  // Clear previous errors

    // 1. Special Commands Check (PRIORITY)

    const trimmedExpr = expr.trim();

    // Audio Generation: sonify(...) or sonificar(...)
    // Regex allows optional spaces and case insensitivity: sonify ( ... )
    const sonifyMatch = trimmedExpr.match(/^(sonify|sonificar)\s*\((.+)\)$/i);
    if (sonifyMatch) {
      let inner = sonifyMatch[2];

      // Auto-fix: Translate 'sen' -> 'sin'
      const { translateToEnglish } = await import('../services/functionDefs');
      inner = translateToEnglish(inner);

      // Auto-fix: Replace 'x' with 't' for audio generation implication
      inner = inner.replace(/\bx\b/g, 't');

      try {
        await MathService.sonify(inner);
        addNotification('Audio Generated', `Playing sound for: ${inner}`, '🎵');
        return { latex: '\\text{🎵 Audio Playing...}', rawValue: 'Audio', approxResult: 'Audio' };
      } catch (e) {
        console.error("Sonify Error:", e);
        return { latex: '\\text{Error de Audio. Verifique su expresion.}', rawValue: 'Error', approxResult: 'Error' };
      }
    }

    // Graph Generation: plot(...) or graficar(...)
    const plotMatch = trimmedExpr.match(/^(plot|graficar)\s*\((.+)\)$/i);
    if (plotMatch) {
      const inner = plotMatch[2];
      try {
        const res = await apiService.plot(inner, 'x', -10, 10, 200);
        return {
          latex: `\\text{Gráfica de } ${inner}`,
          rawValue: `plot(${inner})`,
          approxResult: '',
          plotData: res.points
        };
      } catch (e) {
        return { latex: `\\text{Error al graficar } ${inner}`, rawValue: 'Error', approxResult: 'Error' };
      }
    }

    const plotsonifyMatch = trimmedExpr.match(/^(plotsonify|graficar_y_sonar|sonificar)\s*\((.+)\)$/i);
    if (plotsonifyMatch) {
      const inner = plotsonifyMatch[2];
      try {
        const res = await apiService.plot(inner, 'x', -10, 10, 200);
        
        // Sonify simultaneously
        let innerForSonify = inner;
        const { translateToEnglish } = await import('../services/functionDefs');
        innerForSonify = translateToEnglish(innerForSonify).replace(/\bx\b/g, 't');
        MathService.sonify(innerForSonify).catch(e => console.error(e));

        return {
          latex: `\\text{Gráfica \& Sonido de } ${inner}`,
          rawValue: `plotsonify(${inner})`,
          approxResult: '',
          plotData: res.points,
          easterEgg: { triggered: true, message: 'Audio Generated', emoji: '🎵', animation: 'glow' }
        };
      } catch (e) {
        return { latex: `\\text{Error al graficar } ${inner}`, rawValue: 'Error', approxResult: 'Error' };
        }
    }

    // Advanced CAS Commands: laplace, fourier, ilaplace, ifourier, taylor
    // Intercepted BEFORE parser to avoid implicit multiplication breaking names
    const advancedMatch = trimmedExpr.match(/^(laplace|fourier|ilaplace|ifourier|inverse_laplace|inverse_fourier|taylor)\s*\((.+)\)$/i);
    if (advancedMatch) {
      const funcName = advancedMatch[1].toLowerCase();
      const innerRaw = advancedMatch[2];
      // Translate inner expression (e.g., sen→sin) but preserve the outer function
      const { translateToEnglish } = await import('../services/functionDefs');
      const inner = translateToEnglish(innerRaw);

      try {
        let res;
        if (funcName === 'taylor') {
          const parts = inner.split(',').map(s => s.trim());
          res = await apiService.taylor(parts[0], parts[1] || 'x', parts[2] || '0', parseInt(parts[3]) || 5);
        } else if (funcName === 'laplace') {
          res = await apiService.laplace(inner);
        } else if (funcName === 'fourier') {
          res = await apiService.fourier(inner);
        } else if (funcName === 'ilaplace' || funcName === 'inverse_laplace') {
          res = await apiService.ilaplace(inner);
        } else if (funcName === 'ifourier' || funcName === 'inverse_fourier') {
          res = await apiService.ifourier(inner);
        } else {
          res = await apiService.simplify(trimmedExpr);
        }
        const result = res.latex || res.result;
        return { latex: result, rawValue: res.result, approxResult: res.result };
      } catch (e) {
        return { latex: `\\text{Error en ${funcName}}`, rawValue: 'Error', approxResult: 'Error' };
      }
    }

    // AI Explanation: explain(...), explicar(...), ai ...
    const explainMatch = trimmedExpr.match(/^(explain|explicar)\s*\((.+)\)$/i);
    const aiPrefixMatch = trimmedExpr.match(/^ai\s+(.+)$/i);

    if (explainMatch || aiPrefixMatch) {
      let inner = "";
      if (aiPrefixMatch) {
        inner = aiPrefixMatch[1]; // "solve contrast"
      } else if (explainMatch) {
        inner = explainMatch[2]; // "terms"
        // Remove quotes if present around the topic
        inner = inner.replace(/^["'](.+)["']$/, '$1');
      }

      try {
        // Fetch from Backend AI Service (with auth token)
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        const response = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}/api/ai/explain`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ query: inner })
        });
        const data = await response.json();

        return {
          latex: `\\text{AI Analysis}`,
          rawValue: data.explanation || 'No explanation',
          approxResult: 'AI',
          easterEgg: { triggered: true, message: data.explanation, emoji: '🤖', animation: 'glow' }
        } as any;
      } catch (e) {
        return { latex: `\\text{AI Service Unavailable}`, rawValue: 'Error', approxResult: 'Error' };
      }
    }

    // Number System Conversions: bin(x), hex(x), oct(x), dec(x)
    const baseConvMatch = trimmedExpr.match(/^(bin|hex|oct|dec)\s*\((.+)\)$/i);
    if (baseConvMatch) {
      const mode = baseConvMatch[1].toLowerCase();
      const inner = baseConvMatch[2];
      try {
        // Parse inner expressions like 0xFF or normal math
        const processedInner = parseNumberSystems(inner);
        const substitutedInner = sustituirVariablesYConstantes(processedInner);
        const backendResult = await evaluateWithBackend(substitutedInner);
        
        // Use approxResult or rawValue to get the numeric evaluation
        const valToParse = backendResult.approxResult || backendResult.rawValue;
        const decValue = Math.trunc(parseFloat(valToParse)); // Only work with integers
        
        if (isNaN(decValue)) {
            return { latex: `\\text{Error: } ${inner} \\text{ no es evaluable como entero}`, rawValue: 'Error', approxResult: 'Error' };
        }

        let resultStr = '';
        if (mode === 'bin') {
            resultStr = '0b' + (decValue >>> 0).toString(2); // >>> 0 for unsigned right shift (handles negatives better in binary)
        } else if (mode === 'hex') {
            resultStr = '0x' + (decValue >>> 0).toString(16).toUpperCase();
        } else if (mode === 'oct') {
            resultStr = '0o' + (decValue >>> 0).toString(8);
        } else if (mode === 'dec') {
            resultStr = decValue.toString(10);
        }

        return {
            latex: `\\text{${mode}(} ${inner} \\text{)} = \\mathtt{${resultStr}}`,
            rawValue: resultStr,
            approxResult: resultStr
        };
      } catch (e) {
          return { latex: `\\text{Error de conversión}`, rawValue: 'Error', approxResult: 'Error' };
      }
    }

    // 2. Normal Math Parsing
    // Parse binary/hex/octal literals (0b1010 → 10, 0xFF → 255)
    let processedExpr = parseNumberSystems(expr);

    // Substitute user-defined functions FIRST (before variables)
    processedExpr = substituteUserFunctions(processedExpr);

    // Evaluar operador de igualdad ==
    if (processedExpr.includes('==')) {
      const partes = processedExpr.split('==');
      if (partes.length === 2) {
        const ladoIzquierdo = partes[0].trim();
        const ladoDerecho = partes[1].trim();
        
        try {
          const resultadoIzquierdo = await evaluateExpression(ladoIzquierdo);
          const resultadoDerecho = await evaluateExpression(ladoDerecho);
          
          const valorIzq = resultadoIzquierdo.approxResult.trim();
          const valorDer = resultadoDerecho.approxResult.trim();
          
          const sonIguales = valorIzq === valorDer || resultadoIzquierdo.rawValue === resultadoDerecho.rawValue;
          
          return {
            latex: sonIguales ? '\\text{true}' : '\\text{false}',
            rawValue: sonIguales ? 'true' : 'false',
            approxResult: sonIguales ? 'true' : 'false'
          };
        } catch (error) {
          return {
            latex: '\\text{false}',
            rawValue: 'false',
            approxResult: 'false'
          };
        }
      }
    }

    // Substitute user variables (including ans y constantes de ingenieria)
    const substitutedExpr = sustituirVariablesYConstantes(processedExpr);

    let latex: string;
    let rawValue: string;
    let approxResult: string = '';

    const backendResult = await evaluateWithBackend(substitutedExpr);
    latex = backendResult.latex;
    rawValue = backendResult.rawValue;
    
    if (backendResult.approxResult) {
      const cleanApprox = backendResult.approxResult.trim();
      
      // Si empieza con [ y termina con ], es un array de soluciones (ej: solve)
      if (cleanApprox.startsWith('[') && cleanApprox.endsWith(']')) {
        const numsStr = cleanApprox.slice(1, -1).trim();
        if (numsStr === '') {
          approxResult = '[]';
        } else {
          const formatted = numsStr.split(',').map(s => {
            const trimmed = s.trim();
            const numFloat = parseFloat(trimmed);
            if (!isNaN(numFloat)) {
              return Number.isInteger(numFloat) ? numFloat.toString() : parseFloat(numFloat.toFixed(6)).toString();
            }
            return trimmed;
          });
          approxResult = `[${formatted.join(', ')}]`;
        }
      } else {
        // Comprobar si es un número puro o una expresión algebraica (ej: 2.6666667*x)
        const isPureNumber = /^-?\d+(\.\d+)?(e[+-]?\d+)?$/.test(cleanApprox);
        if (isPureNumber) {
          const numFloat = parseFloat(cleanApprox);
          approxResult = Number.isInteger(numFloat) ? numFloat.toString() : parseFloat(numFloat.toFixed(6)).toString();
        } else {
          // Redondear los números flotantes encontrados dentro de la cadena algebraica
          approxResult = cleanApprox.replace(/-?\d+\.\d+/g, (match) => {
            const val = parseFloat(match);
            return parseFloat(val.toFixed(6)).toString();
          });
        }
      }
    } else {
      // Fallback local limpiando LaTeX
      let cleaned = latex
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')  // \frac{a}{b} → (a)/(b)
        .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')              // \sqrt{x} → sqrt(x)
        .replace(/\\left|\\right/g, '')                         // Remove \left \right
        .replace(/\\[a-zA-Z]+/g, '')                             // Remove other LaTeX commands
        .replace(/[{}]/g, '')                                     // Remove braces
        .trim();

      const numMatch = latex.match(/^-?\d+\.?\d*$/);
      if (numMatch) cleaned = numMatch[0];
      approxResult = cleaned;
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
        // Split by semicolons or newlines for batch evaluation
        const expressions = input.split(/[;\n]/).map(s => s.trim()).filter(s => s.length > 0);
        const newItems: HistoryItem[] = [];

        for (const singleExpr of expressions) {
          const assignment = analizarAsignacion(singleExpr);
          let displayExpr = singleExpr;
          let resultLatex: string;
          let rawValue: string;
          let approxResult: string;
          let easterEggResult: EasterEggResult | undefined;
          let plotData: {x: number, y: number}[] | undefined;

          if (assignment.esAsignacion && assignment.nombreVar && assignment.expresionValor) {
            if (assignment.esDefinicionFuncion && assignment.parametros) {
              defineFunction(assignment.nombreVar, assignment.parametros, assignment.expresionValor);
              resultLatex = `\\text{${assignment.nombreVar}(${assignment.parametros.join(', ')}) definida}`;
              rawValue = assignment.expresionValor;
              approxResult = '';
              displayExpr = `${assignment.nombreVar}(${assignment.parametros.join(', ')}) := ${assignment.expresionValor}`;
            } else if (assignment.esMemoriaCasio) {
              const evalResult = await evaluateExpression(assignment.expresionValor);
              resultLatex = evalResult.latex;
              rawValue = evalResult.rawValue;
              approxResult = evalResult.approxResult;
              easterEggResult = evalResult.easterEgg;
              plotData = evalResult.plotData;
              displayExpr = `${assignment.expresionValor} \\rightarrow ${assignment.nombreVar}`;
              guardarEnMemoria(assignment.nombreVar, rawValue);
            } else {
              const evalResult = await evaluateExpression(assignment.expresionValor);
              resultLatex = evalResult.latex;
              rawValue = evalResult.rawValue;
              approxResult = evalResult.approxResult;
              easterEggResult = evalResult.easterEgg;
              plotData = evalResult.plotData;
              displayExpr = `${assignment.nombreVar} = ${assignment.expresionValor}`;
              definirVariableScripting(assignment.nombreVar, rawValue);
            }
            setAns(rawValue);
          } else {
            const evalResult = await evaluateExpression(singleExpr);
            resultLatex = evalResult.latex;
            rawValue = evalResult.rawValue;
            approxResult = evalResult.approxResult;
            easterEggResult = evalResult.easterEgg;
            plotData = evalResult.plotData;
            setAns(rawValue);
          }

          newItems.push({
            id: Date.now().toString() + '_' + newItems.length,
            expression: displayExpr,
            result: resultLatex,
            approxResult: approxResult,
            timestamp: new Date(),
            easterEgg: easterEggResult,
            plotData: plotData
          });
        }

        setHistory(prev => [...prev, ...newItems]);
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
    <div className="flex h-full w-full bg-background overflow-hidden relative text-white">
      
      {/* Modal de Guardado en Memoria de Calculadora Casio */}
      {variableAGuardar.mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#120500] border border-primary/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setVariableAGuardar({ valor: '', mostrarModal: false })}
              className="absolute top-4 right-4 text-aurora-muted hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
            <h3 className="text-lg font-bold font-display text-white mb-2 flex items-center gap-2">
              <Save size={18} className="text-primary" />
              Guardar en Memoria Casio
            </h3>
            <p className="text-xs text-aurora-secondary mb-4">
              Selecciona una celda de memoria de la calculadora para almacenar el valor:
              <div className="mt-2 p-2 bg-black/40 rounded-lg border border-white/5 font-mono text-xs text-center text-primary truncate">
                {variableAGuardar.valor}
              </div>
            </p>
            <div className="grid grid-cols-3 gap-2">
              {['A', 'B', 'C', 'D', 'E', 'F', 'X', 'Y', 'M'].map((celda) => (
                <button
                  key={celda}
                  onClick={() => {
                    guardarEnMemoria(celda, variableAGuardar.valor);
                    addNotification('Memoria Guardada', `Resultado guardado en la celda ${celda}`, '💾');
                    setVariableAGuardar({ valor: '', mostrarModal: false });
                  }}
                  className="py-3.5 rounded-xl font-display font-extrabold text-lg text-primary border border-primary/25 bg-primary/5 hover:bg-primary/20 hover:text-white transition-all active:scale-95 shadow-md flex items-center justify-center"
                >
                  {celda}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contenedor Principal de la Consola */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Ambient Glow Background Effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/4" />

        {/* Cabecera superior interna con botón de Memoria y controles de Historial */}
        <div className="flex justify-between items-center px-6 py-3 border-b border-white/5 bg-background-light/40 backdrop-blur-md shrink-0 relative z-20">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-sm tracking-wider text-white">
              CONSOLA <span className="text-[10px] font-mono font-medium text-primary px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20">REPL</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* EXACTO/APROX Toggle */}
            <button
              onClick={toggleExact}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all border ${isExact
                ? 'bg-primary/10 text-primary border-primary/30 shadow-[0_0_15px_rgba(255,90,31,0.15)]'
                : 'glass-button text-aurora-secondary'
                }`}
              title={isExact ? 'Mostrando resultado exacto' : 'Mostrando aproximación'}
            >
              {isExact ? (
                <><ToggleLeft size={16} /> Exacto</>
              ) : (
                <><ToggleRight size={16} /> ≈ Aprox</>
              )}
            </button>

            {/* Borrar Historial */}
            <button 
              onClick={() => {
                setHistory([]);
                localStorage.removeItem('binary_equalab_history');
                addNotification('Historial borrado', 'Se ha limpiado el historial de cálculos', '🧹');
              }} 
              className="text-aurora-muted hover:text-aurora-danger hover:bg-white/5 transition-all p-2 rounded-lg" 
              title="Limpiar historial"
            >
              <Eraser size={16} />
            </button>

            <div className="w-px h-6 bg-white/10 mx-1"></div>

            {/* Ocultar/Mostrar Memoria */}
            <button
              onClick={() => setPanelMemoriaAbierto(!panelMemoriaAbierto)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                panelMemoriaAbierto
                  ? 'bg-[#1c0800] text-primary border-primary/30 shadow-[0_0_15px_rgba(255,90,31,0.15)]'
                  : 'bg-white/5 text-aurora-secondary border-white/10 hover:bg-white/10'
              }`}
            >
              {panelMemoriaAbierto ? 'Ocultar Memoria' : 'Mostrar Memoria'}
            </button>
          </div>
        </div>

        {/* Grid de la consola */}
        <div className="flex-1 grid grid-rows-[1fr_auto] h-full w-full min-w-0 overflow-hidden relative">

          {/* Log de Historial */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-4 relative">
            <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-4 pt-1 opacity-70">
              <div className="flex items-center gap-2">
                <h2 className="text-secondary/70 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <Sparkles size={10} className="text-primary animate-pulse-slow" />
                  Historial de Cálculos
                </h2>
                {useBackend ? (
                  <div title="Backend SymPy conectado">
                    <Cloud size={12} className="text-aurora-success" />
                  </div>
                ) : (
                  <div title="Modo local (Nerdamer)">
                    <CloudOff size={12} className="text-aurora-muted" />
                  </div>
                )}
              </div>
            </div>

            {history.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-aurora-secondary/30 mt-20">
                <span className="text-6xl mb-4 font-light drop-shadow-lg">∫</span>
                <p className="text-sm font-medium tracking-widest uppercase">Comienza a calcular...</p>
              </div>
            )}

            {history.map((item) => {
              const esExplain = /^(explain|explicar|ai\s)/i.test(item.expression) || item.approxResult === 'AI';
              const esError = item.result && (item.result.includes('Error') || item.result.includes('Unavailable') || item.result.includes('failed'));
              const mostrarBotonGuardar = item.result && !item.result.includes('definida') && !esExplain && !esError;

              return (
                <div key={item.id} className="relative group flex flex-col gap-1.5 p-3.5 rounded-xl glass-panel hover:bg-white/[0.04] transition-all border border-white/5 hover:border-white/10 shadow-lg">
                  {/* Expresión de entrada (con padding derecho para no solapar con el botón de guardar absoluto) */}
                  <div className="text-right text-aurora-secondary text-sm font-mono tracking-wide opacity-80 pr-24">
                    <MathDisplay expression={item.expression} />
                  </div>

                  {/* Easter Egg / AI Response Display */}
                  {item.easterEgg && item.easterEgg.message && (
                    <div className={`
                      my-2 p-3 rounded-lg border text-sm animate-in fade-in zoom-in duration-500
                      ${item.easterEgg.animation === 'rainbow' ? 'bg-gradient-to-r from-red-500/10 via-green-500/10 to-blue-500/10 border-white/20' : ''}
                      ${item.easterEgg.animation === 'glow' ? 'bg-aurora-primary/10 border-aurora-primary/30 shadow-[0_0_15px_rgba(255,107,53,0.2)]' : ''}
                      ${item.easterEgg.animation === 'sparkle' ? 'bg-yellow-500/10 border-yellow-500/30' : ''}
                      ${!item.easterEgg.animation ? 'bg-white/5 border-white/10' : ''}
                    `}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl pt-1 shrink-0">{item.easterEgg.emoji || '✨'}</span>
                        <div className="flex-1 min-w-0">
                          <AIResponseRenderer content={item.easterEgg.message} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Resultado o error */}
                  <div className="text-right flex items-center justify-end gap-3 mt-1">
                    {esError ? (
                      <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono flex items-center gap-1.5">
                        <AlertCircle size={13} className="shrink-0" />
                        {item.approxResult || item.result || 'Error de sintaxis'}
                      </span>
                    ) : (
                      <span className="text-primary text-xl font-bold font-mono">
                        = {isExact ? (
                          <MathDisplay expression={item.result} isResult inline />
                        ) : (
                          <span className="text-primary flex items-center justify-end gap-1.5">
                            ≈ <MathDisplay expression={item.approxResult || item.result} isResult inline />
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  {/* Botón de Guardar absoluto en la esquina superior derecha fijo para memorias Casio */}
                  {mostrarBotonGuardar && (
                    <button
                      onClick={() => {
                        setVariableAGuardar({ valor: item.approxResult || item.result, mostrarModal: true });
                      }}
                      className="absolute top-3 right-3 px-2 py-1 bg-white/5 border border-white/10 hover:bg-primary/20 hover:text-primary hover:border-primary/30 text-aurora-secondary rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 select-none"
                      title="Guardar en memoria de calculadora Casio"
                    >
                      <Save size={10} />
                      Guardar
                    </button>
                  )}

                  {/* Gráfica generada con plot(expr) */}
                  {item.plotData && item.plotData.length > 0 && (
                    <div className="h-64 mt-3 w-full bg-background/50 rounded-xl p-4 border border-aurora-border shadow-inner animate-fadeIn">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={item.plotData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                          <XAxis 
                            dataKey="x" 
                            type="number" 
                            domain={['dataMin', 'dataMax']} 
                            stroke="#718096" 
                            tick={{ fill: '#718096', fontSize: 12 }} 
                            tickFormatter={(val) => val.toFixed(1)}
                          />
                          <YAxis 
                            type="number" 
                            domain={['auto', 'auto']} 
                            stroke="#718096" 
                            tick={{ fill: '#718096', fontSize: 12 }} 
                            tickFormatter={(val) => val.toFixed(1)}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: '#2D3748', color: '#fff', borderRadius: '8px' }}
                            itemStyle={{ color: '#00EAD3', fontWeight: 'bold' }}
                            labelFormatter={(label) => `x: ${Number(label).toFixed(2)}`}
                            formatter={(value: number) => [value.toFixed(4), 'y']}
                          />
                          <ReferenceLine y={0} stroke="#4A5568" strokeWidth={1.5} />
                          <ReferenceLine x={0} stroke="#4A5568" strokeWidth={1.5} />
                          <Line 
                            type="monotone" 
                            dataKey="y" 
                            stroke="#00EAD3" 
                            strokeWidth={2.5} 
                            dot={false} 
                            isAnimationActive={true} 
                            animationDuration={1500} 
                            animationEasing="ease-out"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}


            <div ref={messagesEndRef} />
          </div>

          {/* ── Quick Action Bar + Collapsible Toolbar ── */}
          <div className="glass-panel border-t-0 border-r-0 border-l-0 shrink-0 z-20 shadow-[0_-15px_30px_inset_rgba(0,0,0,0.4)]">

            {/* Quick Buttons Row — always visible */}
            <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setShowToolbar(!showToolbar)}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  showToolbar
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-white/5 text-aurora-muted border-white/10 hover:bg-white/10'
                }`}
                title="Panel de funciones"
              >
                {showToolbar ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>

              {/* Math Quick Buttons */}
              {[
                { label: '∫', val: 'integrar(' },
                { label: 'd/dx', val: 'derivar(' },
                { label: 'Σ', val: 'sumatoria(' },
                { label: 'lim', val: 'limite(' },
                { label: '√', val: 'raiz(' },
                { label: 'xⁿ', val: '^' },
                { label: 'π', val: 'pi' },
                { label: 'e', val: 'e' },
                { label: '(', val: '(' },
                { label: ')', val: ')' },
                { label: ',', val: ',' },
                { label: 'sin', val: 'sen(' },
                { label: 'cos', val: 'cos(' },
                { label: 'tan', val: 'tan(' },
                { label: 'ln', val: 'ln(' },
                { label: 'log', val: 'log(' },
                { label: '|x|', val: 'abs(' },
                { label: 'n!', val: 'factorial(' },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => setInput(input + btn.val)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold
                    bg-white/5 border border-white/10 text-aurora-text hover:bg-primary/15 hover:text-primary hover:border-primary/30
                    transition-all active:scale-95 select-none"
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Collapsible Toolbar Panel */}
            {showToolbar && (
              <div className="border-t border-aurora-border/50">
                <div className="flex gap-1 px-4 pt-2 pb-1">
                  {(['FUNC', 'ABC', 'GREEK', 'CONST'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setToolbarTab(tab)}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                        toolbarTab === tab
                          ? 'bg-primary/20 text-primary'
                          : 'text-aurora-muted hover:bg-white/5'
                      }`}
                    >
                      {tab === 'GREEK' ? 'αβγ' : tab === 'FUNC' ? 'ƒ(x)' : tab === 'ABC' ? 'xyz' : 'π e c'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5 px-4 pb-3 max-h-32 overflow-y-auto custom-scrollbar">
                  {toolbarTab === 'FUNC' && [
                    { l: 'sinh', v: 'sinh(' }, { l: 'cosh', v: 'cosh(' }, { l: 'tanh', v: 'tanh(' },
                    { l: 'asin', v: 'asin(' }, { l: 'acos', v: 'acos(' }, { l: 'atan', v: 'atan(' },
                    { l: 'exp', v: 'exp(' }, { l: 'sqrt', v: 'raiz(' }, { l: 'cbrt', v: 'cbrt(' },
                    { l: 'floor', v: 'piso(' }, { l: 'ceil', v: 'techo(' },
                    { l: 'nPr', v: 'permutations(' }, { l: 'nCr', v: 'combinations(' },
                    { l: 'GCD', v: 'gcd(' }, { l: 'LCM', v: 'lcm(' }, { l: 'mod', v: 'mod(' },
                    { l: 'det', v: 'determinant(' }, { l: 'inv', v: 'invert(' }, { l: 'Aᵀ', v: 'transpose(' },
                    { l: 'graficar', v: 'graficar(' }, { l: 'sonificar', v: 'sonificar(' },
                    { l: 'explicar', v: 'explicar(' }, { l: 'resolver', v: 'resolver(' },
                    { l: 'simplificar', v: 'simplificar(' }, { l: 'factorizar', v: 'factorizar(' },
                    { l: 'expandir', v: 'expandir(' },
                    { l: 'taylor', v: 'taylor(' }, { l: 'laplace', v: 'laplace(' }, { l: 'fourier', v: 'fourier(' },
                  ].map(b => (
                    <button key={b.l} onClick={() => setInput(input + b.v)}
                      className="px-2 py-1.5 rounded-md text-xs font-mono bg-white/5 border border-white/5 text-aurora-text hover:bg-primary/15 hover:text-primary transition-all active:scale-95 truncate">
                      {b.l}
                    </button>
                  ))}

                  {toolbarTab === 'ABC' && 'xyzwabcdefghijk'.split('').map(l => (
                    <button key={l} onClick={() => setInput(input + l)}
                      className="px-2 py-1.5 rounded-md text-xs font-mono bg-white/5 border border-white/5 text-aurora-text hover:bg-primary/15 hover:text-primary transition-all active:scale-95">
                      {l}
                    </button>
                  ))}

                  {toolbarTab === 'GREEK' && [
                    { l: 'α', v: 'alpha' }, { l: 'β', v: 'beta' }, { l: 'γ', v: 'gamma' }, { l: 'δ', v: 'delta' },
                    { l: 'ε', v: 'epsilon' }, { l: 'ζ', v: 'zeta' }, { l: 'η', v: 'eta' }, { l: 'θ', v: 'theta' },
                    { l: 'λ', v: 'lambda' }, { l: 'μ', v: 'mu' }, { l: 'ν', v: 'nu' }, { l: 'ξ', v: 'xi' },
                    { l: 'ρ', v: 'rho' }, { l: 'σ', v: 'sigma' }, { l: 'τ', v: 'tau' }, { l: 'φ', v: 'phi' },
                    { l: 'ψ', v: 'psi' }, { l: 'ω', v: 'omega' }, { l: '∞', v: 'inf' }, { l: '∂', v: 'd' },
                    { l: 'Δ', v: 'Delta' }, { l: 'Σ', v: 'sum' }, { l: 'Π', v: 'product' }, { l: 'Ω', v: 'Omega' },
                  ].map(b => (
                    <button key={b.l} onClick={() => setInput(input + b.v)}
                      className="px-2 py-1.5 rounded-md text-sm font-serif bg-white/5 border border-white/5 text-aurora-text hover:bg-primary/15 hover:text-primary transition-all active:scale-95">
                      {b.l}
                    </button>
                  ))}

                  {toolbarTab === 'CONST' && [
                    { l: 'π', v: 'pi', d: 'Pi' }, { l: 'e', v: 'e', d: 'Euler' }, { l: 'i', v: 'i', d: 'Imaginario' },
                    { l: 'c', v: 'c', d: 'Luz' }, { l: 'g', v: 'g', d: 'Gravedad' }, { l: 'G', v: 'G', d: 'Newton' },
                    { l: 'h', v: 'h', d: 'Planck' }, { l: 'k', v: 'k', d: 'Boltzmann' }, { l: 'Nₐ', v: 'Na', d: 'Avogadro' },
                    { l: 'R', v: 'R', d: 'Gas' }, { l: 'mₑ', v: 'me', d: 'Electrón' }, { l: 'mₚ', v: 'mp', d: 'Protón' },
                  ].map(b => (
                    <button key={b.l} onClick={() => setInput(input + b.v)}
                      className="px-2 py-1.5 rounded-md text-xs font-serif bg-white/5 border border-white/5 text-aurora-text hover:bg-primary/15 hover:text-primary transition-all active:scale-95 flex flex-col items-center">
                      <span className="text-sm leading-none">{b.l}</span>
                      <span className="text-[8px] opacity-40 leading-none mt-0.5">{b.d}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input Field ── */}
            <div className="px-4 pb-4 pt-1">
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold font-serif italic ${parseError ? 'text-red-500' : 'text-primary'}`}>ƒ</div>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInput(val);
                    setCursorPos(e.target.selectionStart || 0);
                  }}
                  onClick={(e) => setCursorPos(e.currentTarget.selectionStart || 0)}
                  onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart || 0)}
                  onKeyDown={(e) => {
                    if (autocompletado.mostrar && autocompletado.sugerencias.length > 0) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        autocompletado.moverSeleccion('abajo');
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        autocompletado.moverSeleccion('arriba');
                      } else if (e.key === 'Tab' || e.key === 'Enter') {
                        e.preventDefault();
                        const resultado = autocompletado.aplicarSugerencia();
                        if (resultado) {
                          setInput(resultado.nuevaEntrada);
                          setTimeout(() => {
                            if (inputRef.current) {
                              inputRef.current.selectionStart = resultado.nuevoCursor;
                              inputRef.current.selectionEnd = resultado.nuevoCursor;
                            }
                          }, 10);
                        }
                        return;
                      } else if (e.key === 'Escape') {
                        autocompletado.cerrar();
                      }
                    }
                    if (e.key === 'Enter' && !autocompletado.mostrar) {
                      handleKeyClick('=');
                    }
                  }}
                  onBlur={() => setTimeout(() => autocompletado.cerrar(), 150)}
                  className={`w-full bg-background-light border rounded-2xl py-4 pl-12 pr-4 text-xl lg:text-2xl font-mono text-white placeholder:text-aurora-muted focus:ring-2 focus:border-transparent transition-all shadow-inner ${parseError
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-aurora-border focus:ring-primary'
                    }`}
                  placeholder="Escribe una expresión... (ej: derivar(x^2, x))"
                  autoFocus
                />

                {/* Autocomplete Dropdown */}
                {autocompletado.mostrar && autocompletado.sugerencias.length > 0 && (
                  <div className="absolute left-0 right-0 bottom-full mb-2 bg-background-light/90 backdrop-blur-xl border border-aurora-border rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden z-50">
                    {autocompletado.sugerencias.map((fn, idx) => (
                      <div
                        key={fn.name}
                        className={`px-4 py-3 cursor-pointer flex justify-between items-center transition-colors ${idx === autocompletado.indiceSeleccionado ? 'bg-primary/20 text-primary shadow-[inset_2px_0_0_var(--color-primary)]' : 'hover:bg-white/5'
                          }`}
                        onMouseDown={() => {
                          const resultado = autocompletado.aplicarSugerencia(idx);
                          if (resultado) {
                            setInput(resultado.nuevaEntrada);
                            setTimeout(() => {
                              if (inputRef.current) {
                                inputRef.current.selectionStart = resultado.nuevoCursor;
                                inputRef.current.selectionEnd = resultado.nuevoCursor;
                              }
                            }, 10);
                          }
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

                {input && !parseError && !autocompletado.mostrar && (
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
        </div>
      </div>

      {/* Panel de Memoria y Variables Lateral */}
      {panelMemoriaAbierto && (
        <div className="w-[300px] h-full bg-[#0a0604] border-l border-aurora-border/40 flex flex-col shrink-0 relative z-20 animate-fadeIn">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              <Save size={16} className="text-primary" />
              Memoria de Variables
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            
            {/* Sección 1: Constantes Inmutables (Primera mitad) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#9a6040] mb-2">Constantes (Inmutables)</h4>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {CONSTANTES_INGENIERIA.map((c) => (
                  <div 
                    key={c.simbolo} 
                    className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:border-primary/20 flex items-center justify-between cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                    onClick={() => setInput(input + c.simbolo)}
                    title={c.nombre}
                  >
                    <span className="font-mono text-xs font-bold text-[#ffaa00] mr-2">{c.simbolo}</span>
                    <span className="font-mono text-[10px] text-slate-300 truncate max-w-[170px]">{c.valor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección: Memorias de Calculadora Casio */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#9a6040] mb-2">Memorias Casio (A-M, X, Y)</h4>
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                {Object.entries(memoriasCalculadora).map(([celda, valor]) => (
                  <div 
                    key={celda} 
                    className="p-2 rounded-lg bg-[#120500] border border-primary/10 hover:border-primary/30 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 group"
                    onClick={() => setInput(input + celda)}
                    title={`Insertar memoria ${celda}`}
                  >
                    <span className="font-display font-extrabold text-sm text-primary group-hover:text-[#ffaa00] transition-colors">{celda}</span>
                    <span className="font-mono text-[9px] text-aurora-secondary truncate max-w-[70px] mt-0.5">{valor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección 2: Variables del Usuario Mutables (Segunda mitad) */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#9a6040] mb-2">Variables ($) (Scripting)</h4>
              {Object.keys(variablesScripting).filter(k => k.startsWith('$')).length === 0 ? (
                <div className="p-3 text-center rounded-lg border border-dashed border-white/10 text-xs text-aurora-secondary/40 font-mono">
                  Sin variables guardadas (usa $miVar = 10)
                </div>
              ) : (
                <div className="space-y-1.5">
                  {Object.entries(variablesScripting)
                    .filter(([k]) => k.startsWith('$'))
                    .map(([nombre, valor]) => (
                      <div 
                        key={nombre} 
                        className="p-2 rounded-lg bg-[#120500] border border-primary/10 hover:border-primary/20 flex items-center justify-between cursor-pointer group"
                        onClick={() => setInput(input + nombre)}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-xs font-bold text-primary">{nombre}</span>
                          <span className="font-mono text-[10px] text-aurora-secondary truncate max-w-[150px]">{valor}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Asignarle valor vacío borra la variable del contexto
                            definirVariableScripting(nombre, '');
                          }}
                          className="opacity-0 group-hover:opacity-100 text-aurora-muted hover:text-red-400 p-1 rounded transition-all"
                          title="Eliminar variable"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsoleMode;