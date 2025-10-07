// cypress/e2e/budget-form.cy.ts

describe('Budget Creation - New Form Structure', () => {
  beforeEach(() => {
    // ✅ 1. PRIMEIRO: Fazer login
    cy.visit('/dashboard'); // Página que redireciona para login se não autenticado
    cy.get('input[type="email"]').type('edgoes@alphabooks.com');
    cy.get('input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    
    // ✅ 2. Aguardar redirecionamento após login
    cy.url().should('not.include', '/auth/login');
    
    // ✅ 3. Mock das APIs APÓS o login
    cy.intercept('GET', '/api/specifications', {
      fixture: 'specifications.json'
    }).as('getSpecifications');
    
    cy.intercept('GET', '/api/clients*', {
      fixture: 'clients.json'
    }).as('getClients');
    
    cy.intercept('GET', '/api/centers*', {
      fixture: 'centers.json'
    }).as('getCenters');
    
    // ✅ 4. AGORA navegar para a página de orçamento
    cy.visit('/budgets/new');
    
    // ✅ 5. Aguardar requisições (só as que realmente acontecerem)
    cy.wait(['@getClients', '@getCenters'], { timeout: 10000 });
    
    // ✅ 6. Aguardar specifications apenas se feature flag estiver ativa
    cy.get('body').then(($body) => {
      if ($body.find('h3:contains("Especificações de Produção")').length > 0) {
        cy.wait('@getSpecifications', { timeout: 10000 });
      }
    });
  });

  describe('Cenário 1: Budget Completo Premium', () => {
    it('should create a complete budget with all production specifications', () => {
      // ✅ Aguardar a página carregar completamente
      cy.get('h3').contains('Identificação').should('be.visible');
      
      // SEÇÃO 1: Identificação
      cy.log('✅ Seção 1: Identificação');
      
      // Aguardar dropdowns carregarem
      cy.get('[data-testid="clientId"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="centerId"]', { timeout: 10000 }).should('be.visible');
      
      // Selecionar cliente (usar seletor mais robusto)
      cy.get('[data-testid="clientId"] .select-trigger').click();
      cy.get('[data-testid="clientId"] input[placeholder*="cliente"]').type('Editora');
      cy.get('[role="option"]').contains('Editora').first().click();
      
      // Selecionar centro
      cy.get('[data-testid="centerId"] .select-trigger').click();
      cy.get('[data-testid="centerId"] input[placeholder*="centro"]').type('2Print');
      cy.get('[role="option"]').contains('2Print').first().click();

      // SEÇÃO 2: Informações do Projeto
      cy.log('✅ Seção 2: Informações do Projeto');
      
      cy.get('input[name="titulo"]').type('Manual de Geografia - 5º Ano');
      cy.get('input[name="solicitante"]').type('Maria Silva Santos');
      cy.get('input[name="documento"]').type('123.456.789-00');
      cy.get('input[name="editorial"]').type('Editora Educacional Moderna');

      // SEÇÃO 3: Especificações Técnicas
      cy.log('✅ Seção 3: Especificações Técnicas');
      
      cy.get('input[name="tiragem"]').type('5000');
      cy.get('input[name="formato"]').type('21x28cm');
      cy.get('input[name="total_pgs"]').type('128');
      cy.get('input[name="pgs_colors"]').type('32');

      // Production Specifications (se visível)
      cy.get('body').then(($body) => {
        if ($body.find('h3:contains("Especificações de Produção")').length > 0) {
          cy.log('🎯 Production Specifications habilitadas');
          
          // Verificar se campos existem antes de tentar preencher
          cy.get('[data-testid="papel_miolo"]').should('be.visible');
          cy.get('[data-testid="papel_miolo"]').select('Offset 90g');
          
          cy.get('[data-testid="papel_capa"]').select('Cartão Sup. Triplex 300g');
          cy.get('[data-testid="cor_miolo"]').select('4/4');
          cy.get('[data-testid="cor_capa"]').select('4/4');
          cy.get('[data-testid="laminacao"]').select('Fosca');
          cy.get('[data-testid="acabamento"]').select('Lombada colada');
          cy.get('[data-testid="shrink"]').select('sim');
          cy.get('[data-testid="centro_producao"]').select('2Print');
        } else {
          cy.log('⚠️ Production Specifications desabilitadas');
        }
      });

      // SEÇÃO 4: Comercial & Prazos
      cy.log('✅ Seção 4: Comercial & Prazos');
      
      cy.get('input[name="preco_unitario"]').type('12.50');
      
      // Verificar cálculo automático
      cy.get('input[name="preco_total"]').should('contain.value', '62.500');

      // Frete (se habilitado)
      cy.get('body').then(($body) => {
        if ($body.find('input[name="frete"]').length > 0) {
          cy.get('input[name="frete"]').type('850.00');
        }
      });
      
      cy.get('input[name="data_pedido"]').type('2025-10-07');
      cy.get('input[name="data_entrega"]').type('2025-11-15');

      // SEÇÃO 5: Informações Complementares
      cy.log('✅ Seção 5: Informações Complementares');
      
      cy.get('textarea[name="observacoes"]').type(
        'Material didático para rede pública. Seguir normas ABNT.'
      );

      // Submeter formulário
      cy.log('🚀 Submetendo formulário');
      
      cy.intercept('POST', '/api/budgets', {
        statusCode: 201,
        body: { data: { id: 1, numero_pedido: '0001/202510' } }
      }).as('createBudget');
      
      cy.get('button[type="submit"]').click();
      cy.wait('@createBudget');
      
      // Verificar sucesso
      cy.url().should('include', '/budgets');
    });
  });
});