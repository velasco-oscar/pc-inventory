import { getGarantias } from "@/actions/garantias";
import { GarantiasTable } from "./garantias-table";

export default async function GarantiasPage() {
  const garantias = await getGarantias();

  return (
    <div className="container mx-auto p-6">
      <GarantiasTable garantias={garantias} />
    </div>
  );
}
