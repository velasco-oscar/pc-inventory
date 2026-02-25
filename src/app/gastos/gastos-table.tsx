"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearGasto, eliminarGasto } from "@/actions/gastos";
import { gastoOperativoSchema, type GastoOperativoInput } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatearMoneda, formatearFechaCorta, formatearFechaInput, CATEGORIAS_GASTO } from "@/lib/utils-app";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Trash2, Wallet } from "lucide-react";

type Props = {
  gastos: any[];
};

function GastoDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GastoOperativoInput>({
    resolver: zodResolver(gastoOperativoSchema) as any,
    defaultValues: {
      fecha: formatearFechaInput(new Date()),
      categoria: "otro",
      monto: 0,
    },
  });

  const onSubmit = (data: GastoOperativoInput) => {
    startTransition(async () => {
      const result = await crearGasto(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Gasto registrado");
        reset();
        onOpenChange(false);
        onSuccess();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Gasto Operativo</DialogTitle>
          <DialogDescription>Registra un gasto operativo del negocio</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Concepto *</Label>
            <Input {...register("concepto")} placeholder="Descripción del gasto" />
            {errors.concepto && (
              <p className="text-sm text-destructive">{errors.concepto.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Monto (MXN) *</Label>
              <Input
                type="number"
                step="0.01"
                {...register("monto", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.monto && (
                <p className="text-sm text-destructive">{errors.monto.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Fecha *</Label>
              <Input type="date" {...register("fecha")} />
              {errors.fecha && (
                <p className="text-sm text-destructive">{errors.fecha.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={watch("categoria")}
              onValueChange={(v) => setValue("categoria", v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIAS_GASTO.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea {...register("notas")} placeholder="Notas adicionales..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GastosTable({ gastos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);

  const getCategoriaLabel = (cat: string) =>
    CATEGORIAS_GASTO.find((c) => c.value === cat)?.label || cat;

  const gastosFiltrados = gastos.filter((g) => {
    const matchBusqueda = g.concepto.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaFiltro === "todos" || g.categoria === categoriaFiltro;
    return matchBusqueda && matchCategoria;
  });

  const totalFiltrado = gastosFiltrados.reduce((sum, g) => sum + g.monto, 0);

  const handleEliminar = (id: number) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    startTransition(async () => {
      const res = await eliminarGasto(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Gasto eliminado");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gastos Operativos</h1>
          <p className="text-muted-foreground">
            Total: {formatearMoneda(totalFiltrado)} en {gastosFiltrados.length} gasto
            {gastosFiltrados.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Gasto
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar gasto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {CATEGORIAS_GASTO.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Notas</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gastosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Wallet className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No se encontraron gastos
                </TableCell>
              </TableRow>
            ) : (
              gastosFiltrados.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.concepto}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getCategoriaLabel(g.categoria)}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatearMoneda(g.monto)}
                  </TableCell>
                  <TableCell>{formatearFechaCorta(g.fecha)}</TableCell>
                  <TableCell className="max-w-32 truncate text-sm text-muted-foreground">
                    {g.notas || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleEliminar(g.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <GastoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
