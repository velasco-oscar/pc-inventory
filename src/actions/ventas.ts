"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ventaSchema, type VentaInput } from "@/lib/validations";

export async function getVentas() {
  return prisma.venta.findMany({
    include: {
      cliente: true,
      detalles: { include: { componente: { include: { categoria: true } }, ensamble: true } },
    },
    orderBy: { fechaVenta: "desc" },
  });
}

export async function getVenta(id: number) {
  return prisma.venta.findUnique({
    where: { id },
    include: {
      cliente: true,
      detalles: {
        include: {
          componente: { include: { categoria: true, proveedor: true } },
          ensamble: { include: { componentes: { include: { categoria: true } } } },
        },
      },
      garantias: { include: { componente: true, ensamble: true } },
    },
  });
}

export async function crearVenta(data: VentaInput) {
  const parsed = ventaSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { detalles, ...ventaData } = parsed.data;

  try {
    const venta = await prisma.$transaction(async (tx: any) => {
      // Create the sale
      const nuevaVenta = await tx.venta.create({
        data: {
          ...ventaData,
          fechaVenta: new Date(ventaData.fechaVenta),
          clienteId: ventaData.clienteId || null,
          detalles: {
            create: detalles.map((d: any) => ({
              componenteId: d.componenteId || null,
              ensambleId: d.ensambleId || null,
              precioUnitario: d.precioUnitario,
              cantidad: d.cantidad,
            })),
          },
        },
      });

      // Update component states to "vendido"
      const componenteIds = detalles
        .filter((d: any) => d.componenteId)
        .map((d: any) => d.componenteId as number);

      if (componenteIds.length > 0) {
        await tx.componente.updateMany({
          where: { id: { in: componenteIds } },
          data: { estado: "vendido" },
        });
      }

      // Update assembly states to "vendido"
      const ensambleIds = detalles
        .filter((d: any) => d.ensambleId)
        .map((d: any) => d.ensambleId as number);

      if (ensambleIds.length > 0) {
        await tx.ensamble.updateMany({
          where: { id: { in: ensambleIds } },
          data: { estado: "vendido" },
        });

        // Also mark all components in those assemblies as vendido
        await tx.componente.updateMany({
          where: { ensambleId: { in: ensambleIds } },
          data: { estado: "vendido" },
        });
      }

      return nuevaVenta;
    });

    revalidatePath("/ventas");
    revalidatePath("/componentes");
    revalidatePath("/ensambles");
    revalidatePath("/");
    return { success: true, data: venta };
  } catch (e) {
    console.error(e);
    return { error: "Error al crear la venta" };
  }
}

export async function eliminarVenta(id: number) {
  try {
    const venta = await prisma.venta.findUnique({
      where: { id },
      include: { detalles: true },
    });
    if (!venta) return { error: "Venta no encontrada" };

    await prisma.$transaction(async (tx: any) => {
      // Restore component states
      const componenteIds = venta.detalles
        .filter((d: any) => d.componenteId)
        .map((d: any) => d.componenteId as number);

      if (componenteIds.length > 0) {
        await tx.componente.updateMany({
          where: { id: { in: componenteIds } },
          data: { estado: "disponible" },
        });
      }

      const ensambleIds = venta.detalles
        .filter((d: any) => d.ensambleId)
        .map((d: any) => d.ensambleId as number);

      if (ensambleIds.length > 0) {
        await tx.ensamble.updateMany({
          where: { id: { in: ensambleIds } },
          data: { estado: "listo" },
        });
        await tx.componente.updateMany({
          where: { ensambleId: { in: ensambleIds } },
          data: { estado: "en_ensamble" },
        });
      }

      await tx.venta.delete({ where: { id } });
    });

    revalidatePath("/ventas");
    revalidatePath("/componentes");
    revalidatePath("/ensambles");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { error: "Error al eliminar la venta" };
  }
}
