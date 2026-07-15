"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function checkSlugAvailable(slug: string) {
  if (!slug) return false;
  const existing = await db.business.findUnique({ where: { slug } });
  return !existing;
}

type ServiceInput = { name: string; durationMinutes: number; price: number };

export async function createBusiness(data: {
  name: string;
  niche: string;
  whatsapp: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  slug: string;
  services: ServiceInput[];
}) {
  const { userId } = await auth();
  if (!userId) return { error: "Você precisa estar logado." };

  if (!data.name.trim() || !data.whatsapp.trim() || !data.slug.trim()) {
    return { error: "Preencha nome do negócio, WhatsApp e o link." };
  }
  const validServices = data.services.filter((s) => s.name.trim() && s.price > 0);
  if (validServices.length === 0) {
    return { error: "Adicione pelo menos 1 serviço com nome e preço." };
  }

  const slugTaken = await db.business.findUnique({ where: { slug: data.slug } });
  if (slugTaken) {
    return { error: "Esse link já está em uso. Escolha outro." };
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${userId}@sememail.com`;

  const user = await db.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: { clerkId: userId, email },
  });

  const existingBusiness = await db.business.findUnique({ where: { ownerId: user.id } });
  if (existingBusiness) {
    return { error: "Você já tem um negócio cadastrado." };
  }

  await db.business.create({
    data: {
      name: data.name,
      slug: data.slug,
      niche: data.niche,
      whatsapp: data.whatsapp,
      workingHoursStart: data.workingHoursStart,
      workingHoursEnd: data.workingHoursEnd,
      ownerId: user.id,
      services: { create: validServices },
    },
  });

  redirect("/dashboard/agenda");
}
