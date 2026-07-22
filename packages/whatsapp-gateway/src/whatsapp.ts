import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  isJidUser,
  makeCacheableSignalKeyStore,
  WASocket,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

const logger = pino({ level: 'silent' });
const SESSION_DIR = process.env.SESSION_DIR || './sessions';

let sock: WASocket | null = null;
let connectionStatus = false;
let currentQR: string | null = null;

export function isConnected(): boolean {
  return connectionStatus;
}

export function getCurrentQR(): string | null {
  return currentQR;
}

export function getSock(): WASocket | null {
  return sock;
}

export async function initializeWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(path.join(SESSION_DIR));

  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
    printQRInTerminal: true,
    browser: ['Dreamy Life Gateway', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      currentQR = qr;
      console.log('\n=== Scan QR Code Below ===');
      qrcode.generate(qr, { small: true });
      console.log('==========================\n');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`Connection closed. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        setTimeout(() => initializeWhatsApp(), 3000);
      } else {
        connectionStatus = false;
        console.log('Logged out. Please restart and scan QR again.');
      }
    }

    if (connection === 'open') {
      connectionStatus = true;
      currentQR = null;
      console.log('WhatsApp connected successfully!');
    }
  });
}

export async function checkNumberExists(phone: string): Promise<boolean> {
  if (!sock || !connectionStatus) {
    throw new Error('WhatsApp not connected');
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const jid = `${cleanPhone}@s.whatsapp.net`;

  try {
    const result = await sock.onWhatsApp(jid);
    if (!result || result.length === 0) return false;
    const first = result[0];
    return first?.exists === true;
  } catch {
    return false;
  }
}

export async function sendMessage(phone: string, message: string): Promise<string> {
  if (!sock || !connectionStatus) {
    throw new Error('WhatsApp not connected');
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const jid = `${cleanPhone}@s.whatsapp.net`;

  const result = await sock.sendMessage(jid, { text: message });
  return result?.key?.id || 'unknown';
}
