export enum AppMode {
    CONSOLE = 'CONSOLE',
    GRAPHING = 'GRAPHING',
    MATRIX = 'MATRIX',
    ACCOUNTING = 'ACCOUNTING',
    EQUATIONS = 'EQUATIONS',
    STATISTICS = 'STATISTICS',
    COMPLEX = 'complex',
    VECTORS = 'vectors',
    DASHBOARD = 'dashboard'
}

export interface HistoryItem {
    id: string;
    expression: string;
    result: string;
    approxResult?: string;
    timestamp: Date;
    easterEgg?: {
        message?: string;
        emoji?: string;
        animation?: string;
    };
}

export interface MathAction {
    id: string;
    labelEs: string;
    labelEn: string;
    latexTemplate: string;
    sympyTemplate: string;
    numPlaceholders: number;
}
