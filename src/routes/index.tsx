import { createFileRoute } from "@tanstack/react-router";
import { Workbench } from "@/components/workbench";

export const Route = createFileRoute("/")({
  ssr: false,
  component: Home,
});

function Home() {
  return <Workbench />;
}