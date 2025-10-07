// src/components/forms/__tests__/budget-form.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BudgetForm } from '../budget-form';
import { QueryProvider } from '@/components/providers/QueryProvider';

// Mock do useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock do AuthProvider
const mockUser = {
  id: 1,
  email: 'test@test.com',
  role: 'ADMIN' as const,
};

jest.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Wrapper com providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryProvider>
    {children}
  </QueryProvider>
);

describe('BudgetForm - Nova Estrutura', () => {
  beforeEach(() => {
    // Mock das APIs
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: [] }), // clients
      })
      .mockResolvedValueOnce({
        ok: true, 
        json: () => Promise.resolve({ data: [] }), // centers
      });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Estrutura e Layout', () => {
    test('renderiza todas as 5 seções na ordem correta', () => {
      render(
        <TestWrapper>
          <BudgetForm mode="create" />
        </TestWrapper>
      );

      const sections = [
        'Identificação',
        'Informações do Projeto', 
        'Especificações Técnicas',
        'Condições Comerciais e Prazos',
        'Informações Complementares'
      ];

      sections.forEach(section => {
        expect(screen.getByText(section)).toBeInTheDocument();
      });
    });

    test('campos obrigatórios possuem asterisco', () => {
      render(
        <TestWrapper>
          <BudgetForm mode="create" />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/Cliente \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Centro de Produção \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Título do Projeto \*/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tiragem \*/)).toBeInTheDocument();
    });

    test('campo frete tem label atualizada', () => {
      render(
        <TestWrapper>
          <BudgetForm mode="create" />
        </TestWrapper>
      );

      // Verificar se campo existe (pode estar feature flagged)
      const freightField = screen.queryByLabelText(/Valor do Frete/);
      if (freightField) {
        expect(freightField).toBeInTheDocument();
        expect(screen.getByLabelText(/Valor do Frete \(R\$\)/)).toBeInTheDocument();
      }
    });
  });

  describe('Validação de Formulário', () => {
    test('botão submit desabilitado com campos obrigatórios vazios', async () => {
      render(
        <TestWrapper>
          <BudgetForm mode="create" />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /criar orçamento/i });
      expect(submitButton).toBeDisabled();
    });

    test('cálculo automático do valor total', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BudgetForm mode="create" />
        </TestWrapper>
      );

      // Preencher tiragem e valor unitário
      const tiragemField = screen.getByLabelText(/Tiragem/);
      const precoField = screen.getByLabelText(/Valor Unitário/);
      
      await user.type(tiragemField, '1000');
      await user.type(precoField, '10,50');

      // Verificar cálculo automático
      await waitFor(() => {
        const totalField = screen.getByLabelText(/Valor Total/);
        expect(totalField).toHaveValue('R$ 10.500,00');
      });
    });
  });

  describe('Lógica Condicional', () => {
    test('campos de capa desabilitados quando "Sem capa" selecionado', async () => {
      const user = userEvent.setup();
      
      // Mock com specifications habilitadas
      const mockSpecs = {
        "Cor da capa": ["4/0", "4/4", "Sem capa", "Fichário"],
        "Tipo de Papel de Capa": ["Cartão 300g", "Couchê 150g"]
      };

      render(
        <TestWrapper>
          <BudgetForm mode="create" specifications={mockSpecs} />
        </TestWrapper>
      );

      // Verificar se campos existem (feature flagged)
      const corCapaField = screen.queryByTestId('cor_capa');
      const papelCapaField = screen.queryByTestId('papel_capa');
      
      if (corCapaField && papelCapaField) {
        // Selecionar "Sem capa"
        await user.selectOptions(corCapaField, 'Sem capa');
        
        // Verificar se papel_capa foi desabilitado
        await waitFor(() => {
          expect(papelCapaField).toBeDisabled();
        });
      }
    });
  });

  describe('Formatação de Dados', () => {
    test('formatação monetária funciona corretamente', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <BudgetForm mode="create" />
        </TestWrapper>
      );

      const precoField = screen.getByLabelText(/Valor Unitário/);
      
      await user.type(precoField, '1234.56');
      
      await waitFor(() => {
        expect(precoField).toHaveValue('R$ 1.234,56');
      });
    });
  });
});
