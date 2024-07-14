require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// Load products data
const products = require('./products.json');

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    console.log('QR Code received:', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// Welcome message for new messages
client.on('message', async message => {
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

function sendMenu(message) {
    let reply = 'Selamat datang di ALTOMEDIA! Pilih produk yang Anda inginkan:\n\n';

    products.forEach((product, index) => {
        reply += `${index + 1}. ${product.name} - ${product.description}\n`;
        reply += `   ${product.image}\n`;
    });

    reply += '\nKetik nomor produk untuk melanjutkan.';

    message.reply(reply);
}

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

function handlePaymentQris(message) {
    const reply = `Silakan melakukan pembayaran melalui QRIS dengan total harga Rp${totalPrice}.\n\n![QRIS](https://example.com/qris.png)\n\nKirimkan foto bukti pembayaran setelah Anda melakukan pembayaran.`;

    message.reply(reply);
}

function handlePaymentDana(message) {
    const reply = `Silakan melakukan pembayaran ke akun DANA berikut:\n\nNama: ALTOMEDIA\nNomor DANA: 08123456789\n\nTotal harga: Rp${totalPrice}\n\nKirimkan foto bukti pembayaran setelah Anda melakukan pembayaran.`;

    message.reply(reply);
}

client.initialize();

// Start Express server
app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running!');
});
