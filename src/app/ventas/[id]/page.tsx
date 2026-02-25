import { notFound } from "next/navigation";
import { getVenta } from "@/actions/ventas";
import { VentaDetalle } from "./venta-detalle";

export default async function VentaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venta = await getVenta(parseInt(id));

  if (!venta) notFound();

  return (
    <div className="container mx-auto p-6">
      <VentaDetalle venta={venta} />
    </div>
  );
}
