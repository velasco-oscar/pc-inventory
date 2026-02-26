// @ts-nocheck
import "dotenv/config";

const categorias = [
  { nombre: "Procesador", descripcion: "CPUs de escritorio y laptop" },
  { nombre: "Tarjeta Madre", descripcion: "Motherboards de diferentes formatos" },
  { nombre: "RAM", descripcion: "Módulos de memoria RAM" },
  { nombre: "GPU", descripcion: "Tarjetas gráficas dedicadas" },
  { nombre: "SSD", descripcion: "Unidades de estado sólido" },
  { nombre: "HDD", descripcion: "Discos duros mecánicos" },
  { nombre: "Fuente de Poder", descripcion: "Fuentes de alimentación para PC" },
  { nombre: "Case/Gabinete", descripcion: "Gabinetes y torres para PC" },
  { nombre: "Monitor", descripcion: "Monitores y pantallas" },
  { nombre: "Teclado", descripcion: "Teclados mecánicos y de membrana" },
  { nombre: "Mouse", descripcion: "Ratones y dispositivos señaladores" },
  { nombre: "Ventilador/Cooler", descripcion: "Sistemas de enfriamiento" },
  { nombre: "Cable/Adaptador", descripcion: "Cables, adaptadores y conectores" },
  { nombre: "Otro", descripcion: "Otros componentes y accesorios" },
];

async function main() {
  const Database = (await import("better-sqlite3")).default;
  const path = await import("path");
  const dbPath = path.join(__dirname, "..", "dev.db");
  const db = new Database(dbPath);

  console.log("Seeding database...");

  const insert = db.prepare(
    "INSERT OR IGNORE INTO Categoria (nombre, descripcion, createdAt) VALUES (?, ?, datetime('now'))"
  );

  const insertMany = db.transaction((cats: typeof categorias) => {
    for (const cat of cats) {
      insert.run(cat.nombre, cat.descripcion);
    }
  });

  insertMany(categorias);

  const count = db.prepare("SELECT COUNT(*) as count FROM Categoria").get() as any;
  console.log(`✅ ${count.count} categorías en la base de datos`);

  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
