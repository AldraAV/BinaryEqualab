# Binary EquaLab - Gap Analysis (Lo que falta)

## 🔴 CRÍTICO (Básico faltante)

| Feature                      | Documentado | Web | Desktop | Prioridad |
| ---------------------------- | ----------- | --- | ------- | --------- |
| **Variables** `a = 5`        | ✅           | ❌   | ❌       | 🔴 HIGH    |
| **ANS** (último resultado)   | ✅           | ❌   | ❌       | 🔴 HIGH    |
| **Toggle EXACT ↔ APPROX**    | ✅           | ❌   | ❌       | 🔴 HIGH    |
| **Fracciones** a/b ↔ decimal | ✅           | ❌   | ❌       | 🔴 HIGH    |
| **Factorial** n!             | ✅           | 🔶   | ✅       | 🟡 MED     |
| **nPr, nCr**                 | ✅           | ❌   | ❌       | 🟡 MED     |

## 🟡 KEYPAD - Faltantes

| Actual                 | Necesita               |
| ---------------------- | ---------------------- |
| MAIN, ABC, FUNC, CONST | + **GREEK** (α,β,θ...) |
| Sin botón EXP          | EXP (×10ⁿ)             |
| Sin botón %            | % (porcentaje)         |
| Sin botón 1/x          | 1/x (recíproco)        |
| Sin cot, sec, csc      | Trig completas         |

## 🟠 MODOS - Estado actual

| Mode        | Web | Desktop | Status                    |
| ----------- | --- | ------- | ------------------------- |
| Console     | ✅   | ✅       | Básico funciona           |
| Graphing    | ✅   | ✅       | Bastante completo         |
| Matrix      | ✅   | ✅       | Web: 1 matriz, Desktop: 2 |
| Equations   | ❌   | ❌       | NO existe                 |
| Statistics  | ❌   | ❌       | NO existe                 |
| Spreadsheet | ❌   | 🔶       | Solo Desktop (Accounting) |
| Complex     | ❌   | ❌       | NO existe (solo i básico) |
| Vectors     | ❌   | ❌       | NO existe                 |

## 🟢 YA IMPLEMENTADO

- ✅ Console: Input/Output básico, history, constantes físicas
- ✅ Trig: sin, cos, tan, asin, acos, atan, sinh, cosh, tanh
- ✅ Powers: sqrt, cbrt, ^, dropdowns
- ✅ Logs: ln, log, exp
- ✅ Calculus: diff, integrate (indefinida/definida), d/dx
- ✅ Graphing: Funciones, derivadas, integrales, zoom, pan
- ✅ Matrix: Operaciones básicas, det, inv, transpose, eigenvalues

## 📋 TOP 5 para implementar YA

1. **Variables + ANS** - Core de cualquier calculadora
2. **Toggle Exact/Approx** - Diferenciador clave vs calculadoras tontas
3. **EXP button** (×10ⁿ) - Básico para científica
4. **Greek Tab** en keypad - α, β, θ, etc.
5. **Fracciones** - Display y operaciones
