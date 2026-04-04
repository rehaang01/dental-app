/**
 * Run this ONCE to create login credentials for both doctors.
 *
 * Usage:
 *   node scripts/createUsers.js
 *
 * Set passwords via environment variables before running:
 *   PASS_VANITA=yourpassword PASS_RAJNEESH=yourpassword node scripts/createUsers.js
 *
 * If env vars are not set, secure random passwords will be generated and printed.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma  = require('../lib/prisma');
const crypto  = require('crypto');

function randomPassword() {
  return crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
}

async function main() {
  const SALT_ROUNDS = 12;

  const users = [
    {
      username:    'vanita',
      displayName: 'Dr. Vanita Goenka',
      password:    process.env.PASS_VANITA || randomPassword(),
    },
    {
      username:    'rajneesh',
      displayName: 'Dr. Rajneesh Goenka',
      password:    process.env.PASS_RAJNEESH || randomPassword(),
    },
  ];

  console.log('\n🦷 Goenka\'s Dental — Creating Users\n');

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);

    await prisma.user.upsert({
      where:  { username: u.username },
      update: { passwordHash: hash, displayName: u.displayName },
      create: { username: u.username, displayName: u.displayName, passwordHash: hash },
    });

    console.log(`✅  ${u.displayName}`);
    console.log(`    Username : ${u.username}`);
    console.log(`    Password : ${u.password}`);
    console.log('');
  }

  console.log('✔  Done. Save the passwords above — they are hashed and cannot be recovered.');
  console.log('   To change a password, re-run this script with the new PASS_* env variable.\n');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());