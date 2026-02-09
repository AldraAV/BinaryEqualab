/**
 * Binary EquaLab - API Service (React Native)
 * 
 * Connects to the FastAPI backend for symbolic math operations.
 */

const API_BASE_URL = 'https://binary-equa-lab.onrender.com';
const FALLBACK_URL = 'http://10.0.2.2:8000'; // Android emulator localhost

interface MathResponse {
    result: string;
    latex?: string;
    success: boolean;
    error?: string;
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
            });
            this.isBackendAvailable = response.ok;
            return this.isBackendAvailable;
        } catch {
            // Try fallback
            try {
                const response = await fetch(`${FALLBACK_URL}/health`);
                if (response.ok) {
                    this.baseUrl = FALLBACK_URL;
                    this.isBackendAvailable = true;
                    return true;
                }
            } catch {}
            this.isBackendAvailable = false;
            console.warn('Backend not available');
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

    async toLatex(expression: string): Promise<MathResponse> {
        return this.post('/api/latex', { expression });
    }

    get isAvailable(): boolean {
        return this.isBackendAvailable;
    }
}

export const apiService = new ApiService();
export default apiService;
