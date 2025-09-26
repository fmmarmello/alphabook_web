-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
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
    "status" TEXT NOT NULL DEFAULT 'Pendente',
    CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "Center" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("acabamento", "centerId", "clientId", "cor_capa", "cor_miolo", "data_entrega", "data_pedido", "date", "documento", "editorial", "formato", "frete", "id", "laminacao", "numPaginasColoridas", "numPaginasTotal", "numero_pedido", "obs", "pagamento", "papel_capa", "papel_miolo", "prazoEntrega", "shrink", "solicitante", "tipo_produto", "tiragem", "title", "valorTotal", "valorUnitario") SELECT "acabamento", "centerId", "clientId", "cor_capa", "cor_miolo", "data_entrega", "data_pedido", "date", "documento", "editorial", "formato", "frete", "id", "laminacao", "numPaginasColoridas", "numPaginasTotal", "numero_pedido", "obs", "pagamento", "papel_capa", "papel_miolo", "prazoEntrega", "shrink", "solicitante", "tipo_produto", "tiragem", "title", "valorTotal", "valorUnitario" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
