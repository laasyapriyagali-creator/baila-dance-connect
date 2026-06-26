import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BottomTabs } from "@/components/baila/BottomTabs";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/app" || location.pathname === "/app/") {
      throw redirect({ to: "/app/dance" });
    }
  },
  component: AppShell,
});

function AppShell() {
  return (
    <div className="relative mx-auto min-h-[100dvh] max-w-md bg-baila-cream pb-24">
      <Outlet />
      <BottomTabs />
    </div>
  );
}
