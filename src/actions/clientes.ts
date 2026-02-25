"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { clienteSchema, type ClienteInput } from "@/lib/validations";

export async function getClientes() {
  return prisma.cliente.findMany({
    include: { _count: { select: { ventas: true } } },
    orderBy: { nombre: "asc" },
  });
}

export async function getCliente(id: number) {
  return prisma.cliente.findUnique({
    where: { id },
    include: {
      ventas: {
        include: { detalles: { include: { componente: true, ensamble: true } } },
        orderBy: { fechaVenta: "desc" },
      },
    },
  });
}

export async function crearCliente(data: ClienteInput) {
  const parsed = clienteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const cleanData = {
    ...parsed.data,
    email: parsed.data.email || null,
  };
  const cliente = await prisma.cliente.create({ data: cleanData });
  revalidatePath("/clientes");
  return { success: true, data: cliente };
}

export async function actualizarCliente(id: number, data: ClienteInput) {
  const parsed = clienteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const cleanData = {
    ...parsed.data,
    email: parsed.data.email || null,
  };
  await prisma.cliente.update({ where: { id }, data: cleanData });
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: true };
}

export async function eliminarCliente(id: number) {
  try {
    await prisma.cliente.delete({ where: { id } });
    revalidatePath("/clientes");
    return { success: true };
  } catch {
    return { error: "No se puede eliminar: tiene ventas asociadas" };
  }
}
