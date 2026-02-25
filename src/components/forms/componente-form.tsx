"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { componenteSchema, type ComponenteInput } from "@/lib/validations";
import { crearComponente, actualizarComponente } from "@/actions/componentes";
import { calcularCostoMxn, formatearMoneda, formatearFechaInput, MONEDAS, PLATAFORMAS_COMPRA } from "@/lib/utils-app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useState, useTransition, useMemo, useRef } from "react";
import { ArrowLeft, Save, Upload, X, FileText, Image, Download, ExternalLink } from "lucide-react";
import Link from "next/link";

type Props = {
  categorias: { id: number; nombre: string }[];
  proveedores: { id: number; nombre: string }[];
  componente?: any;
};

// Configuración de campos dinámicos por categoría
type CampoDinamico = {
  tipo: "valor-unidad" | "texto";
  label: string;
  placeholder: string;
  valorField: string;
  unidadField?: string;
  unidades?: { value: string; label: string }[];
  defaultUnidad?: string;
};

const CAMPOS_CONFIG: Record<string, CampoDinamico> = {
  capacidad: {
    tipo: "valor-unidad",
    label: "Capacidad",
    placeholder: "ej: 500, 1, 16",
    valorField: "capacidadValor",
    unidadField: "capacidadUnidad",
    unidades: [
      { value: "GB", label: "GB" },
      { value: "TB", label: "TB" },
    ],
    defaultUnidad: "GB",
  },
  vram: {
    tipo: "valor-unidad",
    label: "VRAM",
    placeholder: "ej: 4, 8, 12",
    valorField: "vramValor",
    unidadField: "vramUnidad",
    unidades: [
      { value: "GB", label: "GB" },
      { value: "TB", label: "TB" },
    ],
    defaultUnidad: "GB",
  },
  velocidad: {
    tipo: "valor-unidad",
    label: "Velocidad",
    placeholder: "ej: 3200, 3.6",
    valorField: "velocidadValor",
    unidadField: "velocidadUnidad",
    unidades: [
      { value: "MHz", label: "MHz" },
      { value: "GHz", label: "GHz" },
    ],
    defaultUnidad: "MHz",
  },
  socket: {
    tipo: "texto",
    label: "Socket",
    placeholder: "ej: AM4, LGA1700, AM5",
    valorField: "socket",
  },
  potencia: {
    tipo: "valor-unidad",
    label: "Potencia",
    placeholder: "ej: 550, 750, 850",
    valorField: "potenciaValor",
    unidadField: "potenciaUnidad",
    unidades: [
      { value: "W", label: "W" },
    ],
    defaultUnidad: "W",
  },
};

const CAMPOS_POR_CATEGORIA: Record<string, string[]> = {
  "SSD": ["capacidad"],
  "HDD": ["capacidad"],
  "RAM": ["capacidad", "velocidad"],
  "GPU": ["vram"],
  "Procesador": ["socket", "velocidad"],
  "Tarjeta Madre": ["socket"],
  "Fuente de Poder": ["potencia"],
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ComponenteForm({ categorias, proveedores, componente }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!componente;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ComponenteInput>({
    resolver: zodResolver(componenteSchema) as any,
    defaultValues: componente
      ? {
          categoriaId: componente.categoriaId,
          marca: componente.marca,
          modelo: componente.modelo,
          numeroSerie: componente.numeroSerie || "",
          estado: componente.estado,
          proveedorId: componente.proveedorId || undefined,
          fechaCompra: formatearFechaInput(componente.fechaCompra),
          costoOriginal: componente.costoOriginal,
          monedaCompra: componente.monedaCompra,
          tipoCambio: componente.tipoCambio,
          notas: componente.notas || "",
          origen: componente.origen || "empresa",
          plataformaCompra: componente.plataformaCompra || "",
          capacidadValor: componente.capacidadValor || undefined,
          capacidadUnidad: componente.capacidadUnidad || "GB",
          vramValor: componente.vramValor || undefined,
          vramUnidad: componente.vramUnidad || "GB",
          velocidadValor: componente.velocidadValor || undefined,
          velocidadUnidad: componente.velocidadUnidad || "MHz",
          socket: componente.socket || "",
          potenciaValor: componente.potenciaValor || undefined,
          potenciaUnidad: componente.potenciaUnidad || "W",
          comprobanteCompra: componente.comprobanteCompra || "",
        }
      : {
          estado: "disponible",
          monedaCompra: "MXN",
          tipoCambio: 1,
          fechaCompra: formatearFechaInput(new Date()),
          origen: "empresa",
          plataformaCompra: "",
          capacidadUnidad: "GB",
          vramUnidad: "GB",
          velocidadUnidad: "MHz",
          potenciaUnidad: "W",
        },
  });

  const costoOriginal = watch("costoOriginal") || 0;
  const tipoCambio = watch("tipoCambio") || 1;
  const monedaCompra = watch("monedaCompra") || "MXN";
  const costoMxnCalculado = calcularCostoMxn(costoOriginal, tipoCambio);
  const categoriaId = watch("categoriaId");

  // Determinar qué campos dinámicos mostrar según la categoría seleccionada
  const camposDinamicos = useMemo(() => {
    if (!categoriaId) return [];
    const cat = categorias.find((c) => c.id === categoriaId);
    if (!cat) return [];
    return CAMPOS_POR_CATEGORIA[cat.nombre] || [];
  }, [categoriaId, categorias]);

  const categoriaNombre = useMemo(() => {
    if (!categoriaId) return "";
    return categorias.find((c) => c.id === categoriaId)?.nombre || "";
  }, [categoriaId, categorias]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Solo se permiten archivos PDF e imágenes (JPG, PNG, WebP)");
      return;
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no debe exceder 10 MB");
      return;
    }

    setComprobanteFile(file);
  };

  const removeComprobante = () => {
    setComprobanteFile(null);
    setValue("comprobanteCompra", null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = (data: ComponenteInput) => {
    startTransition(async () => {
      let base64: string | null = null;
      let nombre: string | null = null;

      if (comprobanteFile) {
        base64 = await fileToBase64(comprobanteFile);
        nombre = comprobanteFile.name;
      }

      const result = isEditing
        ? await actualizarComponente(componente.id, data, base64, nombre)
        : await crearComponente(data, base64, nombre);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Componente actualizado" : "Componente creado");
        router.push("/componentes");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/componentes">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEditing ? "Editar Componente" : "Nuevo Componente"}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoriaId">Categoría *</Label>
              <Select
                value={watch("categoriaId")?.toString() || ""}
                onValueChange={(v) => setValue("categoriaId", parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoriaId && (
                <p className="text-sm text-destructive">{errors.categoriaId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="marca">Marca *</Label>
              <Input {...register("marca")} placeholder="ej: AMD, Intel, NVIDIA" />
              {errors.marca && <p className="text-sm text-destructive">{errors.marca.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo *</Label>
              <Input {...register("modelo")} placeholder="ej: Ryzen 5 5600X" />
              {errors.modelo && <p className="text-sm text-destructive">{errors.modelo.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroSerie">Número de Serie</Label>
              <Input {...register("numeroSerie")} placeholder="Opcional" />
            </div>

            {/* Campos dinámicos según categoría */}
            {camposDinamicos.length > 0 && (
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 space-y-4">
                <p className="text-sm font-medium text-primary">
                  Especificaciones de {categoriaNombre}
                </p>
                {camposDinamicos.map((campoKey) => {
                  const config = CAMPOS_CONFIG[campoKey];
                  if (!config) return null;

                  if (config.tipo === "texto") {
                    return (
                      <div key={campoKey} className="space-y-2">
                        <Label>{config.label}</Label>
                        <Input
                          {...register(config.valorField as keyof ComponenteInput)}
                          placeholder={config.placeholder}
                        />
                      </div>
                    );
                  }

                  // tipo: valor-unidad
                  return (
                    <div key={campoKey} className="space-y-2">
                      <Label>{config.label}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          className="flex-1"
                          {...register(config.valorField as keyof ComponenteInput)}
                          placeholder={config.placeholder}
                        />
                        <Select
                          value={watch(config.unidadField as keyof ComponenteInput) as string || config.defaultUnidad}
                          onValueChange={(v) => setValue(config.unidadField as keyof ComponenteInput, v as any)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {config.unidades!.map((u) => (
                              <SelectItem key={u.value} value={u.value}>
                                {u.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={watch("estado")}
                onValueChange={(v) => setValue("estado", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="en_ensamble">En ensamble</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="defectuoso">Defectuoso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proveedorId">Proveedor</Label>
              <Select
                value={watch("proveedorId")?.toString() || "ninguno"}
                onValueChange={(v) => setValue("proveedorId", v === "ninguno" ? null : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin proveedor</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Costos */}
        <Card>
          <CardHeader>
            <CardTitle>Costos y Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Origen</Label>
                <Select
                  value={watch("origen") || "empresa"}
                  onValueChange={(v) => setValue("origen", v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plataforma de compra</Label>
                <Select
                  value={watch("plataformaCompra") || "ninguna"}
                  onValueChange={(v) => setValue("plataformaCompra", v === "ninguna" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguna">Sin especificar</SelectItem>
                    {PLATAFORMAS_COMPRA.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaCompra">Fecha de Compra *</Label>
              <Input type="date" {...register("fechaCompra")} />
              {errors.fechaCompra && (
                <p className="text-sm text-destructive">{errors.fechaCompra.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monedaCompra">Moneda de Compra</Label>
              <Select
                value={monedaCompra}
                onValueChange={(v) => {
                  setValue("monedaCompra", v as any);
                  if (v === "MXN") setValue("tipoCambio", 1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONEDAS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costoOriginal">Costo Original *</Label>
              <Input
                type="number"
                step="0.01"
                {...register("costoOriginal", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.costoOriginal && (
                <p className="text-sm text-destructive">{errors.costoOriginal.message}</p>
              )}
            </div>

            {monedaCompra === "USD" && (
              <div className="space-y-2">
                <Label htmlFor="tipoCambio">Tipo de Cambio (1 USD = ? MXN)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("tipoCambio", { valueAsNumber: true })}
                  placeholder="ej: 17.50"
                />
                {errors.tipoCambio && (
                  <p className="text-sm text-destructive">{errors.tipoCambio.message}</p>
                )}
              </div>
            )}

            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">Costo en MXN (calculado)</p>
              <p className="text-2xl font-bold text-primary">
                {formatearMoneda(costoMxnCalculado)}
              </p>
              {monedaCompra === "USD" && (
                <p className="text-xs text-muted-foreground mt-1">
                  ${costoOriginal.toFixed(2)} USD × {tipoCambio} = {formatearMoneda(costoMxnCalculado)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea {...register("notas")} placeholder="Notas adicionales..." />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprobante de compra */}
      <Card>
        <CardHeader>
          <CardTitle>Comprobante de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label>Subir comprobante (PDF o imagen)</Label>

            {/* Existing receipt from server (editing mode) */}
            {isEditing && componente?.comprobanteCompra && !comprobanteFile && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                {componente.comprobanteCompra.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <Image className="h-5 w-5 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <span className="flex-1 text-sm truncate">
                  {componente.comprobanteCompra}
                </span>
                <div className="flex gap-1 shrink-0">
                  <a
                    href={`/api/comprobantes/${componente.comprobanteCompra}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Abrir en navegador">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                  <a
                    href={`/api/comprobantes/${componente.comprobanteCompra}`}
                    download
                  >
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Descargar">
                      <Download className="h-4 w-4" />
                    </Button>
                  </a>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={removeComprobante}
                    title="Eliminar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Newly selected file (not yet saved) */}
            {comprobanteFile && (
              <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                {comprobanteFile.type?.startsWith("image/") ? (
                  <Image className="h-5 w-5 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="h-5 w-5 text-red-500 shrink-0" />
                )}
                <span className="flex-1 text-sm truncate">
                  {comprobanteFile.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={removeComprobante}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Upload zone — shown when there's no file at all */}
            {!comprobanteFile && !(isEditing && componente?.comprobanteCompra) && (
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Haz clic para seleccionar un archivo
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  PDF, JPG, PNG o WebP (máx. 10 MB)
                </p>
              </div>
            )}

            {/* Replace button when there's an existing file */}
            {(comprobanteFile || (isEditing && componente?.comprobanteCompra)) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Reemplazar archivo
              </Button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/componentes">
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
