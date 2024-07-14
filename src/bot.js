const fs = require('fs');
const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const products = JSON.parse(fs.readFileSync('./src/products.json', 'utf8'));  // Load product data from JSON file

const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async message => {
    let totalPrice = 0;

    if (message.body.toLowerCase() === 'menu') {
        let reply = 'Selamat datang di ALTOMEDIA! Pilih produk yang Anda inginkan:\n\n';

        products.forEach((product, index) => {
            reply += `${index + 1}. ${product.name} - ${product.description}\n`;
            reply += `   ${product.image}\n`;
        });

        reply += '\nKetik nomor produk untuk melanjutkan.';

        message.reply(reply);
    } else if (/^[1-5]$/.test(message.body)) {
        const productId = parseInt(message.body, 10) - 1;
        const product = products[productId];

        let reply = `Anda memilih ${product.name}. Pilih opsi produk:\n\n`;
        product.options.forEach(option => {
            reply += `${option.id}. ${option.name} - Rp${option.price}\n`;
        });

        reply += '\nKetik nomor opsi untuk melanjutkan.';

        message.reply(reply);
    } else if (/^[1-5]$/.test(message.body) && !isNaN(products[parseInt(message.body, 10) - 1])) {
        const productId = parseInt(message.body, 10) - 1;
        const product = products[productId];
        const reply = `Anda telah memilih ${product.name}. Kirimkan URL/link produk yang Anda beli dan quantity (misalnya: "https://urlkamu.com 2").`;

        message.reply(reply);
    } else if (message.body.startsWith('http') && message.body.split(' ').length === 2) {
        const [link, quantity] = message.body.split(' ');
        const product = products.find(p => p.options.some(o => o.id == quantity));

        if (!product) {
            return message.reply('Produk tidak ditemukan. Ketik "menu" untuk melihat daftar produk.');
        }

        const option = product.options.find(o => o.id == quantity);
        totalPrice = option.price * parseInt(quantity, 10);
        const reply = `Total harga: Rp${totalPrice}\n\nPilih metode pembayaran:\n1. QRIS\n2. DANA`;

        message.reply(reply);
    } else if (message.body === '1') {
        const reply = `Silakan melakukan pembayaran melalui QRIS dengan total harga Rp${totalPrice}.\n\n[QRIS](assets/qris.jpeg)\n\nKirimkan foto bukti pembayaran setelah Anda melakukan pembayaran.`;

        message.reply(reply);
    } else if (message.body === '2') {
        const reply = `Silakan melakukan pembayaran ke akun DANA berikut:\n\nNama: ALTOMEDIA\nNomor DANA: 083872543697\n\nTotal harga: Rp${totalPrice}\n\nKirimkan foto bukti pembayaran setelah Anda melakukan pembayaran.`;

        message.reply(reply);
    } else if (message.body.toLowerCase().includes('bukti pembayaran')) {
        message.reply('Terima kasih atas pembayaran Anda. Pesanan Anda sedang diproses.');
    } else {
        message.reply('Ketik "menu" untuk melihat daftar produk.');
    }
});

client.initialize();
