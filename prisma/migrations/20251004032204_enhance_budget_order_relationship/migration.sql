/*
  Warnings:

  - You are about to drop the column `orderId` on the `Budget` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Budget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER,
    "centerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "numero_pedido" TEXT,
    "data_pedido" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_entrega" DATETIME,
    "solicitante" TEXT,
    "documento" TEXT,
    "editorial" TEXT,
    "tipo_produto" TEXT,
    "titulo" TEXT NOT NULL,
    "tiragem" INTEGER NOT NULL,
    "formato" TEXT NOT NULL,
    "total_pgs" INTEGER NOT NULL,
    "pgs_colors" INTEGER NOT NULL,
    "cor_miolo" TEXT,
    "papel_miolo" TEXT,
    "papel_capa" TEXT,
    "cor_capa" TEXT,
    "laminacao" TEXT,
    "acabamento" TEXT,
    "shrink" TEXT,
    "centro_producao" TEXT,
    "observacoes" TEXT,
    "preco_unitario" REAL NOT NULL,
    "preco_total" REAL NOT NULL,
    "prazo_producao" TEXT,
    "pagamento" TEXT,
    "frete" TEXT,
    "submittedAt" DATETIME,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "cancelledAt" DATETIME,
    "convertedAt" DATETIME,
    "approvedById" INTEGER,
    "rejectedById" INTEGER,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Budget_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Budget_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Budget_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Budget_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Budget" ("acabamento", "approved", "centro_producao", "cor_capa", "cor_miolo", "data_entrega", "data_pedido", "documento", "editorial", "formato", "frete", "id", "laminacao", "numero_pedido", "observacoes", "pagamento", "papel_capa", "papel_miolo", "pgs_colors", "prazo_producao", "preco_total", "preco_unitario", "shrink", "solicitante", "tipo_produto", "tiragem", "titulo", "total_pgs") SELECT "acabamento", "approved", "centro_producao", "cor_capa", "cor_miolo", "data_entrega", "data_pedido", "documento", "editorial", "formato", "frete", "id", "laminacao", "numero_pedido", "observacoes", "pagamento", "papel_capa", "papel_miolo", "pgs_colors", "prazo_producao", "preco_total", "preco_unitario", "shrink", "solicitante", "tipo_produto", "tiragem", "titulo", "total_pgs" FROM "Budget";
DROP TABLE "Budget";
ALTER TABLE "new_Budget" RENAME TO "Budget";
CREATE INDEX "Budget_clientId_idx" ON "Budget"("clientId");
CREATE INDEX "Budget_centerId_idx" ON "Budget"("centerId");
CREATE INDEX "Budget_status_idx" ON "Budget"("status");
CREATE INDEX "Budget_approvedById_idx" ON "Budget"("approvedById");
CREATE INDEX "Budget_data_pedido_idx" ON "Budget"("data_pedido");
CREATE TABLE "new_Center" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "obs" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Center" ("id", "name", "obs", "type") SELECT "id", "name", "obs", "type" FROM "Center";
DROP TABLE "Center";
ALTER TABLE "new_Center" RENAME TO "Center";
CREATE INDEX "Center_active_idx" ON "Center"("active");
CREATE INDEX "Center_type_idx" ON "Center"("type");
CREATE TABLE "new_Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cnpjCpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Client" ("address", "cnpjCpf", "email", "id", "name", "phone") SELECT "address", "cnpjCpf", "email", "id", "name", "phone" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE INDEX "Client_cnpjCpf_idx" ON "Client"("cnpjCpf");
CREATE INDEX "Client_email_idx" ON "Client"("email");
CREATE INDEX "Client_active_idx" ON "Client"("active");
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
    "budgetId" INTEGER,
    "orderType" TEXT NOT NULL DEFAULT 'DIRECT_ORDER',
    "title" TEXT NOT NULL,
    "tiragem" INTEGER NOT NULL,
    "formato" TEXT NOT NULL,
    "numPaginasTotal" INTEGER NOT NULL,
    "numPaginasColoridas" INTEGER NOT NULL,
    "valorUnitario" REAL NOT NULL,
    "valorTotal" REAL NOT NULL,
    "prazoEntrega" TEXT NOT NULL,
    "obs" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "numero_pedido" TEXT,
    "data_pedido" DATETIME,
    "data_entrega" DATETIME,
    "solicitante" TEXT,
    "documento" TEXT,
    "editorial" TEXT,
    "tipo_produto" TEXT,
    "cor_miolo" TEXT,
    "papel_miolo" TEXT,
    "papel_capa" TEXT,
    "cor_capa" TEXT,
    "laminacao" TEXT,
    "acabamento" TEXT,
    "shrink" TEXT,
    "pagamento" TEXT,
    "frete" TEXT,
    CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("acabamento", "centerId", "clientId", "cor_capa", "cor_miolo", "data_entrega", "data_pedido", "date", "documento", "editorial", "formato", "frete", "id", "laminacao", "numPaginasColoridas", "numPaginasTotal", "numero_pedido", "obs", "pagamento", "papel_capa", "papel_miolo", "prazoEntrega", "shrink", "solicitante", "status", "tipo_produto", "tiragem", "title", "valorTotal", "valorUnitario") SELECT "acabamento", "centerId", "clientId", "cor_capa", "cor_miolo", "data_entrega", "data_pedido", "date", "documento", "editorial", "formato", "frete", "id", "laminacao", "numPaginasColoridas", "numPaginasTotal", "numero_pedido", "obs", "pagamento", "papel_capa", "papel_miolo", "prazoEntrega", "shrink", "solicitante", "status", "tipo_produto", "tiragem", "title", "valorTotal", "valorUnitario" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE UNIQUE INDEX "Order_budgetId_key" ON "Order"("budgetId");
CREATE INDEX "Order_clientId_idx" ON "Order"("clientId");
CREATE INDEX "Order_centerId_idx" ON "Order"("centerId");
CREATE INDEX "Order_budgetId_idx" ON "Order"("budgetId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_orderType_idx" ON "Order"("orderType");
CREATE INDEX "Order_date_idx" ON "Order"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
