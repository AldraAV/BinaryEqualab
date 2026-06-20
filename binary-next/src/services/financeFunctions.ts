/**
 * Binary EquaLab - Finance Functions (Accounting PRO)
 * 
 * Professional financial calculations for accountants:
 * - VAN (NPV) - Valor Actual Neto
 * - TIR (IRR) - Tasa Interna de Retorno
 * - Depreciación (Linear method)
 * - Interés Simple/Compuesto
 * - Ratios Financieros
 */

export interface FinanceResult {
    value: number;
    formatted: string;
    latex: string;
    breakdown?: string[];
}

/**
 * VAN (NPV) - Valor Actual Neto
 * VAN = Σ(Ft / (1 + r)^t) for t = 0 to n
 * 
 * @param rate - Tasa de descuento (ej: 0.10 para 10%)
 * @param cashFlows - Array de flujos [-inversión, flujo1, flujo2, ...]
 */
export function van(rate: number, cashFlows: number[]): FinanceResult {
    let npv = 0;
    const breakdown: string[] = [];

    for (let t = 0; t < cashFlows.length; t++) {
        const discountedValue = cashFlows[t] / Math.pow(1 + rate, t);
        npv += discountedValue;
        breakdown.push(`Periodo ${t}: ${cashFlows[t].toFixed(2)} / (1 + ${rate})^${t} = ${discountedValue.toFixed(2)}`);
    }

    return {
        value: npv,
        formatted: `$${npv.toFixed(2)}`,
        latex: `\\text{VAN} = ${npv.toFixed(2)}`,
        breakdown
    };
}

/**
 * TIR (IRR) - Tasa Interna de Retorno
 * Encuentra r donde VAN = 0
 * Usa método de Newton-Raphson
 * 
 * @param cashFlows - Array de flujos [-inversión, flujo1, flujo2, ...]
 * @param guess - Estimación inicial (default 0.1 = 10%)
 */
export function tir(cashFlows: number[], guess: number = 0.1): FinanceResult {
    const maxIterations = 100;
    const tolerance = 0.00001;
    let rate = guess;

    for (let i = 0; i < maxIterations; i++) {
        let npv = 0;
        let derivativeNpv = 0;

        for (let t = 0; t < cashFlows.length; t++) {
            npv += cashFlows[t] / Math.pow(1 + rate, t);
            if (t > 0) {
                derivativeNpv -= t * cashFlows[t] / Math.pow(1 + rate, t + 1);
            }
        }

        const newRate = rate - npv / derivativeNpv;

        if (Math.abs(newRate - rate) < tolerance) {
            const percentage = newRate * 100;
            return {
                value: newRate,
                formatted: `${percentage.toFixed(2)}%`,
                latex: `\\text{TIR} = ${percentage.toFixed(2)}\\%`,
                breakdown: [`Convergió en ${i + 1} iteraciones`]
            };
        }
        rate = newRate;
    }

    // Fallback if no convergence
    const percentage = rate * 100;
    return {
        value: rate,
        formatted: `≈${percentage.toFixed(2)}%`,
        latex: `\\text{TIR} \\approx ${percentage.toFixed(2)}\\%`,
        breakdown: ['No convergió completamente']
    };
}

/**
 * Depreciación (Método Lineal / Línea Recta)
 * D = (Costo - ValorResidual) / VidaÚtil
 * 
 * @param cost - Costo del activo
 * @param residual - Valor residual al final
 * @param years - Vida útil en años
 */
export function depreciar(cost: number, residual: number, years: number): FinanceResult {
    const annualDep = (cost - residual) / years;
    const breakdown: string[] = [
        `Costo inicial: $${cost.toFixed(2)}`,
        `Valor residual: $${residual.toFixed(2)}`,
        `Vida útil: ${years} años`,
        `Depreciación anual: ($${cost} - $${residual}) / ${years} = $${annualDep.toFixed(2)}`
    ];

    // Add depreciation schedule
    let bookValue = cost;
    for (let year = 1; year <= years; year++) {
        bookValue -= annualDep;
        breakdown.push(`Año ${year}: Valor en libros = $${bookValue.toFixed(2)}`);
    }

    return {
        value: annualDep,
        formatted: `$${annualDep.toFixed(2)}/año`,
        latex: `D = \\frac{${cost} - ${residual}}{${years}} = ${annualDep.toFixed(2)}`,
        breakdown
    };
}

/**
 * Interés Simple
 * I = C × r × t
 * 
 * @param capital - Capital inicial
 * @param rate - Tasa de interés (ej: 0.05 para 5%)
 * @param time - Tiempo en períodos
 */
export function interesSimple(capital: number, rate: number, time: number): FinanceResult {
    const interest = capital * rate * time;
    const total = capital + interest;

    return {
        value: interest,
        formatted: `I = $${interest.toFixed(2)}, Total = $${total.toFixed(2)}`,
        latex: `I = ${capital} \\times ${rate} \\times ${time} = ${interest.toFixed(2)}`,
        breakdown: [
            `Capital: $${capital}`,
            `Tasa: ${(rate * 100).toFixed(2)}%`,
            `Tiempo: ${time} períodos`,
            `Interés: $${interest.toFixed(2)}`,
            `Monto final: $${total.toFixed(2)}`
        ]
    };
}

/**
 * Interés Compuesto
 * VF = VA × (1 + r/n)^(n×t)
 * 
 * @param capital - Capital inicial (VA)
 * @param rate - Tasa de interés anual
 * @param n - Número de capitalizaciones por período
 * @param time - Tiempo en años
 */
export function interesCompuesto(capital: number, rate: number, n: number, time: number): FinanceResult {
    const futureValue = capital * Math.pow(1 + rate / n, n * time);
    const interest = futureValue - capital;

    return {
        value: futureValue,
        formatted: `VF = $${futureValue.toFixed(2)}`,
        latex: `VF = ${capital} \\times (1 + \\frac{${rate}}{${n}})^{${n} \\times ${time}} = ${futureValue.toFixed(2)}`,
        breakdown: [
            `Capital inicial (VA): $${capital}`,
            `Tasa anual: ${(rate * 100).toFixed(2)}%`,
            `Capitalizaciones/año: ${n}`,
            `Tiempo: ${time} años`,
            `Valor Futuro (VF): $${futureValue.toFixed(2)}`,
            `Interés ganado: $${interest.toFixed(2)}`
        ]
    };
}

/**
 * Flujo de Caja
 * FC = Ingresos - Gastos
 * 
 * @param ingresos - Total de ingresos
 * @param gastos - Total de gastos
 */
export function flujoCaja(ingresos: number, gastos: number): FinanceResult {
    const flujo = ingresos - gastos;
    const status = flujo >= 0 ? 'Positivo ✓' : 'Negativo ✗';

    return {
        value: flujo,
        formatted: `$${flujo.toFixed(2)} (${status})`,
        latex: `\\text{FC} = ${ingresos} - ${gastos} = ${flujo.toFixed(2)}`,
        breakdown: [
            `Ingresos: $${ingresos.toFixed(2)}`,
            `Gastos: $${gastos.toFixed(2)}`,
            `Flujo neto: $${flujo.toFixed(2)}`,
            `Estado: ${status}`
        ]
    };
}

/**
 * Ratio de Liquidez
 * Liquidez = Activo Corriente / Pasivo Corriente
 * 
 * > 1: Buena liquidez
 * < 1: Problemas de liquidez
 */
export function ratioLiquidez(activoCorriente: number, pasivoCorriente: number): FinanceResult {
    const ratio = activoCorriente / pasivoCorriente;
    const status = ratio >= 1 ? 'Saludable ✓' : 'Riesgo ✗';

    return {
        value: ratio,
        formatted: `${ratio.toFixed(2)} (${status})`,
        latex: `\\text{Liquidez} = \\frac{${activoCorriente}}{${pasivoCorriente}} = ${ratio.toFixed(2)}`,
        breakdown: [
            `Activo Corriente: $${activoCorriente.toFixed(2)}`,
            `Pasivo Corriente: $${pasivoCorriente.toFixed(2)}`,
            `Ratio: ${ratio.toFixed(2)}`,
            ratio >= 1.5 ? 'Excelente liquidez' :
                ratio >= 1 ? 'Liquidez aceptable' :
                    'Problemas de liquidez'
        ]
    };
}

/**
 * Ratio de Endeudamiento
 * Endeudamiento = Pasivo Total / Patrimonio
 * 
 * < 0.5: Bajo endeudamiento
 * 0.5-1: Moderado
 * > 1: Alto endeudamiento
 */
export function ratioEndeudamiento(pasivoTotal: number, patrimonio: number): FinanceResult {
    const ratio = pasivoTotal / patrimonio;
    let status = '';
    if (ratio < 0.5) status = 'Bajo endeudamiento ✓';
    else if (ratio <= 1) status = 'Moderado';
    else status = 'Alto endeudamiento ⚠';

    return {
        value: ratio,
        formatted: `${ratio.toFixed(2)} (${status})`,
        latex: `\\text{Endeud.} = \\frac{${pasivoTotal}}{${patrimonio}} = ${ratio.toFixed(2)}`,
        breakdown: [
            `Pasivo Total: $${pasivoTotal.toFixed(2)}`,
            `Patrimonio: $${patrimonio.toFixed(2)}`,
            `Ratio: ${ratio.toFixed(2)}`,
            status
        ]
    };
}

/**
 * ROI - Retorno sobre Inversión
 * ROI = (Ganancia - Inversión) / Inversión × 100%
 */
export function roi(ganancia: number, inversion: number): FinanceResult {
    const roiValue = ((ganancia - inversion) / inversion) * 100;
    const status = roiValue >= 0 ? 'Rentable ✓' : 'Pérdida ✗';

    return {
        value: roiValue,
        formatted: `${roiValue.toFixed(2)}% (${status})`,
        latex: `\\text{ROI} = \\frac{${ganancia} - ${inversion}}{${inversion}} \\times 100\\% = ${roiValue.toFixed(2)}\\%`,
        breakdown: [
            `Ganancia: $${ganancia.toFixed(2)}`,
            `Inversión: $${inversion.toFixed(2)}`,
            `ROI: ${roiValue.toFixed(2)}%`,
            status
        ]
    };
}

// Function registry for console integration
export const FINANCE_FUNCTIONS: Record<string, (...args: number[]) => FinanceResult> = {
    'van': (rate: number, ...flows: number[]) => van(rate, flows),
    'tir': (...flows: number[]) => tir(flows),
    'depreciar': (cost: number, residual: number, years: number) => depreciar(cost, residual, years),
    'interes_simple': (capital: number, rate: number, time: number) => interesSimple(capital, rate, time),
    'interes_compuesto': (capital: number, rate: number, n: number, time: number) => interesCompuesto(capital, rate, n, time),
    'flujo': (ingresos: number, gastos: number) => flujoCaja(ingresos, gastos),
    'liquidez': (activo: number, pasivo: number) => ratioLiquidez(activo, pasivo),
    'endeudamiento': (pasivo: number, patrimonio: number) => ratioEndeudamiento(pasivo, patrimonio),
    'roi': (ganancia: number, inversion: number) => roi(ganancia, inversion),
};

// Help strings for autocomplete
export const FINANCE_FUNCTION_DEFS = [
    {
        name: 'van',
        syntax: 'van(tasa, -inv, f1, f2, f3...)',
        description: { es: 'Valor Actual Neto (VAN/NPV)', en: 'Net Present Value' },
        example: 'van(0.10, -1000, 300, 400, 500)'
    },
    {
        name: 'tir',
        syntax: 'tir(-inv, f1, f2, f3...)',
        description: { es: 'Tasa Interna de Retorno (TIR/IRR)', en: 'Internal Rate of Return' },
        example: 'tir(-1000, 300, 400, 500)'
    },
    {
        name: 'depreciar',
        syntax: 'depreciar(costo, residual, años)',
        description: { es: 'Depreciación lineal anual', en: 'Straight-line depreciation' },
        example: 'depreciar(10000, 1000, 5)'
    },
    {
        name: 'interes_simple',
        syntax: 'interes_simple(capital, tasa, tiempo)',
        description: { es: 'Interés simple I = C×r×t', en: 'Simple interest' },
        example: 'interes_simple(5000, 0.05, 3)'
    },
    {
        name: 'interes_compuesto',
        syntax: 'interes_compuesto(capital, tasa, n, tiempo)',
        description: { es: 'Interés compuesto VF = VA(1+r/n)^(nt)', en: 'Compound interest' },
        example: 'interes_compuesto(5000, 0.05, 12, 3)'
    },
    {
        name: 'flujo',
        syntax: 'flujo(ingresos, gastos)',
        description: { es: 'Flujo de caja neto', en: 'Net cash flow' },
        example: 'flujo(15000, 12000)'
    },
    {
        name: 'liquidez',
        syntax: 'liquidez(activo_corriente, pasivo_corriente)',
        description: { es: 'Ratio de liquidez', en: 'Liquidity ratio' },
        example: 'liquidez(50000, 30000)'
    },
    {
        name: 'endeudamiento',
        syntax: 'endeudamiento(pasivo_total, patrimonio)',
        description: { es: 'Ratio de endeudamiento', en: 'Debt ratio' },
        example: 'endeudamiento(40000, 60000)'
    },
    {
        name: 'roi',
        syntax: 'roi(ganancia, inversion)',
        description: { es: 'Retorno sobre inversión', en: 'Return on Investment' },
        example: 'roi(15000, 10000)'
    }
];
