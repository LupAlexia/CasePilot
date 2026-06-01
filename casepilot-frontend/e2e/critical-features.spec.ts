import { test, expect } from '@playwright/test';

test.describe('Critical user journeys', () => {
  test('Feature 1: autentificare si navigare spre dashboard', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Control total asupra dosarelor.')).toBeVisible();
    await page.getByRole('button', { name: /(începe acum|incepe acum)/i }).first().click();

    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Email').fill('avocat@exemplu.ro');
    await page.getByLabel(/parolă|parola/i).fill('Parola123!');
    await page.getByRole('button', { name: 'Autentificare' }).click();

    await expect(page).toHaveURL(/\/app\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText(/activitate recentă|activitate recenta/i)).toBeVisible();
  });

  test('Feature 2: gestionare dosare - creare, editare, statistici, stergere', async ({ page }) => {
    await page.goto('/app/dosare');

    await expect(page.getByRole('heading', { name: 'Gestionare dosare' })).toBeVisible();
    await expect(page.getByText('1234/2024')).toBeVisible();

    await page.getByRole('button', { name: /adaugă dosar|adauga dosar/i }).click();

    await page.getByLabel(/număr dosar|numar dosar/i).fill('9999/2026');
    await page.getByLabel(/instanță|instanta/i).fill('Tribunalul Cluj');
    await page.getByLabel('Obiect').fill('Litigiu comercial');
    await page.getByLabel(/stadiu procesual/i).click();
    await page.getByRole('option', { name: 'Apel' }).click();
    await page.getByLabel('Status').click();
    await page.getByRole('option', { name: /în așteptare|in așteptare|in asteptare/i }).click();
    await page.getByRole('button', { name: /salvează|salveaza/i }).click();

    await expect(page.getByText('9999/2026')).toBeVisible();

    await page.getByRole('tab', { name: 'Statistici' }).click();
    await expect(page.getByText(/distribuția dosarelor după status|distributia dosarelor dupa status/i)).toBeVisible();
    await expect(page.getByText(/dosare pe instanță|dosare pe instanta/i)).toBeVisible();
    await expect(page.getByText('Dosare pe stadiu procesual')).toBeVisible();

    await page.getByRole('tab', { name: 'Tabel dosare' }).click();

    const row = page.locator('tr', { hasText: '9999/2026' });
    await row.getByRole('button', { name: /șterge|sterge/i }).click();
    const deleteDialog = page.getByRole('dialog', { name: /ștergere dosar|stergere dosar/i });
    await deleteDialog.getByRole('button', { name: /șterge|sterge/i }).click();

    await expect(page.getByText('9999/2026')).toHaveCount(0);
  });

  test('Feature 3: detaliu dosar - tab-uri, upload document local, asistent AI', async ({ page }) => {
    await page.goto('/app/dosare/1');

    await expect(page.getByRole('heading', { name: /informații dosar|informatii dosar/i })).toBeVisible();
    await expect(page.getByText('1234/2024')).toBeVisible();

    // Document upload from local machine
    page.on('dialog', (dialog) => dialog.accept());
    const uploadInput = page.locator('input[type="file"][accept=".pdf,.docx,.doc,.txt"]');
    await uploadInput.setInputFiles('e2e/fixtures/contract-test.pdf');

    await page.getByRole('tab', { name: 'Asistent AI' }).click();

    await expect(page.getByText(/sinteză document|sinteza document/i)).toBeVisible();

    const summarySelect = page.locator('select').first();
    await summarySelect.selectOption({ index: 1 });
    await page.getByRole('button', { name: /generează sinteză|genereaza sinteza/i }).click();
    await expect(page.getByText(/părți implicate|parti implicate/i)).toBeVisible();

    const docTypeSelect = page.locator('select').nth(1);
    await docTypeSelect.selectOption('concluzii');
    await page.getByPlaceholder(/introdu instrucțiuni|introdu instructiuni/i).fill('Argumentare pe exceptia prescriptiei.');

    const templateInput = page.locator('input[type="file"][accept=".docx,.doc"]');
    await templateInput.setInputFiles('e2e/fixtures/template.docx');

    await page.getByRole('button', { name: /generează document|genereaza document/i }).click();

    await expect(page.getByText('Document generat')).toBeVisible();
    await expect(page.getByRole('heading', { name: /concluzii scrise/i })).toBeVisible();
    await expect(page.getByText('Argumentare pe exceptia prescriptiei.').last()).toBeVisible();
  });
});
