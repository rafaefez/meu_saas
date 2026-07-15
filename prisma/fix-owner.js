const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env');
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
});

const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

const ID_REAL_DO_CLERK ='user_3GUh0tOBmOkNfNNASDg588o4qJ3';

async function main() {
  if (!ID_REAL_DO_CLERK.startsWith('user_')) {
    console.log('⚠️  ATENÇÃO: esse ID não começa com "user_" — provavelmente não é o ID real. Confira no Clerk Dashboard antes de continuar.');
    return;
  }

  // Atualiza seu usuário real com o clerkId correto
  const meuUser = await db.user.update({
    where: { email: 'rafael.ferreirac19@gmail.com' },
    data: { clerkId: ID_REAL_DO_CLERK },
  });
  console.log('Seu usuário atualizado:', meuUser.email, '→', meuUser.clerkId);

  // Move o negócio de teste para o seu usuário real
  const business = await db.business.update({
    where: { slug: 'personal-ricardo' },
    data: { ownerId: meuUser.id },
  });
  console.log('Negócio transferido para você:', business.name);

  console.log('\nPronto! Acesse: http://localhost:3000/dashboard/agenda');
}

main().catch(console.error).finally(() => db.$disconnect());