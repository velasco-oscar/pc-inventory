"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { actualizarEstadoGarantia, eliminarGarantia } from "@/actions/garantias";
import { ESTADOS_GARANTIA, formatearFechaCorta } from "@/lib/utils-app";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Search, MoreHorizontal, Trash2, ShieldCheck, AlertTriangle, XCircle, Printer } from "lucide-react";
import { differenceInDays, isPast } from "date-fns";
import { GarantiaPrint } from "@/components/garantia-print";

type Props = {
  garantias: any[];
};

function getIndicadorVencimiento(fechaFin: Date | string) {
  const fin = typeof fechaFin === "string" ? new Date(fechaFin) : fechaFin;
  const diasRestantes = differenceInDays(fin, new Date());

  if (isPast(fin) || diasRestantes < 0) {
    return {
      color: "text-red-500",
      icon: XCircle,
      label: "Vencida",
      urgencia: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    };
  }
  if (diasRestantes <= 30) {
    return {
      color: "text-yellow-500",
      icon: AlertTriangle,
      label: `${diasRestantes} días`,
      urgencia: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    };
  }
  return {
    color: "text-green-500",
    icon: ShieldCheck,
    label: `${diasRestantes} días`,
    urgencia: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  };
}

export function GarantiasTable({ garantias }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const garantiasFiltradas = garantias.filter((g) => {
    const nombre = g.componente
      ? `${g.componente.marca} ${g.componente.modelo}`
      : g.ensamble?.nombre || "";
    const cliente = g.venta?.cliente?.nombre || "";
    const matchBusqueda = `${nombre} ${cliente}`.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = estadoFiltro === "todos" || g.estado === estadoFiltro;
    return matchBusqueda && matchEstado;
  });

  const handleCambiarEstado = (id: number, estado: string) => {
    startTransition(async () => {
      await actualizarEstadoGarantia(id, estado);
      toast.success("Estado actualizado");
      router.refresh();
    });
  };

  const handleEliminar = (id: number) => {
    if (!confirm("¿Eliminar esta garantía?")) return;
    startTransition(async () => {
      const res = await eliminarGarantia(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Garantía eliminada");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Garantías</h1>
        <p className="text-muted-foreground">
          {garantias.length} garantía{garantias.length !== 1 ? "s" : ""} registrada
          {garantias.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-2xl font-bold">
              {garantias.filter((g) => g.estado === "vigente" && differenceInDays(new Date(g.fechaFin), new Date()) > 30).length}
            </p>
            <p className="text-sm text-muted-foreground">Vigentes</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold">
              {garantias.filter((g) => {
                const dias = differenceInDays(new Date(g.fechaFin), new Date());
                return g.estado === "vigente" && dias >= 0 && dias <= 30;
              }).length}
            </p>
            <p className="text-sm text-muted-foreground">Por vencer (30 días)</p>
          </div>
        </div>
        <div className="rounded-lg border p-4 flex items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-2xl font-bold">
              {garantias.filter((g) => g.estado === "vencida" || (g.estado === "vigente" && isPast(new Date(g.fechaFin)))).length}
            </p>
            <p className="text-sm text-muted-foreground">Vencidas</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por item o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="vigente">Vigente</SelectItem>
            <SelectItem value="vencida">Vencida</SelectItem>
            <SelectItem value="reclamada">Reclamada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Venta</TableHead>
              <TableHead>Inicio</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Restante</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {garantiasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No se encontraron garantías
                </TableCell>
              </TableRow>
            ) : (
              garantiasFiltradas.map((g) => {
                const indicador = getIndicadorVencimiento(g.fechaFin);
                const Icono = indicador.icon;
                const estadoInfo = ESTADOS_GARANTIA[g.estado as keyof typeof ESTADOS_GARANTIA];
                return (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">
                      {g.componente
                        ? `${g.componente.marca} ${g.componente.modelo}`
                        : g.ensamble?.nombre || "—"}
                    </TableCell>
                    <TableCell>{g.venta?.cliente?.nombre || "Sin cliente"}</TableCell>
                    <TableCell className="font-mono">#{g.ventaId}</TableCell>
                    <TableCell>{formatearFechaCorta(g.fechaInicio)}</TableCell>
                    <TableCell>{formatearFechaCorta(g.fechaFin)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Icono className={`h-4 w-4 ${indicador.color}`} />
                        <Badge variant="secondary" className={indicador.urgencia}>
                          {indicador.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={estadoInfo?.color}>
                        {estadoInfo?.label || g.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <GarantiaPrint
                            garantia={g}
                            trigger={
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Printer className="mr-2 h-4 w-4" /> Imprimir Garantía
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuSeparator />
                          {g.estado === "vigente" && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleCambiarEstado(g.id, "reclamada")}
                              >
                                Marcar como Reclamada
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleCambiarEstado(g.id, "vencida")}
                              >
                                Marcar como Vencida
                              </DropdownMenuItem>
                            </>
                          )}
                          {g.estado !== "vigente" && (
                            <DropdownMenuItem
                              onClick={() => handleCambiarEstado(g.id, "vigente")}
                            >
                              Marcar como Vigente
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleEliminar(g.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
