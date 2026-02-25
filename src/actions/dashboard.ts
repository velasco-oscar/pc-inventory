"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [
    componentesDisponibles,
    componentesTotal,
    ensamblesListos,
    ventas,
    gastos,
    garantiasProximas,
    ultimasVentas,
    ventasMes,
  ] = await Promise.all([
    // Componentes disponibles con costo
    prisma.componente.findMany({
      where: { estado: "disponible" },
      select: { costoMxn: true },
    }),
    // Total componentes
    prisma.componente.aggregate({
      _sum: { costoMxn: true },
    }),
    // Ensambles listos
    prisma.ensamble.findMany({
      where: { estado: "listo" },
      include: { componentes: { select: { costoMxn: true } } },
    }),
    // Total ventas
    prisma.venta.aggregate({
      _sum: { total: true },
    }),
    // Total gastos
    prisma.gastoOperativo.aggregate({
      _sum: { monto: true },
    }),
    // Garantías próximas a vencer (30 días)
    prisma.garantia.findMany({
      where: {
        estado: "vigente",
        fechaFin: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
      include: {
        venta: { include: { cliente: true } },
        componente: { include: { categoria: true } },
        ensamble: true,
      },
      orderBy: { fechaFin: "asc" },
    }),
    // Últimas 5 ventas
    prisma.venta.findMany({
      include: {
        cliente: true,
        detalles: { include: { componente: true, ensamble: true } },
      },
      orderBy: { fechaVenta: "desc" },
      take: 5,
    }),
    // Ventas del mes actual
    prisma.venta.findMany({
      where: {
        fechaVenta: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      select: { fechaVenta: true, total: true },
      orderBy: { fechaVenta: "asc" },
    }),
  ]);

  const totalInvertido = componentesTotal._sum.costoMxn || 0;
  const totalVendido = ventas._sum.total || 0;
  const totalGastos = gastos._sum.monto || 0;
  const inventarioDisponible = componentesDisponibles.reduce((sum: number, c: any) => sum + c.costoMxn, 0);
  const gananciaBruta = totalVendido - totalInvertido;
  const gananciaNeta = gananciaBruta - totalGastos;

  return {
    totalInvertido,
    totalVendido,
    gananciaBruta,
    gananciaNeta,
    totalGastos,
    inventarioDisponible,
    ensamblesListos: ensamblesListos.map((e: any) => ({
      ...e,
      costoTotal: e.componentes.reduce((sum: number, c: any) => sum + c.costoMxn, 0) + e.costoManoObra,
    })),
    garantiasProximas,
    ultimasVentas,
    ventasMes,
  };
}
