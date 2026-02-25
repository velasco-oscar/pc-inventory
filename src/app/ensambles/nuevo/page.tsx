import { getComponentesDisponibles } from "@/actions/componentes";
import { EnsambleForm } from "@/components/forms/ensamble-form";

export default async function NuevoEnsamblePage() {
  const componentesDisponibles = await getComponentesDisponibles();

  return (
    <div className="container mx-auto p-6">
      <EnsambleForm componentesDisponibles={componentesDisponibles} />
    </div>
  );
}
