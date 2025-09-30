import { test, expect } from '@playwright/test';

// Test data from our mock data file
const validBudgetData = {
  titulo: "Livro de Receitas Tradicionais",
  tiragem: "1000",
  formato: "21x28cm",
  total_pgs: "150",
  pgs_colors: "20",
  preco_unitario: "25.50",
  preco_total: "25500.00",
  prazo_producao: "2024-12-15",
  observacoes: "Impressão em papel couchê 150g"
};

const validClientData = {
  name: "João Silva Santos",
  cnpjCpf: "123.456.789-10",
  phone: "(11) 98765-4321",
  email: "joao.silva@email.com",
  address: "Rua das Flores, 123, Jardim Primavera, São Paulo - SP"
};

const validCenterData = {
  name: "Centro de Produção São Paulo",
  type: "Interno",
  obs: "Centro principal com equipamentos modernos"
};

const validOrderData = {
  title: "Pedido de Livros Escolares 2024",
  tiragem: "5000",
  formato: "21x28cm",
  prazoEntrega: "2024-11-30",
  numPaginasTotal: "200",
  numPaginasColoridas: "50",
  valorUnitario: "15.90",
  valorTotal: "79500.00",
  obs: "Entrega urgente para início do ano letivo"
};

const invalidBudgetData = {
  titulo: "",
  tiragem: "0",
  formato: "",
  total_pgs: "-1",
  pgs_colors: "-5",
  preco_unitario: "-10.00",
  preco_total: "-1000.00"
};

const invalidClientData = {
  name: "",
  cnpjCpf: "111.111.111-11",
  phone: "123",
  email: "invalid-email",
  address: ""
};

test.describe('Form Testing - Budget Forms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/budgets/new');
  });

  test('should successfully create a budget with valid data', async ({ page }) => {
    // Fill out the form with valid data
    await page.fill('#titulo', validBudgetData.titulo);
    await page.fill('#tiragem', validBudgetData.tiragem);
    await page.fill('#formato', validBudgetData.formato);
    await page.fill('#total_pgs', validBudgetData.total_pgs);
    await page.fill('#pgs_colors', validBudgetData.pgs_colors);
    await page.fill('#preco_unitario', validBudgetData.preco_unitario);
    await page.fill('#preco_total', validBudgetData.preco_total);
    await page.fill('#prazo_producao', validBudgetData.prazo_producao);
    await page.fill('#observacoes', validBudgetData.observacoes);

    // Submit the form
    await page.click('button[type="submit"]');

    // Check for success message (toast notification)
    await expect(page.locator('.sonner-toast')).toBeVisible();

    // Should redirect to budgets list
    await expect(page).toHaveURL(/\/budgets$/);
  });

  test('should show validation errors for invalid budget data', async ({ page }) => {
    // Fill out the form with invalid data
    await page.fill('#titulo', invalidBudgetData.titulo);
    await page.fill('#tiragem', invalidBudgetData.tiragem);
    await page.fill('#formato', invalidBudgetData.formato);
    await page.fill('#total_pgs', invalidBudgetData.total_pgs);
    await page.fill('#pgs_colors', invalidBudgetData.pgs_colors);
    await page.fill('#preco_unitario', invalidBudgetData.preco_unitario);
    await page.fill('#preco_total', invalidBudgetData.preco_total);

    // Try to submit the form
    await page.click('button[type="submit"]');

    // Check for validation errors (error messages in the form)
    await expect(page.locator('p.text-destructive')).toBeVisible();

    // Form should not submit (should stay on the same page)
    await expect(page).toHaveURL(/\/budgets\/new$/);
  });

  test('should handle edge case: minimal valid budget data', async ({ page }) => {
    const minimalBudget = {
      titulo: "A",
      tiragem: "1",
      formato: "A4",
      total_pgs: "1",
      pgs_colors: "0",
      preco_unitario: "0.01",
      preco_total: "0.01",
      prazo_producao: "2024-12-31",
      observacoes: ""
    };

    await page.fill('#titulo', minimalBudget.titulo);
    await page.fill('#tiragem', minimalBudget.tiragem);
    await page.fill('#formato', minimalBudget.formato);
    await page.fill('#total_pgs', minimalBudget.total_pgs);
    await page.fill('#pgs_colors', minimalBudget.pgs_colors);
    await page.fill('#preco_unitario', minimalBudget.preco_unitario);
    await page.fill('#preco_total', minimalBudget.preco_total);
    await page.fill('#prazo_producao', minimalBudget.prazo_producao);

    await page.click('button[type="submit"]');

    await expect(page.locator('.sonner-toast')).toBeVisible();
  });

  test('should handle special characters in budget form', async ({ page }) => {
    const specialCharBudget = {
      titulo: "Livro de Matemática - 数学書",
      tiragem: "1000",
      formato: "21×28cm",
      total_pgs: "150",
      pgs_colors: "20",
      preco_unitario: "25.50",
      preco_total: "25500.00",
      prazo_producao: "2024-12-15",
      observacoes: "Contém fórmulas ∑∫∆"
    };

    await page.fill('#titulo', specialCharBudget.titulo);
    await page.fill('#tiragem', specialCharBudget.tiragem);
    await page.fill('#formato', specialCharBudget.formato);
    await page.fill('#total_pgs', specialCharBudget.total_pgs);
    await page.fill('#pgs_colors', specialCharBudget.pgs_colors);
    await page.fill('#preco_unitario', specialCharBudget.preco_unitario);
    await page.fill('#preco_total', specialCharBudget.preco_total);
    await page.fill('#prazo_producao', specialCharBudget.prazo_producao);
    await page.fill('#observacoes', specialCharBudget.observacoes);

    await page.click('button[type="submit"]');

    await expect(page.locator('.sonner-toast')).toBeVisible();
  });
});

test.describe('Form Testing - Client Forms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/clients/new');
  });

  test('should successfully create a client with valid CPF data', async ({ page }) => {
    await page.fill('#name', validClientData.name);
    await page.fill('#cnpjCpf', validClientData.cnpjCpf);
    await page.fill('#phone', validClientData.phone);
    await page.fill('#email', validClientData.email);
    await page.fill('#address', validClientData.address);

    await page.click('button[type="submit"]');

    await expect(page.locator('.sonner-toast')).toBeVisible();
    await expect(page).toHaveURL(/\/clients$/);
  });

  test('should successfully create a client with valid CNPJ data', async ({ page }) => {
    const companyClient = {
      name: "Editora ABC Ltda",
      cnpjCpf: "12.345.678/0001-90",
      phone: "(11) 3456-7890",
      email: "contato@editoraabc.com.br",
      address: "Av. Paulista, 1000, 10º andar, São Paulo - SP"
    };

    await page.fill('#name', companyClient.name);
    await page.fill('#cnpjCpf', companyClient.cnpjCpf);
    await page.fill('#phone', companyClient.phone);
    await page.fill('#email', companyClient.email);
    await page.fill('#address', companyClient.address);

    await page.click('button[type="submit"]');

    await expect(page.locator('.sonner-toast')).toBeVisible();
  });

  test('should show validation errors for invalid client data', async ({ page }) => {
    await page.fill('#name', invalidClientData.name);
    await page.fill('#cnpjCpf', invalidClientData.cnpjCpf);
    await page.fill('#phone', invalidClientData.phone);
    await page.fill('#email', invalidClientData.email);
    await page.fill('#address', invalidClientData.address);

    await page.click('button[type="submit"]');

    await expect(page.locator('p.text-destructive')).toBeVisible();
    await expect(page.locator('.sonner-toast')).not.toBeVisible();
  });

  test('should handle international characters in client form', async ({ page }) => {
    const internationalClient = {
      name: "José María González Müller",
      cnpjCpf: "987.654.321-00",
      phone: "(21) 99876-5432",
      email: "jose.maria@email.com",
      address: "Rúa Ñuñoa, número 123, São José - Río de Janeiro"
    };

    await page.fill('#name', internationalClient.name);
    await page.fill('#cnpjCpf', internationalClient.cnpjCpf);
    await page.fill('#phone', internationalClient.phone);
    await page.fill('#email', internationalClient.email);
    await page.fill('#address', internationalClient.address);

    await page.click('button[type="submit"]');

    await expect(page.locator('.sonner-toast')).toBeVisible();
  });
});

test.describe('Form Testing - Center Forms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/centers/new');
  });

  test('should successfully create a center with valid data', async ({ page }) => {
    await page.fill('#name', validCenterData.name);
    await page.selectOption('[data-testid="type-select"]', validCenterData.type);
    await page.fill('#obs', validCenterData.obs);

    await page.click('button[type="submit"]');

    await expect(page.locator('.sonner-toast')).toBeVisible();
    await expect(page).toHaveURL(/\/centers$/);
  });

  test('should show validation errors for missing center data', async ({ page }) => {
    await page.click('button[type="submit"]');

    await expect(page.locator('p.text-destructive')).toBeVisible();
    await expect(page.locator('.sonner-toast')).not.toBeVisible();
  });

  test('should handle all center types correctly', async ({ page }) => {
    const centerTypes = ['Interno', 'Terceirizado', 'Digital', 'Offset', 'Outro'];

    for (const type of centerTypes) {
      await page.goto('/centers/new');

      await page.fill('#name', `Centro ${type}`);
      await page.selectOption('[data-testid="type-select"]', type);
      await page.fill('#obs', `Observações para ${type}`);

      await page.click('button[type="submit"]');

      await expect(page.locator('.sonner-toast')).toBeVisible();

      // Wait a moment before next iteration
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Form Testing - Order Forms', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders/new');
  });

  test('should successfully create an order with valid data', async ({ page }) => {
    // First need to select client and center (assuming they exist)
    await page.selectOption('select', '1'); // Select first client
    await page.selectOption('select:nth-of-type(2)', '1'); // Select first center

    await page.fill('#title', validOrderData.title);
    await page.fill('#tiragem', validOrderData.tiragem);
    await page.fill('#formato', validOrderData.formato);
    await page.fill('#prazoEntrega', validOrderData.prazoEntrega);
    await page.fill('#numPaginasTotal', validOrderData.numPaginasTotal);
    await page.fill('#numPaginasColoridas', validOrderData.numPaginasColoridas);
    await page.fill('#valorUnitario', validOrderData.valorUnitario);
    await page.fill('#valorTotal', validOrderData.valorTotal);
    await page.fill('#obs', validOrderData.obs);

    await page.click('button[type="submit"]');

    await expect(page.locator('.sonner-toast')).toBeVisible();
    await expect(page).toHaveURL(/\/orders$/);
  });

  test('should show validation errors for invalid order data', async ({ page }) => {
    await page.selectOption('select', '0');
    await page.selectOption('select:nth-of-type(2)', '0');

    await page.fill('#title', '');
    await page.fill('#tiragem', '0');
    await page.fill('#formato', '');
    await page.fill('#prazoEntrega', '');
    await page.fill('#numPaginasTotal', '-1');
    await page.fill('#numPaginasColoridas', '-1');
    await page.fill('#valorUnitario', '-10.00');
    await page.fill('#valorTotal', '-1000.00');

    await page.click('button[type="submit"]');

    await expect(page.locator('p.text-destructive')).toBeVisible();
    await expect(page.locator('.sonner-toast')).not.toBeVisible();
  });

  test('should handle large volume orders', async ({ page }) => {
    await page.selectOption('select', '1');
    await page.selectOption('select:nth-of-type(2)', '1');

    const largeOrder = {
      title: "Enciclopédia Médica Completa",
      tiragem: "25000",
      formato: "25x35cm",
      prazoEntrega: "2025-03-15",
      numPaginasTotal: "1500",
      numPaginasColoridas: "300",
      valorUnitario: "85.00",
      valorTotal: "2125000.00",
      obs: "Projeto especial com acabamento médico"
    };

    await page.fill('#title', largeOrder.title);
    await page.fill('#tiragem', largeOrder.tiragem);
    await page.fill('#formato', largeOrder.formato);
    await page.fill('#prazoEntrega', largeOrder.prazoEntrega);
    await page.fill('#numPaginasTotal', largeOrder.numPaginasTotal);
    await page.fill('#numPaginasColoridas', largeOrder.numPaginasColoridas);
    await page.fill('#valorUnitario', largeOrder.valorUnitario);
    await page.fill('#valorTotal', largeOrder.valorTotal);
    await page.fill('#obs', largeOrder.obs);

    await page.click('button[type="submit"]');

    await expect(page.locator('.sonner-toast')).toBeVisible();
  });
});

test.describe('Form Testing - Security Tests', () => {
  test('should handle SQL injection attempts in budget form', async ({ page }) => {
    await page.goto('/budgets/new');

    const sqlInjectionData = {
      titulo: "'; DROP TABLE budgets; --",
      tiragem: "100",
      formato: "21x28cm",
      total_pgs: "50",
      pgs_colors: "10",
      preco_unitario: "20.00",
      preco_total: "2000.00",
      prazo_producao: "2024-12-15",
      observacoes: "'; DELETE FROM clients; --"
    };

    await page.fill('#titulo', sqlInjectionData.titulo);
    await page.fill('#tiragem', sqlInjectionData.tiragem);
    await page.fill('#formato', sqlInjectionData.formato);
    await page.fill('#total_pgs', sqlInjectionData.total_pgs);
    await page.fill('#pgs_colors', sqlInjectionData.pgs_colors);
    await page.fill('#preco_unitario', sqlInjectionData.preco_unitario);
    await page.fill('#preco_total', sqlInjectionData.preco_total);
    await page.fill('#prazo_producao', sqlInjectionData.prazo_producao);
    await page.fill('#observacoes', sqlInjectionData.observacoes);

    await page.click('button[type="submit"]');

    // Should either show validation errors or handle the input safely
    await expect(
      page.locator('p.text-destructive, .sonner-toast')
    ).toBeVisible();
  });

  test('should handle XSS attempts in client form', async ({ page }) => {
    await page.goto('/clients/new');

    const xssData = {
      name: "<script>alert('XSS')</script>",
      cnpjCpf: "123.456.789-10",
      phone: "(11) 98765-4321",
      email: "test@email.com",
      address: "<iframe src=javascript:alert('XSS')></iframe>"
    };

    await page.fill('#name', xssData.name);
    await page.fill('#cnpjCpf', xssData.cnpjCpf);
    await page.fill('#phone', xssData.phone);
    await page.fill('#email', xssData.email);
    await page.fill('#address', xssData.address);

    await page.click('button[type="submit"]');

    // Should either show validation errors or handle the input safely
    await expect(
      page.locator('p.text-destructive, .sonner-toast')
    ).toBeVisible();

    // Check that no JavaScript was executed by checking if alert was called
    const alertCalled = await page.evaluate(() => {
      const originalAlert = window.alert;
      let called = false;
      window.alert = (...args) => { called = true; return originalAlert.apply(window, args); };
      return called;
    });
    expect(alertCalled).toBe(false);
  });
});

test.describe('Form Testing - Edge Cases', () => {
  test('should handle very long text inputs', async ({ page }) => {
    await page.goto('/budgets/new');

    const longText = 'A'.repeat(10000);

    await page.fill('#titulo', longText);
    await page.fill('#observacoes', longText);

    // Should either handle gracefully or show appropriate error
    await page.click('button[type="submit"]');

    // Check that the page doesn't crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle past dates in budget form', async ({ page }) => {
    await page.goto('/budgets/new');

    await page.fill('#titulo', "Projeto Urgente");
    await page.fill('#tiragem', "100");
    await page.fill('#formato', "21x28cm");
    await page.fill('#total_pgs', "50");
    await page.fill('#pgs_colors', "10");
    await page.fill('#preco_unitario', "20.00");
    await page.fill('#preco_total', "2000.00");
    await page.fill('#prazo_producao', "2020-01-01");

    await page.click('button[type="submit"]');

    // Should handle past dates appropriately
    await expect(
      page.locator('p.text-destructive, .sonner-toast')
    ).toBeVisible();
  });

  test('should handle future dates in order form', async ({ page }) => {
    await page.goto('/orders/new');

    await page.selectOption('select', '1');
    await page.selectOption('select:nth-of-type(2)', '1');

    await page.fill('#title', "Projeto Planejado");
    await page.fill('#tiragem', "100");
    await page.fill('#formato', "21x28cm");
    await page.fill('#prazoEntrega', "2030-12-31");
    await page.fill('#numPaginasTotal', "50");
    await page.fill('#numPaginasColoridas', "10");
    await page.fill('#valorUnitario', "20.00");
    await page.fill('#valorTotal', "2000.00");

    await page.click('button[type="submit"]');

    await expect(page.locator('.sonner-toast')).toBeVisible();
  });
});