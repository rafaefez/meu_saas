"use client";

import { useState, useEffect, useTransition } from "react";
import { getAvailableSlots, createBooking } from "./actions";

type Service = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
};

type Business = {
  id: string;
  name: string;
  whatsapp: string;
};

export default function BookingForm({
  business,
  services,
}: {
  business: Business;
  services: Service[];
}) {
  const [step, setStep] = useState<"service" | "datetime" | "form" | "done">("service");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  // próximos 14 dias como opções de data
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    if (!selectedService || !selectedDate) return;
    setSlots([]);
    getAvailableSlots(business.id, selectedService.id, selectedDate).then(setSlots);
  }, [selectedService, selectedDate, business.id]);

  function handleConfirm() {
    setError("");
    startTransition(async () => {
      const result = await createBooking({
        businessId: business.id,
        serviceId: selectedService!.id,
        dateStr: selectedDate,
        time: selectedTime,
        customerName: name,
        customerPhone: phone,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setStep("done");
      }
    });
  }

  if (step === "done") {
    return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-neutral-200">
        <div className="text-3xl mb-3">✅</div>
        <h2 className="font-semibold text-lg text-neutral-900 mb-1">Agendamento confirmado!</h2>
        <p className="text-neutral-500 text-sm">
          {selectedService?.name} em{" "}
          {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
          })}{" "}
          às {selectedTime}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
      {/* PASSO 1 — SERVIÇO */}
      <div className="p-5 border-b border-neutral-100">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          1. Serviço
        </p>
        <div className="space-y-2">
          {services.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedService(s);
                setSelectedDate("");
                setSelectedTime("");
                setStep("datetime");
              }}
              className={`w-full text-left px-4 py-3 rounded-xl border transition ${
                selectedService?.id === s.id
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 hover:border-neutral-400"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{s.name}</span>
                <span className="text-sm opacity-70">R$ {s.price.toFixed(2)}</span>
              </div>
              <span className="text-xs opacity-60">{s.durationMinutes} min</span>
            </button>
          ))}
        </div>
      </div>

      {/* PASSO 2 — DATA E HORA */}
      {selectedService && (
        <div className="p-5 border-b border-neutral-100">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
            2. Data e horário
          </p>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            {dateOptions.map((d) => {
              const dStr = d.toISOString().slice(0, 10);
              const isSelected = selectedDate === dStr;
              return (
                <button
                  key={dStr}
                  onClick={() => {
                    setSelectedDate(dStr);
                    setSelectedTime("");
                  }}
                  className={`flex-shrink-0 w-14 py-2 rounded-xl border text-center ${
                    isSelected
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200"
                  }`}
                >
                  <div className="text-[10px] uppercase opacity-70">
                    {d.toLocaleDateString("pt-BR", { weekday: "short" })}
                  </div>
                  <div className="font-semibold">{d.getDate()}</div>
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="flex flex-wrap gap-2">
              {slots.length === 0 && (
                <p className="text-sm text-neutral-400">Sem horários livres nesse dia.</p>
              )}
              {slots.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTime(t);
                    setStep("form");
                  }}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    selectedTime === t
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 hover:border-neutral-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PASSO 3 — DADOS DO CLIENTE */}
      {selectedTime && (
        <div className="p-5">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
            3. Seus dados
          </p>
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-neutral-900"
          />
          <input
            type="tel"
            placeholder="WhatsApp (com DDD)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 mb-3 outline-none focus:border-neutral-900"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="w-full bg-neutral-900 text-white rounded-xl py-3 font-medium disabled:opacity-50"
          >
            {isPending ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </div>
      )}
    </div>
  );
}
