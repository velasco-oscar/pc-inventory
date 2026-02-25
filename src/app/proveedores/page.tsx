import { getProveedores } from "@/actions/proveedores";
import { ProveedoresTable } from "./proveedores-table";

export default async function ProveedoresPage() {
  const proveedores = await getProveedores();

  return (
    <div className="container mx-auto p-6">
      <ProveedoresTable proveedores={proveedores} />
    </div>
  );
}
