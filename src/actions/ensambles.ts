"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensambleSchema, type EnsambleInput } from "@/lib/validations";

export async function getEnsambles() {
  return prisma.ensamble.findMany({
    include: {
      componentes: { include: { categoria: true } },
      _count: { select: { detalleVentas: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEnsamble(id: number) {
  return prisma.ensamble.findUnique({
    where: { id },
    include: {
      componentes: { include: { categoria: true, proveedor: true } },
      detalleVentas: { include: { venta: true } },
      garantias: true,
    },
  });
}

export async function getEnsamblesDisponibles() {
  return prisma.ensamble.findMany({
    where: { estado: { in: ["en_proceso", "listo"] } },
    include: { componentes: { include: { categoria: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function crearEnsamble(data: EnsambleInput) {
  const parsed = ensambleSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { componenteIds, ...rest } = parsed.data;

  const ensamble = await prisma.$transaction(async (tx: any) => {
    const nuevo = await tx.ensamble.create({
      data: {
        ...rest,
        fechaEnsamble: new Date(rest.fechaEnsamble),
        precioVentaSugerido: rest.precioVentaSugerido || null,
      },
    });

    await tx.componente.updateMany({
      where: { id: { in: componenteIds } },
      data: { ensambleId: nuevo.id, estado: "en_ensamble" },
    });

    return nuevo;
  });

  revalidatePath("/ensambles");
  revalidatePath("/componentes");
  return { success: true, data: ensamble };
}

export async function actualizarEnsamble(id: number, data: EnsambleInput) {
  const parsed = ensambleSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { componenteIds, ...rest } = parsed.data;

  await prisma.$transaction(async (tx: any) => {
    // Release current components
    await tx.componente.updateMany({
      where: { ensambleId: id },
      data: { ensambleId: null, estado: "disponible" },
    });

    // Update assembly
    await tx.ensamble.update({
      where: { id },
      data: {
        ...rest,
        fechaEnsamble: new Date(rest.fechaEnsamble),
        precioVentaSugerido: rest.precioVentaSugerido || null,
      },
    });

    // Assign new components
    await tx.componente.updateMany({
      where: { id: { in: componenteIds } },
      data: { ensambleId: id, estado: "en_ensamble" },
    });
  });

  revalidatePath("/ensambles");
  revalidatePath(`/ensambles/${id}`);
  revalidatePath("/componentes");
  return { success: true };
}

export async function actualizarEstadoEnsamble(id: number, estado: string) {
  await prisma.ensamble.update({
    where: { id },
    data: { estado },
  });
  revalidatePath("/ensambles");
  revalidatePath(`/ensambles/${id}`);
  return { success: true };
}

export async function eliminarEnsamble(id: number) {
  try {
    const ensamble = await prisma.ensamble.findUnique({
      where: { id },
      include: { componentes: true },
    });
    if (!ensamble) return { error: "Ensamble no encontrado" };
    if (ensamble.estado === "vendido") return { error: "No se puede eliminar un ensamble vendido" };

    await prisma.$transaction(async (tx: any) => {
      await tx.componente.updateMany({
        where: { ensambleId: id },
        data: { ensambleId: null, estado: "disponible" },
      });
      await tx.ensamble.delete({ where: { id } });
    });

    revalidatePath("/ensambles");
    revalidatePath("/componentes");
    return { success: true };
  } catch {
    return { error: "Error al eliminar el ensamble" };
  }
}
