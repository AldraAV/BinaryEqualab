import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AngleMode = 'DEG' | 'RAD' | 'GRAD';

interface CalculatorContextType {
    angleMode: AngleMode;
    setAngleMode: (mode: AngleMode) => void;

    // Variables & Memory
    variables: Record<string, string>; // Store as string to keep exactness (e.g. 'sqrt(2)')
    setVariable: (name: string, value: string) => void;
    ans: string;
    setAns: (value: string) => void;

    // Modes
    isExact: boolean;
    toggleExact: () => void;

    // Convert to radians for internal calculations
    toRadians: (value: number) => number;
    // Convert from radians for display
    fromRadians: (value: number) => number;
}

const CalculatorContext = createContext<CalculatorContextType | undefined>(undefined);

export const CalculatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [angleMode, setAngleMode] = useState<AngleMode>('DEG');
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [ans, setAns] = useState<string>('0');
    const [isExact, setIsExact] = useState<boolean>(false);

    const setVariable = (name: string, value: string) => {
        setVariables(prev => ({ ...prev, [name]: value }));
    };

    const toggleExact = () => setIsExact(prev => !prev);

    const toRadians = (value: number): number => {
        switch (angleMode) {
            case 'DEG':
                return value * (Math.PI / 180);
            case 'GRAD':
                return value * (Math.PI / 200);
            case 'RAD':
            default:
                return value;
        }
    };

    const fromRadians = (value: number): number => {
        switch (angleMode) {
            case 'DEG':
                return value * (180 / Math.PI);
            case 'GRAD':
                return value * (200 / Math.PI);
            case 'RAD':
            default:
                return value;
        }
    };

    return (
        <CalculatorContext.Provider value={{
            angleMode, setAngleMode,
            variables, setVariable,
            ans, setAns,
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
