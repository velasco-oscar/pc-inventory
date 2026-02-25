import { getVentas } from "@/actions/ventas";
import { VentasTable } from "./ventas-table";

export default async function VentasPage() {
  const ventas = await getVentas();

  return (
    <div className="container mx-auto p-6">
      <VentasTable ventas={ventas} />
    </div>
  );
}
