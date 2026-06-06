### INGENIERÍA EN TECNOLOGÍAS DE LA INFORMACIÓN Y COMUNICACIONES

**MATERIA:** Administración de Proyectos  
**DOCENTE:** Dra. Susana Astrid López García  
**PROYECTO:** Binary EquaLab - Sistema de Álgebra Computacional  

**INTEGRANTES DEL EQUIPO:**
- Gerardo Aquino del Ángel – 241H0327
- José Avilés Cárdenas – 241H0226
- Juan Hernández Montiel – 241H0235
- Michel Gaspar Anastasio – 241H0234

**CIUDAD Y FECHA:** Naranjos, Ver., 2026.

---

# ÍNDICE

1. **INICIO DEL PROYECTO**
   1.1 Definición del Proyecto
   1.2 Problemática y Justificación
   1.3 Misión y Visión
   1.4 Objetivos (General y Específicos)
   1.5 Alcances y Limitaciones
   1.6 Diagrama Organizacional

2. **ESTUDIO DE FACTIBILIDAD Y MERCADO**
   2.1 Factibilidad (Técnica, Económica, Operacional)
   2.2 Definición del Universo y Muestra
   2.3 Resultados de la Encuesta de Mercado
   2.4 Diagrama de Ishikawa

3. **ANÁLISIS DE REQUERIMIENTOS Y DEL SISTEMA**
   3.1 Requerimientos Funcionales y No Funcionales
   3.2 Casos de Uso y Perfiles de Usuario
   3.3 Arquitectura y Modelado (Clases, Interacción, Base de Datos)

4. **DISEÑO Y MODELO DE NEGOCIO**
   4.1 Diseño de Interfaces y Módulos
   4.2 Modelo de Monetización
   4.3 Medidas de Seguridad

5. **PLANIFICACIÓN Y METODOLOGÍA**
   5.1 Metodología Ágil (Scrum)
   5.2 Planificación por Sprints
   5.3 Conclusiones

---

# 1. INICIO DEL PROYECTO

### 1.1 Definición del Proyecto
**Binary EquaLab** es un Sistema de Álgebra Computacional (CAS) de código abierto, desarrollado específicamente para el contexto educativo hispanohablante. La plataforma es multiplataforma (web, escritorio y línea de comandos) e integra cálculo simbólico, graficación avanzada, análisis numérico y herramientas especializadas en matemáticas financieras, estadística y álgebra lineal.

### 1.2 Problemática y Justificación
Los estudiantes de ingeniería en México (y Latinoamérica) enfrentan tres grandes barreras para acceder a herramientas matemáticas profesionales:
1. **Económica:** Licencias de software como MATLAB o Mathematica cuestan entre $50 y $160 USD anuales, siendo prohibitivas para el 60% de los estudiantes mexicanos en situación de pobreza moderada.
2. **Lingüística:** El 78% del software opera en inglés, añadiendo carga cognitiva.
3. **Tecnológica:** Las instituciones gastan millones en licencias extranjeras en lugar de adoptar alternativas de código abierto.

Binary EquaLab soluciona esto ofreciendo una herramienta con funciones en **español nativo** (ej. `derivar()`, `integrar()`), completamente **gratuita** y accesible desde cualquier navegador sin requerir instalación pesada.

### 1.3 Misión y Visión
- **Misión:** Democratizar el acceso a herramientas matemáticas de calidad profesional para la comunidad hispanohablante mediante un sistema gratuito, de código abierto y en español nativo, fomentando la equidad educativa y la soberanía tecnológica.
- **Visión:** Convertirse en el Sistema de Álgebra Computacional estándar en instituciones de educación superior hispanohablantes para el año 2028, alcanzando adopción en al menos 50 universidades mexicanas y 200,000 usuarios activos.

### 1.4 Objetivos
**Objetivo General:** Desarrollar e implementar un Sistema de Álgebra Computacional multiplataforma de código abierto con funcionalidad equivalente a herramientas comerciales, que incluya motor C++, interfaces en español nativo y 8 módulos matemáticos funcionales durante el ciclo enero-junio 2026.

**Objetivos Específicos:**
- Investigar y seleccionar tecnologías óptimas (React, FastAPI, C++ EquaCore, Supabase).
- Implementar el motor de cálculo en C++ (Eigen3) para procesar matrices 1000x1000 en <2 segundos.
- Desarrollar la interfaz web (React/TypeScript) garantizando tiempos de carga menores a 3 segundos.
- Validar usabilidad mediante pruebas con 20 estudiantes del ITSNA, logrando >85% de éxito en tareas.

### 1.5 Alcances y Limitaciones
- **Alcances:** 8 módulos operativos (CAS, Gráficas con Epicycles PRO, Ecuaciones, Matrices, Estadística, Complejos, Vectores y Finanzas). Aplicación Web y de Escritorio (PyQt6).
- **Limitaciones:** Dependencia de servicios gratuitos de hosting (Vercel, Render, Supabase) en etapas iniciales. Límites de cómputo en navegador que requieren procesamiento backend para operaciones extremadamente pesadas.

### 1.6 Diagrama Organizacional
> *[INSERTA AQUÍ LA IMAGEN DEL PDF: DIAGRAMA ORGANIZACIONAL BINARY EQUALAB]*

---

# 2. ESTUDIO DE FACTIBILIDAD Y MERCADO

### 2.1 Factibilidad
- **Técnica:** El equipo cuenta con experiencia en el stack seleccionado (React, Python, C++, Supabase). Las bibliotecas usadas (Eigen3, SymPy, KaTeX) son de código abierto y estables.
- **Económica:** El costo estimado de infraestructura inicial es nulo gracias a los "Tiers" gratuitos de Vercel y Render. El costo del proyecto se valúa en **$14,450.00 MXN**, constituido principalmente por las horas-hombre de desarrollo aportadas académicamente.
- **Operacional:** La plataforma operará bajo la nube, garantizando disponibilidad 24/7 sin requerir mantenimiento físico de servidores por parte de la institución.

### 2.2 Definición del Universo y Muestra
El universo se definió como la población joven (18-27 años) de Naranjos Amatlán (4,536 personas aprox.). Aplicando la **Fórmula de Cochran** para poblaciones finitas (N=4,536, confianza=95%, error=5%), el tamaño de la muestra resultó en **354 encuestas**, redondeadas a **360** para el ejercicio operativo en el ITSNA y alrededores.

### 2.3 Resultados de la Encuesta de Mercado (Resumen)
- **73.7%** de quienes usan herramientas matemáticas, solo utilizan la calculadora básica del celular.
- **90.9%** identifica el costo o el idioma como barreras significativas.
- **95.5%** de los encuestados está dispuesto a adoptar Binary EquaLab tras probarlo.
- **Módulos Prioritarios:** Calculadora CAS (31.8%), Estadística (27.3%) y Ecuaciones (22.7%).
- **Aceptación IA:** El 100% considera útil o muy útil la resolución paso a paso mediante Inteligencia Artificial.

> *[INSERTA AQUÍ LAS IMÁGENES/GRÁFICAS DE LOS RESULTADOS DE LA ENCUESTA]*

### 2.4 Diagrama de Ishikawa (Análisis de Causa-Efecto)
Se elaboró un diagrama de causa-efecto para identificar el origen de la brecha digital-matemática en los estudiantes (costos de licencias, barreras de idioma, hardware limitado, etc.).
> *[INSERTA AQUÍ LA IMAGEN DEL PDF: DIAGRAMA-ISHIKAWA]*

---

# 3. ANÁLISIS DE REQUERIMIENTOS Y DEL SISTEMA

### 3.1 Requerimientos Funcionales y No Funcionales
**Funcionales (Principales):**
- RF-01: Evaluar expresiones matemáticas en español nativo.
- RF-02: Renderizado en formato LaTeX.
- RF-04: Descomposición en series de Fourier (Epicycles PRO).
- RF-09: Autenticación mediante correo y Google OAuth.

**No Funcionales:**
- RNF-01: Respuesta a operaciones estándar en <500ms.
- RNF-03: Gratuito en su nivel base, sin anuncios.
- RNF-04: Límite de peticiones de 100 req/min por IP.

### 3.2 Casos de Uso y Perfiles de Usuario
- **Usuario Anónimo:** Accede a todos los módulos de cálculo básico sin restricciones.
- **Usuario Registrado:** Historial interactivo, sincronización en la nube, cuota ampliada de resoluciones con IA.
- **Usuario Premium:** Exportación LaTeX, paso a paso ilimitado.

### 3.3 Arquitectura y Base de Datos
- **Frontend:** React 19, Vite, TypeScript, KaTeX, Nerdamer.
- **Backend:** Python (FastAPI), C++ EquaCore (Eigen3 + pybind11), SymPy.
- **Base de Datos (Supabase - PostgreSQL):**
  Tablas principales: `users`, `users_plans` (gestión de cuotas IA), `calculation_history` (historial de cálculos).

---

# 4. DISEÑO Y MODELO DE NEGOCIO

### 4.1 Diseño de Interfaces
La interfaz es tipo *Single Page Application* (SPA) para navegación sin recargas.
> *[INSERTA AQUÍ LAS IMÁGENES/MOCKUPS DE LOS 8 MÓDULOS DEL MANUAL CORREGIDO]*

### 4.2 Modelo de Monetización
- **Tier Gratuito (Permanente):** Acceso a 8 modos operativos, sin anuncios.
- **Tier Premium ($3-5 USD/mes):** Explicación paso a paso ilimitada, exportación en LaTeX, historial ilimitado. Transacciones seguras vía Stripe.
- **Tier Institucional ($99 USD/mes):** Dashboards multiusuario y acceso API para universidades.

### 4.3 Medidas de Seguridad
- Autenticación JWT y Hashing con bcrypt.
- Protección DDoS vía Cloudflare.
- Rate Limiting y Sanitización contra Inyecciones SQL/XSS.

---

# 5. PLANIFICACIÓN Y METODOLOGÍA

### 5.1 Metodología Ágil (Scrum)
Dada la naturaleza modular del proyecto, se seleccionó Scrum para entregar valor funcional de forma incremental mediante ciclos de 2 semanas.

### 5.2 Planificación por Sprints (Semanas 1-14)
- **Sprint 0 (S1-S2):** Planeación de backlog, diseño de arquitectura y bases de datos.
- **Sprint 1-2 (S3-S8):** Implementación del motor C++ (Eigen3) y wrappers pybind11.
- **Sprint 3 (S7-S10):** Backend Python con FastAPI y endpoints REST.
- **Sprint 4 (S9-S12):** Frontend en React, integración KaTeX y Recharts.
- **Sprint 5 (S11-S13):** Testing unitario (Jest/pytest) y pruebas de validación con usuarios.
- **Sprint 6 (S13-S14):** Despliegue en Vercel/Render y lanzamiento público.

### 5.3 Conclusiones
Binary EquaLab no es únicamente un proyecto académico, es una solución concreta y escalable a la brecha digital en educación STEM. Valida su existencia a través de un riguroso estudio de mercado y demuestra factibilidad técnica gracias al ecosistema actual de código abierto. Su impacto proyectado promete ahorrar millones a las instituciones educativas, empoderando directamente al estudiante.
