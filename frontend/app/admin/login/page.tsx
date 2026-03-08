import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSession } from "@/lib/admin-server";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#16313a_0%,#09131a_45%,#05090d_100%)] px-4 py-12 text-cloud md:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-xs uppercase tracking-[0.35em] text-mint/70">travel map</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-extrabold leading-tight text-cloud md:text-6xl">
            Secure the publishing cockpit before the content model gets any bigger.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-cloud/70 md:text-lg">
            Admin authentication is now backed by persisted PostgreSQL users and role-aware sessions. Viewers, editors, and admins all authenticate through the same signed backend token flow.
          </p>
        </section>
        <AdminLoginForm />
      </div>
    </main>
  );
}
