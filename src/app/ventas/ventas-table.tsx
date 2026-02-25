"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { eliminarVenta } from "@/actions/ventas";
import { formatearMoneda, formatearFechaCorta, METODOS_PAGO } from "@/lib/utils-app";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, MoreHorizontal, Eye, Trash2, ShoppingCart } from "lucide-react";

type Props = {
  ventas: any[];
};

export function VentasTable({ ventas }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");

  const ventasFiltradas = ventas.filter((v) => {
    const texto = `${v.cliente?.nombre || "Sin cliente"} ${v.id} ${v.metodoPago}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const handleEliminar = (id: number) => {
    if (!confirm(`¿Eliminar la venta #${id}? Se restaurarán los estados de componentes/ensambles.`))
      return;
    startTransition(async () => {
      const res = await eliminarVenta(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Venta eliminada");
        router.refresh();
      }
    });
  };

  const getMetodoPagoLabel = (metodo: string) => {
    return METODOS_PAGO.find((m) => m.value === metodo)?.label || metodo;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ventas</h1>
          <p className="text-muted-foreground">
            {ventas.length} venta{ventas.length !== 1 ? "s" : ""} registrada
            {ventas.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/ventas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Nueva Venta
          </Button>
        </Link>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, ID..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ventasFiltradas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No se encontraron ventas
                </TableCell>
              </TableRow>
            ) : (
              ventasFiltradas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono">
                    <Link href={`/ventas/${v.id}`} className="hover:underline">
                      #{v.id}
                    </Link>
                  </TableCell>
                  <TableCell>{v.cliente?.nombre || "Sin cliente"}</TableCell>
                  <TableCell>
                    {v.detalles.length} item{v.detalles.length !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatearMoneda(v.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getMetodoPagoLabel(v.metodoPago)}</Badge>
                  </TableCell>
                  <TableCell>{formatearFechaCorta(v.fechaVenta)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/ventas/${v.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> Ver detalle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleEliminar(v.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
