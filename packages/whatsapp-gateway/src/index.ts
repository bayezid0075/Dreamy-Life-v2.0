import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import QRCode from 'qrcode';
import { initializeWhatsApp, getSock, isConnected, sendMessage, checkNumberExists, getCurrentQR } from './whatsapp';

const app = express();
const PORT = parseInt(process.env.PORT || '5001', 10);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', connected: isConnected() });
});

// Get connection status
app.get('/auth/status', (_req, res) => {
  res.json({ connected: isConnected() });
});

// QR code page - open in browser to scan
app.get('/qr', async (_req, res) => {
  const qr = getCurrentQR();
  if (!qr) {
    if (isConnected()) {
      return res.send('<html><body><h1>WhatsApp is already connected!</h1></body></html>');
    }
    return res.send('<html><body><h1>No QR code available. Restart the gateway and try again.</h1></body></html>');
  }
  try {
    const pngBuffer = await QRCode.toBuffer(qr, { type: 'png', width: 400 });
    const html = `<!DOCTYPE html>
<html><head><title>Scan WhatsApp QR</title>
<meta http-equiv="refresh" content="5">
<style>body{display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;font-family:sans-serif;background:#111;color:#fff;flex-direction:column}
img{border:8px solid #fff;border-radius:12px}
p{margin-top:20px;font-size:18px}</style></head>
<body><h2>Scan with WhatsApp</h2>
<img src="data:image/png;base64,${pngBuffer.toString('base64')}" />
<p>Page auto-refreshes every 5 seconds</p></body></html>`;
    res.send(html);
  } catch (err: any) {
    res.status(500).send('Error generating QR: ' + err.message);
  }
});

// Check if phone number exists on WhatsApp
app.post('/check-number', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'phone is required' });
    }
    const exists = await checkNumberExists(phone);
    res.json({ phone, exists });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Send OTP message
app.post('/send-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ error: 'phone and otp are required' });
    }
    const message = `Your Dreamy Life verification code is: *${otp}*\n\nThis code expires in 10 minutes. Do not share this code with anyone.`;
    const result = await sendMessage(phone, message);
    res.json({ success: true, phone, messageId: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`WhatsApp Gateway running on port ${PORT}`);
  await initializeWhatsApp();
});
