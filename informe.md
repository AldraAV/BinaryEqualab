# 🔬 Análisis Exhaustivo: Deuda Técnica, Migración y Estado de Binary EquaLab
**Fecha y Hora de Emisión:** 14 de Junio de 2026, 20:35 Hrs (Hora del Centro)
**Analista:** Agente Orquestador (Mano Derecha y Arquitecto del Aldraverso)

---

## 1. El Origen del Quiebre: La Migración y Asignación de Tareas

El fallo transversal que la aplicación sufre actualmente **no es un problema aislado de código, sino una falla sistémica originada durante la migración de Vite a Next.js y una deficiente asignación de tareas.**
Los agentes previos o desarrolladores abordaron la migración como un simple "copiar y pegar" de componentes, sin entender los principios arquitectónicos del ecosistema ni adaptar la lógica cliente-servidor a las bondades de Next.js.

### ⚠️ El Problema de la Versión Vite (Client-Side)
La versión antigua basada en Vite es innegablemente **más robusta y avanzada** en cuanto a características funcionales de la UI. Sin embargo, **su dependencia es casi total hacia el cliente (el navegador)**. Toda la lógica dura de interfaz se evalúa en el frontend, lo cual es arquitectónicamente inaceptable para Binary EquaLab:
1. Expone la lógica de los motores de evaluación y el manejo de estado al navegador.
2. Desperdicia la capacidad de procesamiento de servidor (EquaCore).
3. No es escalable para dispositivos de bajos recursos.

Next.js fue implementado para solucionar esto mediante Server-Side Rendering (SSR) y Server Actions, pero la migración está a medias, dejando a Next.js por detrás de Vite en características, mientras acarrea código pesado de frontend.

---

## 2. Infracciones Graves a la LEY DEL ALDRAVERSO (Soberanía del Español)

Se ha detectado una violación flagrante y sistemática a la **Declaración Inapelable del Arquitecto (`arquitecto.md`)**. A pesar de la directiva clara de soberanía lingüística (100% código y archivos en español), el repositorio es una mezcla inconsistente de idiomas:

* **Infracción de Nomenclatura en Componentes:** Existen archivos como `StandardGraphing.tsx`, `ConsoleMode.tsx`, `VectorsMode.tsx`, `AccountingMode.tsx`, `SettingsModal.tsx`, coexistiendo con parches al español como `ModoComplejo.tsx` y `ModoElectrico.tsx`.
* **Infracción en Servicios y Hooks:** `apiService.ts`, `financeFunctions.ts`, `functionDefs.ts`, `useExpression.ts`. Todo esto debería estar nombrado en estricto español (ej. `servicioApi.ts`, `definicionFunciones.ts`).
* **Variables de Código:** Existen cientos de variables en inglés (`isLoading`, `history`, `evaluateExpression`) que violan la Ley de Soberanía. El "copiar y pegar" ignoró por completo los protocolos.

---

## 3. Desviaciones de Arquitectura y Diseño

### El Error de `MedicalReasoningPanel`
Existe un componente en el frontend suelto llamado `MedicalReasoningPanel.tsx`. Esto es un error garrafal de concepto. El razonamiento médico y de laboratorio no es un componente genérico de UI; **pertenece exclusiva y estrictamente al submódulo de Séptima Biomédica**. Colocarlo como un componente frontend general indica que quien hizo la migración no comprendió las divisiones modulares entre los dominios matemáticos puros y los dominios biomédicos del sistema.

---

## 4. Estado Actual del Ecosistema (Web, Backend y Motor)

### Frontends (Vite vs Next.js)
El frontend se divide en **13 modos operativos**, los cuales están desincronizados:
1. Modo Consola (`ConsoleMode`)
2. Graficación Estándar (`StandardGraphing` / `GraphingMode`)
3. Ecuaciones (`EquationsMode`)
4. Vectores (`VectorsMode`)
5. Matrices (`MatrixMode`)
6. Modo Complejo (`ComplexMode` en Vite -> `ModoComplejo` en Next)
7. Modo Eléctrico (`ModoElectrico`)
8. Epiciclos PRO (`EpicyclesPRO`)
9. Simulador PTI (`PTISimulator`)
10. Contabilidad (`AccountingMode`)
11. Estadística (`StatisticsMode`)
12. Teclado Científico y Paneles Anexos.

### Funciones Matemáticas Universales
El sistema cuenta con un parser (`functionDefs.ts`) que registra y preprocesa el diccionario matemático del usuario. Contiene **más de 30 funciones primarias**, organizadas en:
* **Trigonometría Directa e Inversa:** `sen`, `cos`, `tan`, `arcsen`, etc.
* **Cálculo Avanzado:** `integrar`, `derivar`, `limite`, `taylor`.
* **Transformadas:** `laplace`, `fourier`, `ilaplace`, `ifourier`.
* **Modos Gráficos y Sonoros:** `graficar`, `sonar`, `graficar_y_sonar`.
* **Bases Numéricas:** `bin`, `hex`, `oct`.

**Falla detectada:** La versión Next.js no preprocesa bien este diccionario de funciones en la Consola (motivo de tu reporte anterior).

### Backend (Python/FastAPI) y EquaCore (C++)
* **Backend:** Orquesta las peticiones a través de sub-routers (`cas.py`, `graphics.py`, `epicycles.py`, `statistics.py`, `septima.py`). Es estable, pero sufre por recibir peticiones mal formateadas o asimétricas desde el cliente web.
* **EquaCore:** El motor nativo C++ que ejecuta la carga pesada. Está subutilizado por la versión de Vite, ya que Vite confía demasiado en bibliotecas locales como *Nerdamer*.

---

## Conclusión

El principal cuello de botella no es tecnológico, es disciplinario. La migración a Next.js falló en comprender la meta: **quitar la carga pesada del cliente web y unificar la soberanía en español.**

El sistema actual funciona de forma dispar porque los módulos fueron traducidos superficialmente y conectados al backend con "cinta adhesiva", perdiendo en el proceso la robustez que Vite poseía. Se requiere una refactorización profunda bajo las estrictas leyes de `arquitecto.md` y `mano-derecha.md`.
