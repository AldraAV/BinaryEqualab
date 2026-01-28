export enum AppMode {
  CONSOLE = 'CONSOLE',
  GRAPHING = 'GRAPHING',
  MATRIX = 'MATRIX',
  ACCOUNTING = 'ACCOUNTING',
  EQUATIONS = 'EQUATIONS',
  STATISTICS = 'STATISTICS',
  COMPLEX = 'COMPLEX',
  VECTORS = 'VECTORS'
}

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;           // Symbolic/exact result (LaTeX)
  approxResult?: string;    // Numeric approximation
  timestamp: Date;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}
