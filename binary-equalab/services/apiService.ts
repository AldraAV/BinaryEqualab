/**
 * Binary EquaLab - API Service
 * 
 * Connects to the FastAPI backend for symbolic math operations.
 * Todos los cálculos se delegan de forma estricta al backend.
 */

// @ts-ignore - Vite provides import.meta.env
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

interface MathResponse {
    result: string;
    latex?: string;
    approx?: string; // Agregado para aproximación numérica del backend
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
        return this.post('/api/cas/simplify', { expression, variable });
    }

    async evaluate(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/cas/evaluate', { expression, var: variable });
    }

    async expand(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/cas/expand', { expression, variable });
    }

    async factor(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/cas/factor', { expression, variable });
    }

    async derivative(expression: string, variable: string = 'x', order: number = 1): Promise<MathResponse> {
        return this.post('/api/cas/derivative', { expression, variable, order });
    }

    async integral(
        expression: string,
        variable: string = 'x',
        lowerBound?: number,
        upperBound?: number
    ): Promise<MathResponse> {
        return this.post('/api/cas/integrate', {
            expression,
            variable,
            lower_bound: lowerBound,
            upper_bound: upperBound
        });
    }

    async solveEquation(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/cas/solve-equation', { expression, variable });
    }

    async solveSystem(equations: string[], variables: string[]): Promise<MathResponse> {
        return this.post('/api/cas/solve-system', { equations, variables });
    }

    async solveInequality(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/cas/solve-inequality', { expression, variable });
    }

    async solveODE(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/cas/solve-ode', { expression, variable });
    }

    async limit(
        expression: string,
        variable: string = 'x',
        point: string = '0',
        direction: string = '+'
    ): Promise<MathResponse> {
        return this.post('/api/cas/limit', { expression, variable, point, direction });
    }

    async taylor(
        expression: string,
        variable: string = 'x',
        point: string = '0',
        order: number = 5
    ): Promise<MathResponse> {
        return this.post('/api/cas/taylor', { expression, variable, point, order });
    }

    async laplace(expression: string): Promise<MathResponse> {
        return this.post('/api/cas/laplace', { expression });
    }

    async fourier(expression: string): Promise<MathResponse> {
        return this.post('/api/cas/fourier', { expression });
    }

    async ilaplace(expression: string): Promise<MathResponse> {
        return this.post('/api/cas/ilaplace', { expression });
    }

    async ifourier(expression: string): Promise<MathResponse> {
        return this.post('/api/cas/ifourier', { expression });
    }

    async toLatex(expression: string): Promise<MathResponse> {
        return this.post('/api/latex', { expression });
    }

    async plot(expression: string, variable: string = 'x', xMin: number = -10, xMax: number = 10, points: number = 200): Promise<{expression: string, points: {x: number, y: number}[], success: boolean}> {
        return this.post('/api/cas/plot', { expression, var: variable, x_min: xMin, x_max: xMax, points });
    }

    async calculateComplex(op: string, z1: { re: number, im: number }, z2: { re: number, im: number }, n: number = 2): Promise<{
        result: { re: number, im: number };
        polar: { r: number, theta: number, theta_deg: number };
        latex: string;
        success: boolean;
    }> {
        return this.post('/api/cas/complex/calculate', { op, z1, z2, n });
    }

    async calculateVectors(op: string, v1: number[], v2: number[], k: number = 1.0): Promise<{
        result?: number[];
        result_scalar?: number;
        text: string;
        properties: string[];
        success: boolean;
    }> {
        return this.post('/api/cas/vectors/calculate', { op, v1, v2, k });
    }

    // Utility
    get isAvailable(): boolean {
        return this.isBackendAvailable;
    }
}

// Singleton instance
export const apiService = new ApiService();
export default apiService;
