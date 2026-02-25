/*
  Warnings:

  - You are about to drop the column `capacidad` on the `Componente` table. All the data in the column will be lost.
  - You are about to drop the column `potencia` on the `Componente` table. All the data in the column will be lost.
  - You are about to drop the column `velocidad` on the `Componente` table. All the data in the column will be lost.
  - You are about to drop the column `vram` on the `Componente` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Componente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "categoriaId" INTEGER NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numeroSerie" TEXT,
    "foto" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'disponible',
    "proveedorId" INTEGER,
    "ensambleId" INTEGER,
    "fechaCompra" DATETIME NOT NULL,
    "costoOriginal" REAL NOT NULL,
    "monedaCompra" TEXT NOT NULL DEFAULT 'MXN',
    "tipoCambio" REAL NOT NULL DEFAULT 1.0,
    "costoMxn" REAL NOT NULL,
    "notas" TEXT,
    "capacidadValor" REAL,
    "capacidadUnidad" TEXT,
    "vramValor" REAL,
    "vramUnidad" TEXT,
    "velocidadValor" REAL,
    "velocidadUnidad" TEXT,
    "socket" TEXT,
    "potenciaValor" REAL,
    "potenciaUnidad" TEXT,
    "comprobanteCompra" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Componente_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Componente_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Componente_ensambleId_fkey" FOREIGN KEY ("ensambleId") REFERENCES "Ensamble" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Componente" ("categoriaId", "comprobanteCompra", "costoMxn", "costoOriginal", "createdAt", "ensambleId", "estado", "fechaCompra", "foto", "id", "marca", "modelo", "monedaCompra", "notas", "numeroSerie", "proveedorId", "socket", "tipoCambio", "updatedAt") SELECT "categoriaId", "comprobanteCompra", "costoMxn", "costoOriginal", "createdAt", "ensambleId", "estado", "fechaCompra", "foto", "id", "marca", "modelo", "monedaCompra", "notas", "numeroSerie", "proveedorId", "socket", "tipoCambio", "updatedAt" FROM "Componente";
DROP TABLE "Componente";
ALTER TABLE "new_Componente" RENAME TO "Componente";
CREATE UNIQUE INDEX "Componente_numeroSerie_key" ON "Componente"("numeroSerie");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
