import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import NotesEditor from "./notes-editor";

const STATUS_LABEL: Record<string, string> = {
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { business: true },
  });
  if (!user?.business) redirect("/dashboard/onboarding");

  const customer = await db.customer.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { datetime: "desc" },
        include: { service: true, transaction: true },
      },
    },
  });

  if (!customer || customer.businessId !== user.business.id) return notFound();

  const concluidos = customer.appointments.filter((a) => a.status === "concluido").length;
  const totalPago = customer.appointments
    .filter((a) => a.transaction?.status === "pago")
    .reduce((sum, a) => sum + (a.transaction?.amount ?? 0), 0);

  const digits = customer.phone.replace(/\D/g, "");

  return (
    <main className="max-w-2xl mx-auto p-6">
      <a href="/dashboard/clientes" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← Voltar
      </a>

      <div className="flex items-center justify-between mt-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{customer.name}</h1>
          <p className="text-neutral-500 text-sm">{customer.phone}</p>
        </div>
        <a
          href={`https://wa.me/55${digits}`}
          target="_blank"
          rel="noopener"
          className="text-sm px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50"
        >
          WhatsApp
        </a>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">Atendimentos</p>
          <p className="text-xl font-bold text-neutral-900">{concluidos}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">Total pago</p>
          <p className="text-xl font-bold text-neutral-900">R$ {totalPago.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-4 mb-8">
        <NotesEditor customerId={customer.id} initialNotes={customer.notes ?? ""} />
      </div>

      <h2 className="text-sm font-semibold text-neutral-700 mb-3">Histórico de agendamentos</h2>
      <div className="space-y-2">
        {customer.appointments.length === 0 && (
          <p className="text-sm text-neutral-400">Nenhum agendamento ainda.</p>
        )}
        {customer.appointments.map((a) => (
          <div
            key={a.id}
            className="bg-white border border-neutral-200 rounded-xl px-4 py-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-neutral-900 text-sm">{a.service.name}</p>
              <p className="text-xs text-neutral-500">
                {a.datetime.toLocaleDateString("pt-BR")} às {a.datetime.toTimeString().slice(0, 5)}
              </p>
            </div>
            <span className="text-xs text-neutral-500">{STATUS_LABEL[a.status] ?? a.status}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
