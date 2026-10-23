import dotenv from 'dotenv';
import readline from 'readline';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db';

dotenv.config();

function parseArgs(): { email?: string; password?: string; promptPassword?: boolean } {
  const args = process.argv.slice(2);
  const result: { email?: string; password?: string; promptPassword?: boolean } = {};

  for (const arg of args) {
    if (arg.startsWith('--email=')) {
      result.email = arg.split('=')[1].trim();
    } else if (arg.startsWith('--password=')) {
      result.password = arg.split('=')[1].trim();
    } else if (arg === '--prompt') {
      result.promptPassword = true;
    }
  }

  return result;
}

async function promptForPassword(email: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`Enter new admin password for ${email} (min 8 chars): `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('\n==================================================');
  console.log('       SLUGIFY PRO — ADMIN ACCOUNT BOOTSTRAP       ');
  console.log('==================================================\n');

  const args = parseArgs();
  const email = (args.email || process.env.ADMIN_EMAIL || 'huzaifaahmedary@gmail.com').trim().toLowerCase();

  let password = args.password || process.env.ADMIN_PASSWORD || process.env.ADMIN_RESET_PASSWORD;

  if (!password && process.stdin.isTTY && !process.env.CI) {
    password = await promptForPassword(email);
  }

  if (!password) {
    // Generate a strong, secure temporary passphrase
    const randomHex = crypto.randomBytes(4).toString('hex');
    password = `Admin#Slugify${randomHex}!`;
    console.log(`[!] No password specified. Generated secure credentials:`);
  }

  if (password.length < 8) {
    console.error('[ERROR] Password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    const adminUser = db.resetAdminPassword(email, password);
    const sub = db.getSubscriptionByUserId(adminUser.id);
    const setupKey = db.getAdminSetupKey();

    // Verify hash match
    const verified = bcrypt.compareSync(password, adminUser.passwordHash);
    if (!verified) {
      throw new Error('Hash verification check failed on server.');
    }

    console.log('\n[SUCCESS] Administrator account successfully configured!\n');
    console.log('  ------------------------------------------------');
    console.log(`  Admin Email:     ${adminUser.email}`);
    console.log(`  Password:        ${password}`);
    console.log(`  Role:            ${adminUser.role}`);
    console.log(`  Plan:            ${sub?.plan?.toUpperCase()} (Lifetime / Active)`);
    console.log(`  Email Verified:  ${adminUser.emailVerified}`);
    console.log(`  Server Key:      ${setupKey}`);
    console.log('  ------------------------------------------------\n');
    console.log('You can now log in at http://localhost:3000');
    console.log('1. Click "Sign In" in the top navigation.');
    console.log('2. Enter your Admin Email and Password.');
    console.log('3. Open the top-right user menu and click "Admin Console".\n');
    process.exit(0);
  } catch (err: any) {
    console.error('[ERROR] Failed to setup admin account:', err?.message || err);
    process.exit(1);
  }
}

main();
