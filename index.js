require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
app.use(express.json());

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'client', // Your client ID
        dataPath: './session.json' // Path to store session data
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Handle QR Code generation
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code received, scan it with your WhatsApp mobile app.');
});

// Handle client ready event
client.on('ready', () => {
    console.log('Client is ready!');
});

// Handle incoming messages
client.on('message', async (message) => {
    console.log('Received message:', message.body);

    if (message.body.toLowerCase() === 'halo') {
        await message.reply('Halo! Selamat datang di ALTOMEDIA. Ketik "menu" untuk melihat daftar perintah.');
    } else if (message.body.toLowerCase() === 'menu') {
        await message.reply('Menu:\n1. Halo\n2. Info\n3. Produk\nKetik "info" untuk informasi lebih lanjut, atau "produk" untuk melihat produk.');
    } else if (message.body.toLowerCase() === 'info') {
        await message.reply('Ini adalah bot WhatsApp sederhana dari ALTOMEDIA. Ketik "halo" untuk menyapa, "menu" untuk melihat perintah, atau "produk" untuk melihat produk.');
    } else if (message.body.toLowerCase() === 'produk') {
        await message.reply('Daftar Produk:\n1. Produk A\n2. Produk B\n3. Produk C\n4. Produk D\n5. Produk E\nKetik nama produk untuk melihat pilihan.');
    } else if (['produk a', 'produk b', 'produk c', 'produk d', 'produk e'].includes(message.body.toLowerCase())) {
        const product = message.body.toLowerCase().replace('produk ', '').toUpperCase();
        const options = `
            Pilihan untuk Produk ${product}:
            1. Pilihan 1 - Rp 100.000
            2. Pilihan 2 - Rp 150.000
            3. Pilihan 3 - Rp 200.000
            4. Pilihan 4 - Rp 250.000
            5. Pilihan 5 - Rp 300.000
            Kirimkan nomor pilihan (1-5), diikuti dengan URL produk dan quantity.
        `;
        await message.reply(options);
    } else if (message.body.toLowerCase().startsWith('pilihan')) {
        const parts = message.body.split(' ');
        if (parts.length < 3) {
            await message.reply('Format yang benar: Pilihan <nomor> <URL> <quantity>.');
            return;
        }
        const pilihan = parts[1];
        const url = parts[2];
        const quantity = parseInt(parts[3], 10);

        if (quantity < 1) {
            await message.reply('Quantity tidak valid. Harap masukkan quantity yang valid.');
            return;
        }

        let price;
        switch (pilihan) {
            case '1':
                price = 100000;
                break;
            case '2':
                price = 150000;
                break;
            case '3':
                price = 200000;
                break;
            case '4':
                price = 250000;
                break;
            case '5':
                price = 300000;
                break;
            default:
                await message.reply('Pilihan tidak valid. Harap pilih antara 1-5.');
                return;
        }

        const totalPrice = price * quantity;
        await message.reply(`URL Produk: ${url}\nQuantity: ${quantity}\nTotal Harga: Rp ${totalPrice}\n\nKetik "qris" untuk membayar menggunakan QRIS atau "dana" untuk membayar menggunakan DANA.`);
    } else if (message.body.toLowerCase() === 'qris') {
        await message.reply(`Untuk membayar, silakan scan QR Code berikut:\n\n![QRIS](https://example.com/qris-image)\n\nSetelah membayar, kirimkan foto bukti pembayaran.`);
    } else if (message.body.toLowerCase() === 'dana') {
        await message.reply(`Untuk membayar, kirimkan ke DANA dengan informasi berikut:\n\n**Nama:** ALTOMEDIA\n**Nomor:** 0822-2222-3333\n\nTotal Harga: [TOTAL_HARGA]\n\nSetelah membayar, kirimkan foto bukti pembayaran.`);
    } else if (message.body.toLowerCase().startsWith('bukti')) {
        await message.reply('Terima kasih! Bukti pembayaran Anda telah diterima.');
    } else {
        await message.reply('Perintah tidak dikenali. Ketik "menu" untuk melihat daftar perintah.');
    }
});

// Start the client
client.initialize();

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
