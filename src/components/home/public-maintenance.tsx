import MaintenancePage from "@/components/home/MaintenancePage";
import { isDevSitePreview } from "@/lib/site-preview";
import { isSiteMaintenanceOn } from "@/lib/site-security";

export async function publicMaintenancePage() {
  if (!(await isSiteMaintenanceOn())) return null;
  if (await isDevSitePreview()) return null;
  return <MaintenancePage />;
}
