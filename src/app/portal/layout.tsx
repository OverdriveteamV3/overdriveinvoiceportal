import AdminMessageDock from "@/components/admin/AdminMessageDock";
import { getAdminSessionProfile } from "@/lib/admin-auth-server";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getAdminSessionProfile();

  return (
    <>
      {children}
      {profile?.role === "master" ? <AdminMessageDock /> : null}
    </>
  );
}
