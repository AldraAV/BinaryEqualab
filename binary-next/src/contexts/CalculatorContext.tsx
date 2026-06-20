"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AngleMode = 'DEG' | 'RAD' | 'GRAD';

export interface UserFunction {
    name: string;
    params: string[];
    body: string;
}

interface CalculatorContextType {
    angleMode: AngleMode;
    setAngleMode: (mode: AngleMode) => void;

    // Variables de Scripting ($nombre = valor, estilo MATLAB)
    variablesScripting: Record<string, string>;
    definirVariableScripting: (name: string, value: string) => void;

    // Memorias estáticas de la Calculadora (A, B, C, D, E, F, X, Y, M, estilo CASIO)
    memoriasCalculadora: Record<string, string>;
    guardarEnMemoria: (celda: string, value: string) => void;

    // Matrices (MatA, MatB, MatC, MatD, MatE)
    matricesCalculadora: Record<string, number[][]>;
    guardarEnMatriz: (nombre: string, matriz: number[][]) => void;

    // Compatibilidad heredada (mapeado a variables de scripting)
    variables: Record<string, string>;
    setVariable: (name: string, value: string) => void;

    ans: string;
    setAns: (value: string) => void;

    // Funciones definidas por el usuario
    userFunctions: Record<string, UserFunction>;
    defineFunction: (name: string, params: string[], body: string) => void;
    removeFunction: (name: string) => void;
    getUserFunction: (name: string) => UserFunction | undefined;

    // Modos
    isExact: boolean;
    toggleExact: () => void;

    toRadians: (value: number) => number;
    fromRadians: (value: number) => number;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export const CalculatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
    const [variablesScripting, setVariablesScripting] = useState<Record<string, string>>({});
    const [memoriasCalculadora, setMemoriasCalculadora] = useState<Record<string, string>>({
        A: '0', B: '0', C: '0', D: '0', E: '0', F: '0', X: '0', Y: '0', M: '0'
    });
    const [matricesCalculadora, setMatricesCalculadora] = useState<Record<string, number[][]>>({
        A: [[0, 0], [0, 0]], B: [[0, 0], [0, 0]], C: [[0, 0], [0, 0]], D: [[0, 0], [0, 0]], E: [[0, 0], [0, 0]]
    });
    const [ans, setAns] = useState<string>('0');
    const [isExact, setIsExact] = useState<boolean>(false);
    const [userFunctions, setUserFunctions] = useState<Record<string, UserFunction>>({});

    const definirVariableScripting = (name: string, value: string) => {
        const nombreConPrefijo = name.startsWith('$') ? name : `$${name}`;
        setVariablesScripting(prev => ({ ...prev, [nombreConPrefijo]: value }));
    };

    const guardarEnMemoria = (celda: string, value: string) => {
        const celdaMayuscula = celda.toUpperCase();
        setMemoriasCalculadora(prev => ({ ...prev, [celdaMayuscula]: value }));
    };

    const guardarEnMatriz = (nombre: string, matriz: number[][]) => {
        const nombreMayuscula = nombre.toUpperCase();
        setMatricesCalculadora(prev => ({ ...prev, [nombreMayuscula]: matriz }));
    };

    // Mapeo por compatibilidad heredada
    const setVariable = (name: string, value: string) => {
        definirVariableScripting(name, value);
    };

    const defineFunction = (name: string, params: string[], body: string) => {
        setUserFunctions(prev => ({ ...prev, [name]: { name, params, body } }));
    };

    const removeFunction = (name: string) => {
        setUserFunctions(prev => {
            const updated = { ...prev };
            delete updated[name];
            return updated;
        });
    };

    const getUserFunction = (name: string): UserFunction | undefined => {
        return userFunctions[name];
    };

    const toggleExact = () => setIsExact(prev => !prev);

    const toRadians = (value: number): number => {
        switch (angleMode) {
            case 'DEG': return value * (Math.PI / 180);
            case 'GRAD': return value * (Math.PI / 200);
            case 'RAD': default: return value;
        }
    };

    const fromRadians = (value: number): number => {
        switch (angleMode) {
            case 'DEG': return value * (180 / Math.PI);
            case 'GRAD': return value * (200 / Math.PI);
            case 'RAD': default: return value;
        }
    };

    return (
        <CalculatorContext.Provider value={{
            angleMode, setAngleMode,
            variablesScripting, definirVariableScripting,
            memoriasCalculadora, guardarEnMemoria,
            matricesCalculadora, guardarEnMatriz,
            variables: variablesScripting, setVariable, // Compatibilidad heredada
            ans, setAns,
            userFunctions, defineFunction, removeFunction, getUserFunction,
            isExact, toggleExact,
            toRadians, fromRadians
        }}>
            {children}
        </CalculatorContext.Provider>
    );
};

export const useCalculator = () => {
    const context = useContext(CalculatorContext);
    if (!context) {
        throw new Error('useCalculator must be used within a CalculatorProvider');
    }
    return context;
};

