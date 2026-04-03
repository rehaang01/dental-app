const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let client = null;
let isReady = false;

function initWhatsApp() {
  client = new Client({ authStrategy: new LocalAuth() });

  client.on('qr', (qr) => {
    console.log('\n📱 Scan this QR code with WhatsApp:\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('ready', () => {
    isReady = true;
    console.log('✅ WhatsApp connected!');
  });

  client.on('disconnected', () => {
    isReady = false;
    console.log('❌ WhatsApp disconnected');
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp auth failure:', msg);
  });

  client.initialize();
}

async function sendVisitMessage(patient, visit, balanceDue, includeDues) {
  console.log('\n--- WhatsApp Debug ---');
  console.log('isReady:', isReady, '| client exists:', !!client);

  if (!isReady || !client) throw new Error('WhatsApp not ready');

  const numbers = patient.contactNumbers || [];
  console.log('Raw numbers from DB:', numbers);

  if (numbers.length === 0) throw new Error('Patient has no contact numbers saved');

  // Build the message first
  let message = `Hello ${patient.name}! 👋\n\nThank you for visiting us today.\n\n`;

  if (visit.medicinesInstructions) {
    message += `📋 *Instructions & Medicines:*\n${visit.medicinesInstructions}\n\n`;
  }

  if (includeDues && balanceDue > 0) {
    message += `💰 *Payment Reminder:*\nYou have a pending balance of ₹${balanceDue.toFixed(2)}. Kindly clear this at your next visit.\n\n`;
  }

  message += `Take care! 😊\n— Dr. ${visit.doctor}\nGoenka's Dental Care Centre`;

  // Try each number — attempt to send directly rather than checking isRegisteredUser
  // (isRegisteredUser is unreliable on some whatsapp-web.js versions)
  let lastError = null;

  for (const num of numbers) {
    const cleaned = num.replace(/\D/g, ''); // strip +, spaces, dashes
    const chatId = `${cleaned}@c.us`;
    console.log(`Trying number: "${num}" → cleaned: "${cleaned}" → chatId: "${chatId}"`);

    try {
      await client.sendMessage(chatId, message);
      console.log(`✅ Message sent successfully to ${chatId}`);
      return; // success — exit
    } catch (err) {
      console.log(`❌ Failed to send to ${chatId}:`, err.message);
      lastError = err;
      // continue to next number
    }
  }

  // All numbers failed
  throw new Error(`Could not send to any number. Last error: ${lastError?.message}`);
}

module.exports = { initWhatsApp, sendVisitMessage };