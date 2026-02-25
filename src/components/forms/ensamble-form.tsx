"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ensambleSchema, type EnsambleInput } from "@/lib/validations";
import { crearEnsamble, actualizarEnsamble } from "@/actions/ensambles";
import { formatearMoneda, formatearFechaInput } from "@/lib/utils-app";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useState, useTransition, useMemo } from "react";
import { ArrowLeft, Save, Cpu, Search } from "lucide-react";
import Link from "next/link";

type Props = {
  componentesDisponibles: any[];
  componentesActuales?: any[];
  ensamble?: any;
};

export function EnsambleForm({ componentesDisponibles, componentesActuales, ensamble }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busquedaComp, setBusquedaComp] = useState("");
  const isEditing = !!ensamble;

  // Merge available + current assembly components (when editing)
  const todosComponentes = useMemo(() => {
    if (!componentesActuales) return componentesDisponibles;
    const ids = new Set(componentesDisponibles.map((c: any) => c.id));
    return [
      ...componentesDisponibles,
      ...componentesActuales.filter((c: any) => !ids.has(c.id)),
    ];
  }, [componentesDisponibles, componentesActuales]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EnsambleInput>({
    resolver: zodResolver(ensambleSchema) as any,
    defaultValues: ensamble
      ? {
          nombre: ensamble.nombre,
          costoManoObra: ensamble.costoManoObra,
          precioVentaSugerido: ensamble.precioVentaSugerido || undefined,
          estado: ensamble.estado,
          notas: ensamble.notas || "",
          fechaEnsamble: formatearFechaInput(ensamble.fechaEnsamble),
          componenteIds: ensamble.componentes.map((c: any) => c.id),
        }
      : {
          estado: "en_proceso",
          costoManoObra: 0,
          fechaEnsamble: formatearFechaInput(new Date()),
          componenteIds: [],
        },
  });

  const componenteIds = watch("componenteIds") || [];
  const costoManoObra = watch("costoManoObra") || 0;

  const costoComponentes = useMemo(
    () =>
      todosComponentes
        .filter((c: any) => componenteIds.includes(c.id))
        .reduce((acc: number, c: any) => acc + c.costoOriginal * c.tipoCambio, 0),
    [componenteIds, todosComponentes]
  );

  const costoTotal = costoComponentes + costoManoObra;

  const componentesFiltrados = todosComponentes.filter((c: any) => {
    const texto = `${c.marca} ${c.modelo} ${c.categoria?.nombre || ""}`.toLowerCase();
    return texto.includes(busquedaComp.toLowerCase());
  });

  const toggleComponente = (id: number) => {
    const current = componenteIds;
    if (current.includes(id)) {
      setValue(
        "componenteIds",
        current.filter((cid: number) => cid !== id)
      );
    } else {
      setValue("componenteIds", [...current, id]);
    }
  };

  const onSubmit = (data: EnsambleInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await actualizarEnsamble(ensamble.id, data)
        : await crearEnsamble(data);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Ensamble actualizado" : "Ensamble creado");
        router.push("/ensambles");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/ensambles">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {isEditing ? "Editar Ensamble" : "Nuevo Ensamble"}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info básica */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input {...register("nombre")} placeholder="ej: PC Gamer RTX 4060" />
              {errors.nombre && (
                <p className="text-sm text-destructive">{errors.nombre.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Fecha de Ensamble *</Label>
              <Input type="date" {...register("fechaEnsamble")} />
              {errors.fechaEnsamble && (
                <p className="text-sm text-destructive">{errors.fechaEnsamble.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={watch("estado")}
                onValueChange={(v) => setValue("estado", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_proceso">En proceso</SelectItem>
                  <SelectItem value="listo">Listo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Costo Mano de Obra</Label>
              <Input
                type="number"
                step="0.01"
                {...register("costoManoObra", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Precio de Venta Sugerido</Label>
              <Input
                type="number"
                step="0.01"
                {...register("precioVentaSugerido", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea {...register("notas")} />
            </div>

            {/* Cost summary */}
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Costo componentes:</span>
                <span>{formatearMoneda(costoComponentes)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Mano de obra:</span>
                <span>{formatearMoneda(costoManoObra)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total inversión:</span>
                <span className="text-primary">{formatearMoneda(costoTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component selector */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Seleccionar Componentes
              <Badge variant="secondary">{componenteIds.length} seleccionados</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.componenteIds && (
              <p className="text-sm text-destructive">{errors.componenteIds.message}</p>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Filtrar componentes..."
                value={busquedaComp}
                onChange={(e) => setBusquedaComp(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[500px] rounded-md border p-4">
              {componentesFiltrados.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay componentes disponibles
                </p>
              ) : (
                <div className="space-y-2">
                  {componentesFiltrados.map((c: any) => {
                    const seleccionado = componenteIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          seleccionado
                            ? "bg-primary/10 border-primary"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleComponente(c.id)}
                      >
                        <Checkbox
                          checked={seleccionado}
                          onCheckedChange={() => toggleComponente(c.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {c.marca} {c.modelo}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {c.categoria?.nombre || "Sin categoría"}
                            {c.numeroSerie && ` · S/N: ${c.numeroSerie}`}
                          </p>
                        </div>
                        <span className="text-sm font-medium">
                          {formatearMoneda(c.costoOriginal * c.tipoCambio)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/ensambles">
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
