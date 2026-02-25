"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { categoriaSchema, type CategoriaInput } from "@/lib/validations";

export async function getCategorias() {
  return prisma.categoria.findMany({
    include: { _count: { select: { componentes: true } } },
    orderBy: { nombre: "asc" },
  });
}

export async function getCategoria(id: number) {
  return prisma.categoria.findUnique({
    where: { id },
    include: { componentes: true },
  });
}

export async function crearCategoria(data: CategoriaInput) {
  const parsed = categoriaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await prisma.categoria.create({ data: parsed.data });
  revalidatePath("/componentes");
  return { success: true };
}

export async function actualizarCategoria(id: number, data: CategoriaInput) {
  const parsed = categoriaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await prisma.categoria.update({ where: { id }, data: parsed.data });
  revalidatePath("/componentes");
  return { success: true };
}

export async function eliminarCategoria(id: number) {
  try {
    await prisma.categoria.delete({ where: { id } });
    revalidatePath("/componentes");
    return { success: true };
  } catch {
    return { error: "No se puede eliminar: tiene componentes asociados" };
  }
}
