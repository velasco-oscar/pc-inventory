"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { gastoOperativoSchema, type GastoOperativoInput } from "@/lib/validations";

export async function getGastos(params?: { fechaInicio?: string; fechaFin?: string }) {
  const where: any = {};
  if (params?.fechaInicio && params?.fechaFin) {
    where.fecha = {
      gte: new Date(params.fechaInicio),
      lte: new Date(params.fechaFin),
    };
  }

  return prisma.gastoOperativo.findMany({
    where,
    orderBy: { fecha: "desc" },
  });
}

export async function crearGasto(data: GastoOperativoInput) {
  const parsed = gastoOperativoSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await prisma.gastoOperativo.create({
    data: {
      ...parsed.data,
      fecha: new Date(parsed.data.fecha),
    },
  });

  revalidatePath("/gastos");
  return { success: true };
}

export async function eliminarGasto(id: number) {
  try {
    await prisma.gastoOperativo.delete({ where: { id } });
    revalidatePath("/gastos");
    return { success: true };
  } catch {
    return { error: "Error al eliminar el gasto" };
  }
}
