import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

async function handleSignOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, area, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-dhl-dark mb-5">Mi Perfil</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden mb-6">
        {/* Avatar strip */}
        <div className="bg-dhl-yellow px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-dhl-dark/10 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-dhl-dark/60" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-dhl-dark text-lg leading-tight">
              {profile?.full_name ?? "Usuario"}
            </p>
            <p className="text-dhl-dark/60 text-sm mt-0.5">
              {profile?.role === "admin" ? "Administrador" : "Colaborador"}
            </p>
          </div>
        </div>

        {/* Info rows */}
        <div className="divide-y divide-dhl-mid-gray">
          <div className="px-6 py-4 flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-dhl-gray flex-shrink-0" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            <div>
              <p className="text-xs text-dhl-gray">Correo</p>
              <p className="text-sm font-medium text-dhl-dark">{user.email}</p>
            </div>
          </div>

          <div className="px-6 py-4 flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-dhl-gray flex-shrink-0" aria-hidden="true">
              <rect width="18" height="18" x="3" y="3" rx="2"/>
              <path d="M3 9h18"/>
              <path d="M9 21V9"/>
            </svg>
            <div>
              <p className="text-xs text-dhl-gray">Área</p>
              <p className="text-sm font-medium text-dhl-dark">{profile?.area ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout */}
      <form action={handleSignOut}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 border-2 border-dhl-red text-dhl-red font-bold py-3.5 rounded-xl hover:bg-dhl-red hover:text-white transition-all duration-150 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
