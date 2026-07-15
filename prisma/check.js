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

async function main() {
  const users = await db.user.findMany({ include: { business: true } });
  console.log('\n=== USERS NO BANCO ===');
  users.forEach(u => {
    console.log(`- clerkId: ${u.clerkId} | email: ${u.email} | tem negócio: ${u.business ? 'SIM (' + u.business.name + ')' : 'NÃO'}`);
  });
  console.log('\n=== TOTAL:', users.length, 'usuários ===\n');
}

main().catch(console.error).finally(() => db.$disconnect());