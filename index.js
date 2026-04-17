const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Creamos el cliente con los argumentos necesarios para servidores gratuitos
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

// Memoria para el control de stickers
const stickerLog = {};

// Mostrar el QR en la terminal/logs
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('--- ESCANEA EL QR ABAJO ---');
});

client.on('ready', () => {
    console.log('✅ BOT ONLINE Y MODERANDO');
});

client.on('message', async msg => {
    const chat = await msg.getChat();
    
    // Solo actuar en grupos
    if (!chat.isGroup) return;

    const authorId = msg.author || msg.from;
    
    // Buscar si el que envió el mensaje es admin
    const chatMember = chat.participants.find(p => p.id._serialized === authorId);
    const isAdmin = chatMember ? (chatMember.isAdmin || chatMember.isSuperAdmin) : false;

    // Si es administrador, ignoramos todas las restricciones
    if (isAdmin) return;

    // --- REGLA 1: ELIMINAR LINKS ---
    if (/(https?:\/\/[^\s]+|www\.[^\s]+)/gi.test(msg.body)) {
        try {
            await msg.delete(true);
            console.log(`🚫 Link eliminado de: ${authorId}`);
        } catch (e) {
            console.log("Error al borrar link (¿el bot es admin?)");
        }
    }

    // --- REGLA 2: LÍMITE DE STICKERS (2 por minuto) ---
    if (msg.type === 'sticker') {
        const now = Date.now();
        if (!stickerLog[authorId]) stickerLog[authorId] = [];
        
        // Limpiar registros de más de 60 segundos
        stickerLog[authorId] = stickerLog[authorId].filter(time => now - time < 60000);

        if (stickerLog[authorId].length >= 2) {
            try {
                await msg.delete(true);
                console.log(`⚠️ Spam de stickers evitado de: ${authorId}`);
            } catch (e) {
                console.log("Error al borrar sticker");
            }
        } else {
            stickerLog[authorId].push(now);
        }
    }
});

// Iniciar el bot
client.initialize();
