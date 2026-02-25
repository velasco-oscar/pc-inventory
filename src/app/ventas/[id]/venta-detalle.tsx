"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { eliminarVenta } from "@/actions/ventas";
import { formatearMoneda, formatearFecha, METODOS_PAGO } from "@/lib/utils-app";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ArrowLeft, Trash2, User, Calendar, CreditCard, FileText } from "lucide-react";

type Props = {
  venta: any;
};

export function VentaDetalle({ venta }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const getMetodoPagoLabel = (m: string) =>
    METODOS_PAGO.find((mp) => mp.value === m)?.label || m;

  const handleEliminar = () => {
    if (!confirm(`¿Eliminar la venta #${venta.id}?`)) return;
    startTransition(async () => {
      const res = await eliminarVenta(venta.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Venta eliminada");
        router.push("/ventas");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/ventas">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Venta #{venta.id}</h1>
            <p className="text-muted-foreground">
              {formatearFecha(venta.fechaVenta)}
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleEliminar}
          disabled={isPending}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isPending ? "Eliminando..." : "Eliminar"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Cliente</p>
              <p className="font-medium">{venta.cliente?.nombre || "Sin cliente"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Método de Pago</p>
              <p className="font-medium">{getMetodoPagoLabel(venta.metodoPago)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <Badge variant="outline">{venta.tipoVenta}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venta.detalles.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Badge variant="secondary">
                      {d.componenteId ? "Componente" : "Ensamble"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {d.componente
                      ? `${d.componente.marca} ${d.componente.modelo}`
                      : d.ensamble?.nombre || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatearMoneda(d.precioUnitario)}
                  </TableCell>
                  <TableCell className="text-right">{d.cantidad}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatearMoneda(d.precioUnitario * d.cantidad)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-4" />
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatearMoneda(venta.subtotal)}</span>
              </div>
              {venta.descuento > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>Descuento:</span>
                  <span>-{formatearMoneda(venta.descuento)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-primary">{formatearMoneda(venta.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      {venta.notas && (
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{venta.notas}</p>
          </CardContent>
        </Card>
      )}

      {/* Guarantees */}
      {venta.garantias && venta.garantias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Garantías</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venta.garantias.map((g: any) => (
                  <TableRow key={g.id}>
                    <TableCell>
                      {g.componente
                        ? `${g.componente.marca} ${g.componente.modelo}`
                        : g.ensamble?.nombre || "—"}
                    </TableCell>
                    <TableCell>{formatearFecha(g.fechaFin)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{g.estado}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
