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

  client.initialize();
}

async function sendVisitMessage(patient, visit, balanceDue, includeDues) {
  if (!isReady || !client) throw new Error('WhatsApp not ready');

  const numbers = patient.contactNumbers || [];

  let sentTo = null;
  for (const num of numbers) {
    const cleaned = num.replace(/\D/g, '');
    const chatId = `${cleaned}@c.us`;
    try {
      const isRegistered = await client.isRegisteredUser(chatId);
      if (isRegistered) {
        sentTo = chatId;
        break;
      }
    } catch {}
  }

  if (!sentTo) throw new Error('No WhatsApp number found for patient');

  let message = `Hello ${patient.name}! 👋\n\nThank you for visiting us today.\n\n`;

  if (visit.medicinesInstructions) {
    message += `📋 *Instructions & Medicines:*\n${visit.medicinesInstructions}\n\n`;
  }

  if (includeDues && balanceDue > 0) {
    message += `💰 *Payment Reminder:*\nYou have a pending balance of ₹${balanceDue.toFixed(2)}. Kindly clear this at your next visit.\n\n`;
  }

  message += `Take care! 😊\n— Dr. ${visit.doctor}\nGoenka's Dental Care Centre`;

  await client.sendMessage(sentTo, message);
}

module.exports = { initWhatsApp, sendVisitMessage };