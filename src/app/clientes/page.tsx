import { getClientes } from "@/actions/clientes";
import { ClientesTable } from "./clientes-table";

export default async function ClientesPage() {
  const clientes = await getClientes();

  return (
    <div className="container mx-auto p-6">
      <ClientesTable clientes={clientes} />
    </div>
  );
}
