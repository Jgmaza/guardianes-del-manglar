import { expect, test } from '@playwright/test';

test('welcome page shows product brand and citizen CTAs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Guardianes del Manglar' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reportar ahora' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Consultar estado' })).toBeVisible();
});

test('citizen report page loads wizard steps', async ({ page }) => {
  await page.goto('/reportar');
  await expect(page.getByRole('heading', { name: 'Crear reporte' })).toBeVisible();
  await expect(page.getByText('Captura una evidencia')).toBeVisible();
});

test('cra dashboard loads report inbox', async ({ page }) => {
  await page.goto('/cra');
  await expect(page.getByRole('heading', { name: 'Panel C.R.A.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Bandeja de reportes' })).toBeVisible();
});
