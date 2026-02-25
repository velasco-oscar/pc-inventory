# PC Inventory - Sistema de Inventario y Ventas

Sistema completo para gestionar el inventario y ventas de un negocio de compra/venta de computadoras y componentes.

## Stack Tecnológico

- **Frontend:** Next.js 16+ (App Router), React 19, TypeScript
- **UI:** Tailwind CSS 4, shadcn/ui, Lucide React
- **ORM:** Prisma 7 con SQLite
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Export:** SheetJS (xlsx)
- **Desktop:** Tauri 2 (opcional)
- **Idioma:** Español (es-MX)
- **Moneda:** MXN con soporte USD + tipo de cambio

## Características

- **Dashboard:** Resumen financiero, tarjetas KPI, últimas ventas
- **Componentes:** CRUD completo, filtros por estado/categoría/proveedor, búsqueda, paginación
- **Ensambles (PCs):** Creación de PCs a partir de componentes, cálculo automático de costos
- **Ventas:** Registro de ventas con múltiples items, actualización automática de estados
- **Clientes y Proveedores:** Gestión de contactos con búsqueda
- **Garantías:** Seguimiento con indicadores visuales (verde/amarillo/rojo)
- **Gastos Operativos:** Registro y categorización de gastos
- **Reportes:** Gráficas financieras, análisis de inventario
- **Exportar a Excel:** Todas las tablas en un solo archivo .xlsx
- **Tema oscuro/claro:** Toggle de tema con persistencia

## Requisitos

- Node.js 18+
- npm o pnpm

## Instalación

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd pc-inventory-next

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# El archivo .env ya debería tener: DATABASE_URL="file:./dev.db"

# Crear la base de datos y ejecutar migraciones
npx prisma migrate dev

# Sembrar datos iniciales (categorías)
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Estructura del Proyecto

```
src/
├── actions/          # Server Actions (CRUD para cada entidad)
├── app/              # Páginas (App Router)
│   ├── api/exportar/ # API Route para exportar Excel
│   ├── clientes/
│   ├── componentes/
│   ├── ensambles/
│   ├── garantias/
│   ├── gastos/
│   ├── proveedores/
│   ├── reportes/
│   ├── ventas/
│   ├── layout.tsx
│   └── page.tsx      # Dashboard
├── components/
│   ├── forms/        # Formularios reutilizables
│   ├── ui/           # shadcn/ui components
│   ├── sidebar.tsx
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── generated/prisma/ # Cliente Prisma generado
└── lib/
    ├── prisma.ts     # Singleton PrismaClient
    ├── utils-app.ts  # Utilidades (formateo, constantes)
    └── validations.ts # Schemas Zod
```

## Base de Datos

El proyecto usa SQLite a través de Prisma. La base de datos se crea como `dev.db` en la raíz.

### Modelos

| Modelo | Descripción |
|--------|------------|
| Categoria | Categorías de componentes (CPU, GPU, RAM, etc.) |
| Proveedor | Proveedores de componentes |
| Componente | Piezas individuales con costos en MXN/USD |
| Ensamble | PCs armadas a partir de componentes |
| Cliente | Clientes del negocio |
| Venta | Ventas con detalles y totales |
| DetalleVenta | Items individuales de cada venta |
| Garantia | Garantías con fechas y estados |
| GastoOperativo | Gastos del negocio por categoría |

### Comandos Prisma

```bash
npx prisma studio          # Ver la BD en el navegador
npx prisma migrate dev     # Crear nueva migración
npx prisma generate        # Regenerar el cliente
npx prisma migrate reset   # Resetear la BD
```

## Empaquetado con Tauri (Desktop)

### Requisitos adicionales

- Rust (rustup)
- Dependencias del sistema según tu OS ([ver docs de Tauri](https://v2.tauri.app/start/prerequisites/))

### Desarrollo y Build

```bash
npm install -D @tauri-apps/cli    # Instalar CLI
npx tauri dev                     # Desarrollo
npx tauri build                   # Generar ejecutable
```

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Iniciar en producción
npm run lint     # Linter
```

## Licencia

MIT
