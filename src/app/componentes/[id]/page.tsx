import { notFound } from "next/navigation";
import { getComponente } from "@/actions/componentes";
import { getCategorias } from "@/actions/categorias";
import { getProveedores } from "@/actions/proveedores";
import { ComponenteForm } from "@/components/forms/componente-form";

export default async function EditarComponentePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [componente, categorias, proveedores] = await Promise.all([
    getComponente(parseInt(id)),
    getCategorias(),
    getProveedores(),
  ]);

  if (!componente) notFound();

  return (
    <div className="container mx-auto p-6">
      <ComponenteForm
        componente={componente}
        categorias={categorias}
        proveedores={proveedores}
      />
    </div>
  );
}
