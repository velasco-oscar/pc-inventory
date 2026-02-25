import { getGastos } from "@/actions/gastos";
import { GastosTable } from "./gastos-table";

export default async function GastosPage() {
  const gastos = await getGastos({});

  return (
    <div className="container mx-auto p-6">
      <GastosTable gastos={gastos} />
    </div>
  );
}
