const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/google-chrome', // Ruta fija del Docker
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    }
});
// ... resto de tu código de stickers y links ...
client.on('qr', qr => qrcode.generate(qr, {small: true}));
client.on('ready', () => console.log('✅ BOT ONLINE'));
client.initialize();
const stickerLog = {};

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
    console.log('--- QR DETECTADO: ESCANEA AHORA ---');
});

client.on('ready', () => console.log('✅ BOT ONLINE Y VIGILANDO'));

client.on('message', async msg => {
    const chat = await msg.getChat();
    if (!chat.isGroup) return;

    const authorId = msg.author || msg.from;
    const chatMember = chat.participants.find(p => p.id._serialized === authorId);
    const isAdmin = chatMember.isAdmin || chatMember.isSuperAdmin;

    if (isAdmin) return;

    // REGLA: BORRAR LINKS
    if (/(https?:\/\/[^\s]+|www\.[^\s]+)/gi.test(msg.body)) {
        try { await msg.delete(true); } catch (e) { console.log("Error borrando link"); }
    }

    // REGLA: LÍMITE 2 STICKERS POR MINUTO
    if (msg.type === 'sticker') {
        const now = Date.now();
        if (!stickerLog[authorId]) stickerLog[authorId] = [];
        stickerLog[authorId] = stickerLog[authorId].filter(time => now - time < 60000);

        if (stickerLog[authorId].length >= 2) {
            try { await msg.delete(true); } catch (e) { console.log("Error borrando sticker"); }
        } else {
            stickerLog[authorId].push(now);
        }
    }
});

client.initialize();
