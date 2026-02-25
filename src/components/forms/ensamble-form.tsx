"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ensambleSchema, type EnsambleInput } from "@/lib/validations";
import { crearEnsamble, actualizarEnsamble } from "@/actions/ensambles";
import {
  formatearMoneda,
  formatearFechaInput,
  BUILD_CHECKLIST,
  ORIGENES,
} from "@/lib/utils-app";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useTransition, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  Save,
  Cpu,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Link from "next/link";

type Props = {
  componentesDisponibles: any[];
  componentesActuales?: any[];
  ensamble?: any;
};

export function EnsambleForm({
  componentesDisponibles,
  componentesActuales,
  ensamble,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busquedaComp, setBusquedaComp] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroOrigen, setFiltroOrigen] = useState("todos");
  const [seccionesAbiertas, setSeccionesAbiertas] = useState<Set<string>>(
    new Set(BUILD_CHECKLIST.map((s) => s.categoria))
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<EnsambleInput | null>(null);
  const isEditing = !!ensamble;

  // Local state for values that also need to sync with react-hook-form
  // Using local state avoids watch()+setValue() infinite render loops with Radix Select
  const [estado, setEstado] = useState<string>(ensamble?.estado || "en_proceso");
  const [componenteIds, setComponenteIds] = useState<number[]>(
    ensamble?.componentes?.map((c: any) => c.id) || []
  );
  const [costoManoObra, setCostoManoObra] = useState<number>(
    ensamble?.costoManoObra || 0
  );

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

  // --- Derived data ---

  const costoComponentes = useMemo(
    () =>
      todosComponentes
        .filter((c: any) => componenteIds.includes(c.id))
        .reduce(
          (acc: number, c: any) => acc + c.costoOriginal * c.tipoCambio,
          0
        ),
    [componenteIds, todosComponentes]
  );

  const costoTotal = costoComponentes + costoManoObra;

  // All unique categories from available components
  const categoriasDisponibles = useMemo(() => {
    const cats = new Map<string, string>();
    todosComponentes.forEach((c: any) => {
      if (c.categoria?.nombre) cats.set(c.categoria.nombre, c.categoria.nombre);
    });
    return Array.from(cats.values()).sort();
  }, [todosComponentes]);

  // Filtered components based on search + filters
  const componentesFiltrados = useMemo(() => {
    return todosComponentes.filter((c: any) => {
      const texto =
        `${c.marca} ${c.modelo} ${c.categoria?.nombre || ""} ${c.numeroSerie || ""}`.toLowerCase();
      const matchBusqueda = texto.includes(busquedaComp.toLowerCase());
      const matchCategoria =
        filtroCategoria === "todas" ||
        c.categoria?.nombre === filtroCategoria;
      const matchOrigen =
        filtroOrigen === "todos" || c.origen === filtroOrigen;
      return matchBusqueda && matchCategoria && matchOrigen;
    });
  }, [todosComponentes, busquedaComp, filtroCategoria, filtroOrigen]);

  // Group filtered components by category name
  const componentesPorCategoria = useMemo(() => {
    const grupos = new Map<string, any[]>();
    componentesFiltrados.forEach((c: any) => {
      const cat = c.categoria?.nombre || "Sin categoría";
      if (!grupos.has(cat)) grupos.set(cat, []);
      grupos.get(cat)!.push(c);
    });
    // Sort by BUILD_CHECKLIST order first, then alphabetical
    const orden = BUILD_CHECKLIST.map((s) => s.categoria);
    return new Map(
      [...grupos.entries()].sort((a, b) => {
        const ia = orden.indexOf(a[0]);
        const ib = orden.indexOf(b[0]);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a[0].localeCompare(b[0]);
      })
    );
  }, [componentesFiltrados]);

  // Selected components (full objects) for the strip
  const componentesSeleccionados = useMemo(
    () => todosComponentes.filter((c: any) => componenteIds.includes(c.id)),
    [componenteIds, todosComponentes]
  );

  // Build checklist status: how many of each category are selected
  const checklistStatus = useMemo(() => {
    return BUILD_CHECKLIST.map((slot) => {
      const seleccionados = componentesSeleccionados.filter(
        (c: any) => c.categoria?.nombre === slot.categoria
      );
      const count = seleccionados.length;
      const exceedsMax = slot.max !== null && count > slot.max;
      const fulfilled = slot.requerido ? count > 0 : true;
      return { ...slot, count, seleccionados, exceedsMax, fulfilled };
    });
  }, [componentesSeleccionados]);

  // Missing required slots
  const slotsFaltantes = checklistStatus.filter(
    (s) => s.requerido && s.count === 0
  );

  // Slots exceeding max
  const slotsExcedidos = checklistStatus.filter((s) => s.exceedsMax);

  // --- Handlers ---

  const toggleComponente = useCallback(
    (id: number) => {
      setComponenteIds((prev) => {
        const next = prev.includes(id)
          ? prev.filter((cid) => cid !== id)
          : [...prev, id];
        setValue("componenteIds", next);
        return next;
      });
    },
    [setValue]
  );

  const toggleSeccion = (cat: string) => {
    setSeccionesAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const doSubmit = (data: EnsambleInput) => {
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

  const onSubmit = (data: EnsambleInput) => {
    // If there are missing required slots, ask for confirmation
    if (slotsFaltantes.length > 0) {
      setPendingData(data);
      setShowConfirmDialog(true);
    } else {
      doSubmit(data);
    }
  };

  const confirmSubmit = () => {
    setShowConfirmDialog(false);
    if (pendingData) doSubmit(pendingData);
    setPendingData(null);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
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

        <div className="grid gap-6 xl:grid-cols-4 lg:grid-cols-3">
          {/* ─── Column 1: General Info ─── */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  {...register("nombre")}
                  placeholder="ej: PC Gamer RTX 4060"
                />
                {errors.nombre && (
                  <p className="text-sm text-destructive">
                    {errors.nombre.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Fecha de Ensamble *</Label>
                <Input type="date" {...register("fechaEnsamble")} />
                {errors.fechaEnsamble && (
                  <p className="text-sm text-destructive">
                    {errors.fechaEnsamble.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={estado}
                  onValueChange={(v) => {
                    setEstado(v);
                    setValue("estado", v as any);
                  }}
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
                  {...register("costoManoObra", {
                    valueAsNumber: true,
                    onChange: (e) => {
                      const val = parseFloat(e.target.value);
                      setCostoManoObra(isNaN(val) ? 0 : val);
                    },
                  })}
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
            </CardContent>
          </Card>

          {/* ─── Column 2: Component Selector ─── */}
          <Card className="xl:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Seleccionar Componentes
                <Badge variant="secondary">
                  {componenteIds.length} seleccionados
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.componenteIds && (
                <p className="text-sm text-destructive">
                  {errors.componenteIds.message}
                </p>
              )}

              {/* Filter bar */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar marca, modelo, serial..."
                    value={busquedaComp}
                    onChange={(e) => setBusquedaComp(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={filtroCategoria}
                  onValueChange={setFiltroCategoria}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las categorías</SelectItem>
                    {categoriasDisponibles.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroOrigen} onValueChange={setFiltroOrigen}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {Object.entries(ORIGENES).map(([key, val]) => (
                      <SelectItem key={key} value={key}>
                        {val.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected components strip */}
              {componentesSeleccionados.length > 0 && (
                <div className="flex flex-wrap gap-1.5 rounded-md border border-dashed p-2">
                  {componentesSeleccionados.map((c: any) => (
                    <Badge
                      key={c.id}
                      variant="secondary"
                      className="gap-1 pr-1 cursor-pointer hover:bg-destructive/20"
                      onClick={() => toggleComponente(c.id)}
                    >
                      <span className="max-w-[150px] truncate text-xs">
                        {c.marca} {c.modelo}
                      </span>
                      <X className="h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Grouped component list */}
              <ScrollArea className="h-[460px] rounded-md border">
                {componentesFiltrados.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No hay componentes que coincidan con los filtros
                  </p>
                ) : (
                  <div className="divide-y">
                    {[...componentesPorCategoria.entries()].map(
                      ([categoria, comps]) => {
                        const abierta = seccionesAbiertas.has(categoria);
                        const seleccionadosEnCategoria = comps.filter(
                          (c: any) => componenteIds.includes(c.id)
                        ).length;
                        const slot = BUILD_CHECKLIST.find(
                          (s) => s.categoria === categoria
                        );

                        return (
                          <div key={categoria}>
                            {/* Category header */}
                            <button
                              type="button"
                              className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-muted/50 hover:bg-muted transition-colors sticky top-0 z-10"
                              onClick={() => toggleSeccion(categoria)}
                            >
                              {abierta ? (
                                <ChevronDown className="h-4 w-4 shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 shrink-0" />
                              )}
                              {slot && (
                                <span className="text-base">{slot.icon}</span>
                              )}
                              <span>{categoria}</span>
                              <Badge
                                variant="outline"
                                className="ml-auto text-xs"
                              >
                                {comps.length} disponibles
                              </Badge>
                              {seleccionadosEnCategoria > 0 && (
                                <Badge variant="default" className="text-xs">
                                  {seleccionadosEnCategoria} ✓
                                </Badge>
                              )}
                              {slot && slot.max !== null &&
                                seleccionadosEnCategoria > slot.max && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Máx {slot.max}
                                  </Badge>
                                )}
                            </button>

                            {/* Component items */}
                            {abierta && (
                              <div className="divide-y divide-dashed">
                                {comps.map((c: any) => {
                                  const seleccionado =
                                    componenteIds.includes(c.id);
                                  return (
                                    <div
                                      key={c.id}
                                      className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                        seleccionado
                                          ? "bg-primary/10"
                                          : "hover:bg-muted/30"
                                      }`}
                                      onClick={() => toggleComponente(c.id)}
                                    >
                                      <Checkbox
                                        checked={seleccionado}
                                        onCheckedChange={() =>
                                          toggleComponente(c.id)
                                        }
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                          {c.marca} {c.modelo}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                          {c.numeroSerie &&
                                            `S/N: ${c.numeroSerie}`}
                                          {c.origen && (
                                            <span
                                              className={`ml-1 inline-block rounded px-1 text-[10px] ${
                                                ORIGENES[
                                                  c.origen as keyof typeof ORIGENES
                                                ]?.color || ""
                                              }`}
                                            >
                                              {ORIGENES[
                                                c.origen as keyof typeof ORIGENES
                                              ]?.label || c.origen}
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                      <span className="text-sm font-medium whitespace-nowrap">
                                        {formatearMoneda(
                                          c.costoOriginal * c.tipoCambio
                                        )}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* ─── Column 3: Build Checklist ─── */}
          <Card className="xl:col-span-1 lg:col-span-3 xl:row-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="h-5 w-5" />
                Checklist de Armado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {checklistStatus.map((slot) => {
                const statusIcon =
                  slot.count > 0 ? (
                    slot.exceedsMax ? (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )
                  ) : slot.requerido ? (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  );

                return (
                  <div
                    key={slot.categoria}
                    className={`rounded-md p-2.5 transition-colors ${
                      slot.requerido && slot.count === 0
                        ? "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
                        : slot.exceedsMax
                          ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                          : slot.count > 0
                            ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                            : "border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {statusIcon}
                      <span className="text-base">{slot.icon}</span>
                      <span className="text-sm font-medium flex-1">
                        {slot.label}
                      </span>
                      {slot.requerido && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          req
                        </span>
                      )}
                      {slot.count > 0 && (
                        <Badge
                          variant={slot.exceedsMax ? "destructive" : "secondary"}
                          className="text-xs h-5"
                        >
                          {slot.count}
                          {slot.max !== null && `/${slot.max}`}
                        </Badge>
                      )}
                    </div>
                    {/* Show selected components for this slot */}
                    {slot.seleccionados.length > 0 && (
                      <div className="mt-1.5 ml-6 space-y-0.5">
                        {slot.seleccionados.map((c: any) => (
                          <p
                            key={c.id}
                            className="text-xs text-muted-foreground truncate"
                          >
                            • {c.marca} {c.modelo}
                          </p>
                        ))}
                      </div>
                    )}
                    {slot.exceedsMax && (
                      <p className="text-xs text-destructive mt-1 ml-6">
                        ⚠ Máximo {slot.max} permitido
                        {slot.max === 1 ? "" : "s"}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Components not in any checklist slot */}
              {componentesSeleccionados.filter(
                (c: any) =>
                  !BUILD_CHECKLIST.some(
                    (s) => s.categoria === c.categoria?.nombre
                  )
              ).length > 0 && (
                <div className="rounded-md p-2.5 border border-dashed mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📎</span>
                    <span className="text-sm font-medium">
                      Otros componentes
                    </span>
                    <Badge variant="secondary" className="text-xs h-5 ml-auto">
                      {
                        componentesSeleccionados.filter(
                          (c: any) =>
                            !BUILD_CHECKLIST.some(
                              (s) => s.categoria === c.categoria?.nombre
                            )
                        ).length
                      }
                    </Badge>
                  </div>
                  <div className="mt-1.5 ml-6 space-y-0.5">
                    {componentesSeleccionados
                      .filter(
                        (c: any) =>
                          !BUILD_CHECKLIST.some(
                            (s) => s.categoria === c.categoria?.nombre
                          )
                      )
                      .map((c: any) => (
                        <p
                          key={c.id}
                          className="text-xs text-muted-foreground truncate"
                        >
                          • {c.categoria?.nombre}: {c.marca} {c.modelo}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ─── Sticky Cost Footer ─── */}
        <div className="sticky bottom-0 z-20 -mx-6 px-6 py-3 bg-background/95 backdrop-blur border-t shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              <div className="text-sm">
                <span className="text-muted-foreground">Componentes: </span>
                <span className="font-medium">
                  {formatearMoneda(costoComponentes)}
                </span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Mano de obra: </span>
                <span className="font-medium">
                  {formatearMoneda(costoManoObra)}
                </span>
              </div>
              <div className="text-sm font-bold">
                <span className="text-muted-foreground">Total: </span>
                <span className="text-primary text-base">
                  {formatearMoneda(costoTotal)}
                </span>
              </div>
              {slotsFaltantes.length > 0 && (
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">
                    {slotsFaltantes.length} requerido
                    {slotsFaltantes.length > 1 ? "s" : ""} faltante
                    {slotsFaltantes.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {slotsExcedidos.length > 0 && (
                <div className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-xs">
                    {slotsExcedidos.length} categoría
                    {slotsExcedidos.length > 1 ? "s" : ""} excede
                    {slotsExcedidos.length > 1 ? "n" : ""} el máximo
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Link href="/ensambles">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isPending
                  ? "Guardando..."
                  : isEditing
                    ? "Actualizar"
                    : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* ─── Confirmation Dialog for missing required components ─── */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Componentes requeridos faltantes
            </DialogTitle>
            <DialogDescription>
              El ensamble no tiene los siguientes componentes requeridos. ¿Deseas
              guardarlo de todas formas?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {slotsFaltantes.map((slot) => (
              <div
                key={slot.categoria}
                className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2"
              >
                <span className="text-base">{slot.icon}</span>
                <span className="text-sm font-medium">{slot.label}</span>
                <Badge
                  variant="outline"
                  className="ml-auto text-amber-700 dark:text-amber-300 border-amber-300"
                >
                  Faltante
                </Badge>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Volver a editar
            </Button>
            <Button onClick={confirmSubmit} disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar de todas formas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
