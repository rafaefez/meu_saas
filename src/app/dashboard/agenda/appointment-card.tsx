"use client";

import { useTransition } from "react";
import { updateAppointmentStatus } from "./actions";

type Appointment = {
  id: string;
  datetime: Date;
  status: string;
  customer: { name: string; phone: string };
  service: { name: string; durationMinutes: number; price: number };
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  confirmado: { bg: "#EAF6F1", text: "#123A33", label: "Confirmado" },
  concluido: { bg: "#E8F0FE", text: "#1D4ED8", label: "Concluído" },
  cancelado: { bg: "#FEF2F2", text: "#B91C1C", label: "Cancelado" },
  faltou: { bg: "#FFF7ED", text: "#C2410C", label: "Faltou" },
};

export default function AppointmentCard({ appt }: { appt: Appointment }) {
  const [isPending, startTransition] = useTransition();
  const style = STATUS_STYLE[appt.status] ?? STATUS_STYLE.confirmado;
  const isFuture = appt.datetime.getTime() > Date.now();

  function whatsappLink() {
    const digits = appt.customer.phone.replace(/\D/g, "");
    const text = encodeURIComponent(
      `Oi ${appt.customer.name.split(" ")[0]}, sobre seu horário de ${appt.service.name} em ${appt.datetime.toLocaleDateString(
        "pt-BR"
      )} às ${appt.datetime.toTimeString().slice(0, 5)}...`
    );
    return `https://wa.me/55${digits}?text=${text}`;
  }

  function handleStatusChange(status: "cancelado" | "concluido" | "confirmado") {
    startTransition(async () => {
      await updateAppointmentStatus(appt.id, status);
    });
  }

  return (
    <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3 gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-neutral-900 truncate">{appt.customer.name}</p>
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: style.bg, color: style.text }}
          >
            {style.label}
          </span>
        </div>
        <p className="text-sm text-neutral-500 truncate">
          {appt.service.name} · {appt.service.durationMinutes}min · R${" "}
          {appt.service.price.toFixed(2)}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className="font-semibold text-neutral-900 text-sm">
          {appt.datetime.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
        </p>
        <p className="text-sm text-neutral-500">{appt.datetime.toTimeString().slice(0, 5)}</p>
      </div>

      <div className="flex flex-col gap-1 flex-shrink-0">
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener"
          className="text-xs text-center px-3 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 whitespace-nowrap"
        >
          WhatsApp
        </a>
        {appt.status === "confirmado" && (
          <div className="flex gap-1">
            {isFuture ? (
              <button
                disabled={isPending}
                onClick={() => handleStatusChange("cancelado")}
                className="text-xs px-2 py-1.5 rounded-lg border border-neutral-200 text-red-600 hover:bg-red-50 flex-1 disabled:opacity-50"
              >
                Cancelar
              </button>
            ) : (
              <button
                disabled={isPending}
                onClick={() => handleStatusChange("concluido")}
                className="text-xs px-2 py-1.5 rounded-lg border border-neutral-200 text-blue-600 hover:bg-blue-50 flex-1 disabled:opacity-50"
              >
                Concluir
              </button>
            )}
          </div>
        )}
        {appt.status === "cancelado" && isFuture && (
          <button
            disabled={isPending}
            onClick={() => handleStatusChange("confirmado")}
            className="text-xs px-2 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
          >
            Reativar
          </button>
        )}
      </div>
    </div>
  );
}
