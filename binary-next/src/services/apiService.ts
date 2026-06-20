/**
 * Binary EquaLab - API Service
 * 
 * Connects to the FastAPI backend for symbolic math operations.
 * Todos los cálculos se delegan de forma estricta al backend.
 */

// API base URL is defined in env
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface MathResponse {
    result: string;
    latex?: string;
    approx?: string; // Agregado para aproximación numérica del backend
    num_a?: number;
    num_b?: number;
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
    lower_bound?: number | string;
    upper_bound?: number | string;
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
            let errorMsg = `API error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.detail) {
                    errorMsg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
                }
            } catch (e) {
                // Ignore parse errors for error body
            }
            throw new Error(errorMsg);
        }

        return response.json();
    }

    // Math Operations
    async simplify(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/cas/simplify', { expression, variable });
    }

    async evaluate(expression: string, variable: string = 'x'): Promise<MathResponse> {
        return this.post('/api/consola/evaluar', { expression, variable });
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

    async integral(expression: string, variable: string = 'x', lowerBound?: number | string, upperBound?: number | string): Promise<MathResponse> {
        const res = await this.post<MathResponse>('/api/cas/integrate', {
            expression,
            var: variable,
            lower_bound: lowerBound,
            upper_bound: upperBound
        });
        return { ...res, success: true };
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

    // Statistics
    async statDescriptive(data: number[]): Promise<any> {
        return this.post('/api/statistics/descriptive', { data });
    }

    async statRegression(points: { x: number; y: number }[]): Promise<any> {
        return this.post('/api/statistics/regression', { points });
    }

    async statNormal(mean: number, std: number, x?: number, prob?: number): Promise<any> {
        return this.post('/api/statistics/normal', { mean, std, x, prob });
    }

    async statBinomial(n: number, p: number, x: number): Promise<any> {
        return this.post('/api/statistics/binomial', { n, p, x });
    }

    async statPoisson(lam: number, x: number): Promise<any> {
        return this.post('/api/statistics/poisson', { lam, x });
    }

    // --- Graphics (New Math Engine endpoints) ---
    async graphicsEvaluate(expressions: string[], xMin: number, xMax: number, points: number = 400): Promise<any> {
        return this.post('/api/graphics/evaluate', { expressions, x_min: xMin, x_max: xMax, points });
    }

    async graphicsDerivative(expression: string, xMin: number, xMax: number, points: number = 400): Promise<any> {
        return this.post('/api/graphics/derivative', { expression, x_min: xMin, x_max: xMax, points });
    }

    async graphicsConvolution(fExpr: string, gExpr: string, tVal: number, xMin: number = -10, xMax: number = 10, curvePoints: number = 100): Promise<any> {
        return this.post('/api/graphics/convolution', { f_expr: fExpr, g_expr: gExpr, t_val: tVal, x_min: xMin, x_max: xMax, curve_points: curvePoints });
    }

    // --- Epicycles PRO (New Math Engine endpoints) ---
    async epicyclesFft(points: { x: number, y: number }[]): Promise<any> {
        return this.post('/api/epicycles/fft', { points });
    }

    async epicyclesSmooth(points: { x: number, y: number }[], iterations: number = 3): Promise<any> {
        return this.post('/api/epicycles/smooth', { points, iterations });
    }

    async epicyclesParseParametric(expression: string, samples: number = 200): Promise<any> {
        return this.post('/api/epicycles/parse_parametric', { expression, samples });
    }

    async epicyclesPresetWave(waveType: string, numCircles: number, baseAmplitude: number = 100.0): Promise<any> {
        return this.post('/api/epicycles/preset_wave', { wave_type: waveType, num_circles: numCircles, base_amplitude: baseAmplitude });
    }

    // Utility
    get isAvailable(): boolean {
        return this.isBackendAvailable;
    }
}

// Singleton instance
export const apiService = new ApiService();
export default apiService;

