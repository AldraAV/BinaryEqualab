import { useState, useEffect } from 'react';
import { getAutocompleteSuggestions, FunctionDef } from '../services/functionDefs';

export interface EstadoAutocompletado {
  sugerencias: FunctionDef[];
  indiceSeleccionado: number;
  mostrar: boolean;
  palabraActiva: string;
  inicioPalabra: number;
  finPalabra: number;
}

export function usarAutocompletado(entrada: string, posicionCursor: number) {
  const [estado, setEstado] = useState<EstadoAutocompletado>({
    sugerencias: [],
    indiceSeleccionado: 0,
    mostrar: false,
    palabraActiva: '',
    inicioPalabra: 0,
    finPalabra: 0
  });

  useEffect(() => {
    // Buscar la palabra actual bajo el cursor
    if (!entrada || posicionCursor === 0) {
      setEstado(e => ({ ...e, mostrar: false }));
      return;
    }

    // Encuentra el inicio de la palabra actual (letras y guiones bajos)
    let inicio = posicionCursor - 1;
    while (inicio >= 0 && /[a-zA-Z_]/.test(entrada[inicio])) {
      inicio--;
    }
    inicio++; // Regresar al primer caracter válido

    // Encuentra el fin de la palabra actual
    let fin = posicionCursor;
    while (fin < entrada.length && /[a-zA-Z_]/.test(entrada[fin])) {
      fin++;
    }

    const palabraActiva = entrada.substring(inicio, fin);

    if (palabraActiva.length >= 1) { // Mostrar sugerencias desde la primera letra
      const sugerenciasEncontradas = getAutocompleteSuggestions(palabraActiva);
      
      if (sugerenciasEncontradas.length > 0) {
        setEstado({
          sugerencias: sugerenciasEncontradas,
          indiceSeleccionado: 0,
          mostrar: true,
          palabraActiva: palabraActiva,
          inicioPalabra: inicio,
          finPalabra: fin
        });
        return;
      }
    }
    
    setEstado(e => ({ ...e, mostrar: false }));
  }, [entrada, posicionCursor]);

  const moverSeleccion = (direccion: 'arriba' | 'abajo') => {
    setEstado(e => {
      if (!e.mostrar || e.sugerencias.length === 0) return e;
      let nuevoIndice = direccion === 'abajo' ? e.indiceSeleccionado + 1 : e.indiceSeleccionado - 1;
      if (nuevoIndice < 0) nuevoIndice = e.sugerencias.length - 1;
      if (nuevoIndice >= e.sugerencias.length) nuevoIndice = 0;
      return { ...e, indiceSeleccionado: nuevoIndice };
    });
  };

  const aplicarSugerencia = (indiceSugerencia?: number): { nuevaEntrada: string; nuevoCursor: number } | null => {
    if (!estado.mostrar || estado.sugerencias.length === 0) return null;
    
    const indice = indiceSugerencia !== undefined ? indiceSugerencia : estado.indiceSeleccionado;
    const item = estado.sugerencias[indice];
    
    // Calcular el texto a insertar (ej. "integrate(" )
    const textoAInsertar = item.name + '(';
    
    // Reemplazar la palabra activa con la sugerencia
    const antes = entrada.substring(0, estado.inicioPalabra);
    const despues = entrada.substring(estado.finPalabra);
    
    const nuevaEntrada = antes + textoAInsertar + despues;
    const nuevoCursor = antes.length + textoAInsertar.length;

    setEstado(e => ({ ...e, mostrar: false }));
    
    return { nuevaEntrada, nuevoCursor };
  };

  return {
    ...estado,
    moverSeleccion,
    aplicarSugerencia,
    cerrar: () => setEstado(e => ({ ...e, mostrar: false }))
  };
}
