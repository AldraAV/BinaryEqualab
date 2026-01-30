# Binary EquaLab Web - Aurora v2.0 🌐

> *"Las matemáticas también sienten, pero estas no se equivocan."*

La versión web de Binary EquaLab, construida con React, Vite y TailwindCSS.
Designed for the "Aurora" aesthetic.

<p align="center">
  <img src="../docs/banner_web.png" alt="Binary EquaLab Web" width="500">
</p>

<p align="center">
  <em>🌐 Calculator CAS en el navegador</em>
</p>

---

## 🚀 Quick Start

```bash
pnpm install
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## ✨ Features

### 8 Modes
- **Calculadora CAS** — Derivadas, integrales, límites, ecuaciones
- **Gráficas** — 2D plotting + Epicycles PRO
- **Ecuaciones** — Sistemas y desigualdades
- **Matrices** — Operaciones completas
- **Estadística** — Descriptiva, regresión, probabilidad
- **Complejos** — Operaciones + diagrama de Argand
- **Vectores** — 2D/3D con visualización
- **Contador PRO** — VAN, TIR, depreciación, interés

### 🎨 Epicycles PRO
- Dibuja formas → Transformada de Fourier
- Suavizado Catmull-Rom
- Input paramétrico: `x = cos(t); y = sin(2*t)`
- Templates: corazón, estrella, infinito

### 🔢 Sistemas Numéricos
```
0b1010   → 10  (binario)
0xFF     → 255 (hexadecimal)
0o17     → 15  (octal)
```

### 🥚 Easter Eggs
Prueba: `1+1`, `(-1)*(-1)`, `0b101010`

---

## 🛠️ Tech Stack

- **React 18** + TypeScript
- **Vite** — Fast builds
- **Nerdamer** — CAS engine
- **Tailwind-style** — Aurora design system
- **lucide-react** — Icons

---

## 📁 Structure

```
binary-equalab/
├── components/         # React components
│   ├── ConsoleMode.tsx     # CAS calculator
│   ├── GraphingMode.tsx    # Graphing + Epicycles
│   ├── EpicyclesPRO.tsx    # Fourier visualizer
│   ├── EquationsMode.tsx   # Equation solver
│   ├── StatisticsMode.tsx  # Stats calculator
│   ├── ComplexMode.tsx     # Complex numbers
│   ├── VectorsMode.tsx     # Vector operations
│   └── AccountingMode.tsx  # Financial functions
├── services/           # Business logic
│   ├── mathParser.ts       # Expression preprocessing
│   ├── functionDefs.ts     # Spanish function definitions
│   ├── financeFunctions.ts # VAN, TIR, etc.
│   └── easterEggs.ts       # Hidden surprises
└── types.ts            # TypeScript types
```

---

## 🔧 Development

```bash
# Install
pnpm install

# Dev server
pnpm run dev

# Build
pnpm run build

# Preview
pnpm run preview
```

---

MIT © Malexnnn/ Aldra ORG.
