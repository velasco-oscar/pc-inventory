"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearProveedor, actualizarProveedor, eliminarProveedor } from "@/actions/proveedores";
import { proveedorSchema, type ProveedorInput } from "@/lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Truck } from "lucide-react";

type Props = {
  proveedores: any[];
};

function ProveedorDialog({
  open,
  onOpenChange,
  proveedor,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proveedor?: any;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!proveedor;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProveedorInput>({
    resolver: zodResolver(proveedorSchema) as any,
    defaultValues: proveedor || {},
  });

  const onSubmit = (data: ProveedorInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await actualizarProveedor(proveedor.id, data)
        : await crearProveedor(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Proveedor actualizado" : "Proveedor creado");
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
          <DialogTitle>{isEditing ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos del proveedor" : "Registra un nuevo proveedor"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input {...register("nombre")} placeholder="Nombre del proveedor" />
            {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Teléfono</Label>
            <Input {...register("telefono")} placeholder="Teléfono" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register("email")} placeholder="correo@ejemplo.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input {...register("direccion")} placeholder="Dirección" />
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
              {isPending ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ProveedoresTable({ proveedores }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<any>(null);

  const proveedoresFiltrados = proveedores.filter((p) => {
    const texto = `${p.nombre} ${p.email || ""} ${p.telefono || ""}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const handleEliminar = (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar al proveedor "${nombre}"?`)) return;
    startTransition(async () => {
      const res = await eliminarProveedor(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Proveedor eliminado");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proveedores</h1>
          <p className="text-muted-foreground">
            {proveedores.length} proveedor{proveedores.length !== 1 ? "es" : ""} registrado
            {proveedores.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => { setEditando(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Proveedor
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar proveedor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proveedoresFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Truck className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No se encontraron proveedores
                </TableCell>
              </TableRow>
            ) : (
              proveedoresFiltrados.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}</TableCell>
                  <TableCell>{p.telefono || "—"}</TableCell>
                  <TableCell>{p.email || "—"}</TableCell>
                  <TableCell className="max-w-48 truncate">{p.direccion || "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditando(p); setDialogOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleEliminar(p.id, p.nombre)}
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

      <ProveedorDialog
        key={editando?.id || "nuevo"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        proveedor={editando}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
