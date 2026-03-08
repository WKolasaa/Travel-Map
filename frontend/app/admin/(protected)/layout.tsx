import Link from "next/link";
import { AdminLogoutButton } from "@/components/admin/logout-button";
import { requireAdminSession } from "@/lib/admin-server";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#09131a_0%,#10212c_100%)] text-cloud">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 md:grid-cols-[260px_1fr] md:px-6">
        <aside className="rounded-[28px] border border-line/60 bg-panel/70 p-5 shadow-panel">
          <p className="text-xs uppercase tracking-[0.35em] text-mint/70">admin</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Travel Map CMS</h1>
          <p className="mt-3 rounded-2xl border border-line/60 bg-ink/40 px-4 py-3 text-xs uppercase tracking-[0.2em] text-cloud/65">
            {session.user.name} | {session.user.role}
          </p>
          <p className="mt-3 rounded-2xl border border-line/60 bg-ink/20 px-4 py-3 text-xs text-cloud/60">
            signed in as {session.user.email}
          </p>
          <nav className="mt-8 space-y-3 text-sm">
            <Link href="/admin" className="block rounded-2xl border border-line/60 px-4 py-3 transition hover:border-mint/50">Overview</Link>
            <Link href="/admin/places" className="block rounded-2xl border border-line/60 px-4 py-3 transition hover:border-mint/50">Places</Link>
            <Link href="/admin/trips" className="block rounded-2xl border border-line/60 px-4 py-3 transition hover:border-mint/50">Trips</Link>
            {session.user.role === "admin" ? (
              <Link href="/admin/users" className="block rounded-2xl border border-line/60 px-4 py-3 transition hover:border-mint/50">Users & Groups</Link>
            ) : null}
            <Link href="/" className="block rounded-2xl border border-line/60 px-4 py-3 transition hover:border-mint/50">Back to map</Link>
            <AdminLogoutButton />
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
