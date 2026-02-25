"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { garantiaSchema, type GarantiaInput } from "@/lib/validations";

export async function getGarantias() {
  return prisma.garantia.findMany({
    include: {
      venta: { include: { cliente: true } },
      componente: { include: { categoria: true } },
      ensamble: true,
    },
    orderBy: { fechaFin: "asc" },
  });
}

export async function crearGarantia(data: GarantiaInput) {
  const parsed = garantiaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.garantia.create({
    data: {
      ...parsed.data,
      fechaInicio: new Date(parsed.data.fechaInicio),
      fechaFin: new Date(parsed.data.fechaFin),
      componenteId: parsed.data.componenteId || null,
      ensambleId: parsed.data.ensambleId || null,
    },
  });

  revalidatePath("/garantias");
  return { success: true };
}

export async function actualizarEstadoGarantia(id: number, estado: string) {
  await prisma.garantia.update({
    where: { id },
    data: { estado },
  });
  revalidatePath("/garantias");
  return { success: true };
}

export async function eliminarGarantia(id: number) {
  try {
    await prisma.garantia.delete({ where: { id } });
    revalidatePath("/garantias");
    return { success: true };
  } catch {
    return { error: "Error al eliminar la garantía" };
  }
}
