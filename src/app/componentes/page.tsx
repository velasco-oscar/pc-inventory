import { getComponentes } from "@/actions/componentes";
import { getCategorias } from "@/actions/categorias";
import { getProveedores } from "@/actions/proveedores";
import { ComponentesTable } from "./componentes-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function ComponentesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const estado = params.estado || undefined;
  const categoriaId = params.categoriaId ? parseInt(params.categoriaId) : undefined;
  const proveedorId = params.proveedorId ? parseInt(params.proveedorId) : undefined;
  const busqueda = params.busqueda || undefined;
  const origen = params.origen || undefined;
  const page = params.page ? parseInt(params.page) : 1;

  const [{ componentes, total, pages }, categorias, proveedores] = await Promise.all([
    getComponentes({ estado, categoriaId, proveedorId, busqueda, origen, page }),
    getCategorias(),
    getProveedores(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Componentes</h1>
        <Link href="/componentes/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Componente
          </Button>
        </Link>
      </div>

      <ComponentesTable
        componentes={componentes}
        categorias={categorias}
        proveedores={proveedores}
        total={total}
        pages={pages}
        currentPage={page}
        filters={{ estado, categoriaId, proveedorId, busqueda, origen }}
      />
    </div>
  );
}
