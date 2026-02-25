import { notFound } from "next/navigation";
import { getEnsamble } from "@/actions/ensambles";
import { getComponentesDisponibles } from "@/actions/componentes";
import { EnsambleForm } from "@/components/forms/ensamble-form";

export default async function EditarEnsamblePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ensamble, componentesDisponibles] = await Promise.all([
    getEnsamble(parseInt(id)),
    getComponentesDisponibles(),
  ]);

  if (!ensamble) notFound();

  return (
    <div className="container mx-auto p-6">
      <EnsambleForm
        ensamble={ensamble}
        componentesDisponibles={componentesDisponibles}
        componentesActuales={ensamble.componentes}
      />
    </div>
  );
}
