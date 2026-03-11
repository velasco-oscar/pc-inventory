-- CreateTable
CREATE TABLE "Licencia" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ensambleId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "clave" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'software',
    "costo" REAL NOT NULL DEFAULT 0,
    "monedaCompra" TEXT NOT NULL DEFAULT 'MXN',
    "tipoCambio" REAL NOT NULL DEFAULT 1.0,
    "costoMxn" REAL NOT NULL DEFAULT 0,
    "fechaCompra" DATETIME,
    "fechaExpiracion" DATETIME,
    "proveedor" TEXT,
    "notas" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Licencia_ensambleId_fkey" FOREIGN KEY ("ensambleId") REFERENCES "Ensamble" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
