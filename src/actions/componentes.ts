"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { componenteSchema, type ComponenteInput } from "@/lib/validations";
import { calcularCostoMxn } from "@/lib/utils-app";

export async function getComponentes(params?: {
  estado?: string;
  categoriaId?: number;
  proveedorId?: number;
  busqueda?: string;
  page?: number;
  limit?: number;
}) {
  const { estado, categoriaId, proveedorId, busqueda, page = 1, limit = 20 } = params || {};

  const where: any = {};
  if (estado) where.estado = estado;
  if (categoriaId) where.categoriaId = categoriaId;
  if (proveedorId) where.proveedorId = proveedorId;
  if (busqueda) {
    where.OR = [
      { marca: { contains: busqueda } },
      { modelo: { contains: busqueda } },
      { numeroSerie: { contains: busqueda } },
    ];
  }

  const [componentes, total] = await Promise.all([
    prisma.componente.findMany({
      where,
      include: { categoria: true, proveedor: true, ensamble: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.componente.count({ where }),
  ]);

  return { componentes, total, pages: Math.ceil(total / limit) };
}

export async function getComponente(id: number) {
  return prisma.componente.findUnique({
    where: { id },
    include: {
      categoria: true,
      proveedor: true,
      ensamble: true,
      detalleVentas: { include: { venta: true } },
      garantias: true,
    },
  });
}

export async function getComponentesDisponibles() {
  return prisma.componente.findMany({
    where: { estado: "disponible" },
    include: { categoria: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function crearComponente(data: ComponenteInput) {
  const parsed = componenteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const costoMxn = calcularCostoMxn(parsed.data.costoOriginal, parsed.data.tipoCambio);

  await prisma.componente.create({
    data: {
      ...parsed.data,
      fechaCompra: new Date(parsed.data.fechaCompra),
      costoMxn,
      proveedorId: parsed.data.proveedorId || null,
      ensambleId: parsed.data.ensambleId || null,
      numeroSerie: parsed.data.numeroSerie || null,
    },
  });

  revalidatePath("/componentes");
  return { success: true };
}

export async function actualizarComponente(id: number, data: ComponenteInput) {
  const parsed = componenteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const costoMxn = calcularCostoMxn(parsed.data.costoOriginal, parsed.data.tipoCambio);

  await prisma.componente.update({
    where: { id },
    data: {
      ...parsed.data,
      fechaCompra: new Date(parsed.data.fechaCompra),
      costoMxn,
      proveedorId: parsed.data.proveedorId || null,
      ensambleId: parsed.data.ensambleId || null,
      numeroSerie: parsed.data.numeroSerie || null,
    },
  });

  revalidatePath("/componentes");
  revalidatePath(`/componentes/${id}`);
  return { success: true };
}

export async function eliminarComponente(id: number) {
  try {
    const componente = await prisma.componente.findUnique({ where: { id } });
    if (!componente) return { error: "Componente no encontrado" };
    if (componente.estado === "vendido") return { error: "No se puede eliminar un componente vendido" };
    if (componente.estado === "en_ensamble") return { error: "No se puede eliminar un componente en ensamble" };

    await prisma.componente.delete({ where: { id } });
    revalidatePath("/componentes");
    return { success: true };
  } catch {
    return { error: "Error al eliminar el componente" };
  }
}
