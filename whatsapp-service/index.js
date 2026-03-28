const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const express = require("express");
const cors = require("cors");
const pino = require("pino");
const path = require("path");
const fs = require("fs");
require("dotenv").config();
const AUTH_PATH = path.join(__dirname, 'auth_info_baileys');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const AUTH_KEY = process.env.WHATSAPP_INTERNAL_KEY || "standard_secret_key";

let sock;
let lastQr = null;

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_PATH);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(`DEBUG: Using Baileys v${version.join('.')}, isLatest: ${isLatest}`);

    sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            lastQr = qr;
            console.log("-----------------------------------------");
            console.log("SCAN QR CODE UNTUK KONEK WHATSAPP:");
            qrcode.generate(qr, { small: true });
            console.log("-----------------------------------------");
        }

        if (connection === 'close') {
            lastQr = null;
            const statusCode = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode : 0;
            
            console.log('DEBUG: Connection closed. Status Code:', statusCode);

            if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                console.log('DEBUG: Logged out or session conflict. Clearing session data...');
                if (fs.existsSync(AUTH_PATH)) {
                    fs.rmSync(AUTH_PATH, { recursive: true, force: true });
                }
                setTimeout(connectToWhatsApp, 3000);
            } else {
                console.log('DEBUG: Attempting to reconnect...');
                setTimeout(connectToWhatsApp, 5000);
            }
        } else if (connection === 'open') {
            lastQr = null;
            console.log('DEBUG: WhatsApp Connection Opened Successfully! ✅');
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// API Endpoints
app.get('/qr', (req, res) => {
    if (lastQr) {
        res.json({ qr: lastQr });
    } else {
        res.json({ qr: null, message: sock?.user ? "Connected" : "Initializing" });
    }
});

app.post('/logout', async (req, res) => {
    const { key } = req.body;
    if (key !== AUTH_KEY) return res.status(401).json({ error: "Unauthorized" });

    try {
        if (sock) {
            await sock.logout();
            res.json({ success: true });
        } else {
            res.status(400).json({ error: "Not connected" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
app.post('/send-message', async (req, res) => {
    const { phone, message, key } = req.body;

    if (key !== AUTH_KEY) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    if (!sock || !sock.user) {
        return res.status(503).json({ error: "WhatsApp service not ready" });
    }

    if (!phone || !message) {
        return res.status(400).json({ error: "Missing phone or message" });
    }

    try {
        // Format phone: remove +, and ensure it starts with 62 or other country code
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.slice(1);
        }
        if (!formattedPhone.endsWith('@s.whatsapp.net')) {
            formattedPhone += '@s.whatsapp.net';
        }

        const sentMsg = await sock.sendMessage(formattedPhone, { text: message });
        console.log(`DEBUG: Message sent to ${phone}`);
        res.json({ success: true, messageId: sentMsg.key.id });
    } catch (err) {
        console.error("DEBUG: Failed to send message:", err);
        res.status(500).json({ error: "Failed to send message", details: err.message });
    }
});

app.get('/status', (req, res) => {
    res.json({
        connected: !!(sock && sock.user),
        user: sock?.user || null
    });
});

app.listen(PORT, () => {
    console.log(`DEBUG: WhatsApp Service running on http://localhost:${PORT}`);
    connectToWhatsApp();
});

// Prevent service from crashing
process.on('unhandledRejection', (err) => {
    console.error('CRITICAL: Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});
