"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Retorna os horários livres de um dia, considerando duração do serviço
// e os agendamentos que já existem naquele dia.
export async function getAvailableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string // formato "YYYY-MM-DD"
) {
  const business = await db.business.findUnique({ where: { id: businessId } });
  const service = await db.service.findUnique({ where: { id: serviceId } });
  if (!business || !service) return [];

  const [startH, startM] = business.workingHoursStart.split(":").map(Number);
  const [endH, endM] = business.workingHoursEnd.split(":").map(Number);

  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59`);

  // Domingo fechado no MVP (dia 0) — ajuste depois se o negócio atender domingo
  if (dayStart.getDay() === 0) return [];

  const existing = await db.appointment.findMany({
    where: {
      businessId,
      status: { not: "cancelado" },
      datetime: { gte: dayStart, lte: dayEnd },
    },
    include: { service: true },
  });

  const slots: string[] = [];
  const duration = service.durationMinutes;
  let cursor = new Date(dateStr);
  cursor.setHours(startH, startM, 0, 0);
  const limit = new Date(dateStr);
  limit.setHours(endH, endM, 0, 0);

  const now = new Date();

  while (cursor.getTime() + duration * 60000 <= limit.getTime()) {
    const slotEnd = new Date(cursor.getTime() + duration * 60000);

    const conflict = existing.some((appt) => {
      const apptEnd = new Date(appt.datetime.getTime() + appt.service.durationMinutes * 60000);
      return cursor < apptEnd && slotEnd > appt.datetime;
    });

    if (!conflict && cursor > now) {
      slots.push(cursor.toTimeString().slice(0, 5)); // "HH:MM"
    }

    cursor = new Date(cursor.getTime() + 30 * 60000); // slots a cada 30 min
  }

  return slots;
}

export async function createBooking(data: {
  businessId: string;
  serviceId: string;
  dateStr: string;
  time: string;
  customerName: string;
  customerPhone: string;
}) {
  const { businessId, serviceId, dateStr, time, customerName, customerPhone } = data;

  if (!customerName.trim() || !customerPhone.trim()) {
    return { error: "Preencha nome e telefone." };
  }

  const datetime = new Date(`${dateStr}T${time}:00`);

  // Revalida a disponibilidade no exato momento da confirmação,
  // evitando dois clientes reservarem o mesmo horário ao mesmo tempo.
  const freshSlots = await getAvailableSlots(businessId, serviceId, dateStr);
  if (!freshSlots.includes(time)) {
    return { error: "Esse horário acabou de ser reservado por outra pessoa. Escolha outro." };
  }

  // Busca ou cria o cliente pelo telefone dentro deste negócio
  let customer = await db.customer.findFirst({
    where: { businessId, phone: customerPhone },
  });
  if (!customer) {
    customer = await db.customer.create({
      data: { businessId, name: customerName, phone: customerPhone },
    });
  }

  const service = await db.service.findUnique({ where: { id: serviceId } });

  const appointment = await db.appointment.create({
    data: { businessId, customerId: customer.id, serviceId, datetime, status: "confirmado" },
  });

  await db.transaction.create({
    data: {
      businessId,
      appointmentId: appointment.id,
      amount: service?.price ?? 0,
      status: "pendente",
    },
  });

  revalidatePath("/dashboard/agenda");
  return { success: true };
}
