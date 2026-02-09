import React, { createContext, useContext, useState, ReactNode } from 'react';
import { HistoryItem } from '../types/types';
import apiService from '../services/apiService';

interface CalculatorState {
    expression: string;
    displayLatex: string;
    history: HistoryItem[];
    isLoading: boolean;
    error: string | null;
}

interface CalculatorContextType extends CalculatorState {
    setExpression: (expr: string) => void;
    appendToExpression: (value: string) => void;
    backspace: () => void;
    clear: () => void;
    evaluate: () => Promise<void>;
    executeAction: (actionId: string) => Promise<void>;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export function CalculatorProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<CalculatorState>({
        expression: '',
        displayLatex: '',
        history: [],
        isLoading: false,
        error: null,
    });

    const setExpression = (expr: string) => {
        setState(prev => ({ ...prev, expression: expr, displayLatex: expr }));
    };

    const appendToExpression = (value: string) => {
        setState(prev => ({
            ...prev,
            expression: prev.expression + value,
            displayLatex: prev.expression + value,
        }));
    };

    const backspace = () => {
        setState(prev => ({
            ...prev,
            expression: prev.expression.slice(0, -1),
            displayLatex: prev.displayLatex.slice(0, -1),
        }));
    };

    const clear = () => {
        setState(prev => ({
            ...prev,
            expression: '',
            displayLatex: '',
            error: null,
        }));
    };

    const evaluate = async () => {
        if (!state.expression.trim()) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const result = await apiService.simplify(state.expression);

            const historyItem: HistoryItem = {
                id: Date.now().toString(),
                expression: state.expression,
                result: result.latex || result.result,
                timestamp: new Date(),
            };

            setState(prev => ({
                ...prev,
                history: [historyItem, ...prev.history],
                expression: '',
                displayLatex: result.latex || result.result,
                isLoading: false,
            }));
        } catch (e: any) {
            setState(prev => ({
                ...prev,
                error: e.message || 'Error evaluando expresión',
                isLoading: false,
            }));
        }
    };

    const executeAction = async (actionId: string) => {
        if (!state.expression.trim()) return;

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            let result;
            const expr = state.expression;

            switch (actionId) {
                case 'DERIVATIVE':
                    result = await apiService.derivative(expr);
                    break;
                case 'INTEGRAL':
                    result = await apiService.integral(expr);
                    break;
                case 'SOLVE':
                    result = await apiService.solve(expr);
                    break;
                case 'SIMPLIFY':
                    result = await apiService.simplify(expr);
                    break;
                case 'FACTOR':
                    result = await apiService.factor(expr);
                    break;
                case 'EXPAND':
                    result = await apiService.expand(expr);
                    break;
                default:
                    result = await apiService.simplify(expr);
            }

            const historyItem: HistoryItem = {
                id: Date.now().toString(),
                expression: `${actionId.toLowerCase()}(${expr})`,
                result: result.latex || result.result,
                timestamp: new Date(),
            };

            setState(prev => ({
                ...prev,
                history: [historyItem, ...prev.history],
                expression: '',
                displayLatex: result.latex || result.result,
                isLoading: false,
            }));
        } catch (e: any) {
            setState(prev => ({
                ...prev,
                error: e.message || 'Error ejecutando acción',
                isLoading: false,
            }));
        }
    };

    return (
        <CalculatorContext.Provider
            value={{
                ...state,
                setExpression,
                appendToExpression,
                backspace,
                clear,
                evaluate,
                executeAction,
            }}
        >
            {children}
        </CalculatorContext.Provider>
    );
}

export function useCalculator() {
    const context = useContext(CalculatorContext);
    if (context === undefined) {
        throw new Error('useCalculator must be used within a CalculatorProvider');
    }
    return context;
}
