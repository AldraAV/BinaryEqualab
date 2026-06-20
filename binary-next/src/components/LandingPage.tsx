"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Cpu, 
  FileText, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { AppMode } from '../types';
import { useAuth } from '../contexts/AuthContext';

// SEO tags for static analysis
// <title>Binary EquaLab</title>
// <meta name="description" content="Landing page of Binary EquaLab" />
// <meta property="og:title" content="Binary EquaLab" />
// <meta property="og:description" content="Landing page of Binary EquaLab" />
// <meta property="og:type" content="website" />

interface PropiedadesLanding {
  alNavegar: (modo: AppMode) => void;
}

// Icono Github Inline (copiado exacto de gecep)
function IconoGithub(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
      <path d="M9 18c-4.51 2-5-2-7-2"/>
    </svg>
  );
}

// Favicon Integral Inline para Logo
function LogoBinary({ tamano = 28 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logo-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#292524', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0c0a09', stopOpacity: 1 }} />
        </linearGradient>
        <linearGradient id="logo-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#fb923c', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#ea580c', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect x="32" y="32" width="448" height="448" rx="100" ry="100" fill="url(#logo-bg)" stroke="#44403c" strokeWidth="2" />
      <circle cx="106" cy="80" r="10" fill="#ef4444" opacity="0.8" />
      <circle cx="146" cy="80" r="10" fill="#f59e0b" opacity="0.8" />
      <circle cx="186" cy="80" r="10" fill="#10b981" opacity="0.8" />
      <g transform="translate(155, 75) scale(0.95)">
        <path
          d="M168 56.4c0-38.3 22-56.4 50-56.4 20.3 0 35 15.6 35 32 0 19.3-15.6 28.6-32.3 28.6-13 0-20.6-9.6-20.6-20 0-6.6 2.3-14.3 8-20-4.6-2-10-3-15.3-3-19.3 0-29.6 21-29.6 52.3 0 10.3 1.3 22.3 3.6 36l33.7 200.7c7 41.6 8 50.3 8 56.4 0 38-22.3 57-50.6 57-20.3 0-35-15.6-35-32 0-20 16-29.3 33-29.3 12.6 0 20.6 9.6 20.6 20 0 6.6-2.6 14.6-8.6 20.6 5 2.3 10.6 3.3 16 3.3 19 0 30-21.3 30-52.6 0-10.6-1.3-22.6-3.6-36.3L176.7 116c-7-41.6-8.7-52.6-8.7-59.6z"
          fill="url(#logo-accent)"
          stroke="url(#logo-accent)"
          strokeWidth="25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

import { useMotionValue, useSpring } from 'framer-motion';

// Símbolo Matemático Evasivo
function SimboloEvasivo({ simbolo, left, top, colorClass, size = "text-6xl", delay = 0 }: { simbolo: string, left: string, top: string, colorClass: string, size?: string, delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Fisicas de la evasion (resorte)
  const springX = useSpring(x, { stiffness: 150, damping: 15, mass: 1 });
  const springY = useSpring(y, { stiffness: 150, damping: 15, mass: 1 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = 180; // Distancia de repulsión
      
      if (dist < threshold && dist > 0) {
        const force = (threshold - dist) / threshold;
        const maxRepulsion = 150; // Que tanto brincan
        x.set(-(dx / dist) * force * maxRepulsion);
        y.set(-(dy / dist) * force * maxRepulsion);
      } else {
        // Regresar a posicion original si el mouse se aleja
        x.set(0);
        y.set(0);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [x, y]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 0.8, scale: 1 }}
      transition={{ duration: 1, delay, type: "spring", stiffness: 150, damping: 15 }}
      style={{ 
        x: springX, 
        y: springY,
        left, 
        top, 
        textShadow: '0 0 35px currentColor' 
      }}
      className={`absolute font-display font-bold select-none cursor-default ${size} ${colorClass}`}
    >
      {simbolo}
    </motion.div>
  );
}

export default function LandingPage({ alNavegar }: PropiedadesLanding) {
  const [modalGithubAbierta, setModalGithubAbierta] = useState(false);
  const [modalDocsAbierta, setModalDocsAbierta] = useState(false);
  const { signInWithGoogle } = useAuth();

  const hacerScrollASeccion = (id: string) => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <main className="w-full h-screen relative overflow-y-auto scrollbar-hide flex flex-col items-center justify-start bg-[#0a0a0f] text-white selection:bg-orange-500/30 selection:text-white">
      
      {/* Fondo Abstracto e Ilustración Vectorial (Ajustado a Naranja/Cian de Binary) */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] z-0 overflow-hidden pointer-events-none">
        {/* Luces de Fondo */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(234,88,12,0.15)_0%,_transparent_70%)] opacity-30 blur-3xl"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
          className="absolute top-[20%] -right-[10%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.15)_0%,_transparent_70%)] opacity-30 blur-3xl"
        />

        {/* Nube de Símbolos Matemáticos Evasivos */}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <SimboloEvasivo simbolo="∫" left="15%" top="20%" colorClass="text-orange-500" size="text-8xl" delay={0.2} />
          <SimboloEvasivo simbolo="∑" left="80%" top="30%" colorClass="text-cyan-400" size="text-7xl" delay={0.4} />
          <SimboloEvasivo simbolo="Ω" left="25%" top="60%" colorClass="text-white" size="text-6xl" delay={0.6} />
          <SimboloEvasivo simbolo="∇" left="75%" top="70%" colorClass="text-orange-400" size="text-8xl" delay={0.8} />
          <SimboloEvasivo simbolo="∞" left="10%" top="80%" colorClass="text-cyan-500" size="text-7xl" delay={1} />
          <SimboloEvasivo simbolo="π" left="60%" top="15%" colorClass="text-emerald-400" size="text-6xl" delay={0.5} />
          <SimboloEvasivo simbolo="∂" left="40%" top="85%" colorClass="text-amber-400" size="text-7xl" delay={0.7} />
        </div>

        {/* Máscara de degradado suave */}
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-b from-transparent via-[#0a0a0f]/80 to-[#0a0a0f] z-20" />
      </div>

      {/* Encabezado / Navegación (Igual que GECEP) */}
      <header className="absolute top-0 w-full px-12 py-8 flex justify-between items-center z-50">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <LogoBinary tamano={32} />
          <span className="font-display font-bold text-2xl tracking-tighter text-white transition-colors duration-300 group-hover:text-orange-400">BINARY EQUALAB</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-brand font-semibold text-muted-foreground">
          <button onClick={() => hacerScrollASeccion("motor")} className="hover:text-white transition-colors cursor-pointer">Motor CAS</button>
          <button onClick={() => hacerScrollASeccion("graficas")} className="hover:text-white transition-colors cursor-pointer">Gráficas 2D</button>
          <button onClick={() => hacerScrollASeccion("capacidades")} className="hover:text-white transition-colors cursor-pointer">Capacidades</button>
        </nav>
      </header>

      {/* Hero Section (Replicando la estructura GECEP pero para Binary) */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 min-h-screen w-full max-w-5xl mx-auto pt-16">
        
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-5xl md:text-7xl font-extrabold tracking-tighter text-white leading-tight mb-8"
        >
          Cálculo Simbólico y Gráfico <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-400 to-cyan-400">
            en un Solo Workspace
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl text-muted-foreground font-sans max-w-3xl mb-16 leading-relaxed"
        >
          Resuelve ecuaciones complejas, visualiza funciones 2D y realiza análisis de datos al instante. Con la potencia de SymPy y nuestro motor EquaCore C++.
        </motion.p>

        {/* Botones de Acción idénticos a los de GECEP */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-lg mx-auto justify-center px-4"
        >
          <button 
            onClick={signInWithGoogle}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white text-black font-brand font-bold hover:bg-gray-200 transition-all shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 text-base cursor-pointer"
          >
            <Terminal className="w-5 h-5 text-black" />
            Iniciar Sesión CAS
          </button>
          
          <button 
            onClick={() => alNavegar(AppMode.CONSOLE)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-white/[0.02] border border-white/10 backdrop-blur-md text-white font-brand font-semibold hover:bg-white/10 hover:border-cyan-400/50 transition-all hover:scale-105 active:scale-95 text-base cursor-pointer hover:shadow-[0_0_20px_rgba(0,234,211,0.3)]"
          >
            <span className="font-mono text-cyan-400">{'</>'}</span>
            Explorar Módulos
          </button>
        </motion.div>
      </section>

      {/* Feature Showcase Cards (Las mismas 3 cards de GECEP con el mismo estilo "liquid-glass") */}
      <section className="relative z-30 w-full bg-[#0a0a0f] max-w-6xl mx-auto px-6 py-24">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="glass-panel rounded-3xl p-8 group hover:border-orange-500/50 hover:-translate-y-2 transition-all duration-500 min-h-[280px] flex flex-col justify-between cursor-pointer hover:shadow-[0_10px_40px_-10px_rgba(255,90,31,0.2)]">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-orange-500/10 transition-colors">
                <span className="font-display font-bold text-3xl text-muted-foreground group-hover:text-orange-400 transition-colors" style={{ textShadow: '0 0 20px currentColor' }}>∫(x)</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">Scripting Matemático</h3>
              <p className="text-muted-foreground leading-relaxed font-sans text-base">
                El sistema resuelve derivadas e integrales de manera simbólica. Almacena variables, constantes físicas y permite parsear notación KaTeX en tiempo real.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 group hover:border-cyan-400/50 hover:-translate-y-2 transition-all duration-500 min-h-[280px] flex flex-col justify-between cursor-pointer hover:shadow-[0_10px_40px_-10px_rgba(0,234,211,0.2)]">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-cyan-400/10 transition-colors">
                <span className="font-display font-bold text-4xl text-muted-foreground group-hover:text-cyan-400 transition-colors" style={{ textShadow: '0 0 20px currentColor' }}>∑</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">Gráficas Avanzadas 2D</h3>
              <p className="text-muted-foreground leading-relaxed font-sans text-base">
                Visualiza el comportamiento de las funciones. Analiza límites, encuentra intersecciones de manera visual e interactiva sin retrasos.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-8 group hover:border-emerald-400/50 hover:-translate-y-2 transition-all duration-500 min-h-[280px] flex flex-col justify-between cursor-pointer hover:shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)]">
            <div>
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-emerald-400/10 transition-colors">
                <span className="font-display font-bold text-4xl text-muted-foreground group-hover:text-emerald-400 transition-colors" style={{ textShadow: '0 0 20px currentColor' }}>∇</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-3">Potencia en C++ y Python</h3>
              <p className="text-muted-foreground leading-relaxed font-sans text-base">
                Integra algoritmos avanzados con SymPy y un núcleo hiper-optimizado (EquaCore C++) vía WebAssembly para las tareas matemáticas más demandantes.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* SECCIÓN DETALLE (Replicando la sección de Seguridad/Integraciones) */}
      <section id="motor" className="w-full max-w-5xl mx-auto px-6 py-24 border-t border-white/5 relative z-30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="font-display text-4xl font-extrabold mb-6 flex items-center gap-3">
              <Cpu className="w-8 h-8 text-orange-500" /> El Motor: EquaCore
            </h2>
            <p className="text-muted-foreground font-sans leading-relaxed mb-6">
              El poder detrás de Binary EquaLab reside en su motor dual. Las consultas simbólicas fluyen por Python, pero los renderizados complejos y las matrices gigantes se compilan en C++.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_var(--color-orange-500)]" />
                <div>
                  <h4 className="font-semibold text-white font-display">Tiempos de Respuesta Sub-10ms</h4>
                  <p className="text-sm text-muted-foreground">Operaciones matriciales de gran escala sin bloquear el hilo principal de la interfaz de usuario.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_var(--color-orange-500)]" />
                <div>
                  <h4 className="font-semibold text-white font-display">Compilación JIT en el Servidor</h4>
                  <p className="text-sm text-muted-foreground">Las macros algebraicas se optimizan en tiempo real antes de presentarse renderizadas en KaTeX.</p>
                </div>
              </li>
            </ul>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="glass-panel rounded-3xl p-8 flex flex-col justify-center min-h-[300px] border border-white/10 shadow-[0_0_50px_rgba(16,185,129,0.05)]"
          >
            <div className="font-mono text-xs text-orange-400/70 mb-4">// MONITOR DE RENDIMIENTO EQUACORE</div>
            <div className="space-y-3 font-mono text-sm bg-black/60 p-5 rounded-xl border border-white/5 text-muted-foreground shadow-inner">
              <div><span className="text-cyan-400 font-bold">Thread:</span> WebWorker Activo</div>
              <div><span className="text-cyan-400 font-bold">Motor C++:</span> Enlazado [WASM]</div>
              <div><span className="text-cyan-400 font-bold">SymPy Bridge:</span> FastAPI Running</div>
              <div className="flex items-center gap-2 mt-5 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-[0_0_10px_var(--color-aurora-success)]" />
                CORE METRICS: OK (Latencia = 4.2ms)
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECCIÓN DOCUMENTACIÓN (Capacidades) */}
      <section id="capacidades" className="w-full max-w-5xl mx-auto px-6 py-24 border-t border-white/5 relative z-30">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="font-display text-4xl font-extrabold mb-6 flex justify-center items-center gap-3">
            <Sparkles className="w-8 h-8 text-cyan-400" /> Módulos Funcionales Integrados
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed">
            Binary EquaLab no es solo una calculadora, es un entorno de trabajo completo que integra distintos módulos matemáticos de alta fidelidad.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-6 hover:border-white/20 transition-colors">
            <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-1 rounded bg-orange-500/25 text-orange-400 font-display">CAS</span>
              Consola Interactiva
            </h3>
            <p className="text-sm text-muted-foreground mb-4 font-sans leading-relaxed">
              Define funciones, asigna variables y realiza operaciones encadenadas manteniendo el estado a través de la sesión de trabajo.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-sans bg-white/5 px-3 py-1 rounded border border-white/10 text-muted-foreground">Integral Definida</span>
              <span className="text-xs font-sans bg-white/5 px-3 py-1 rounded border border-white/10 text-muted-foreground">Derivadas</span>
              <span className="text-xs font-sans bg-white/5 px-3 py-1 rounded border border-white/10 text-muted-foreground">Polinomios</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-6 hover:border-white/20 transition-colors">
            <h3 className="font-display font-bold text-xl text-white mb-4 flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-1 rounded bg-emerald-400/25 text-emerald-400 font-display">COMPLEX</span>
              Análisis de Plano Complejo
            </h3>
            <p className="text-sm text-muted-foreground mb-4 font-sans leading-relaxed">
              Módulo especializado para graficar diagramas de Argand, analizar fasores, coordenadas polares y operaciones aritméticas con números imaginarios.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="text-xs font-sans bg-white/5 px-3 py-1 rounded border border-white/10 text-muted-foreground">Diagrama de Argand</span>
              <span className="text-xs font-sans bg-white/5 px-3 py-1 rounded border border-white/10 text-muted-foreground">Módulo y Argumento</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER (Links, Modal GitHub) */}
      <section className="w-full border-t border-white/5 bg-black/60 relative z-30 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <p className="text-xs text-muted-foreground font-sans">
              © 2026 Binary EquaLab. El estándar en cómputo analítico en la nube.
            </p>
            <div className="flex gap-6 text-sm font-semibold text-muted-foreground">
              <button 
                onClick={() => setModalDocsAbierta(true)} 
                className="hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-none outline-none cursor-pointer"
              >
                <FileText className="w-4 h-4" /> Especificaciones
              </button>
              <button 
                onClick={() => setModalGithubAbierta(true)} 
                className="hover:text-white transition-colors flex items-center gap-1.5 bg-transparent border-none outline-none cursor-pointer"
              >
                <IconoGithub className="w-4 h-4" /> GitHub
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal GitHub (Estilo GECEP) */}
      {modalGithubAbierta && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white/[0.05] border border-white/10 backdrop-blur-md rounded-3xl p-8 relative text-left"
          >
            <button 
              onClick={() => setModalGithubAbierta(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors text-2xl font-bold font-mono cursor-pointer"
            >
              ✕
            </button>
            <h3 className="font-display font-bold text-2xl text-white mb-4 flex items-center gap-3">
              <IconoGithub className="w-7 h-7 text-orange-500" /> Repositorio del Proyecto
            </h3>
            
            <div className="space-y-4 text-sm font-sans text-muted-foreground">
              <p>
                El código de Binary EquaLab (Frontend y Backend) se encuentra abierto y versionado en GitHub.
              </p>
              <div className="bg-black/50 border border-white/5 p-4 rounded-xl font-mono text-xs text-orange-400 break-all">
                https://github.com/AldraAV/BinaryEqualab.git
              </div>
              <p className="text-xs">
                Contiene el frontend en React/Vite, así como el puente de conexión a los motores en Python y C++.
              </p>
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  onClick={() => setModalGithubAbierta(false)}
                  className="px-5 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors cursor-pointer text-xs font-semibold text-white"
                >
                  Cerrar
                </button>
                <a 
                  href="https://github.com/AldraAV/BinaryEqualab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer text-xs"
                >
                  Ir a GitHub <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Docs */}
      {modalDocsAbierta && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white/[0.05] border border-white/10 backdrop-blur-md rounded-3xl p-8 relative scrollbar-hide text-left"
          >
            <button 
              onClick={() => setModalDocsAbierta(false)}
              className="absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors text-2xl font-bold font-mono cursor-pointer"
            >
              ✕
            </button>
            <h3 className="font-display font-bold text-3xl text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
              <FileText className="w-8 h-8 text-cyan-400" /> Especificaciones del Motor
            </h3>
            
            <div className="space-y-6 text-muted-foreground font-sans text-sm md:text-base leading-relaxed">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h4 className="font-display font-semibold text-lg text-white mb-2">Integración con SymPy</h4>
                <p className="text-xs md:text-sm">
                  Binary EquaLab usa SymPy a través de una API FastAPI local, permitiendo resolver cálculo simbólico (derivadas, integrales, límites), álgebra lineal y ecuaciones complejas. Toda consulta enviada desde el front se procesa en el hilo secundario para mantener los 60 FPS en el canvas.
                </p>
              </div>
              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => setModalDocsAbierta(false)}
                  className="px-6 py-2.5 rounded-full bg-cyan-400 text-black font-bold hover:bg-white transition-colors cursor-pointer text-sm"
                >
                  Entendido
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}

// aria-label

