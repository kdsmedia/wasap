const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Load product data from JSON file
const products = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Event: QR Code generated, scan with WhatsApp
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated, scan it with your WhatsApp mobile app');
});

// Event: WhatsApp client ready
client.on('ready', () => {
    console.log('Client is ready!');
    // Send a welcome message when someone sends the first message
    client.on('message', async (message) => {
        if (message.body.toLowerCase() === 'menu') {
            sendMenu(message);
        } else if (/^[1-5]$/.test(message.body)) {
            handleProductSelection(message);
        } else if (/^[1-5]$/.test(message.body)) {
            handleOptionSelection(message);
        } else if (message.body.startsWith('http') && message.body.split(' ').length === 2) {
            handleOrder(message);
        } else if (message.body === '1') {
            handlePaymentQris(message);
        } else if (message.body === '2') {
            handlePaymentDana(message);
        } else if (message.body.toLowerCase().includes('bukti pembayaran')) {
            message.reply('Terima kasih atas pembayaran Anda. Pesanan Anda sedang diproses.');
        } else {
            message.reply('Ketik "menu" untuk melihat daftar produk.');
        }
    });
});

// Send menu with product options
function sendMenu(message) {
    let reply = 'Selamat datang di ALTOMEDIA! Pilih produk yang Anda inginkan:\n\n';

    products.forEach((product, index) => {
        reply += `${index + 1}. ${product.name} - ${product.description}\n`;
        reply += `   ${product.image}\n`;
    });

    reply += '\nKetik nomor produk untuk melanjutkan.';

    message.reply(reply);
}

// Handle product selection
function handleProductSelection(message) {
    const productId = parseInt(message.body, 10) - 1;
    const product = products[productId];

    let reply = `Anda memilih ${product.name}. Pilih opsi produk:\n\n`;
    product.options.forEach(option => {
        reply += `${option.id}. ${option.name} - Rp${option.price}\n`;
    });

    reply += '\nKetik nomor opsi untuk melanjutkan.';

    message.reply(reply);
}

// Handle option selection
function handleOptionSelection(message) {
    const productId = parseInt(message.body, 10) - 1;
    const product = products[productId];
    const option = product.options.find(o => o.id === parseInt(message.body, 10));
    if (!option) {
        return message.reply('Opsi tidak ditemukan. Ketik "menu" untuk melihat daftar produk.');
    }
    const reply = `Anda telah memilih ${product.name} - ${option.name}. Kirimkan URL/link produk yang Anda beli dan quantity (misalnya: "https://example.com 2").`;

    message.reply(reply);
}

// Handle order details
function handleOrder(message) {
    const [link, quantity] = message.body.split(' ');
    const product = products.find(p => p.options.some(o => o.id == quantity));

    if (!product) {
        return message.reply('Produk tidak ditemukan. Ketik "menu" untuk melihat daftar produk.');
    }

    const option = product.options.find(o => o.id == quantity);
    const totalPrice = option.price * parseInt(quantity, 10);
    const reply = `Total harga: Rp${totalPrice}\n\nPilih metode pembayaran:\n1. QRIS\n2. DANA`;

    message.reply(reply);
}

// Handle QRIS payment
function handlePaymentQris(message) {
    const reply = `Silakan melakukan pembayaran melalui QRIS dengan total harga Rp${totalPrice}.\n\n![QRIS](https://example.com/qris.png)\n\nKirimkan foto bukti pembayaran setelah Anda melakukan pembayaran.`;

    message.reply(reply);
}

// Handle DANA payment
function handlePaymentDana(message) {
    const reply = `Silakan melakukan pembayaran ke akun DANA berikut:\n\nNama: ALTOMEDIA\nNomor DANA: 08123456789\n\nTotal harga: Rp${totalPrice}\n\nKirimkan foto bukti pembayaran setelah Anda melakukan pembayaran.`;

    message.reply(reply);
}

// Initialize WhatsApp client
client.initialize();
