# Binary EquaLab - Complete CAS Feature Specification

> 🎯 **Vision:** Calculadora científica completa tipo Casio fx-991/ClassPad + MATLAB + Photomath

---

## 🖥️ Console Mode (MATLAB-like)

### Core Features
| Feature        | Description                               |
| -------------- | ----------------------------------------- |
| **Variables**  | Almacenar/recuperar: `a = 5`, `b = a + 3` |
| **ANS**        | Último resultado (tipo Casio)             |
| **History**    | Navegación con ↑↓                         |
| **Multi-line** | Scripts con `;` separador                 |
| **AC**         | Clear todo, C = clear input               |

### Output Formats
- **Exact** (simbólico): `√2`, `π/4`, `3/7`
- **Approx** (~): `1.414...`, `0.785...`, `0.428...`
- **Scientific**: `1.23×10⁵`
- **Engineering**: `123×10³`
- **Fraction**: `a/b` ↔ decimal
- **Mixed**: `1 2/3`

---

## ⌨️ Keypads

### 🔢 Numeric Keypad
```
7  8  9  ÷  DEL
4  5  6  ×  (
1  2  3  -  )
0  .  EXP +  =
```

### 🔤 Algebraic Keypad
```
x  y  z  t  n
a  b  c  d  k
,  :  ;  _  →
```

### 🇬🇷 Greek Alphabet
| Letter    | Use                  |
| --------- | -------------------- |
| α β γ δ ε | Variables/constantes |
| θ φ ψ     | Ángulos              |
| λ μ σ ω   | Física/estadística   |
| Σ Π ∫ ∂   | Operadores           |

### 🔬 Constants
| Symbol | Value      | Name             |
| ------ | ---------- | ---------------- |
| π      | 3.14159... | Pi               |
| e      | 2.71828... | Euler            |
| i      | √(-1)      | Imaginaria       |
| φ      | (1+√5)/2   | Áurea            |
| γ      | 0.57721... | Euler-Mascheroni |

---

## 📐 Functions

### Trigonometric
| Standard    | Inverse        | Hyperbolic     | Inv. Hyp.         |
| ----------- | -------------- | -------------- | ----------------- |
| sin cos tan | asin acos atan | sinh cosh tanh | asinh acosh atanh |
| csc sec cot | acsc asec acot | csch sech coth | acsch asech acoth |

### Powers & Roots
| Function      | Syntax | Example          |
| ------------- | ------ | ---------------- |
| Cuadrado      | x²     | `x^2`            |
| Potencia      | xⁿ     | `x^n`            |
| Raíz cuadrada | √x     | `sqrt(x)`        |
| Raíz cúbica   | ∛x     | `cbrt(x)`        |
| Raíz n-ésima  | ⁿ√x    | `nthroot(x, n)`  |
| Recíproco     | 1/x    | `1/x` o `inv(x)` |

### Logarithms
| Function     | Syntax                |
| ------------ | --------------------- |
| Natural (ln) | `ln(x)`               |
| Base 10      | `log(x)` o `log10(x)` |
| Base n       | `logn(x, base)`       |
| Exponencial  | `exp(x)` o `e^x`      |

### Calculus
| Operation        | Syntax                   |
| ---------------- | ------------------------ |
| Derivada         | `diff(f, x)` o `d/dx(f)` |
| Derivada n-ésima | `diff(f, x, n)`          |
| Integral indef.  | `integrate(f, x)`        |
| Integral def.    | `integrate(f, x, a, b)`  |
| Límite           | `limit(f, x, a)`         |
| Sumatoria        | `sum(f, n, a, b)`        |
| Producto         | `product(f, n, a, b)`    |
| Taylor           | `taylor(f, x, a, n)`     |

### Combinatorics & Stats
| Function       | Syntax                |
| -------------- | --------------------- |
| Factorial      | `n!` o `factorial(n)` |
| Permutación    | `nPr(n, r)`           |
| Combinación    | `nCr(n, r)`           |
| Valor absoluto | `abs(x)`              |
| Porcentaje     | `x%` = x/100          |
| Módulo         | `mod(a, b)`           |

---

## 📐 Angle & Coordinate Systems

### Angle Units
| Mode      | Symbol | Conversion      |
| --------- | ------ | --------------- |
| Grados    | °      | 360° = 2π       |
| Radianes  | rad    | 2π = 360°       |
| Gradianes | grad   | 400 grad = 360° |

### DMS (Degrees-Minutes-Seconds)
```
45°30'15" = 45.504166...°
deg2dms(45.504166) → 45°30'15"
dms2deg(45, 30, 15) → 45.504166
```

### Coordinate Conversion
| From        | To          | Function                    |
| ----------- | ----------- | --------------------------- |
| Rectangular | Polar       | `rect2polar(x, y)` → (r, θ) |
| Polar       | Rectangular | `polar2rect(r, θ)` → (x, y) |

---

## 🔢 Number Systems

| Base             | Prefix | Example          |
| ---------------- | ------ | ---------------- |
| Binario (2)      | 0b     | `0b1010` = 10    |
| Octal (8)        | 0o     | `0o12` = 10      |
| Decimal (10)     | -      | `10`             |
| Hexadecimal (16) | 0x     | `0xA` = 10       |
| Base N           | -      | `toBase(num, n)` |

### Operations
```
AND, OR, XOR, NOT, NAND, NOR
SHL (<<), SHR (>>)
```

---

## 📏 Unit Conversion

### SI Prefixes
| Prefix | Symbol | Factor |
| ------ | ------ | ------ |
| exa    | E      | 10¹⁸   |
| peta   | P      | 10¹⁵   |
| tera   | T      | 10¹²   |
| giga   | G      | 10⁹    |
| mega   | M      | 10⁶    |
| kilo   | k      | 10³    |
| milli  | m      | 10⁻³   |
| micro  | μ      | 10⁻⁶   |
| nano   | n      | 10⁻⁹   |
| pico   | p      | 10⁻¹²  |

### Physical Constants
| Symbol | Value       | Unit     |
| ------ | ----------- | -------- |
| c      | 2.998×10⁸   | m/s      |
| G      | 6.674×10⁻¹¹ | N·m²/kg² |
| h      | 6.626×10⁻³⁴ | J·s      |
| k      | 1.381×10⁻²³ | J/K      |
| Nₐ     | 6.022×10²³  | mol⁻¹    |
| e      | 1.602×10⁻¹⁹ | C        |

---

## 🎛️ Application Modes

### 1. Console (CAS)
- MATLAB-like REPL
- Variables persistentes
- Scripts

### 2. Graphing
- Standard 2D y=f(x)
- Parametric (x(t), y(t))
- Polar r(θ)
- Implicit
- 3D surfaces
- Table mode (X → Y)

### 3. Matrices (Linear Algebra)
- Dual matrix A/B
- Operations: +, -, ×, ÷
- det, inv, T (transpose)
- Eigenvalues/vectors
- RREF, Rank
- Solve Ax=b
- LU, QR decomposition

### 4. Equations
- Linear systems (n variables)
- Polynomial solver
- Numerical solver (Newton)
- Inequations
- Complex solutions

### 5. Statistics
- 1-var, 2-var stats
- Distributions (Normal, Binomial, Poisson)
- Regression (linear, quad, exp, log)
- Hypothesis testing

### 6. Spreadsheet (Accounting)
- Cell references A1:B10
- Formulas
- Sum, Average, etc.

### 7. Complex Numbers
- a + bi form
- r∠θ (polar)
- Euler: re^(iθ)
- Operations completas

### 8. Vectors
- 2D, 3D
- Dot product, cross product
- Magnitude, unit vector
- Projection

---

## 🔄 Dual Representation

> Todo lo que tenga forma simbólica debe mostrarse en **ambas formas**

| Input               | Symbolic | Numeric  |
| ------------------- | -------- | -------- |
| `sqrt(2)`           | √2       | ≈ 1.414  |
| `pi/4`              | π/4      | ≈ 0.785  |
| `sin(pi/6)`         | 1/2      | = 0.5    |
| `integrate(x^2, x)` | x³/3     | -        |
| `solve(x^2-2, x)`   | ±√2      | ≈ ±1.414 |

Toggle: **[EXACT]** ↔ **[≈ APPROX]**

---

## 🎨 UI Components

### Function Buttons (INS-style Casio)
- **SHIFT** → Secondary functions
- **ALPHA** → Variables/letters
- **CALC** → Evaluate with values
- **⇄** → Toggle exact/approx
- **FORMAT** → Output format
- **SETUP** → Mode settings

### Display Areas
1. **Input line** - Editable expression
2. **Preview** - Real-time LaTeX render  
3. **Result** - Calculated output
4. **History** - Previous calculations

---

*Binary EquaLab - "The Algebra Also Feels" 🍒*
