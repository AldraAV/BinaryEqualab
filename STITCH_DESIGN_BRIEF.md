# Binary EquaLab 🍒 - Design Brief para Stitch

## 🎯 Visión del Proyecto

**Binary EquaLab** es una calculadora matemática de **nueva generación** que combina:
- **CAS (Computer Algebra System)** profesional tipo Mathematica/Wolfram Alpha
- **IA generativa** para resolver problemas complejos
- **Interface moderna y poderosa** que no sacrifica funcionalidad por simplicidad

**Filosofía:** "Tan poderosa como Mathematica, tan accesible como una calculadora"

---

## 🧮 Funcionalidad Core

### 1. **Teclado Matemático PRO**
Un teclado especializado con:
- **Operaciones CAS:** Derivar, Integrar, Resolver, Simplificar, Factorizar, Límites, Series
- **Funciones avanzadas:** Trigonométricas, Logarítmicas, Matrices, Vectores
- **Sistema de Placeholders (□):** Al presionar "Derivar", crea `d/dx(□)` donde el usuario llena el □

### 2. **Vista Previa LaTeX en Tiempo Real**
- Renderiza la expresión matemática **como en un paper académico**
- Ejemplo: `\frac{d}{dx}(x^2)` se ve como ecuación profesional
- Muestra placeholders activos resaltados

### 3. **Motor Dual**
- **Motor Local:** SymPy (Python) para cálculos básicos sin conexión
- **Motor IA Cloud:** GPT-4 + SymPy para problemas complejos con razonamiento paso a paso

### 4. **Historial Inteligente**
- Cada cálculo se guarda con:
  - Expresión original
  - Resultado con LaTeX
  - Pasos intermedios (si fue resuelto por IA)
- Permite reutilizar expresiones pasadas

---

## 🎨 Estética y Diseño Visual

### **Paleta de Colores: "Aurora Oscura"**

**Fondo:**
```
Warm Black 1: #1c1917 (stone-900)
Warm Black 2: #292524 (stone-800)
Warm Black 3: #44403c (stone-700)
```

**Acentos (Gradiente Aurora):**
```
Orange 400: #fb923c
Orange 600: #ea580c (principal)
Red 700:    #b91c1c
```

**Elementos de Acción:**
```
Verde:   #10b981 (success)
Amarillo: #f59e0b (warning)
Rojo:    #ef4444 (destructive)
```

### **Principios de Diseño**

1. **Glassmorphism**: Fondos semi-transparentes con blur
2. **Elevación sutil**: Sombras suaves para profundidad
3. **Tipografía monoespaciada**: Para expresiones matemáticas
4. **Animaciones micro**: Transiciones de 200-300ms
5. **Dark-first**: Diseñado para uso nocturno prolongado

### **Referencias Visuales**
- **Aesthetics:** Wolfram Alpha + Notion + Raycast
- **UX:** Calculator++ (Android) + Photomath
- **Iconografía:** Lucide Icons / Phosphor Icons (outline style)

---

## 📱 Estructura de Pantallas

### **Pantalla Principal: Math Calculator**

```
┌─────────────────────────────────┐
│  Binary EquaLab 🍒              │ ← TopBar con aurora gradient
├─────────────────────────────────┤
│  HISTORIAL                      │
│  ┌───────────────────────────┐  │
│  │ x² + 2x + 1              │  │
│  │ = (x + 1)²               │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ d/dx(sin(x))             │  │
│  │ = cos(x)                 │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  VISTA PREVIA LaTeX             │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │   d                       │  │
│  │  ── (x² + □)              │  │ ← Placeholder activo
│  │  dx                       │  │
│  │                           │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  TECLADO CAS                    │
│  ┌─────┬─────┬─────┬─────┐     │
│  │ D/dx│ ∫   │ lim │solve│     │
│  ├─────┼─────┼─────┼─────┤     │
│  │ sin │ cos │ tan │  √  │     │
│  ├─────┼─────┼─────┼─────┤     │
│  │  7  │  8  │  9  │  ÷  │     │
│  │  4  │  5  │  6  │  ×  │     │
│  │  1  │  2  │  3  │  -  │     │
│  │  0  │  .  │  x  │  +  │     │
│  └─────┴─────┴─────┴─────┘     │
│  [⌫]  [Clear]  [=Calcular]     │
└─────────────────────────────────┘
```

### **Elementos Clave**

1. **TopBar**
   - Gradiente sutil de aurora
   - Logo integral + nombre
   - Posible menú hamburguesa (futuro: settings, cloud sync)

2. **Historial**
   - Cards con glassmorphism
   - Scroll vertical
   - Tap para reutilizar expresión

3. **Vista Previa**
   - Fondo ligeramente diferenciado (#292524)
   - Renderizado LaTeX crisp
   - Placeholder activo con borde aurora

4. **Teclado**
   - Grid responsive
   - Botones con elevación sutil
   - Área CAS en parte superior (botones naranja)
   - Área numérica en parte inferior (botones neutral)
   - Botones de control en footer (⌫ rojo, = verde)

---

## 🎭 Componentes Específicos

### **Botón CAS (Operación Matemática)**
```
Forma: Rounded rectangle (8px radius)
Fondo: rgba(251, 146, 60, 0.1) con border #ea580c
Texto: #fb923c, bold, 11-12sp
Hover: Gradiente aurora completo
Presionado: Scale 0.95
```

### **Botón Numérico**
```
Forma: Rounded rectangle (8px radius)
Fondo: #44403c
Texto: White, bold, 18-20sp
Hover: Brillo +10%
Presionado: Scale 0.97
```

### **Card de Historial**
```
Fondo: rgba(41, 37, 36, 0.6) blur(10px)
Border: 1px solid rgba(251, 146, 60, 0.2)
Padding: 12-16px
Sombra: 0 2px 8px rgba(0,0,0,0.3)
```

### **Vista Previa LaTeX**
```
Fondo: #292524
Border radius: 12px
Padding: 16px
LaTeX color: #fafaf9 (stone-50)
Placeholder activo: Border 2px #fb923c pulsante
```

---

## 🔧 Interacciones y UX

### **Flujo de Uso Típico**

1. Usuario presiona **"Derivar"** → Aparece `d/dx(□)` en preview
2. Usuario escribe `x`, presiona `^`, escribe `2` → Actualiza a `d/dx(x²)`
3. Usuario presiona **Tab** → Cursor avanza al siguiente placeholder (si existe)
4. Usuario presiona **"="** → Se calcula y muestra `2x` en resultado
5. Expresión se guarda en historial automáticamente

### **Microinteracciones**

- **Inserción de token:** Fade in 150ms
- **Navegación placeholder:** Highlight pulse 300ms
- **Cálculo en progreso:** Loading spinner sutil en botón "="
- **Error:** Shake animation + border rojo temporal
- **Success:** Green flash sutil en resultado

---

## 🌟 Casos de Uso Ejemplares

### **Estudiante de Cálculo**
```
Problema: Derivar f(x) = sin(x²)
1. Presiona "d/dx"
2. Escribe: sin(x^2)
3. Resultado: 2x·cos(x²)
```

### **Ingeniero**
```
Problema: Resolver x² - 5x + 6 = 0
1. Presiona "solve"
2. Escribe: x^2 - 5x + 6 = 0
3. Resultado: x = 2, x = 3
```

### **Físico**
```
Problema: Expandir (a + b)³
1. Presiona "expand"
2. Escribe: (a + b)^3
3. Resultado: a³ + 3a²b + 3ab² + b³
```

---

## 📐 Especificaciones Técnicas (Mobile)

- **Plataforma:** Android (Kotlin) / iOS potencial con Flutter/React Native
- **Layout:** Jetpack Compose / Flutter Widgets
- **LaTeX Rendering:** WebView con KaTeX.js
- **Backend:** Python FastAPI (SymPy + OpenAI)
- **Offline Mode:** SymPy local para operaciones básicas

---

## 🎁 Diferenciadores vs Competencia

| Feature          | Binary EquaLab | Photomath | Wolfram Alpha | Calculator++ |
| ---------------- | -------------- | --------- | ------------- | ------------ |
| CAS Offline      | ✅              | ❌         | ❌             | ❌            |
| IA Reasoning     | ✅              | Limitado  | ✅ ($)         | ❌            |
| LaTeX Preview    | ✅              | ❌         | ✅             | ❌            |
| Interfaz Moderna | ✅              | ✅         | ❌             | Neutral      |
| Gratis           | ✅ (Beta)       | Freemium  | Freemium      | ✅            |

---

## 🚀 Mood & Inspiración

**Palabras Clave:**
- **Powerful** (poderosa, no limitada)
- **Elegant** (elegante, no recargada)
- **Professional** (académica, no juguete)
- **Modern** (2026, no 2015)
- **Accessible** (directa, no intimidante)

**NO queremos:**
- Colores neón agresivos
- Skeuomorfismo exagerado
- Animaciones distractoras
- UI "cute" infantil

**SÍ queremos:**
- Minimalismo funcional
- Contraste alto para legibilidad
- Jerarquía visual clara
- Sensación de "herramienta pro"

---

## 📝 Notas Finales

- **Tema claro:** Futuro, pero **dark-first** es prioridad
- **Responsive:** Debe funcionar en pantallas 5" a 7"
- **One-handed use:** Botones CAS arriba, numpad abajo accesible con pulgar
- **Accesibilidad:** Alto contraste, tap targets ≥48dp

🍒 **Binary EquaLab no es solo una calculadora, es un laboratorio matemático en tu bolsillo.**
