"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearCliente, actualizarCliente, eliminarCliente } from "@/actions/clientes";
import { clienteSchema, type ClienteInput } from "@/lib/validations";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";

type Props = {
  clientes: any[];
};

function ClienteDialog({
  open,
  onOpenChange,
  cliente,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: any;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!cliente;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema) as any,
    defaultValues: cliente || {},
  });

  const onSubmit = (data: ClienteInput) => {
    startTransition(async () => {
      const result = isEditing
        ? await actualizarCliente(cliente.id, data)
        : await crearCliente(data);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEditing ? "Cliente actualizado" : "Cliente creado");
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
          <DialogTitle>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos del cliente" : "Registra un nuevo cliente"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre *</Label>
            <Input {...register("nombre")} placeholder="Nombre completo" />
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

export function ClientesTable({ clientes }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<any>(null);

  const clientesFiltrados = clientes.filter((c) => {
    const texto = `${c.nombre} ${c.email || ""} ${c.telefono || ""}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const handleEliminar = (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar al cliente "${nombre}"?`)) return;
    startTransition(async () => {
      const res = await eliminarCliente(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Cliente eliminado");
        router.refresh();
      }
    });
  };

  const handleEditar = (cliente: any) => {
    setEditando(cliente);
    setDialogOpen(true);
  };

  const handleNuevo = () => {
    setEditando(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""} registrado
            {clientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleNuevo}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
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
            {clientesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              clientesFiltrados.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell>{c.telefono || "—"}</TableCell>
                  <TableCell>{c.email || "—"}</TableCell>
                  <TableCell className="max-w-48 truncate">{c.direccion || "—"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditar(c)}>
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleEliminar(c.id, c.nombre)}
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

      <ClienteDialog
        key={editando?.id || "nuevo"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        cliente={editando}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
