# Binary EquaLab CLI

<p align="center">
  <img src="../docs/banner_cli.png" alt="Binary EquaLab CLI" width="500">
</p>

<p align="center">
  <em>"Las matemáticas también sienten, pero estas no se equivocan."</em>
</p>

---

## 🚀 Installation

```bash
pip install binary-equalab
```

Or from source:
```bash
# En carpeta binary-cli
pip install -e .
bneqls
```
(La opción `-e` hace que los cambios se reflejen al momento sin reinstalar).

### 📱 Termux (Android)
La instalación en Termux nativo requiere compilar algunas dependencias (NumPy/SymPy).

```bash
# 1. Instalar compiladores y librerías del sistema
pkg update
pkg install python clang make pkg-config libjpeg-turbo freetype libpng

# 2. Instalar Binary EquaLab
pip install binary-equalab
```

---

## 🐚 Universal Shell Setup
Binary EquaLab incluye un configurador mágico para tu terminal. Instala temas (Oh My Posh/Zsh), fuentes y plugins automáticamente.

```bash
# Ejecutar configurador
binary setup-shell
# O directamente:
python -m binary_equalab.cli setup-shell
```

Soporta:
-   **Windows**: Oh My Posh + Nerd Fonts.
-   **Termux**: Zsh + Oh My Zsh + Autosuggestions.
-   **Linux**: Recomendaciones de Starship.

## 🚀 Uso del CLI

### 🎮 Interactive TUI (v3.1)
La interfaz inmersiva tipo "Jupyter-Lite" con 50+ autocompletados.

```bash
binary-math tui
```

**Features:**
-   ✨ **Autocompletado & Hints:** Escribe y recibe ayuda contextual.
-   🎹 **Sonificación:** `sonify(sin(440*t))` reproduce el audio automáticamente.
-   📜 **Historial:** Navega con ↑ / ↓.
-   🖥️ **Pretty Print:** Ecuaciones renderizadas con Unicode.

### Rápido REPL Mode
Para consultas rápidas sin interfaz gráfica:
```bash
binary-math
```

```
Binary EquaLab CLI v3.1.0
>>> derivar(x^2 + 3x, x)
→ 2*x + 3

>>> esPrimo(97)
→ Sí, 97 es primo

>>> f(x) := x^2 + 1
→ Función f(x) definida.
>>> f(5)
→ 26

>>> taylor(sin(x), x, 0, 5)
→ -x**3/6 + x
```

### One-liner Mode
```bash
binary-math "derivar(x^3, x)"
# Output: 3*x^2

binary-math "factorial(10)"
# Output: 3628800

binary-math "0b1010 + 0b0101"
# Output: 15
```

---

## 🔢 Functions

### Calculus
| Function                | Example                    | Result    |
| ----------------------- | -------------------------- | --------- |
| `derivar(f, x)`         | `derivar(x^2, x)`          | `2*x`     |
| `integrar(f, x)`        | `integrar(sin(x), x)`      | `-cos(x)` |
| `limite(f, x, a)`       | `limite(sin(x)/x, x, 0)`   | `1`       |
| `sumatoria(f, n, a, b)` | `sumatoria(n^2, n, 1, 10)` | `385`     |

### Algebra (Extended)
| Function              | Example                      | Result              |
| --------------------- | ---------------------------- | ------------------- |
| `simplificar(f)`      | `simplificar((x^2-1)/(x-1))` | `x+1`              |
| `expandir(f)`         | `expandir((x+1)^2)`          | `x^2+2*x+1`        |
| `factorizar(f)`       | `factorizar(x^2-1)`          | `(x-1)*(x+1)`      |
| `resolver(f, x)`      | `resolver(x^2-4, x)`         | `[-2, 2]`          |
| `parciales(f, x)`     | `parciales(1/(x^2-1), x)`    | Partial fractions   |
| `mcd(a, b)`           | `mcd(24, 36)`                | `12`               |
| `mcm(a, b)`           | `mcm(4, 6)`                  | `12`               |
| `esPrimo(n)`          | `esPrimo(97)`                | `Sí, 97 es primo`  |
| `combinar(n, k)`      | `combinar(10, 3)`            | `120`              |
| `permutar(n, k)`      | `permutar(10, 3)`            | `720`              |
| `factoresPrimos(n)`   | `factoresPrimos(360)`        | `2^3 × 3^2 × 5`    |

### Statistics (Extended)
| Function          | Example                        |
| ----------------- | ------------------------------ |
| `media(...)`      | `media(1, 2, 3, 4, 5)` → `3`   |
| `mediana(...)`    | `mediana(1, 2, 3, 4, 5)` → `3` |
| `desviacion(...)` | Standard deviation             |
| `varianza(...)`   | Variance                       |
| `covarianza(xs..., ys...)` | Covariance              |
| `correlacion(xs..., ys...)` | Pearson correlation    |
| `regresion(xs..., ys...)` | Linear regression (m, b) |
| `normalpdf(x, μ, σ)` | Normal PDF                  |
| `binomialpmf(k, n, p)` | Binomial PMF              |

### Trigonometry
`sin`, `cos`, `tan`, `csc`, `sec`, `cot`, `asin`, `acos`, `atan`, `acsc`, `asec`, `acot`, `sinh`, `cosh`, `tanh`

Aliases: `seno`=`sin`, `coseno`=`cos`, `tangente`=`tan`, `senh`=`sinh`

### Scripting
```
>>> f(x) := x^2 + 1
→ Función f(x) definida.
>>> f(3)
→ 10
>>> a = 5; b = 3    # Batch con ;
```

---

## 🥚 Easter Eggs

Try these:
- `1+1`
- `(-1)*(-1)`
- `0b101010`

---

## 🛠️ Development

```bash
cd binary-cli
pip install -e ".[dev]"
pytest
```

---

MIT © Aldra's Team
