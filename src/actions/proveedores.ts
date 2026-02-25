"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { proveedorSchema, type ProveedorInput } from "@/lib/validations";

export async function getProveedores() {
  return prisma.proveedor.findMany({
    include: { _count: { select: { componentes: true } } },
    orderBy: { nombre: "asc" },
  });
}

export async function getProveedor(id: number) {
  return prisma.proveedor.findUnique({
    where: { id },
    include: { componentes: { include: { categoria: true } } },
  });
}

export async function crearProveedor(data: ProveedorInput) {
  const parsed = proveedorSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const cleanData = {
    ...parsed.data,
    email: parsed.data.email || null,
  };
  const proveedor = await prisma.proveedor.create({ data: cleanData });
  revalidatePath("/proveedores");
  return { success: true, data: proveedor };
}

export async function actualizarProveedor(id: number, data: ProveedorInput) {
  const parsed = proveedorSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const cleanData = {
    ...parsed.data,
    email: parsed.data.email || null,
  };
  await prisma.proveedor.update({ where: { id }, data: cleanData });
  revalidatePath("/proveedores");
  revalidatePath(`/proveedores/${id}`);
  return { success: true };
}

export async function eliminarProveedor(id: number) {
  try {
    await prisma.proveedor.delete({ where: { id } });
    revalidatePath("/proveedores");
    return { success: true };
  } catch {
    return { error: "No se puede eliminar: tiene componentes asociados" };
  }
}
