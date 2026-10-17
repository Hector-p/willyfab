// Prints an ADMIN_PASSWORD_HASH value. Run with the password in the environment so it stays out of shell history:
//   $env:ADMIN_PASSWORD = "..."; npm run hash-password
import { createInterface } from 'node:readline/promises';
import { hashPassword } from '../src/security.ts';

const MIN_LENGTH = 16;

async function readPassword(): Promise<string> {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return await rl.question('Admin password: ');
  } finally {
    rl.close();
  }
}

const password = (await readPassword()).trim();
if (password.length < MIN_LENGTH) {
  console.error(`Use at least ${MIN_LENGTH} characters. 20+ random characters is recommended.`);
  process.exit(1);
}

console.log(hashPassword(password));
