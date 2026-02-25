import { getCategorias } from "@/actions/categorias";
import { getProveedores } from "@/actions/proveedores";
import { ComponenteForm } from "@/components/forms/componente-form";

export default async function NuevoComponentePage() {
  const [categorias, proveedores] = await Promise.all([
    getCategorias(),
    getProveedores(),
  ]);

  return (
    <div className="container mx-auto p-6">
      <ComponenteForm categorias={categorias} proveedores={proveedores} />
    </div>
  );
}
