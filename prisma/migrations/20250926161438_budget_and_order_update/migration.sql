-- CreateTable
CREATE TABLE "Client" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "cnpjCpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Center" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "obs" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "centerId" INTEGER NOT NULL,
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
    CONSTRAINT "Order_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
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
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "orderId" INTEGER,
    CONSTRAINT "Budget_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Budget_orderId_key" ON "Budget"("orderId");
