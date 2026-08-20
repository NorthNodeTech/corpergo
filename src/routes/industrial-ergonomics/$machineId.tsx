import { createFileRoute, notFound } from "@tanstack/react-router";
import { IndustrialMachinePage } from "@/features/landing/IndustrialMachinePage";
import { getIndustrialMachine } from "@/features/landing/industrial-machines";
import { publicRouteHead } from "@/lib/seo";

export const Route = createFileRoute("/industrial-ergonomics/$machineId")({
  loader: ({ params }) => {
    const machine = getIndustrialMachine(params.machineId);
    if (!machine) throw notFound();
    return { machine };
  },
  head: ({ params }) => {
    const machine = getIndustrialMachine(params.machineId);
    return publicRouteHead({
      path: `/industrial-ergonomics/${params.machineId}`,
      title: `${machine?.name ?? "Industrial Ergonomics"} - CorpErgo`,
      description:
        machine?.role ??
        "Industrial ergonomics guidance from CorpErgo for correct machine use, posture and workplace assessment.",
    });
  },
  component: MachineGuideRoute,
});

function MachineGuideRoute() {
  const { machine } = Route.useLoaderData();
  return <IndustrialMachinePage machine={machine} />;
}
