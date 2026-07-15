import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function AgendaPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { business: true },
  });

  if (!user?.business) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <p className="text-neutral-500 mb-4">
            Você ainda não configurou seu negócio.
          </p>
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

  const appointments = await db.appointment.findMany({
    where: { businessId: user.business.id, datetime: { gte: new Date() } },
    include: { customer: true, service: true },
    orderBy: { datetime: "asc" },
  });

  const linkPublico = `/agendar/${user.business.slug}`;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Agenda</h1>
        <a
          href={linkPublico}
          target="_blank"
          className="text-sm text-neutral-500 underline hover:text-neutral-900"
        >
          Ver link público →
        </a>
      </div>

      {appointments.length === 0 && (
        <div className="border border-dashed border-neutral-300 rounded-xl p-10 text-center text-neutral-400">
          Nenhum agendamento futuro ainda. Compartilhe seu link público com os clientes.
        </div>
      )}

      <div className="space-y-2">
        {appointments.map((appt) => (
          <div
            key={appt.id}
            className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3"
          >
            <div>
              <p className="font-medium text-neutral-900">{appt.customer.name}</p>
              <p className="text-sm text-neutral-500">
                {appt.service.name} · {appt.customer.phone}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-neutral-900">
                {appt.datetime.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
              </p>
              <p className="text-sm text-neutral-500">
                {appt.datetime.toTimeString().slice(0, 5)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
