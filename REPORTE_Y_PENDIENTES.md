# Reporte de Estado y Tareas Pendientes — BinaryEquaLab

> Documento generado como resumen del estado actual y hoja de ruta para la unificación del ecosistema matemático de la aplicación.

## 🛠️ Lo que se implementó recientemente

1. **Gestión de variables Casio (Memoria)**: Se integró el soporte real de almacenamiento para variables estáticas (`A`, `B`, `C`, `D`, `E`, `F`, `X`, `Y`, `M`) en el REPL de `ConsoleMode`. El modal se ajustó para reflejar la interfaz de selección estilo Casio.
2. **Cálculos exactos/aproximados de integrales definidas**: Se reestructuró la comunicación con el backend (FastAPI) para recibir los parámetros numéricos de área bajo la curva y se modificó `StandardGraphing.tsx` para renderizar el resultado tanto en decimal exacto (usando el formato de 6 cifras) como en formato algebraico puro/fracción en LaTeX.
3. **Módulo de Gráficos — Convolución real**: Se descartaron los *mocks* visuales en la convolución y se implementó un motor numérico interactivo basado en la regla de Simpson, el cual traza y calcula el producto de cruce de dos funciones definidas por el usuario dinámicamente mediante un slider de tiempo (`t`).
4. **UX del REPL**: Se reubicaron los controles clave ("Aprox/Exacto" y "Limpiar historial") a la barra de estado general para que permanezcan *sticky* y siempre visibles, evitando que se pierdan con el scroll del historial. También se mejoró la resiliencia al limpiar el historial persistido.
5. **Corrección de compilación (Hotfix)**: Se corrigió un error de sintaxis en `StandardGraphing.tsx` (una llave de cierre sobrante en un hook de `useEffect`) que bloqueaba al compilador de Vite.

## 🚧 Tareas Pendientes (Roadmap inmediato)

1. **Corrección de Errores en API CAS (FastAPI)**:
   - Existen fallos (`400 Bad Request`) en endpoints como `/api/cas/solve-equation`, `/api/cas/solve-system`, `/api/cas/solve-inequality` y `/api/cas/simplify`.
   - **Causa probable**: Inconsistencias en cómo el motor de SymPy procesa el cuerpo de la petición cuando se envían literales o ecuaciones con la sintaxis de igualación incompleta o variables erróneas. Requiere depuración e implementación de bloques de captura de errores más rigurosos.

2. **Renovación total del Módulo de Matrices**:
   - Pasar del modelo básico ("Matriz A y Matriz B") a un gestor de **mínimo 5 matrices con nombre** (`A`, `B`, `C`, `D`, `E`).
   - Implementar acciones unitarias robustas: `determinante`, `inversa` (por múltiples métodos), `transpuesta`, `rango`, `traza`, `potencia`.
   - Ejecutar acciones combinadas: suma, resta, multiplicación y potencia cruzada como un flujo expresivo encadenable.
   - **Modo Explain**: Explicación paso a paso y humanizada sobre la resolución matricial manual (ej. cómo aplicar Gauss-Jordan o cofactores para la inversa).

3. **Integración Global (Consola ↔ Módulos Visuales)**:
   - Instaurar una capa de almacenamiento unificada (*Global State Management*).
   - Permitir a la **Consola (REPL)** llamar, operar y manipular las matrices o funciones creadas en las interfaces gráficas, y viceversa.
   - Dar soporte en la consola a números complejos, unidades imaginarias, constantes universales y variables financieras declaradas globalmente.

4. **Diseño Visual (Lava-Neon Pro)**:
   - Asegurar que la ampliación del soporte mantenga la excelencia visual (componentes pulidos, accesibles en pocos clics, zero Purple Ban).
   - Aplicar el manejo de estados de carga, feedback de transacciones de manera virtuosa.
   - Realizar pruebas de estrés sobre la nueva carga de trabajo intermodular para no comprometer el performance en UI.
