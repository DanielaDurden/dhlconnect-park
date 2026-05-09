import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getRiffsLevel } from "@/types";

const ROLE_LABEL: Record<string, string> = {
  executive:    "Ejecutivo",
  professional: "Profesional",
  guest:        "Visita",
  admin:        "Administrador",
  client:       "Colaborador",
};

const LEVEL_ICON: Record<string, string> = {
  "Opening Act":  "🎤",
  "Rising Star":  "⭐",
  "Headliner":    "🎸",
  "Rock Legend":  "🏆",
};

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

  const admin = createAdminClient();

  const [{ data: profile }, { data: riffs }] = await Promise.all([
    admin.from("profiles").select("full_name, area, role").eq("id", user.id).single(),
    admin.from("riffs_log").select("action, points, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const totalRiffs = (riffs ?? []).reduce((s: number, r: { points: number }) => s + r.points, 0);
  const riffsInfo = getRiffsLevel(totalRiffs);

  const ACTION_LABEL: Record<string, string> = {
    solidarity_release:  "Liberación solidaria",
    checkin_carpooling:  "Check-in con carpooling",
    early_checkout:      "Liberación anticipada",
    checkin_ontime:      "Check-in a tiempo",
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-xl font-bold text-dhl-dark mb-5">Mi Perfil</h1>

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden mb-5">
        <div className="bg-dhl-yellow px-6 py-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-dhl-dark/10 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-dhl-dark/60" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <div>
            <p className="font-bold text-dhl-dark text-lg leading-tight">
              {profile?.full_name ?? "Usuario"}
            </p>
            <p className="text-dhl-dark/60 text-sm mt-0.5">
              {ROLE_LABEL[profile?.role ?? "client"] ?? "Colaborador"}
            </p>
          </div>
        </div>

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
              <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
            </svg>
            <div>
              <p className="text-xs text-dhl-gray">Área</p>
              <p className="text-sm font-medium text-dhl-dark">{profile?.area ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Riffs card */}
      <div className="bg-dhl-dark rounded-2xl px-5 py-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-dhl-yellow text-xs font-bold uppercase tracking-wide mb-0.5">Mis Riffs</p>
            <p className="text-white text-3xl font-black">{totalRiffs.toLocaleString("es-CL")}</p>
          </div>
          <div className="text-right">
            <p className="text-white text-lg font-bold">{LEVEL_ICON[riffsInfo.level]} {riffsInfo.level}</p>
            <p className="text-white/50 text-xs mt-0.5">
              {riffsInfo.level !== "Rock Legend"
                ? `${(riffsInfo.next - totalRiffs).toLocaleString("es-CL")} Riffs para el siguiente`
                : "Nivel máximo alcanzado"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-dhl-yellow rounded-full transition-all" style={{ width: `${riffsInfo.progress}%` }} />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-white/40">
            <span>0</span>
            <span>{riffsInfo.next.toLocaleString("es-CL")}</span>
          </div>
        </div>

        {/* Levels */}
        <div className="grid grid-cols-4 gap-1 mt-2">
          {(["Opening Act","Rising Star","Headliner","Rock Legend"] as const).map((lvl) => (
            <div key={lvl} className={`text-center rounded-lg py-1.5 ${riffsInfo.level === lvl ? "bg-dhl-yellow/20 border border-dhl-yellow/40" : "opacity-40"}`}>
              <p className="text-[10px] text-white/80 font-semibold leading-tight">{LEVEL_ICON[lvl]}</p>
              <p className="text-[8px] text-white/60 leading-tight mt-0.5">{lvl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Riffs history */}
      {riffs && riffs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-dhl-mid-gray overflow-hidden mb-5">
          <div className="bg-dhl-yellow px-4 py-3">
            <h2 className="text-dhl-dark font-bold text-sm">Historial de Riffs</h2>
          </div>
          <div className="divide-y divide-dhl-mid-gray">
            {riffs.slice(0, 10).map((r: { action: string; points: number; created_at: string }, i: number) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-dhl-dark font-medium">{ACTION_LABEL[r.action] ?? r.action}</p>
                  <p className="text-xs text-dhl-gray">{new Date(r.created_at).toLocaleDateString("es-CL")}</p>
                </div>
                <span className="text-sm font-bold text-green-600">+{r.points}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
