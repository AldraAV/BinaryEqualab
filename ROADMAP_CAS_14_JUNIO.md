# 🗺️ ROADMAP DEL MOTOR CAS Y EXPANSIÓN GLOBAL (14 de Junio de 2026)
> Orquestado bajo la doctrina del *Aldraverse*, la Ley del Arquitecto y el *Zero-Bug Policy*.

## 🎯 Objetivo General
Transformar la consola (CAS) en el cerebro maestro de *Binary EquaLab*. Todo módulo visual y toda función matemática debe ser accesible, gobernable y autocompletable desde la consola mediante un árbol de sintaxis abstracta (AST) hiperoptimizado y 100% en español.

---

## 🚀 FASE 1: Expansión del Diccionario (`functionDefs.ts`)
**Meta:** Registrar la totalidad de funciones matemáticas, científicas y estadísticas sin dejar ninguna fuera.
- **Trigonometría Extendida:** Inversas, hiperbólicas completas.
- **Cálculo Numérico y Simbólico:** Derivadas, integrales definidas/indefinidas, límites, series, sumatorias.
- **Probabilidad y Estadística:** Permutaciones, combinaciones, distribuciones (Binomial, Normal, Poisson), factoriales.
- **Constantes y Sistemas:** Conversión de bases (`hex`, `bin`), coordenadas (polar/rectangular), constantes universales.

## 🧠 FASE 2: Autocompletado Dinámico (Grafo/Trie)
**Meta:** Que el usuario jamás se pierda en la sintaxis.
- Crear un motor de sugerencias basado en un Árbol (Trie) que filtre dinámicamente según lo que el usuario teclee.
- Si el usuario escribe `resol`, el sistema sugiere `resolver(ecuacion, x)`.
- Mostrar un recuadro de "ayuda" o "firma de la función" mientras se escribe.

## ⚙️ FASE 3: Súper Parser y AST (`mathParser.ts` -> `CommandParserService`)
**Meta:** Una pre-ejecución blindada antes de tocar el servidor.
- Reemplazar las expresiones regulares frágiles por un parser que construya un AST (Abstract Syntax Tree) validado en tiempo real.
- Traducir al vuelo del español al inglés (Soberanía Lingüística preservada en el frontend, ejecución compatible en el backend).

## 📡 FASE 4: Unificación del Backend (`cas.py` & FastAPI)
**Meta:** El backend debe saber digerir todo lo que le mande el Súper Parser.
- Actualizar los endpoints para soportar las nuevas funciones estadísticas, probabilísticas y trigonométricas avanzadas.
- Sincronizar las peticiones hacia `SymPy` o `EquaCore` dependiendo de la carga.

## 🔗 FASE 5: Absorción de Módulos Visuales
**Meta:** "No recrear la rueda".
- Los módulos como **Estadística**, **Vectores** o **Matrices** usarán el Súper Parser de la consola como motor.
- Lo que se haga en un botón del UI, internamente lanza una sentencia oculta en la consola para unificar el historial de operaciones.

---
*Mano Derecha de Ingeniería — "De 3,000 plaquetas nació el código que salva vidas."*

## 📝 Registro de Orquestación y Refactorización (15 de Junio de 2026, 00:26 hrs)

Bajo la orquestación paralela, la arquitectura de la consola (CAS) ha sido reestructurada exitosamente. A continuación el detalle técnico exacto de las intervenciones realizadas:

### Frontend (UI y Lógica del Cliente)
- **`binary-next/src/services/functionDefs.ts`**
  - **Acción:** Expansión masiva del diccionario (`[MODIFICADO]`).
  - **Impacto:** Integración de distribuciones (Normal, Binomial, Poisson), trigonometría hiperbólica completa, probabilidad (permutaciones/combinaciones) e ingenierías base. Todo parametrizado en español.
- **`binary-next/src/services/CommandAutocompleteService.ts`**
  - **Acción:** Lógica de Motor de Autocompletado (`[NUEVO]`).
  - **Impacto:** Archivo creado para manejar el filtrado dinámico del texto y construir las sugerencias (*ghost text*).
- **`binary-next/src/services/CommandParserService.ts`**
  - **Acción:** Motor AST de Pre-ejecución (`[NUEVO]`).
  - **Impacto:** Archivo creado para reemplazar las regex frágiles. Valida jerarquías matemáticas en el frontend antes de enviar peticiones, traduciendo soberanamente del español al inglés del backend.
- **`binary-next/src/components/ConsoleMode.tsx`**
  - **Acción:** Inyección de Identidad Visual (`[MODIFICADO]`).
  - **Impacto:** Se ancló el *Ghost Text* sobre la línea activa del input y se agregó la *Status Bar* inferior para mostrar las firmas de parámetros (ej. `integrar(función, variable, límite_inf, límite_sup)`).

### Backend (Motores de Cálculo y Ruteo)
- **`backend/routers/cas.py`**
  - **Acción:** Purga de Responsabilidades (`[MODIFICADO]`).
  - **Impacto:** El endpoint omnipotente `/evaluate` fue extraído y destruido. **153 líneas borradas** para recuperar la limpieza del archivo.
- **`backend/routers/console_router.py`**
  - **Acción:** Re-enrutamiento Soberano (`[NUEVO]`).
  - **Impacto:** Archivo creado desde cero para manejar el endpoint `/api/consola/evaluar`. Actúa como *Gateway* recibiendo la data de la consola en español, re-deribando la computación matricial hacia `EquaCore` (C++) y lo simbólico hacia `SymPy`.
- **`backend/main.py`**
  - **Acción:** Integración de API (`[MODIFICADO]`).
  - **Impacto:** El `enrutador_consola` fue acoplado al orquestador maestro de FastAPI.

### Scripts de Validación (Zero-Bug Policy)
- **`.agent/scripts/test_console_parser.py`**
  - **Acción:** Blindaje Pre-ejecución (`[NUEVO]`).
  - **Impacto:** Pruebas unitarias en español asegurando protección contra comandos vacíos, desbalance de paréntesis e inyecciones lógicas.

### Solución de Bugs Post-Migración (15 de Junio de 2026, 17:50 hrs)

- **`binary-next/src/services/mathParser.ts`**
  - **Acción:** Registro de Diccionario.
  - **Impacto:** Añadidas `senh`, `arcsenh`, `normal`, `normalpdf`, y `N` a la lista blanca de funciones del parser (evitando que `N(0,0,1)` se parsee erróneamente como `N * (0,0,1)`).
- **`backend/routers/console_router.py`**
  - **Acción:** Evaluación Numérica Activa (`doit`) y Bypass de SymEngine.
  - **Impacto:** 
    1. Se implementó una lógica condicional (lista negra) para forzar la evaluación en `SymPy` cuando se detectan funciones en español complejas o estadísticas (`sumatoria`, `N`, `senh`), ya que el Nivel 1 (`SymEngine`) silenciosamente retornaba objetos simbólicos sin evaluarlos.
    2. Se integró la orden `.doit()` explícita antes de la simplificación final. Ahora las `sumatorias` y `productorias` se calculan a su valor numérico real (`55`) en lugar de devolver la expresión LaTeX abstracta sin operar.

### Integración Masiva del Diccionario (16 de Junio de 2026, 01:30 hrs)

- **`binary-next/src/services/functionDefs.ts`**
  - **Acción:** Expansión Definitiva (`[MODIFICADO]`).
  - **Impacto:** Añadidas más de 12 funciones faltantes de los documentos maestros (`objetivop.md`): `binomialpmf`, `binomialcdf`, `normalcdf`, `poissonpmf`, `poissoncdf`, `aleatorio`, `aleatorio_entero`, `arccosh`, `arctanh`, `grados`, `radianes`, `plotsonify`. **108 líneas añadidas**.
- **`binary-next/src/services/mathParser.ts`**
  - **Acción:** Registro en el AST (`[MODIFICADO]`).
  - **Impacto:** Las nuevas funciones fueron mapeadas en la lista blanca de variables para que el parser las trate como métodos (ej. `normalcdf(...)`) y no como multiplicaciones algebraicas (ej. `n*o*r*m*a*l*c*d*f`). Esto arregla directamente el bug *"solo las parsea"* reportado con funciones como `sinh`.
- **`backend/routers/console_router.py`**
  - **Acción:** Mapeo de Lambdas Numéricas (`[MODIFICADO]`).
  - **Impacto:** Se añadieron las funciones probabilísticas a `PALABRAS_SYMPY` y se inyectaron lambdas (ej. `lambda k, n, p: ...` para poisson y binomiales) al espacio de nombres de `sympy.sympify()`. Ahora el backend devuelve valores numéricos (ej. `0.5` para `normalcdf(0,0,1)`). **10 líneas añadidas**.
- **`analisis_exhaustivo_next_vite.md`**
  - **Acción:** Auditoría de Arquitectura (`[NUEVO]`).
  - **Impacto:** Se redactó un documento autocrítico asumiendo el error estratégico del Client-Side Rendering en Vite para matemáticas, y documentando las desviaciones lingüísticas al nombrar variables en inglés en contra del protocolo de Soberanía del Aldraverso.

### Validación Final y Plan de Arquitectura (17 de Junio de 2026, 18:58 hrs)

- **`test_console_parser.py`**
  - **Acción:** Ejecución del Smoke Test (`[VERIFICADO]`).
  - **Impacto:** Se ejecutó la batería de pruebas en codificación UTF-8 garantizando que la cadena Frontend → `console_router.py` → `SymPy/EquaCore` responde numéricamente a `sinh(2)+log(10)` y probabilísticamente a `N(0,0,1)`. Resultado verde: 7/7 pruebas superadas.
- **`implementation_plan.md`**
  - **Acción:** Planificación de Fase 5 (`[NUEVO]`).
  - **Impacto:** Se redactó el documento estratégico para destripar y absorber los módulos visuales (Estadística, Vectores, Matrices) hacia el motor CAS, solicitando autorización explícita para la refactorización invasiva y abordando el UX del historial.
