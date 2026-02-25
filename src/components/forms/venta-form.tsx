"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ventaSchema, type VentaInput } from "@/lib/validations";
import { crearVenta } from "@/actions/ventas";
import { formatearMoneda, formatearFechaInput, METODOS_PAGO } from "@/lib/utils-app";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useState, useTransition, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Save, Trash2, ShoppingCart, ShieldCheck } from "lucide-react";
import Link from "next/link";

type Props = {
  clientes: any[];
  componentesDisponibles: any[];
  ensamblesDisponibles: any[];
};

export function VentaForm({ clientes, componentesDisponibles, ensamblesDisponibles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<VentaInput>({
    resolver: zodResolver(ventaSchema) as any,
    defaultValues: {
      fechaVenta: formatearFechaInput(new Date()),
      tipoVenta: "componente",
      metodoPago: "efectivo",
      descuento: 0,
      subtotal: 0,
      total: 0,
      detalles: [],
      incluirGarantia: false,
      garantiaFechaFin: "",
      garantiaNotas: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const detalles = watch("detalles") || [];
  const descuento = watch("descuento") || 0;

  const subtotal = useMemo(
    () => detalles.reduce((sum, d) => sum + (d.precioUnitario || 0) * (d.cantidad || 1), 0),
    [detalles]
  );
  const total = Math.max(0, subtotal - descuento);

  // Keep form values in sync
  useMemo(() => {
    setValue("subtotal", subtotal);
    setValue("total", total);
  }, [subtotal, total, setValue]);

  // Determine sale type
  useMemo(() => {
    const hasComp = detalles.some((d) => d.componenteId);
    const hasEns = detalles.some((d) => d.ensambleId);
    if (hasComp && hasEns) setValue("tipoVenta", "mixto");
    else if (hasEns) setValue("tipoVenta", "ensamble");
    else setValue("tipoVenta", "componente");
  }, [detalles, setValue]);

  // Items already added
  const compIdsUsados = detalles.filter((d) => d.componenteId).map((d) => d.componenteId);
  const ensIdsUsados = detalles.filter((d) => d.ensambleId).map((d) => d.ensambleId);

  const compDisp = componentesDisponibles.filter((c) => !compIdsUsados.includes(c.id));
  const ensDisp = ensamblesDisponibles.filter((e) => !ensIdsUsados.includes(e.id));

  const agregarComponente = (id: number) => {
    const comp = componentesDisponibles.find((c) => c.id === id);
    if (!comp) return;
    append({
      componenteId: comp.id,
      ensambleId: null,
      precioUnitario: comp.costoOriginal * comp.tipoCambio * 1.3, // 30% markup suggested
      cantidad: 1,
    });
  };

  const agregarEnsamble = (id: number) => {
    const ens = ensamblesDisponibles.find((e) => e.id === id);
    if (!ens) return;
    const costoTotal =
      ens.componentes.reduce((s: number, c: any) => s + c.costoOriginal * c.tipoCambio, 0) +
      ens.costoManoObra;
    append({
      componenteId: null,
      ensambleId: ens.id,
      precioUnitario: ens.precioVentaSugerido || costoTotal * 1.3,
      cantidad: 1,
    });
  };

  const getItemNombre = (detalle: any): string => {
    if (detalle.componenteId) {
      const c = componentesDisponibles.find((x) => x.id === detalle.componenteId);
      return c ? `${c.marca} ${c.modelo}` : "Componente";
    }
    if (detalle.ensambleId) {
      const e = ensamblesDisponibles.find((x) => x.id === detalle.ensambleId);
      return e ? e.nombre : "Ensamble";
    }
    return "Item";
  };

  const onSubmit = (data: VentaInput) => {
    startTransition(async () => {
      const result = await crearVenta(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Venta registrada");
        router.push("/ventas");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ventas">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Nueva Venta</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info de la venta */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Venta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={watch("clienteId")?.toString() || "ninguno"}
                onValueChange={(v) =>
                  setValue("clienteId", v === "ninguno" ? null : parseInt(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ninguno">Sin cliente / Mostrador</SelectItem>
                  {clientes.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input type="date" {...register("fechaVenta")} />
              {errors.fechaVenta && (
                <p className="text-sm text-destructive">{errors.fechaVenta.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Método de Pago</Label>
              <Select
                value={watch("metodoPago")}
                onValueChange={(v) => setValue("metodoPago", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descuento (MXN)</Label>
              <Input
                type="number"
                step="0.01"
                {...register("descuento", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea {...register("notas")} placeholder="Notas de la venta..." />
            </div>

            {/* Totals */}
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatearMoneda(subtotal)}</span>
              </div>
              {descuento > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Descuento:</span>
                  <span>-{formatearMoneda(descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-primary">{formatearMoneda(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Items de la Venta ({fields.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.detalles && (
              <p className="text-sm text-destructive">
                {typeof errors.detalles === "object" && "message" in errors.detalles
                  ? (errors.detalles as any).message
                  : "Revisa los items"}
              </p>
            )}

            {/* Add items */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Agregar Componente</Label>
                <Select onValueChange={(v) => agregarComponente(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar componente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {compDisp.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No hay componentes disponibles
                      </SelectItem>
                    ) : (
                      compDisp.map((c: any) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.marca} {c.modelo} — {formatearMoneda(c.costoOriginal * c.tipoCambio)}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Agregar Ensamble (PC)</Label>
                <Select onValueChange={(v) => agregarEnsamble(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar ensamble..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ensDisp.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No hay ensambles disponibles
                      </SelectItem>
                    ) : (
                      ensDisp.map((e: any) => (
                        <SelectItem key={e.id} value={String(e.id)}>
                          {e.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Items list */}
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Agrega componentes o ensambles a la venta</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{getItemNombre(detalles[index])}</p>
                      <p className="text-xs text-muted-foreground">
                        {detalles[index]?.componenteId ? "Componente" : "Ensamble"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Input
                          type="number"
                          min="1"
                          {...register(`detalles.${index}.cantidad`, { valueAsNumber: true })}
                          className="h-8 text-center"
                        />
                      </div>
                      <span className="text-muted-foreground">×</span>
                      <div className="w-32">
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`detalles.${index}.precioUnitario`, { valueAsNumber: true })}
                          className="h-8"
                        />
                      </div>
                      <span className="w-28 text-right font-medium text-sm">
                        {formatearMoneda(
                          (detalles[index]?.precioUnitario || 0) *
                            (detalles[index]?.cantidad || 1)
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Garantía */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Garantía
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="incluirGarantia"
              checked={watch("incluirGarantia")}
              onCheckedChange={(checked) => setValue("incluirGarantia", !!checked)}
            />
            <Label htmlFor="incluirGarantia" className="cursor-pointer">
              Incluir garantía para los items vendidos
            </Label>
          </div>

          {watch("incluirGarantia") && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-2">
                <Label>Fecha de vencimiento *</Label>
                <Input type="date" {...register("garantiaFechaFin")} />
                {errors.garantiaFechaFin && (
                  <p className="text-sm text-destructive">{errors.garantiaFechaFin.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notas de garantía</Label>
                <Input
                  {...register("garantiaNotas")}
                  placeholder="Notas adicionales sobre la garantía..."
                />
              </div>

              <p className="text-xs text-muted-foreground sm:col-span-2">
                Se creará una garantía por cada item de la venta. La fecha de inicio será la fecha de venta.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Link href="/ventas">
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending || fields.length === 0}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Guardando..." : "Registrar Venta"}
        </Button>
      </div>
    </form>
  );
}
