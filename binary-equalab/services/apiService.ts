/**
 * Binary EquaLab - API Service
 * 
 * Connects to the FastAPI backend for symbolic math operations.
 * Falls back to client-side Nerdamer if backend is unavailable.
 */

// @ts-ignore - Vite provides import.meta.env
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

interface MathResponse {
    result: string;
    latex?: string;
    success: boolean;
    error?: string;
}

interface ExpressionRequest {
    expression: string;
    variable?: string;
}

interface DerivativeRequest extends ExpressionRequest {
    order?: number;
}

interface IntegralRequest extends ExpressionRequest {
    lower_bound?: number;
    upper_bound?: number;
}

interface LimitRequest extends ExpressionRequest {
    point: number;
    direction?: string;
}

interface TaylorRequest extends ExpressionRequest {
    point?: number;
    order?: number;
}

class ApiService {
    private baseUrl: string;
    private isBackendAvailable: boolean = true;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.checkBackendHealth();
    }

    async checkBackendHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            });
            this.isBackendAvailable = response.ok;
            return this.isBackendAvailable;
        } catch {
            this.isBackendAvailable = false;
            console.warn('Backend not available, using client-side math');
            return false;
        }
    }

    private async post<T>(endpoint: string, body: object): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        return response.json();
    }

    // Math Operations
    async simplify(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/simplify', { expression, variable });
    }

    async expand(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/expand', { expression, variable });
    }

    async factor(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/factor', { expression, variable });
    }

    async derivative(expression: string, variable: string = 'x', order: number = 1): Promise<MathResponse> {
        return this.post('/api/derivative', { expression, variable, order });
    }

    async integral(
        expression: string,
        variable: string = 'x',
        lowerBound?: number,
        upperBound?: number
    ): Promise<MathResponse> {
        return this.post('/api/integral', {
            expression,
            variable,
            lower_bound: lowerBound,
            upper_bound: upperBound
        });
    }

    async solve(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/solve', { expression, variable });
    }

    async limit(
        expression: string,
        variable: string = 'x',
        point: number = 0,
        direction: string = '+'
    ): Promise<MathResponse> {
        return this.post('/api/limit', { expression, variable, point, direction });
    }

    async taylor(
        expression: string,
        variable: string = 'x',
        point: number = 0,
        order: number = 5
    ): Promise<MathResponse> {
        return this.post('/api/taylor', { expression, variable, point, order });
    }

    async laplace(expression: string): Promise<MathResponse> {
        return this.post('/api/laplace', { expression });
    }

    async fourier(expression: string): Promise<MathResponse> {
        return this.post('/api/fourier', { expression });
    }

    async toLatex(expression: string): Promise<MathResponse> {
        return this.post('/api/latex', { expression });
    }

    // Utility
    get isAvailable(): boolean {
        return this.isBackendAvailable;
    }
}

// Singleton instance
export const apiService = new ApiService();
export default apiService;
