import { test, expect } from '@playwright/test';

test.describe('Pruebas de verificación de los modos matemáticos en Binary EquaLab', () => {

  test.beforeEach(async ({ page }) => {
    // Abrir la aplicación en el puerto local de desarrollo
    await page.goto('/');
  });

  test('Modo Ecuaciones: Formateo correcto de la solución en sistemas lineales', async ({ page }) => {
    // Ir a la sección de ecuaciones (asumiendo que hay un menú o botón para seleccionarlo)
    // Busquemos el botón que activa el modo ecuaciones
    const botonModoEcuaciones = page.getByRole('button', { name: /Ecuación/i }).first();
    await botonModoEcuaciones.click();

    // Seleccionar la pestaña de "Sistema"
    const pestañaSistema = page.getByRole('button', { name: 'Sistema' });
    await pestañaSistema.click();

    // Escribir los inputs lhs y rhs de la primera ecuación (2x + y = 5)
    const entradaLhs1 = page.locator('input[aria-label="Parte izquierda de la ecuación 1"]');
    await entradaLhs1.fill('2*x + y');
    const entradaRhs1 = page.locator('input[aria-label="Parte derecha de la ecuación 1"]');
    await entradaRhs1.fill('5');

    // Escribir los inputs lhs y rhs de la segunda ecuación (x - y = 1)
    const entradaLhs2 = page.locator('input[aria-label="Parte izquierda de la ecuación 2"]');
    await entradaLhs2.fill('x - y');
    const entradaRhs2 = page.locator('input[aria-label="Parte derecha de la ecuación 2"]');
    await entradaRhs2.fill('1');

    // Especificar las variables
    const entradaVariables = page.locator('#entrada-variable');
    await entradaVariables.fill('x, y');

    // Hacer clic en resolver
    const botonResolver = page.getByRole('button', { name: /Resolver/i });
    await botonResolver.click();

    // Comprobar la solución en MathDisplay (debe ser x = 2 y y = 1)
    // El MathDisplay renderiza la fórmula LaTeX, por lo que buscamos que no contenga el bug "x = x,2"
    const contenedorSolucion = page.locator('h3:has-text("Solución") + div, h3:has-text("Solución") ~ div');
    await expect(contenedorSolucion).toBeVisible();

    const textoSolucion = await contenedorSolucion.textContent();
    // Validar que no contenga "x = x,2" sino que contenga x = 2 y y = 1
    expect(textoSolucion).not.toContain('x,2');
    expect(textoSolucion).not.toContain('y,1');
    expect(textoSolucion).toContain('2');
    expect(textoSolucion).toContain('1');
  });

  test('Modo Complejos: Entrada y cálculo en polar para z2', async ({ page }) => {
    // Abrir el modo de números complejos
    const botonModoComplejos = page.getByRole('button', { name: /Complejos/i }).first();
    if (await botonModoComplejos.isVisible()) {
      await botonModoComplejos.click();
    } else {
      // Si está en el sidebar
      await page.click('text=Números Complejos');
    }

    // Cambiar el tipo de entrada a Polar
    const botonPolar = page.getByRole('button', { name: 'Polar (r∠θ)' });
    await botonPolar.click();

    // Llenar z1 en polar: 5 ∠ 53.13° (aprox 3 + 4i)
    const entradaZ1Modulo = page.locator('input[aria-label="Módulo del número complejo z1"]');
    await entradaZ1Modulo.fill('5');
    const entradaZ1Angulo = page.locator('input[aria-label="Ángulo en grados del número complejo z1"]');
    await entradaZ1Angulo.fill('53.13');

    // Llenar z2 en polar: 2 ∠ 30°
    const entradaZ2Modulo = page.locator('input[aria-label="Módulo del número complejo z2"]');
    await expect(entradaZ2Modulo).toBeVisible(); // Asegurar que el input polar de z2 esté visible
    await entradaZ2Modulo.fill('2');
    const entradaZ2Angulo = page.locator('input[aria-label="Ángulo en grados del número complejo z2"]');
    await entradaZ2Angulo.fill('30');

    // Cambiar operación a multiplicación
    await page.getByRole('button', { name: '×' }).click();

    // Calcular
    await page.getByRole('button', { name: 'Calcular' }).click();

    // El resultado en polar de multiplicar 5 ∠ 53.13° por 2 ∠ 30° es 10 ∠ 83.13°
    const contenedorResultado = page.locator('text=Resultado').locator('xpath=..');
    const textoResultado = await contenedorResultado.textContent();
    
    // Verificar módulo de 10
    expect(textoResultado).toContain('10.00');
    // Verificar ángulo aproximado a 83.13
    expect(textoResultado).toContain('83.13');
  });

  test('Modo Vectores: Saneamiento de la operación cross al cambiar de dimensión a 2D', async ({ page }) => {
    // Seleccionar modo vectores
    const botonModoVectores = page.getByRole('button', { name: /Vectores/i }).first();
    if (await botonModoVectores.isVisible()) {
      await botonModoVectores.click();
    } else {
      await page.click('text=Vectores 2D/3D');
    }

    // Seleccionar dimensión 3D
    const boton3D = page.getByRole('button', { name: '3D' });
    await boton3D.click();

    // Seleccionar operación Producto Cruz
    const botonCruz = page.getByRole('button', { name: 'v₁ × v₂' });
    await expect(botonCruz).toBeVisible();
    await botonCruz.click();

    // Cambiar dimensión a 2D
    const boton2D = page.getByRole('button', { name: '2D' });
    await boton2D.click();

    // La operación seleccionada debe cambiar automáticamente a Suma (v1 + v2)
    // El botón 'v1 + v2' debe tener la clase activa (bg-aurora-primary)
    const botonSuma = page.getByRole('button', { name: 'v₁ + v₂' });
    await expect(botonSuma).toHaveClass(/bg-aurora-primary/);

    // El botón de producto cruz no debe estar en la interfaz de 2D
    const botonCruz2D = page.getByRole('button', { name: 'v₁ × v₂' });
    await expect(botonCruz2D).not.toBeVisible();
  });

});
