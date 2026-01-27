# Binary EquaLab ∫✨

> **"El álgebra también siente"** — Calculadora CAS gratuita para estudiantes

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ¿Qué es?

Binary EquaLab es una calculadora científica con **Computer Algebra System (CAS)** completo, inspirada en la Casio fx-991EX ClassWiz pero con superpoderes:

- ✅ **Gratis** — Para estudiantes que no pueden pagar calculadoras de $100+
- ✅ **Simbólico** — Simplifica, factoriza, deriva, integra expresiones
- ✅ **Gráficas** — Plotea funciones, calcula derivadas e integrales visualmente
- ✅ **Fourier** — Visualiza series de Fourier con epicycles animados
- ✅ **Cross-platform** — Web, Desktop (Windows/Linux/Mac)

## Stack

| Componente      | Tecnología                           |
| --------------- | ------------------------------------ |
| **Web**         | React + Vite + TypeScript + Tailwind |
| **Desktop**     | Python + PyQt6 + SymPy               |
| **Backend**     | FastAPI + Supabase                   |
| **Math Engine** | SymPy (Python) / Nerdamer (JS)       |

## Inicio Rápido

### Web (Development)
```bash
cd binary-equalab
pnpm install
pnpm run dev
# Abre http://localhost:5173
```

### Desktop
```bash
pip install PyQt6 pyqt6-tools qdarktheme sympy
python main.py
```

### Backend API
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# Docs en http://localhost:8000/docs
```

## Características

### Console Mode (CAS)
- `simplify((x^2-1)/(x-1))` → `x + 1`
- `diff(sin(x), x)` → `cos(x)`
- `integrate(x^2, x)` → `x³/3`
- `solve(x^2 - 4, x)` → `[-2, 2]`
- `taylor(sin(x), x, 0, 5)` → `x - x³/6 + x⁵/120`
- `laplace(sin(t))` → `1/(s² + 1)`

### Graphing Mode
- Múltiples funciones con colores
- Toggle de derivada (línea punteada)
- Integral definida (área sombreada)
- Trace cursor con detección de raíces

### Epicycles (Fourier)
- Square, Triangle, Sawtooth waves
- Control de armónicos (1-100)
- Animación 60 FPS

## Roadmap

- [x] MVP Web funcional
- [x] Desktop PyQt6 reparado
- [x] Backend FastAPI
- [ ] Auth con Supabase
- [ ] Export a Arduino/ESP32
- [ ] Engine C++ (performance)

## Licencia

MIT License — Usa, modifica, distribuye libremente.

---

Parte del **Aldraverse** 🍒

*Tu luz sigue intacta. Por favor, sigue brillando.* ∫✨
