const { default: makeWASocket, useSingleFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function connectToWhatsApp() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error = Boom).output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Koneksi terputus, mencoba menghubungkan ulang...', shouldReconnect);
            if (shouldReconnect) connectToWhatsApp();
        } else if (connection === 'open') {
            console.log('Bot terhubung ke WhatsApp!');
        }
    });

    sock.ev.on('messages.upsert', async (message) => {
        const msg = message.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (text === 'halo') {
            await sock.sendMessage(from, { text: 'Halo Desu! Ada yang bisa watashi bantu?' });
        } else if (text === 'menu') {
            await sock.sendMessage(from, { text: 'Ini daftar menu:\n1. halo\n2. info\n3. waktu' });
        } else if (text === 'waktu') {
            const waktu = new Date().toLocaleTimeString();
            await sock.sendMessage(from, { text: `Sekarang pukul: ${waktu}` });
        } else {
            await sock.sendMessage(from, { text: 'Maaf, watashi tidak mengerti perintah itu, Desu!' });
        }
    });
}

connectToWhatsApp();
               
