const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
});

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const user = await db.user.upsert({
    where: { clerkId: 'teste123' },
    update: {},
    create: { clerkId: 'teste123', email: 'teste@teste.com', name: 'Rafael (teste)' },
  });
  console.log('User pronto:', user.id);

  const business = await db.business.upsert({
    where: { slug: 'personal-ricardo' },
    update: {},
    create: {
      name: 'Personal Ricardo Fitness',
      slug: 'personal-ricardo',
      niche: 'personal',
      whatsapp: '11999999999',
      workingHoursStart: '08:00',
      workingHoursEnd: '18:00',
      ownerId: user.id,
    },
  });
  console.log('Business pronto:', business.id);

  const existing = await db.service.findFirst({ where: { businessId: business.id } });
  if (!existing) {
    const service = await db.service.create({
      data: { name: 'Sessão 1h', durationMinutes: 60, price: 80, businessId: business.id },
    });
    console.log('Service criado:', service.id);
  } else {
    console.log('Service já existia:', existing.id);
  }

  console.log('\nPronto! Acesse: http://localhost:3000/agendar/personal-ricardo');
}

main().catch(console.error).finally(() => db.$disconnect());