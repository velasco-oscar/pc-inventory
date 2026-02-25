import { z } from "zod";

export const categoriaSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional().nullable(),
});

export const proveedorSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  direccion: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const componenteSchema = z.object({
  categoriaId: z.coerce.number().min(1, "Selecciona una categoría"),
  marca: z.string().min(1, "La marca es requerida"),
  modelo: z.string().min(1, "El modelo es requerido"),
  numeroSerie: z.string().optional().nullable(),
  foto: z.string().optional().nullable(),
  estado: z.enum(["disponible", "en_ensamble", "vendido", "defectuoso"]).default("disponible"),
  proveedorId: z.coerce.number().optional().nullable(),
  ensambleId: z.coerce.number().optional().nullable(),
  fechaCompra: z.string().min(1, "La fecha de compra es requerida"),
  costoOriginal: z.coerce.number().min(0, "El costo debe ser mayor o igual a 0"),
  monedaCompra: z.enum(["MXN", "USD"]).default("MXN"),
  tipoCambio: z.coerce.number().min(0.01, "El tipo de cambio debe ser mayor a 0").default(1),
  notas: z.string().optional().nullable(),
});

export const ensambleSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  foto: z.string().optional().nullable(),
  costoManoObra: z.coerce.number().min(0, "El costo debe ser mayor o igual a 0").default(0),
  precioVentaSugerido: z.coerce.number().optional().nullable(),
  estado: z.enum(["en_proceso", "listo", "vendido"]).default("en_proceso"),
  notas: z.string().optional().nullable(),
  fechaEnsamble: z.string().min(1, "La fecha de ensamble es requerida"),
  componenteIds: z.array(z.number()).min(1, "Selecciona al menos un componente"),
});

export const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  telefono: z.string().optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
  direccion: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
});

export const detalleVentaSchema = z.object({
  componenteId: z.number().optional().nullable(),
  ensambleId: z.number().optional().nullable(),
  precioUnitario: z.coerce.number().min(0),
  cantidad: z.coerce.number().min(1).default(1),
});

export const ventaSchema = z.object({
  clienteId: z.coerce.number().optional().nullable(),
  fechaVenta: z.string().min(1, "La fecha de venta es requerida"),
  tipoVenta: z.enum(["componente", "ensamble", "mixto"]),
  subtotal: z.coerce.number().min(0),
  descuento: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0),
  metodoPago: z.enum(["efectivo", "transferencia", "tarjeta", "otro"]),
  notas: z.string().optional().nullable(),
  detalles: z.array(detalleVentaSchema).min(1, "Agrega al menos un item"),
});

export const garantiaSchema = z.object({
  ventaId: z.coerce.number().min(1, "La venta es requerida"),
  componenteId: z.coerce.number().optional().nullable(),
  ensambleId: z.coerce.number().optional().nullable(),
  fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
  fechaFin: z.string().min(1, "La fecha de fin es requerida"),
  condiciones: z.string().min(1, "Las condiciones son requeridas"),
  estado: z.enum(["vigente", "vencida", "reclamada"]).default("vigente"),
  notas: z.string().optional().nullable(),
});

export const gastoOperativoSchema = z.object({
  concepto: z.string().min(1, "El concepto es requerido"),
  monto: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  fecha: z.string().min(1, "La fecha es requerida"),
  categoria: z.enum(["envio", "servicios", "herramientas", "publicidad", "otro"]),
  notas: z.string().optional().nullable(),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type ProveedorInput = z.infer<typeof proveedorSchema>;
export type ComponenteInput = z.infer<typeof componenteSchema>;
export type EnsambleInput = z.infer<typeof ensambleSchema>;
export type ClienteInput = z.infer<typeof clienteSchema>;
export type VentaInput = z.infer<typeof ventaSchema>;
export type GarantiaInput = z.infer<typeof garantiaSchema>;
export type GastoOperativoInput = z.infer<typeof gastoOperativoSchema>;
