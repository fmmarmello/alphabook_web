# Form Test Data - Mock Data for All Application Forms

This document contains comprehensive mock data for testing all forms in the AlphaBook application. Each form section includes valid data, invalid data, and edge cases.

## Budget Form (`/budgets/new`, `/budgets/[id]/edit`)

### Valid Data (Success Cases)

#### Standard Budget
```json
{
  "titulo": "Livro de Receitas Tradicionais",
  "tiragem": 1000,
  "formato": "21x28cm",
  "total_pgs": 150,
  "pgs_colors": 20,
  "preco_unitario": 25.50,
  "preco_total": 25500.00,
  "prazo_producao": "2024-12-15",
  "observacoes": "Impressão em papel couchê 150g"
}
```

#### Minimal Budget
```json
{
  "titulo": "A",
  "tiragem": 1,
  "formato": "A4",
  "total_pgs": 1,
  "pgs_colors": 0,
  "preco_unitario": 0.01,
  "preco_total": 0.01,
  "observacoes": ""
}
```

#### Large Volume Budget
```json
{
  "titulo": "Enciclopédia Completa",
  "tiragem": 50000,
  "formato": "30x40cm",
  "total_pgs": 2000,
  "pgs_colors": 500,
  "preco_unitario": 150.00,
  "preco_total": 7500000.00,
  "prazo_producao": "2025-06-30",
  "observacoes": "Projeto especial com acabamento premium"
}
```

### Invalid Data (Error Cases)

#### Missing Required Fields
```json
{
  "titulo": "",
  "tiragem": 0,
  "formato": "",
  "total_pgs": -1,
  "pgs_colors": -5,
  "preco_unitario": -10.00,
  "preco_total": -1000.00
}
```

#### Invalid Number Formats
```json
{
  "titulo": "Teste",
  "tiragem": "invalid",
  "formato": "21x28cm",
  "total_pgs": "abc",
  "pgs_colors": 10.5,
  "preco_unitario": "R$ 25,50",
  "preco_total": "twenty five"
}
```

#### Extremely Large Values
```json
{
  "titulo": "Teste",
  "tiragem": 999999999,
  "formato": "21x28cm",
  "total_pgs": 999999,
  "pgs_colors": 999999,
  "preco_unitario": 999999999.99,
  "preco_total": 999999999999.99
}
```

## Client Form (`/clients/new`, `/clients/[id]/edit`)

### Valid Data (Success Cases)

#### Individual Client (CPF)
```json
{
  "name": "João Silva Santos",
  "cnpjCpf": "123.456.789-10",
  "phone": "(11) 98765-4321",
  "email": "joao.silva@email.com",
  "address": "Rua das Flores, 123, Jardim Primavera, São Paulo - SP"
}
```

#### Company Client (CNPJ)
```json
{
  "name": "Editora ABC Ltda",
  "cnpjCpf": "12.345.678/0001-90",
  "phone": "(11) 3456-7890",
  "email": "contato@editoraabc.com.br",
  "address": "Av. Paulista, 1000, 10º andar, São Paulo - SP"
}
```

#### Client with Special Characters
```json
{
  "name": "José María González O'Connor",
  "cnpjCpf": "987.654.321-00",
  "phone": "(21) 99876-5432",
  "email": "jose.maria@email.com",
  "address": "Rua José, nº 123, Bairro São José, Rio de Janeiro - RJ"
}
```

### Invalid Data (Error Cases)

#### Invalid CPF
```json
{
  "name": "Cliente Inválido",
  "cnpjCpf": "111.111.111-11",
  "phone": "(11) 98765-4321",
  "email": "cliente@email.com",
  "address": "Rua Teste, 123"
}
```

#### Invalid CNPJ
```json
{
  "name": "Empresa Inválida",
  "cnpjCpf": "11.111.111/1111-11",
  "phone": "(11) 98765-4321",
  "email": "empresa@email.com",
  "address": "Rua Teste, 123"
}
```

#### Invalid Email Formats
```json
{
  "name": "Cliente Teste",
  "cnpjCpf": "123.456.789-10",
  "phone": "(11) 98765-4321",
  "email": "invalid-email",
  "address": "Rua Teste, 123"
}
```

#### Invalid Phone Numbers
```json
{
  "name": "Cliente Teste",
  "cnpjCpf": "123.456.789-10",
  "phone": "123",
  "email": "cliente@email.com",
  "address": "Rua Teste, 123"
}
```

#### Empty Required Fields
```json
{
  "name": "",
  "cnpjCpf": "",
  "phone": "",
  "email": "",
  "address": ""
}
```

## Center Form (`/centers/new`, `/centers/[id]/edit`)

### Valid Data (Success Cases)

#### Internal Production Center
```json
{
  "name": "Centro de Produção São Paulo",
  "type": "Interno",
  "obs": "Centro principal com equipamentos modernos"
}
```

#### Outsourced Center
```json
{
  "name": "Gráfica Parceira XYZ",
  "type": "Terceirizado",
  "obs": "Especializada em grandes tiragens"
}
```

#### Digital Center
```json
{
  "name": "Impressão Digital Express",
  "type": "Digital",
  "obs": "Impressão sob demanda com qualidade premium"
}
```

#### Offset Center
```json
{
  "name": "Offset Industrial",
  "type": "Offset",
  "obs": "Especializada em livros didáticos"
}
```

### Invalid Data (Error Cases)

#### Missing Required Fields
```json
{
  "name": "",
  "type": "",
  "obs": ""
}
```

#### Invalid Type
```json
{
  "name": "Centro Inválido",
  "type": "TipoInexistente",
  "obs": "Teste"
}
```

## Order Form (`/orders/new`, `/orders/[id]/edit`)

### Valid Data (Success Cases)

#### Standard Order
```json
{
  "clientId": 1,
  "centerId": 1,
  "title": "Pedido de Livros Escolares 2024",
  "tiragem": 5000,
  "formato": "21x28cm",
  "prazoEntrega": "2024-11-30",
  "numPaginasTotal": 200,
  "numPaginasColoridas": 50,
  "valorUnitario": 15.90,
  "valorTotal": 79500.00,
  "obs": "Entrega urgente para início do ano letivo"
}
```

#### Small Order
```json
{
  "clientId": 2,
  "centerId": 3,
  "title": "Catálogo de Produtos",
  "tiragem": 100,
  "formato": "A4",
  "prazoEntrega": "2024-10-15",
  "numPaginasTotal": 20,
  "numPaginasColoridas": 20,
  "valorUnitario": 5.50,
  "valorTotal": 550.00,
  "obs": "Impressão colorida completa"
}
```

#### Large Order
```json
{
  "clientId": 1,
  "centerId": 2,
  "title": "Enciclopédia Médica Completa",
  "tiragem": 25000,
  "formato": "25x35cm",
  "prazoEntrega": "2025-03-15",
  "numPaginasTotal": 1500,
  "numPaginasColoridas": 300,
  "valorUnitario": 85.00,
  "valorTotal": 2125000.00,
  "obs": "Projeto especial com acabamento médico"
}
```

### Invalid Data (Error Cases)

#### Missing Required Fields
```json
{
  "clientId": 0,
  "centerId": 0,
  "title": "",
  "tiragem": 0,
  "formato": "",
  "prazoEntrega": "",
  "numPaginasTotal": -1,
  "numPaginasColoridas": -1,
  "valorUnitario": -10.00,
  "valorTotal": -1000.00
}
```

#### Invalid IDs
```json
{
  "clientId": 99999,
  "centerId": 99999,
  "title": "Teste",
  "tiragem": 100,
  "formato": "21x28cm",
  "prazoEntrega": "2024-12-31",
  "numPaginasTotal": 100,
  "numPaginasColoridas": 50,
  "valorUnitario": 10.00,
  "valorTotal": 1000.00
}
```

## Edge Cases and Boundary Testing

### Boundary Values

#### Budget Form Boundaries
```json
{
  "titulo": "A",
  "tiragem": 1,
  "formato": "A",
  "total_pgs": 0,
  "pgs_colors": 0,
  "preco_unitario": 0.01,
  "preco_total": 0.01,
  "prazo_producao": "2024-01-01"
}
```

#### Client Form Boundaries
```json
{
  "name": "A",
  "cnpjCpf": "000.000.000-00",
  "phone": "(00) 0000-0000",
  "email": "a@b.co",
  "address": "A"
}
```

#### Order Form Boundaries
```json
{
  "clientId": 1,
  "centerId": 1,
  "title": "A",
  "tiragem": 1,
  "formato": "A",
  "prazoEntrega": "2024-01-01",
  "numPaginasTotal": 0,
  "numPaginasColoridas": 0,
  "valorUnitario": 0.01,
  "valorTotal": 0.01
}
```

### Special Characters and Unicode

#### Budget with Special Characters
```json
{
  "titulo": "Livro de Matemática Avançada - 数学書",
  "tiragem": 1000,
  "formato": "21×28cm",
  "total_pgs": 150,
  "pgs_colors": 20,
  "preco_unitario": 25.50,
  "preco_total": 25500.00,
  "observacoes": "Contém fórmulas matemáticas complexas ∑∫∆"
}
```

#### Client with International Characters
```json
{
  "name": "José María González Müller",
  "cnpjCpf": "123.456.789-10",
  "phone": "(11) 98765-4321",
  "email": "jose.maria@email.com",
  "address": "Rúa Ñuñoa, número 123, São José - Río de Janeiro"
}
```

### Date Edge Cases

#### Past Dates
```json
{
  "titulo": "Projeto Urgente",
  "tiragem": 100,
  "formato": "21x28cm",
  "total_pgs": 50,
  "pgs_colors": 10,
  "preco_unitario": 20.00,
  "preco_total": 2000.00,
  "prazo_producao": "2020-01-01"
}
```

#### Very Future Dates
```json
{
  "titulo": "Projeto Planejado",
  "tiragem": 100,
  "formato": "21x28cm",
  "total_pgs": 50,
  "pgs_colors": 10,
  "preco_unitario": 20.00,
  "preco_total": 2000.00,
  "prazo_producao": "2030-12-31"
}
```

### SQL Injection Attempts

#### Budget Form SQL Injection
```json
{
  "titulo": "'; DROP TABLE budgets; --",
  "tiragem": 100,
  "formato": "21x28cm",
  "total_pgs": 50,
  "pgs_colors": 10,
  "preco_unitario": 20.00,
  "preco_total": 2000.00,
  "observacoes": "'; DELETE FROM clients; --"
}
```

#### Client Form SQL Injection
```json
{
  "name": "'; DROP TABLE clients; --",
  "cnpjCpf": "123.456.789-10",
  "phone": "(11) 98765-4321",
  "email": "test@email.com",
  "address": "'; DROP TABLE orders; --"
}
```

### XSS Attempts

#### Budget Form XSS
```json
{
  "titulo": "<script>alert('XSS')</script>",
  "tiragem": 100,
  "formato": "21x28cm",
  "total_pgs": 50,
  "pgs_colors": 10,
  "preco_unitario": 20.00,
  "preco_total": 2000.00,
  "observacoes": "<img src=x onerror=alert('XSS')>"
}
```

#### Client Form XSS
```json
{
  "name": "<script>alert('XSS')</script>",
  "cnpjCpf": "123.456.789-10",
  "phone": "(11) 98765-4321",
  "email": "test@email.com",
  "address": "<iframe src=javascript:alert('XSS')></iframe>"
}
```

## Test Scenarios Summary

### Success Scenarios
- [x] Standard valid data for all forms
- [x] Minimal valid data (boundary testing)
- [x] Large volume data
- [x] Special characters and Unicode support
- [x] International names and addresses

### Error Scenarios
- [x] Missing required fields
- [x] Invalid data formats (CPF, CNPJ, email, phone)
- [x] Invalid number formats
- [x] Negative values where not allowed
- [x] Zero values where positive required
- [x] Extremely large values

### Edge Cases
- [x] Boundary values (min/max limits)
- [x] SQL injection attempts
- [x] XSS attempts
- [x] Past/future dates
- [x] Very long text inputs
- [x] Empty strings vs null values
- [x] Special characters in all text fields

This comprehensive test data covers all major scenarios for form validation and security testing.