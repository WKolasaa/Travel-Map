import { UserManagement } from "@/components/admin/user-management";
import { getAdminGroups, getAdminUsers, requireMinimumRole } from "@/lib/admin-server";

export default async function AdminUsersPage() {
  const session = await requireMinimumRole("admin");
  const [users, groups] = await Promise.all([getAdminUsers(), getAdminGroups()]);

  return <UserManagement initialUsers={users} initialGroups={groups} currentUserId={session.user.id} />;
}
