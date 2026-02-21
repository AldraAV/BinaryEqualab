# Binary EquaLab Web - Aurora v3.2.5 Élite 🌐🧪

> *"Las matemáticas también sienten, pero estas no se equivocan. Ahora, con IA biomédica integrada."*

La versión más avanzada de Binary EquaLab, construida con React, Vite y un motor híbrido CAS + Bio-Engine C++. Diseñada bajo la estética "Aurora" (Warm-Dark).

<p align="center">
  <img src="../docs/banner_web.png" alt="Binary EquaLab Web" width="500">
</p>

---

## 🚀 Versión v3.2.5: Resiliencia & IA
Esta versión marca el salto a la **Suite Élite**, con infraestructura de supervivencia para servicios gratuitos y un sistema de IA enriquecido.

### 🧬 Bio-Engine v3.0 Core
- **Bio-ODE Solver:** Resolución avanzada de modelos Farmacocinéticos, Windkessel y Hodgkin-Huxley.
- **SymPy Backend:** Integración con motor simbólico remoto para cálculos de alta precisión.

### 🤖 IA Integrada & Renderizado Enriquecido
- **Modo Explain:** La IA desglosa conceptos matemáticos y biomédicos con claridad.
- **KaTeX Professional:** Fórmulas renderizadas con tipografía matemática real.
- **AIResponseRenderer:** Interfaz enriquecida con soporte para **Markdown** y estética Aurora.

### 🛡️ Infraestructura & Estabilidad
- **Anti-Sleep (Ghost Pings):** Sistema de supervivencia para Render y Supabase en tiers gratuitos.
- **CSS Grid Layout:** Re-ingeniería estructural para una estabilidad visual inquebrantable.
- **Persistencia Local:** Historial de cálculos y chats persistentes vía `localStorage`.

---

## ✨ Features (Modos Principales)

### 8 Modos de Operación
- **Calculadora CAS PRO** — Derivadas, integrales, límites, ecuaciones con soporte IA.
- **Séptima Core (Biomedicina)** — Resolución de ecuaciones diferenciales aplicadas.
- **Gráficas & Fourier** — Plotting 2D + Epicycles PRO.
- **Matrices & Álgebra** — Operaciones lineales y sistemas complejos.
- **Ecuaciones** — Sistemas y desigualdades.
- **Estadística** — Descriptiva, regresión y probabilidad.
- **Complejos** — Operaciones + diagrama de Argand.
- **Contador PRO** — VAN, TIR, depreciación y finanzas avanzadas (Contabilidad).

### 🎨 Epicycles PRO
- Dibuja formas libremente → Conversión a **Transformada de Fourier**.
- Suavizado **Catmull-Rom** para trazos artísticos.
- Input paramétrico: `x = cos(t); y = sin(2*t)`.
- Templates integrados: corazón, estrella, infinito.

### 🔢 Sistemas Numéricos
Soporte nativo para múltiples bases:
```
0b1010   → 10  (binario)
0xFF     → 255 (hexadecimal)
0o17     → 15  (octal)
```

### 🥚 Easter Eggs
Prueba comandos como: `1+1`, `(-1)*(-1)`, `0b101010` o pide un `explain` para ver la IA en acción.

---

## 🛠️ Tech Stack Élite

- **Core:** React 19 + TypeScript
- **Bundler:** Vite 6 (Configurado para ESM/CJS Interop)
- **Math Engines:** Nerdamer (Local) + SymPy (Backend API) + Bio-Engine (C++/WASM)
- **AI Services:** Groq & Kimi (Multi-AIEngine con Fallback dinámico)
- **Rendering:** KaTeX, React-Markdown, Remark-Math, Rehype-Katex
- **Database/Auth:** Supabase JS

---

## 🔧 Desarrollo & Comandos

```bash
# Instalación
pnpm install

# Servidor de desarrollo
pnpm run dev

# Construcción para producción
pnpm run build

# Previsualización de build
pnpm run preview
```

---

## 📁 Estructura del Proyecto

```
binary-equalab/
├── components/         # Componentes Átomicos & Aurora UI
│   ├── AIResponseRenderer.tsx # Renderizado de IA Élite
│   ├── ConsoleMode.tsx        # Consola Grid de alta estabilidad
│   ├── GraphingMode.tsx       # Gráficas + Epicycles
│   ├── EpicyclesPRO.tsx       # Motor de Fourier
│   └── Dashboard.tsx          # Métricas y Plan SaaS
├── services/           # Lógica de Negocio & Bio-Solvers (mathParser, financeFunctions)
├── contexts/           # Gestión de Estado (Auth, Notificaciones)
└── types.ts            # Tipado estricto v3.0
```

---

MIT © Aldra's Team | Binary EquaLab 2026
