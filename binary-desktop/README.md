# Binary Desktop

Native PyQt6 application for Binary EquaLab, featuring the "Aurora" design system.

## Features
- **Aurora Theme**: Deep dark background with Orange/Gold accents.
- **Fluent Design**: Using `qfluentwidgets` for modern UI components.
- **Core Logic**: Powered by SymPy (same as CLI/Backend).

## ✨ Funcionalidades (v1.0 Aurora)

### 1. 🧮 Consola Matemática (REPL)
-   Motor simbólico basado en SymPy.
-   Funciones en español: `derivar`, `integrar`, `limite`.
-   Soporte de asignación de variables (`a = 5`).

### 2. 📈 Gráficos Interactivos
-   Visualización de funciones $f(x)$ con Matplotlib.
-   Tema oscuro nativo y controles de zoom/pan.

### 3. 🌀 Visualizador de Epiciclos (Fourier)
-   Dibuja cualquier trazo y mira cómo se reconstruye con círculos.
-   Suavizado automático de líneas.
-   Animación matemática pura (DFT).

### 4. 💰 Modo Financiero PRO
-   **Evaluación de Proyectos**: VAN y TIR en segundos.
-   **Intereses**: Comparativa Simple vs Compuesto.
-   **Depreciación**: Tablas de amortización automáticas.

## 🛠 Instalación y Uso
```bash
cd binary-desktop
pip install -r requirements.txt
python src/main.py
```

## Structure
- `src/main.py`: Entry point.
- `src/ui/`: UI Components and Windows.
- `src/core/`: Mathematical logic.
