import Link from "next/link";
import { getAdminBootstrapData, requireAdminSession } from "@/lib/admin-server";

export default async function AdminHomePage() {
  const [data, session] = await Promise.all([getAdminBootstrapData(), requireAdminSession()]);

  return (
    <main className="space-y-6">
      <section className="rounded-[28px] border border-line/60 bg-panel/70 p-6 shadow-panel">
        <p className="text-xs uppercase tracking-[0.35em] text-mint/70">overview</p>
        <h2 className="mt-3 font-display text-4xl font-extrabold text-cloud">Content control surface</h2>
        <p className="mt-3 max-w-3xl text-cloud/70">
          Role-aware admin access is now live. Viewers can inspect content, editors can mutate places and trips, and admins can manage users and destructive actions.
        </p>
        <div className="mt-5 inline-flex rounded-full border border-line/60 px-4 py-2 text-xs uppercase tracking-[0.24em] text-mint/75">
          active role: {session.user.role}
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-line/60 bg-panel/70 p-5 shadow-panel">
          <div className="text-xs uppercase tracking-[0.24em] text-mint/70">places</div>
          <div className="mt-3 font-display text-5xl font-extrabold">{data.places.length}</div>
        </div>
        <div className="rounded-[24px] border border-line/60 bg-panel/70 p-5 shadow-panel">
          <div className="text-xs uppercase tracking-[0.24em] text-mint/70">trips</div>
          <div className="mt-3 font-display text-5xl font-extrabold">{data.trips.length}</div>
        </div>
        <div className="rounded-[24px] border border-line/60 bg-panel/70 p-5 shadow-panel">
          <div className="text-xs uppercase tracking-[0.24em] text-mint/70">route-enabled</div>
          <div className="mt-3 font-display text-5xl font-extrabold">{data.trips.filter((trip) => trip.routeEnabled).length}</div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {session.user.role !== "viewer" ? (
          <Link href="/admin/places/new" className="rounded-[24px] border border-line/60 bg-panel/70 p-5 shadow-panel transition hover:border-accentBrand/60">
            <div className="text-xs uppercase tracking-[0.24em] text-mint/70">new</div>
            <div className="mt-2 font-display text-2xl font-bold">Create place</div>
          </Link>
        ) : null}
        {session.user.role !== "viewer" ? (
          <Link href="/admin/trips/new" className="rounded-[24px] border border-line/60 bg-panel/70 p-5 shadow-panel transition hover:border-accentBrand/60">
            <div className="text-xs uppercase tracking-[0.24em] text-mint/70">new</div>
            <div className="mt-2 font-display text-2xl font-bold">Create trip</div>
          </Link>
        ) : null}
        {session.user.role === "admin" ? (
          <Link href="/admin/users" className="rounded-[24px] border border-line/60 bg-panel/70 p-5 shadow-panel transition hover:border-accentBrand/60">
            <div className="text-xs uppercase tracking-[0.24em] text-mint/70">access</div>
            <div className="mt-2 font-display text-2xl font-bold">Manage users</div>
          </Link>
        ) : null}
      </section>
    </main>
  );
}
