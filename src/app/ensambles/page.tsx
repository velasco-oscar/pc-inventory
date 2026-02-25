import { getEnsambles } from "@/actions/ensambles";
import { EnsamblesTable } from "./ensambles-table";

export default async function EnsamblesPage() {
  const ensambles = await getEnsambles();

  return (
    <div className="container mx-auto p-6">
      <EnsamblesTable ensambles={ensambles} />
    </div>
  );
}
