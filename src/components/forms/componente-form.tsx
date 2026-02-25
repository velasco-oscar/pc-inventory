"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { componenteSchema, type ComponenteInput } from "@/lib/validations";
import { crearComponente, actualizarComponente } from "@/actions/componentes";
import { calcularCostoMxn, formatearMoneda, formatearFechaInput, MONEDAS } from "@/lib/utils-app";
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
import { useState, useTransition } from "react";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

type Props = {
  categorias: { id: number; nombre: string }[];
  proveedores: { id: number; nombre: string }[];
  componente?: any;
};

export function ComponenteForm({ categorias, proveedores, componente }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!componente;

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
        }
      : {
          estado: "disponible",
          monedaCompra: "MXN",
          tipoCambio: 1,
          fechaCompra: formatearFechaInput(new Date()),
        },
  });

  const costoOriginal = watch("costoOriginal") || 0;
  const tipoCambio = watch("tipoCambio") || 1;
  const monedaCompra = watch("monedaCompra") || "MXN";
  const costoMxnCalculado = calcularCostoMxn(costoOriginal, tipoCambio);

  const onSubmit = (data: ComponenteInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await actualizarComponente(componente.id, data)
        : await crearComponente(data);

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
