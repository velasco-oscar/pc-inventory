"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { componenteSchema, type ComponenteInput } from "@/lib/validations";
import { calcularCostoMxn } from "@/lib/utils-app";
import path from "path";
import fs from "fs/promises";

export async function getComponentes(params?: {
  estado?: string;
  categoriaId?: number;
  proveedorId?: number;
  busqueda?: string;
  origen?: string;
  page?: number;
  limit?: number;
}) {
  const { estado, categoriaId, proveedorId, busqueda, origen, page = 1, limit = 20 } = params || {};

  const where: any = {};
  if (estado) where.estado = estado;
  if (categoriaId) where.categoriaId = categoriaId;
  if (proveedorId) where.proveedorId = proveedorId;
  if (origen) where.origen = origen;
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

async function guardarComprobante(base64Data: string, originalName: string): Promise<string> {
  const comprobantesDir = path.join(process.cwd(), "comprobantes");
  await fs.mkdir(comprobantesDir, { recursive: true });

  const ext = path.extname(originalName) || ".pdf";
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filePath = path.join(comprobantesDir, uniqueName);

  // base64Data comes as "data:<mime>;base64,<data>"
  const base64Content = base64Data.split(",")[1] || base64Data;
  const buffer = Buffer.from(base64Content, "base64");
  await fs.writeFile(filePath, buffer);

  return uniqueName;
}

export async function crearComponente(
  data: ComponenteInput,
  comprobanteBase64?: string | null,
  comprobanteNombre?: string | null
) {
  const parsed = componenteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const costoMxn = calcularCostoMxn(parsed.data.costoOriginal, parsed.data.tipoCambio);

  let comprobanteCompra = parsed.data.comprobanteCompra || null;
  if (comprobanteBase64 && comprobanteNombre) {
    comprobanteCompra = await guardarComprobante(comprobanteBase64, comprobanteNombre);
  }

  const { categoriaId, proveedorId, ensambleId, fechaCompra, ...rest } = parsed.data;

  await prisma.componente.create({
    data: {
      marca: rest.marca,
      modelo: rest.modelo,
      numeroSerie: rest.numeroSerie || null,
      foto: rest.foto || null,
      estado: rest.estado,
      fechaCompra: new Date(fechaCompra),
      costoOriginal: rest.costoOriginal,
      monedaCompra: rest.monedaCompra,
      tipoCambio: rest.tipoCambio,
      costoMxn,
      notas: rest.notas || null,
      origen: rest.origen,
      plataformaCompra: rest.plataformaCompra || null,
      capacidadValor: rest.capacidadValor || null,
      capacidadUnidad: rest.capacidadUnidad || null,
      vramValor: rest.vramValor || null,
      vramUnidad: rest.vramUnidad || null,
      velocidadValor: rest.velocidadValor || null,
      velocidadUnidad: rest.velocidadUnidad || null,
      socket: rest.socket || null,
      potenciaValor: rest.potenciaValor || null,
      potenciaUnidad: rest.potenciaUnidad || null,
      comprobanteCompra,
      categoria: { connect: { id: categoriaId } },
      ...(proveedorId ? { proveedor: { connect: { id: proveedorId } } } : {}),
      ...(ensambleId ? { ensamble: { connect: { id: ensambleId } } } : {}),
    },
  });

  revalidatePath("/componentes");
  return { success: true };
}

export async function actualizarComponente(
  id: number,
  data: ComponenteInput,
  comprobanteBase64?: string | null,
  comprobanteNombre?: string | null
) {
  const parsed = componenteSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const costoMxn = calcularCostoMxn(parsed.data.costoOriginal, parsed.data.tipoCambio);

  let comprobanteCompra = parsed.data.comprobanteCompra || null;
  if (comprobanteBase64 && comprobanteNombre) {
    comprobanteCompra = await guardarComprobante(comprobanteBase64, comprobanteNombre);
  }

  const { categoriaId, proveedorId, ensambleId, fechaCompra, ...rest } = parsed.data;

  await prisma.componente.update({
    where: { id },
    data: {
      marca: rest.marca,
      modelo: rest.modelo,
      numeroSerie: rest.numeroSerie || null,
      foto: rest.foto || null,
      estado: rest.estado,
      fechaCompra: new Date(fechaCompra),
      costoOriginal: rest.costoOriginal,
      monedaCompra: rest.monedaCompra,
      tipoCambio: rest.tipoCambio,
      costoMxn,
      notas: rest.notas || null,
      origen: rest.origen,
      plataformaCompra: rest.plataformaCompra || null,
      capacidadValor: rest.capacidadValor || null,
      capacidadUnidad: rest.capacidadUnidad || null,
      vramValor: rest.vramValor || null,
      vramUnidad: rest.vramUnidad || null,
      velocidadValor: rest.velocidadValor || null,
      velocidadUnidad: rest.velocidadUnidad || null,
      socket: rest.socket || null,
      potenciaValor: rest.potenciaValor || null,
      potenciaUnidad: rest.potenciaUnidad || null,
      comprobanteCompra,
      categoria: { connect: { id: categoriaId } },
      ...(proveedorId
        ? { proveedor: { connect: { id: proveedorId } } }
        : { proveedor: { disconnect: true } }),
      ...(ensambleId
        ? { ensamble: { connect: { id: ensambleId } } }
        : { ensamble: { disconnect: true } }),
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
