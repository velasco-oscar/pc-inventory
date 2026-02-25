"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatearMoneda, formatearFechaCorta, ESTADOS_COMPONENTE } from "@/lib/utils-app";
import { Eye, Pencil, Trash2, Search, FileSpreadsheet, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { eliminarComponente } from "@/actions/componentes";
import { toast } from "sonner";

type Componente = {
  id: number;
  marca: string;
  modelo: string;
  numeroSerie: string | null;
  estado: string;
  costoMxn: number;
  monedaCompra: string;
  fechaCompra: Date | string;
  categoria: { id: number; nombre: string };
  proveedor: { id: number; nombre: string } | null;
};

type Props = {
  componentes: Componente[];
  categorias: { id: number; nombre: string }[];
  proveedores: { id: number; nombre: string }[];
  total: number;
  pages: number;
  currentPage: number;
  filters: {
    estado?: string;
    categoriaId?: number;
    proveedorId?: number;
    busqueda?: string;
  };
};

export function ComponentesTable({
  componentes,
  categorias,
  proveedores,
  total,
  pages,
  currentPage,
  filters,
}: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState(filters.busqueda || "");
  const [isPending, startTransition] = useTransition();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();
    if (filters.estado && key !== "estado") params.set("estado", filters.estado);
    if (filters.categoriaId && key !== "categoriaId") params.set("categoriaId", String(filters.categoriaId));
    if (filters.proveedorId && key !== "proveedorId") params.set("proveedorId", String(filters.proveedorId));
    if (filters.busqueda && key !== "busqueda") params.set("busqueda", filters.busqueda);

    if (value && value !== "todos") params.set(key, value);
    params.set("page", "1");
    router.push(`/componentes?${params.toString()}`);
  };

  const handleSearch = () => {
    updateFilter("busqueda", busqueda);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este componente?")) return;
    startTransition(async () => {
      const result = await eliminarComponente(id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Componente eliminado");
        router.refresh();
      }
    });
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    params.set("tipo", "componentes");
    if (filters.estado) params.set("estado", filters.estado);
    if (filters.categoriaId) params.set("categoriaId", String(filters.categoriaId));
    window.open(`/api/exportar?${params.toString()}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar marca, modelo o serial..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-64"
          />
          <Button variant="outline" size="icon" onClick={handleSearch}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Select
          value={filters.estado || "todos"}
          onValueChange={(v) => updateFilter("estado", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="en_ensamble">En ensamble</SelectItem>
            <SelectItem value="vendido">Vendido</SelectItem>
            <SelectItem value="defectuoso">Defectuoso</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.categoriaId ? String(filters.categoriaId) : "todos"}
          onValueChange={(v) => updateFilter("categoriaId", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.proveedorId ? String(filters.proveedorId) : "todos"}
          onValueChange={(v) => updateFilter("proveedorId", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los proveedores</SelectItem>
            {proveedores.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Categoría</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Costo MXN</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {componentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No se encontraron componentes
                </TableCell>
              </TableRow>
            ) : (
              componentes.map((c) => {
                const estadoInfo = ESTADOS_COMPONENTE[c.estado as keyof typeof ESTADOS_COMPONENTE];
                return (
                  <TableRow key={c.id}>
                    <TableCell>{c.categoria.nombre}</TableCell>
                    <TableCell className="font-medium">{c.marca}</TableCell>
                    <TableCell>{c.modelo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.numeroSerie || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={estadoInfo?.color || ""}>
                        {estadoInfo?.label || c.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatearMoneda(c.costoMxn)}</TableCell>
                    <TableCell className="text-xs">{formatearFechaCorta(c.fechaCompra)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/componentes/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/componentes/${c.id}?editar=true`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(c.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} componente(s) encontrado(s)
        </p>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("page", String(currentPage - 1));
                router.push(`/componentes?${params.toString()}`);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Página {currentPage} de {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= pages}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("page", String(currentPage + 1));
                router.push(`/componentes?${params.toString()}`);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
