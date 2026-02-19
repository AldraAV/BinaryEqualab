# Binary EquaLab

<p align="center">
  <img src="docs/banner_main.png" alt="Binary EquaLab Banner" width="600">
</p>

<p align="center">
  <em>"Las matemáticas también sienten, pero estas no se equivocan."</em>
  <br>
  <small>Aurora v2.0 Suite</small>
</p>s

<p align="center">
  <a href="#web">🌐 Web</a> •
  <a href="#desktop">💻 Desktop</a> •
  <a href="#cli">⌨️ CLI</a> •
  <a href="#features">🔢 Features</a> •
  <a href="#installation">📦 Installation</a>
</p>

---

## 🌟 About

**Binary EquaLab** is a professional Computer Algebra System (CAS) with support for Spanish mathematical functions. It's available in three flavors:

| Platform    | Description               | Tech Stack              |
| ----------- | ------------------------- | ----------------------- |
| **Web**     | Full-featured browser app | React + Vite + Nerdamer |
| **Desktop** | Native application        | Python + PyQt6 + SymPy  |
| **CLI**     | Command-line REPL         | Python + SymPy + Rich   |

---

## ✨ Features

### 🧮 CAS Calculator
- **Spanish functions**: `derivar()`, `integrar()`, `resolver()`, `factorizar()`
- **Derivatives**: `derivar(x^3 + 2x, x)` → `3x² + 2`
- **Integrals**: `integrar(sin(x), x)` → `-cos(x)`
- **Limits**: `limite(sin(x)/x, x, 0)` → `1`
- **Solve equations**: `resolver(x^2 - 4, x)` → `[-2, 2]`

### 📊 8 Modes
| Mode                | Features                             |
| ------------------- | ------------------------------------ |
| **Calculadora CAS** | Full symbolic computation            |
| **Gráficas**        | 2D plotting + Epicycles PRO          |
| **Ecuaciones**      | Single, systems, inequalities        |
| **Matrices**        | Operations, determinants, inverse    |
| **Estadística**     | Descriptive, regression, probability |
| **Complejos**       | Operations + Argand diagram          |
| **Vectores**        | 2D/3D + visualization                |
| **Contador PRO**    | VAN, TIR, depreciation, interest     |

### 🎨 Epicycles PRO
- Draw custom shapes → Fourier transform
- Catmull-Rom line smoothing
- Parametric function input: `x = cos(t); y = sin(2*t)`
- Templates: heart, star, infinity, spiral
- Glow trail effects

### 🔢 Number Systems
- **Binary**: `0b1010` → `10`
- **Hexadecimal**: `0xFF` → `255`
- **Octal**: `0o17` → `15`

### 🥚 Easter Eggs
Try these expressions:
- `1+1` — Unity
- `(-1)*(-1)` — Redemption
- `0b101010` — Binary philosophy

---

<h2 id="web">🌐 Web Version</h2>

<p align="center">
  <img src="docs/banner_web.png" alt="Binary EquaLab Web" width="500">
</p>

```bash
cd binary-equalab
pnpm install
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

<h2 id="desktop">💻 Desktop Version</h2>

```bash
pip install -r requirements.txt
python main.py
```

---

<h2 id="cli">⌨️ CLI Version</h2>

<p align="center">
  <img src="docs/banner_cli.png" alt="Binary EquaLab CLI" width="500">
</p>

```bash
cd binary-cli
pip install -e .
binary-math
```

### Usage

```
Binary EquaLab CLI v1.0.0
>>> derivar(x^2 + 3x, x)
→ 2*x + 3

>>> van(0.10, -1000, 300, 400, 500)
→ 78.82

>>> 0b1010 + 0b0101
→ 15
```

---

## 📦 Installation

### Prerequisites
- **Node.js 18+** (Web)
- **Python 3.9+** (Desktop/CLI)
- **pnpm** (recommended for Web)

### Quick Start

```bash
# Clone
git clone https://github.com/AldraAV/BinaryEquaLab.git
cd BinaryEquaLab

# Web
cd binary-equalab && pnpm install && pnpm run dev

# CLI
cd binary-cli && pip install -e .
```

---

## 🏗️ Project Structure

```
BinaryEquaLab/
├── binary-equalab/     # 🌐 Web (React + Vite)
├── src/                # 💻 Desktop (PyQt6)
├── binary-cli/         # ⌨️ CLI (Python)
├── backend/            # 🐍 SymPy API server
├── engine/             # ⚙️ C++ Engine (future)
└── docs/               # 📚 Documentation + images
```

---

## 🎯 Philosophy

> *"Las matemáticas también sienten, pero estas no se equivocan."*

Binary EquaLab es un ecosistema matemático unificado que abarca:
- **CLI**: Para terminales rápidas (Windows/Linux/Termux).
- **Desktop**: App visual potente (PyQt6/Fluenta).
- **Web**: Experiencia accesible desde cualquier navegador.

Every calculation carries meaning beyond numbers.

---

## 📜 License

MIT © Aldra's Team
