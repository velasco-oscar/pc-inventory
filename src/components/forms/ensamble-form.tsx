"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ensambleSchema, type EnsambleInput, type LicenciaInput } from "@/lib/validations";
import { crearEnsamble, actualizarEnsamble } from "@/actions/ensambles";
import {
  formatearMoneda,
  formatearFechaInput,
  BUILD_CHECKLIST,
  ORIGENES,
  TIPOS_LICENCIA,
  MONEDAS,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useTransition, useMemo, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Cpu,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Check,
  CheckCircle2,
  Circle,
  CircuitBoard,
  MemoryStick,
  Monitor,
  HardDrive,
  Plug,
  Box,
  Fan,
  Paperclip,
  KeyRound,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const SLOT_ICONS: Record<string, LucideIcon> = {
  "circuit-board": CircuitBoard,
  "cpu": Cpu,
  "memory-stick": MemoryStick,
  "monitor": Monitor,
  "hard-drive": HardDrive,
  "plug": Plug,
  "box": Box,
  "fan": Fan,
};

function SlotIcon({ name, className }: { name: string; className?: string }) {
  const Icon = SLOT_ICONS[name];
  if (!Icon) return null;
  return <Icon className={className || "h-4 w-4"} />;
}

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
  const [licencias, setLicencias] = useState<LicenciaInput[]>(
    ensamble?.licencias?.map((l: any) => ({
      id: l.id,
      nombre: l.nombre,
      clave: l.clave || "",
      tipo: l.tipo,
      costo: l.costo,
      monedaCompra: l.monedaCompra,
      tipoCambio: l.tipoCambio,
      fechaCompra: l.fechaCompra ? formatearFechaInput(l.fechaCompra) : "",
      fechaExpiracion: l.fechaExpiracion ? formatearFechaInput(l.fechaExpiracion) : "",
      proveedor: l.proveedor || "",
      notas: l.notas || "",
    })) || []
  );
  const [clavesVisibles, setClavesVisibles] = useState<Set<number>>(new Set());

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
    getValues,
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
          licencias: ensamble.licencias?.map((l: any) => ({
            id: l.id,
            nombre: l.nombre,
            clave: l.clave || "",
            tipo: l.tipo,
            costo: l.costo,
            monedaCompra: l.monedaCompra,
            tipoCambio: l.tipoCambio,
            fechaCompra: l.fechaCompra ? formatearFechaInput(l.fechaCompra) : "",
            fechaExpiracion: l.fechaExpiracion ? formatearFechaInput(l.fechaExpiracion) : "",
            proveedor: l.proveedor || "",
            notas: l.notas || "",
          })) || [],
        }
      : {
          estado: "en_proceso",
          costoManoObra: 0,
          fechaEnsamble: formatearFechaInput(new Date()),
          componenteIds: [],
          licencias: [],
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

  const costoLicencias = useMemo(
    () => licencias.reduce((acc, l) => acc + (l.costo || 0) * (l.tipoCambio || 1), 0),
    [licencias]
  );

  const costoTotal = costoComponentes + costoManoObra + costoLicencias;

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

  const toggleComponente = useCallback((id: number) => {
    setComponenteIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((cid) => cid !== id)
        : [...prev, id];
      return next;
    });
  }, []);

  const shallowEqualNumbers = (a: number[] | undefined, b: number[]) => {
    if (!a) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  // Sync form values with local state (avoids watch()+setValue loops)
  useEffect(() => {
    const current = getValues("componenteIds");
    if (!shallowEqualNumbers(current, componenteIds)) {
      setValue("componenteIds", componenteIds, { shouldDirty: true, shouldValidate: false });
    }
  }, [componenteIds, getValues, setValue]);

  useEffect(() => {
    const current = getValues("estado");
    if (current !== estado) {
      setValue("estado", estado as any, { shouldDirty: true, shouldValidate: false });
    }
  }, [estado, getValues, setValue]);

  useEffect(() => {
    const current = getValues("costoManoObra");
    if (current !== costoManoObra) {
      setValue("costoManoObra", costoManoObra, { shouldDirty: true, shouldValidate: false });
    }
  }, [costoManoObra, getValues, setValue]);

  useEffect(() => {
    setValue("licencias", licencias, { shouldDirty: true, shouldValidate: false });
  }, [licencias, setValue]);

  const toggleSeccion = (cat: string) => {
    setSeccionesAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // --- Licencia handlers ---

  const agregarLicencia = () => {
    setLicencias((prev) => [
      ...prev,
      {
        nombre: "",
        clave: "",
        tipo: "software",
        costo: 0,
        monedaCompra: "MXN",
        tipoCambio: 1,
        fechaCompra: formatearFechaInput(new Date()),
        fechaExpiracion: "",
        proveedor: "",
        notas: "",
      },
    ]);
  };

  const eliminarLicencia = (index: number) => {
    setLicencias((prev) => prev.filter((_, i) => i !== index));
  };

  const actualizarLicencia = (index: number, campo: string, valor: any) => {
    setLicencias((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [campo]: valor } : l))
    );
  };

  const toggleClaveVisible = (index: number) => {
    setClavesVisibles((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const copiarClave = (clave: string) => {
    navigator.clipboard.writeText(clave);
    toast.success("Clave copiada al portapapeles");
  };

  const copiarEspecificaciones = () => {
    if (componentesSeleccionados.length === 0) {
      toast.error("No hay componentes seleccionados");
      return;
    }

    // Order to display specs, with custom labels for the listing
    const specOrder: { categoria: string; label: string }[] = [
      { categoria: "Procesador", label: "PROCESADOR" },
      { categoria: "Tarjeta Madre", label: "TARJETA MADRE" },
      { categoria: "RAM", label: "RAM" },
      { categoria: "GPU", label: "GPU" },
      { categoria: "SSD", label: "SSD" },
      { categoria: "HDD", label: "HDD" },
      { categoria: "Fuente de Poder", label: "FUENTE DE PODER" },
      { categoria: "Case/Gabinete", label: "GABINETE" },
      { categoria: "Ventilador/Cooler", label: "VENTILACIÓN" },
    ];

    const lines: string[] = ["ESPECIFICACIONES:"];

    for (const spec of specOrder) {
      const comps = componentesSeleccionados.filter(
        (c: any) => c.categoria?.nombre === spec.categoria
      );
      if (comps.length === 0) continue;

      for (const c of comps) {
        let detail = `${c.marca} ${c.modelo}`;
        // Add capacity info (RAM, SSD, HDD)
        if (c.capacidadValor) {
          detail += ` ${c.capacidadValor}${c.capacidadUnidad || "GB"}`;
        }
        // Add speed info (RAM, Procesador)
        if (c.velocidadValor) {
          detail += ` ${c.velocidadValor}${c.velocidadUnidad || "MHz"}`;
        }
        // Add VRAM (GPU)
        if (c.vramValor) {
          detail += ` ${c.vramValor}${c.vramUnidad || "GB"}`;
        }
        // Add wattage (PSU)
        if (c.potenciaValor) {
          detail += ` ${c.potenciaValor}${c.potenciaUnidad || "W"}`;
        }
        lines.push(`${spec.label}: ${detail}`);
      }
    }

    // Add components not in the standard checklist
    const otrosComps = componentesSeleccionados.filter(
      (c: any) => !specOrder.some((s) => s.categoria === c.categoria?.nombre)
    );
    for (const c of otrosComps) {
      const catLabel = (c.categoria?.nombre || "OTRO").toUpperCase();
      lines.push(`${catLabel}: ${c.marca} ${c.modelo}`);
    }

    // Add licencias (Windows, Office, etc.)
    const licConNombre = licencias.filter((l) => l.nombre);
    if (licConNombre.length > 0) {
      for (const l of licConNombre) {
        const tipoLabel = TIPOS_LICENCIA.find((t) => t.value === l.tipo)?.label?.toUpperCase() || "LICENCIA";
        lines.push(`${tipoLabel}: ${l.nombre}`);
      }
    }

    const texto = lines.join("\n");
    navigator.clipboard.writeText(texto);
    toast.success("Especificaciones copiadas al portapapeles");
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
              <div className="h-[460px] rounded-md border overflow-y-auto">
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
                                <SlotIcon name={slot.icon} className="h-4 w-4 text-muted-foreground" />
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
                                      <div
                                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border shadow-xs transition-colors ${
                                          seleccionado
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-input"
                                        }`}
                                      >
                                        {seleccionado && (
                                          <Check className="h-3 w-3" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                          {c.marca} {c.modelo}
                                          {c.capacidadValor && (
                                            <span className="ml-1 text-xs text-muted-foreground font-normal">
                                              ({c.capacidadValor} {c.capacidadUnidad || "GB"})
                                            </span>
                                          )}
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
              </div>
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
                      <SlotIcon name={slot.icon} className="h-4 w-4 text-muted-foreground" />
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
                            {c.capacidadValor && (
                              <span className="font-medium"> — {c.capacidadValor} {c.capacidadUnidad || "GB"}</span>
                            )}
                          </p>
                        ))}
                        {/* Show total capacity for categories that have it (RAM, SSD, HDD) */}
                        {["RAM", "SSD", "HDD"].includes(slot.categoria) &&
                          slot.seleccionados.some((c: any) => c.capacidadValor) && (
                            <p className="text-xs font-semibold text-foreground mt-1 pt-1 border-t border-dashed">
                              Total: {(() => {
                                let totalGB = 0;
                                slot.seleccionados.forEach((c: any) => {
                                  if (c.capacidadValor) {
                                    totalGB += c.capacidadUnidad === "TB"
                                      ? c.capacidadValor * 1024
                                      : c.capacidadValor;
                                  }
                                });
                                return totalGB >= 1024
                                  ? `${(totalGB / 1024).toFixed(totalGB % 1024 === 0 ? 0 : 1)} TB`
                                  : `${totalGB} GB`;
                              })()}
                            </p>
                          )}
                      </div>
                    )}
                    {slot.exceedsMax && (
                      <p className="text-xs text-destructive mt-1 ml-6 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Máximo {slot.max} permitido
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
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
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

        {/* ─── Licencias / Claves ─── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Licencias / Claves
                {licencias.length > 0 && (
                  <Badge variant="secondary">{licencias.length}</Badge>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={agregarLicencia}
              >
                <Plus className="mr-1 h-4 w-4" />
                Agregar Licencia
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {licencias.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <KeyRound className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No hay licencias agregadas</p>
                <p className="text-xs mt-1">
                  Agrega licencias de Windows, Office, antivirus, etc.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {licencias.map((lic, index) => (
                  <div
                    key={index}
                    className="rounded-lg border p-4 space-y-3 relative"
                  >
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-xs">
                        {TIPOS_LICENCIA.find((t) => t.value === lic.tipo)?.label || lic.tipo}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => eliminarLicencia(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {/* Nombre */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nombre *</Label>
                        <Input
                          placeholder="ej: Windows 11 Pro"
                          value={lic.nombre}
                          onChange={(e) =>
                            actualizarLicencia(index, "nombre", e.target.value)
                          }
                        />
                      </div>

                      {/* Tipo */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tipo</Label>
                        <Select
                          value={lic.tipo}
                          onValueChange={(v) =>
                            actualizarLicencia(index, "tipo", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_LICENCIA.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Costo */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Costo</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={lic.costo || ""}
                          onChange={(e) =>
                            actualizarLicencia(
                              index,
                              "costo",
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>

                      {/* Moneda + Tipo de cambio */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Moneda</Label>
                        <div className="flex gap-2">
                          <Select
                            value={lic.monedaCompra}
                            onValueChange={(v) => {
                              actualizarLicencia(index, "monedaCompra", v);
                              if (v === "MXN") {
                                actualizarLicencia(index, "tipoCambio", 1);
                              }
                            }}
                          >
                            <SelectTrigger className="w-[100px]">
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
                          {lic.monedaCompra === "USD" && (
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="T/C"
                              value={lic.tipoCambio || ""}
                              onChange={(e) =>
                                actualizarLicencia(
                                  index,
                                  "tipoCambio",
                                  parseFloat(e.target.value) || 1
                                )
                              }
                              className="flex-1"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Clave */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Clave / Serial</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            type={clavesVisibles.has(index) ? "text" : "password"}
                            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                            value={lic.clave || ""}
                            onChange={(e) =>
                              actualizarLicencia(index, "clave", e.target.value)
                            }
                            className="pr-20 font-mono text-sm"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0"
                          onClick={() => toggleClaveVisible(index)}
                        >
                          {clavesVisibles.has(index) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        {lic.clave && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0"
                            onClick={() => copiarClave(lic.clave || "")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Fechas + Proveedor */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Fecha de Compra</Label>
                        <Input
                          type="date"
                          value={lic.fechaCompra || ""}
                          onChange={(e) =>
                            actualizarLicencia(index, "fechaCompra", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Fecha de Expiración</Label>
                        <Input
                          type="date"
                          value={lic.fechaExpiracion || ""}
                          onChange={(e) =>
                            actualizarLicencia(index, "fechaExpiracion", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Proveedor</Label>
                        <Input
                          placeholder="ej: Kingsuin, Microsoft"
                          value={lic.proveedor || ""}
                          onChange={(e) =>
                            actualizarLicencia(index, "proveedor", e.target.value)
                          }
                        />
                      </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Notas</Label>
                      <Input
                        placeholder="Notas adicionales..."
                        value={lic.notas || ""}
                        onChange={(e) =>
                          actualizarLicencia(index, "notas", e.target.value)
                        }
                      />
                    </div>

                    {/* Cost in MXN */}
                    {lic.costo > 0 && (
                      <div className="text-right text-sm text-muted-foreground">
                        Costo MXN:{" "}
                        <span className="font-medium text-foreground">
                          {formatearMoneda((lic.costo || 0) * (lic.tipoCambio || 1))}
                        </span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Total licencias */}
                {licencias.length > 0 && (
                  <div className="flex justify-end pt-2 border-t">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Total licencias: </span>
                      <span className="font-bold">
                        {formatearMoneda(costoLicencias)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

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
              {costoLicencias > 0 && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Licencias: </span>
                  <span className="font-medium">
                    {formatearMoneda(costoLicencias)}
                  </span>
                </div>
              )}
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copiarEspecificaciones}
                disabled={componentesSeleccionados.length === 0}
                title="Copiar especificaciones para publicación"
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                Copiar Specs
              </Button>
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
                <SlotIcon name={slot.icon} className="h-4 w-4 text-amber-600" />
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
