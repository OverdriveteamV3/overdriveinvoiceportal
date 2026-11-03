import MaintenancePage from "@/components/home/MaintenancePage";
import { isSiteMaintenanceOn } from "@/lib/site-security";

export async function publicMaintenancePage() {
  if (!(await isSiteMaintenanceOn())) return null;
  return <MaintenancePage />;
}
