import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AppointmentCard from "./appointment-card";
import Link from "next/link";

type Filter = "upcoming" | "today" | "completed" | "canceled" | "all";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "upcoming", label: "Próximos" },
  { value: "today", label: "Hoje" },
  { value: "completed", label: "Concluídos" },
  { value: "canceled", label: "Cancelados" },
  { value: "all", label: "Todos" },
];

function dateLabel(d: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Hoje";
  if (target.getTime() === tomorrow.getTime()) return "Amanhã";
  return d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const filter = (params.status as Filter) || "upcoming";
  const query = params.q?.trim() || "";

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { business: true },
  });

  if (!user?.business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <p className="text-neutral-500 mb-4">Você ainda não configurou seu negócio.</p>
          <a
            href="/dashboard/onboarding"
            className="inline-block bg-neutral-900 text-white rounded-xl px-6 py-3 font-medium"
          >
            Configurar agora
          </a>
        </div>
      </div>
    );
  }

  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const where: any = { businessId: user.business.id };

  if (filter === "upcoming") {
    where.datetime = { gte: now };
    where.status = "confirmado";
  } else if (filter === "today") {
    where.datetime = { gte: todayStart, lte: todayEnd };
  } else if (filter === "completed") {
    where.status = "concluido";
  } else if (filter === "canceled") {
    where.status = "cancelado";
  }
  // "all" não filtra

  if (query) {
    where.customer = { name: { contains: query, mode: "insensitive" } };
  }

  const appointments = await db.appointment.findMany({
    where,
    include: { customer: true, service: true },
    orderBy: { datetime: filter === "completed" || filter === "canceled" ? "desc" : "asc" },
  });

  // Agrupa por dia
  const groups: { label: string; items: typeof appointments }[] = [];
  for (const appt of appointments) {
    const label = dateLabel(appt.datetime);
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push(appt);
  }

  const linkPublico = `/agendar/${user.business.slug}`;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-neutral-900">Agenda</h1>
        <a
          href={linkPublico}
          target="_blank"
          className="text-sm text-neutral-500 underline hover:text-neutral-900"
        >
          Ver link público →
        </a>
      </div>

      {/* FILTROS */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/dashboard/agenda?status=${f.value}${query ? `&q=${query}` : ""}`}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border ${
              filter === f.value
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* BUSCA */}
      <form method="GET" className="mb-6">
        <input type="hidden" name="status" value={filter} />
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nome do cliente..."
          className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-neutral-900"
        />
      </form>

      {/* LISTA */}
      {groups.length === 0 && (
        <div className="border border-dashed border-neutral-300 rounded-xl p-10 text-center text-neutral-400">
          Nenhum agendamento encontrado {query && `para "${query}"`} nesse filtro.
        </div>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">
              {group.label} · {group.items.length}
            </p>
            <div className="space-y-2">
              {group.items.map((appt) => (
                <AppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
