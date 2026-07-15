"use client";

import { useState, useTransition } from "react";
import { createBusiness } from "./actions";
import { slugify } from "@/lib/slugify";

type Service = { name: string; durationMinutes: number; price: number };

const NICHOS = [
  { value: "personal", label: "Personal trainer" },
  { value: "manicure", label: "Manicure / Nail designer" },
  { value: "pilates", label: "Pilates / Estúdio" },
  { value: "clinica", label: "Clínica / Consultório" },
  { value: "salao", label: "Salão de beleza / Barbearia" },
  { value: "outro", label: "Outro" },
];

export default function OnboardingForm() {
  const [name, setName] = useState("");
  const [niche, setNiche] = useState("personal");
  const [whatsapp, setWhatsapp] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [startHour, setStartHour] = useState("08:00");
  const [endHour, setEndHour] = useState("18:00");
  const [services, setServices] = useState<Service[]>([
    { name: "", durationMinutes: 60, price: 0 },
  ]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleNameChange(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function updateService(index: number, field: keyof Service, value: string) {
    setServices((prev) =>
      prev.map((s, i) =>
        i === index
          ? {
              ...s,
              [field]: field === "name" ? value : Number(value) || 0,
            }
          : s
      )
    );
  }

  function addService() {
    setServices((prev) => [...prev, { name: "", durationMinutes: 60, price: 0 }]);
  }

  function removeService(index: number) {
    setServices((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      const result = await createBusiness({
        name,
        niche,
        whatsapp,
        workingHoursStart: startHour,
        workingHoursEnd: endHour,
        slug,
        services,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 space-y-6">
      {/* NOME DO NEGÓCIO */}
      <div>
        <label className="text-sm font-medium text-neutral-700 mb-1 block">
          Nome do negócio
        </label>
        <input
          type="text"
          placeholder="Ex: Personal Ricardo Fitness"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-neutral-900"
        />
      </div>

      {/* NICHO */}
      <div>
        <label className="text-sm font-medium text-neutral-700 mb-1 block">Tipo de negócio</label>
        <select
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-neutral-900 bg-white"
        >
          {NICHOS.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
      </div>

      {/* WHATSAPP */}
      <div>
        <label className="text-sm font-medium text-neutral-700 mb-1 block">
          WhatsApp (com DDD)
        </label>
        <input
          type="tel"
          placeholder="11999999999"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-neutral-900"
        />
      </div>

      {/* LINK PÚBLICO */}
      <div>
        <label className="text-sm font-medium text-neutral-700 mb-1 block">
          Seu link de agendamento
        </label>
        <div className="flex items-center border border-neutral-200 rounded-xl overflow-hidden focus-within:border-neutral-900">
          <span className="pl-4 text-neutral-400 text-sm whitespace-nowrap">/agendar/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugEdited(true);
            }}
            className="w-full py-3 pr-4 outline-none"
          />
        </div>
      </div>

      {/* HORÁRIO DE FUNCIONAMENTO */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1 block">Abre às</label>
          <input
            type="time"
            value={startHour}
            onChange={(e) => setStartHour(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-neutral-900"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-700 mb-1 block">Fecha às</label>
          <input
            type="time"
            value={endHour}
            onChange={(e) => setEndHour(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-4 py-3 outline-none focus:border-neutral-900"
          />
        </div>
      </div>

      {/* SERVIÇOS */}
      <div>
        <label className="text-sm font-medium text-neutral-700 mb-2 block">Seus serviços</label>
        <div className="space-y-3">
          {services.map((service, i) => (
            <div key={i} className="flex gap-2 items-start">
              <input
                type="text"
                placeholder="Nome (ex: Sessão 1h)"
                value={service.name}
                onChange={(e) => updateService(i, "name", e.target.value)}
                className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
              <input
                type="number"
                placeholder="Min"
                value={service.durationMinutes || ""}
                onChange={(e) => updateService(i, "durationMinutes", e.target.value)}
                className="w-16 border border-neutral-200 rounded-xl px-2 py-2 text-sm outline-none focus:border-neutral-900"
              />
              <input
                type="number"
                placeholder="R$"
                value={service.price || ""}
                onChange={(e) => updateService(i, "price", e.target.value)}
                className="w-20 border border-neutral-200 rounded-xl px-2 py-2 text-sm outline-none focus:border-neutral-900"
              />
              {services.length > 1 && (
                <button
                  onClick={() => removeService(i)}
                  className="text-neutral-400 hover:text-red-500 px-2 py-2"
                  type="button"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={addService}
          type="button"
          className="text-sm text-neutral-600 underline mt-2"
        >
          + Adicionar outro serviço
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full bg-neutral-900 text-white rounded-xl py-3 font-medium disabled:opacity-50"
      >
        {isPending ? "Criando..." : "Criar meu negócio"}
      </button>
    </div>
  );
}
