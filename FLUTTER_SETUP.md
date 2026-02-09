# 🚀 Instalación de Flutter para Binary EquaLab

## Paso 1: Descargar Flutter SDK

1. Ve a: https://docs.flutter.dev/get-started/install/windows
2. O descarga directo: https://storage.googleapis.com/flutter_infra_release/releases/stable/windows/flutter_windows_3.27.1-stable.zip
3. Extrae el ZIP en `C:\src\flutter` (evita Program Files por permisos)

## Paso 2: Configurar Variables de Entorno

```powershell
# Opción A: Temporal (solo esta sesión)
$env:Path += ";C:\src\flutter\bin"

# Opción B: Permanente (recomendado)
# 1. Presiona Win + X → Sistema → Configuración avanzada
# 2. Variables de entorno → Path → Editar
# 3. Agregar: C:\src\flutter\bin
```

## Paso 3: Verificar Instalación

```powershell
flutter doctor
```

**Salida esperada:**
```
[✓] Flutter (Channel stable, 3.27.1)
[✓] Android toolchain - develop for Android devices (Android SDK version XX)
[!] Android Studio (version XX) ← Instalará plugin después
[✓] VS Code (version XX)
[✓] Connected device (0 available)
```

## Paso 4: Aceptar Licencias Android

```powershell
flutter doctor --android-licenses
# Presiona 'y' para aceptar todas
```

## Paso 5: Instalar Plugin en Android Studio

1. Android Studio → File → Settings → Plugins
2. Buscar: **Flutter**
3. Instalar (incluye Dart automáticamente)
4. Restart IDE

## Paso 6: Crear Proyecto Flutter

```powershell
cd C:\Users\carde\Desktop\MUACK\BinaryEquaLab
flutter create binary-mobile --org com.aldra.binaryequalab
cd binary-mobile
```

## Paso 7: Verificar que Funcione

```powershell
# Conecta tu celular en modo debug USB
flutter devices

# Ejecuta la app de ejemplo
flutter run
```

## Comandos Útiles Flutter

```powershell
# Hot reload (mientras corre la app)
# Presiona 'r' en la terminal

# Hot restart
# Presiona 'R'

# Compilar APK release
flutter build apk --release

# Ver logs
flutter logs

# Limpiar build
flutter clean
```

## Estructura del Proyecto Binary Mobile

```
binary-mobile/
├── lib/
│   ├── main.dart                    # Entry point
│   ├── theme/
│   │   └── app_theme.dart          # Aurora Dark theme
│   ├── screens/
│   │   └── calculator_screen.dart
│   ├── widgets/
│   │   ├── latex_preview.dart
│   │   ├── math_keyboard.dart
│   │   └── history_card.dart
│   ├── models/
│   │   ├── math_token.dart
│   │   └── math_expression.dart
│   └── services/
│       └── api_service.dart        # Backend connection
├── pubspec.yaml                     # Dependencies
├── android/                         # Android config
└── ios/                             # iOS config (futuro)
```

## Dependencias a Instalar

En `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0                      # API calls
  flutter_math_fork: ^0.7.2         # LaTeX rendering
  provider: ^6.1.1                  # State management
  shared_preferences: ^2.2.2        # Local storage
```

## ¿Listo para Continuar?

Una vez que `flutter doctor` muestre todo en verde (excepto tal vez iOS si no tienes Mac), estaré listo para:

1. ✅ Crear el proyecto `binary-mobile`
2. ✅ Implementar el diseño de los mockups de Stitch
3. ✅ Conectar al backend Python
4. ✅ Migrar toda la lógica de Kotlin

🍒
