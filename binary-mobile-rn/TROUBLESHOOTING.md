# Binary EquaLab - React Native Quick Start

## ⚠️ Problema Actual: Conflicto npm/pnpm

El proyecto tiene archivos bloqueados. **Solución:**

### Opción 1: Usar npm (Recomendado)
```powershell
# 1. Cerrar todos los procesos Node/Metro
taskkill /F /IM node.exe

# 2. Limpiar
cd binary-mobile-rn
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item package-lock.json -ErrorAction SilentlyContinue

# 3. Instalar con npm
npm install

# 4. Ejecutar
npm run web  # Para probar en navegador
# O
npm run android  # Para Android
```

### Opción 2: Simplificar el proyecto

Si sigue fallando, puedo crear una versión **sin Expo** (React Native CLI puro) que es más ligera.

---

## 🎯 Estado Actual

**Código creado (80% reutilizado del web):**
- ✅ `src/services/apiService.ts`
- ✅ `src/types/types.ts`
- ✅ `src/config/mathActions.ts`
- ✅ `src/contexts/CalculatorContext.tsx`
- ✅ `src/components/MathKeyboard.tsx`
- ✅ `src/components/MathPreview.tsx`
- ✅ `src/components/HistoryList.tsx`
- ✅ `src/screens/CalculatorScreen.tsx`
- ✅ `App.tsx`

**Problema:** node_modules bloqueado por Metro Bundler

---

## 🍒 Siguiente Paso

¿Prefieres:
1. **Cerrar Metro y reinstalar** (5 min)
2. **Crear versión React Native CLI** sin Expo (10 min)
3. **Volver a Kotlin** y mejorar el UI (ya compilaba)
