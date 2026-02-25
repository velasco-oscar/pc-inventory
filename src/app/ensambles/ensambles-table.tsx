"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { eliminarEnsamble, actualizarEstadoEnsamble } from "@/actions/ensambles";
import { ESTADOS_ENSAMBLE, formatearMoneda, formatearFechaCorta } from "@/lib/utils-app";
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
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Monitor } from "lucide-react";

type Props = {
  ensambles: any[];
};

export function EnsamblesTable({ ensambles }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");

  const ensamblesFiltrados = ensambles.filter((e) => {
    const matchBusqueda = e.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = estadoFiltro === "todos" || e.estado === estadoFiltro;
    return matchBusqueda && matchEstado;
  });

  function calcularCostoTotal(ensamble: any) {
    const costoComponentes = ensamble.componentes.reduce(
      (acc: number, c: any) => acc + (c.costoOriginal * c.tipoCambio),
      0
    );
    return costoComponentes + ensamble.costoManoObra;
  }

  const handleEliminar = (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar el ensamble "${nombre}"?`)) return;
    startTransition(async () => {
      const res = await eliminarEnsamble(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Ensamble eliminado");
        router.refresh();
      }
    });
  };

  const handleCambiarEstado = (id: number, estado: string) => {
    startTransition(async () => {
      await actualizarEstadoEnsamble(id, estado);
      toast.success("Estado actualizado");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ensambles (PCs)</h1>
          <p className="text-muted-foreground">
            {ensambles.length} ensamble{ensambles.length !== 1 ? "s" : ""} registrado
            {ensambles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/ensambles/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Ensamble
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ensamble..."
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
            <SelectItem value="en_proceso">En proceso</SelectItem>
            <SelectItem value="listo">Listo</SelectItem>
            <SelectItem value="vendido">Vendido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Componentes</TableHead>
              <TableHead>Costo Total</TableHead>
              <TableHead>Precio Sugerido</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ensamblesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <Monitor className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No se encontraron ensambles
                </TableCell>
              </TableRow>
            ) : (
              ensamblesFiltrados.map((e) => {
                const estado = ESTADOS_ENSAMBLE[e.estado as keyof typeof ESTADOS_ENSAMBLE];
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <Link href={`/ensambles/${e.id}`} className="hover:underline">
                        {e.nombre}
                      </Link>
                    </TableCell>
                    <TableCell>{e.componentes.length} piezas</TableCell>
                    <TableCell>{formatearMoneda(calcularCostoTotal(e))}</TableCell>
                    <TableCell>
                      {e.precioVentaSugerido
                        ? formatearMoneda(e.precioVentaSugerido)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={estado?.color}>
                        {estado?.label || e.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatearFechaCorta(e.fechaEnsamble)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/ensambles/${e.id}`}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar
                            </Link>
                          </DropdownMenuItem>
                          {e.estado === "en_proceso" && (
                            <DropdownMenuItem
                              onClick={() => handleCambiarEstado(e.id, "listo")}
                            >
                              Marcar como Listo
                            </DropdownMenuItem>
                          )}
                          {e.estado === "listo" && (
                            <DropdownMenuItem
                              onClick={() => handleCambiarEstado(e.id, "en_proceso")}
                            >
                              Regresar a En proceso
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleEliminar(e.id, e.nombre)}
                            disabled={e.estado === "vendido"}
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
