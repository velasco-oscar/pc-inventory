import { getClientes } from "@/actions/clientes";
import { getComponentesDisponibles } from "@/actions/componentes";
import { getEnsamblesDisponibles } from "@/actions/ensambles";
import { VentaForm } from "@/components/forms/venta-form";

export default async function NuevaVentaPage() {
  const [clientes, componentesDisponibles, ensamblesDisponibles] = await Promise.all([
    getClientes(),
    getComponentesDisponibles(),
    getEnsamblesDisponibles(),
  ]);

  return (
    <div className="container mx-auto p-6">
      <VentaForm
        clientes={clientes}
        componentesDisponibles={componentesDisponibles}
        ensamblesDisponibles={ensamblesDisponibles}
      />
    </div>
  );
}
