import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function formatearFecha(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatearFechaCorta(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(d, "dd/MM/yyyy", { locale: es });
}

export function formatearFechaInput(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(d, "yyyy-MM-dd");
}

export function formatearHace(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(monto);
}

export function calcularCostoMxn(costoOriginal: number, tipoCambio: number): number {
  return Math.round(costoOriginal * tipoCambio * 100) / 100;
}

export const ESTADOS_COMPONENTE = {
  disponible: { label: "Disponible", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  en_ensamble: { label: "En ensamble", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  vendido: { label: "Vendido", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
  defectuoso: { label: "Defectuoso", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
} as const;

export const ESTADOS_ENSAMBLE = {
  en_proceso: { label: "En proceso", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  listo: { label: "Listo", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  vendido: { label: "Vendido", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
} as const;

// Build checklist config — defines required/optional component categories for a PC build
export type BuildSlot = {
  categoria: string;
  label: string;
  requerido: boolean;
  max: number | null; // null = unlimited
  icon: string; // lucide icon name
};

export const BUILD_CHECKLIST: BuildSlot[] = [
  { categoria: "Tarjeta Madre", label: "Tarjeta Madre", requerido: true, max: 1, icon: "circuit-board" },
  { categoria: "Procesador", label: "Procesador", requerido: true, max: 1, icon: "cpu" },
  { categoria: "RAM", label: "RAM", requerido: true, max: null, icon: "memory-stick" },
  { categoria: "GPU", label: "GPU", requerido: false, max: null, icon: "monitor" },
  { categoria: "SSD", label: "Almacenamiento (SSD)", requerido: true, max: null, icon: "hard-drive" },
  { categoria: "HDD", label: "Almacenamiento (HDD)", requerido: false, max: null, icon: "hard-drive" },
  { categoria: "Fuente de Poder", label: "Fuente de Poder", requerido: true, max: 1, icon: "plug" },
  { categoria: "Case/Gabinete", label: "Case / Gabinete", requerido: false, max: 1, icon: "box" },
  { categoria: "Ventilador/Cooler", label: "Ventilador / Cooler", requerido: false, max: null, icon: "fan" },
];

export const ESTADOS_GARANTIA = {
  vigente: { label: "Vigente", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  vencida: { label: "Vencida", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  reclamada: { label: "Reclamada", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
} as const;

export const METODOS_PAGO = [
  { value: "efectivo", label: "Efectivo" },
  { value: "transferencia", label: "Transferencia" },
  { value: "tarjeta", label: "Tarjeta" },
  { value: "otro", label: "Otro" },
] as const;

export const MONEDAS = [
  { value: "MXN", label: "Pesos (MXN)" },
  { value: "USD", label: "Dólares (USD)" },
] as const;

export const ORIGENES = {
  empresa: { label: "Empresa", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  personal: { label: "Personal", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
} as const;

export const PLATAFORMAS_COMPRA = [
  { value: "amazon", label: "Amazon" },
  { value: "ebay", label: "eBay" },
  { value: "mercadolibre", label: "MercadoLibre" },
  { value: "facebook_marketplace", label: "Facebook Marketplace" },
  { value: "temu", label: "Temu" },
  { value: "aliexpress", label: "AliExpress" },
  { value: "tienda_fisica", label: "Tienda Física" },
  { value: "otro", label: "Otro" },
] as const;

export const CATEGORIAS_GASTO = [
  { value: "envio", label: "Envío" },
  { value: "consumibles", label: "Consumibles" },
  { value: "servicios", label: "Servicios" },
  { value: "herramientas", label: "Herramientas" },
  { value: "publicidad", label: "Publicidad" },
  { value: "otro", label: "Otro" },
] as const;
