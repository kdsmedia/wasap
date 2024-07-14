// index.js

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const storeName = "ALTOMEDIA"; // Nama toko

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR code generated. Scan using WhatsApp.');
});

client.on('ready', () => {
    console.log('WhatsApp Bot is ready!');
});

const products = [
    {
        id: 1,
        name: 'Baju',
        description: 'Baju dengan berbagai pilihan warna dan ukuran',
        options: [
            { optionId: 1, description: 'Warna Merah, Ukuran S', price: 50000 },
            { optionId: 2, description: 'Warna Merah, Ukuran M', price: 55000 },
            { optionId: 3, description: 'Warna Biru, Ukuran S', price: 50000 },
            { optionId: 4, description: 'Warna Biru, Ukuran M', price: 55000 }
        ]
    },
    {
        id: 2,
        name: 'Celana',
        description: 'Celana dengan berbagai pilihan warna dan ukuran',
        options: [
            { optionId: 1, description: 'Warna Hitam, Ukuran 30', price: 75000 },
            { optionId: 2, description: 'Warna Hitam, Ukuran 32', price: 80000 },
            { optionId: 3, description: 'Warna Abu-abu, Ukuran 30', price: 75000 },
            { optionId: 4, description: 'Warna Abu-abu, Ukuran 32', price: 80000 }
        ]
    }
];

let order = {};
const welcomedUsers = [];

client.on('message', message => {
    const msg = message.body.toLowerCase();
    const senderNumber = message.from;

    if (!welcomedUsers.includes(senderNumber)) {
        message.reply(`Selamat datang di ${storeName}! Halo! Selamat datang di Toko Kami. Ketik "produk" untuk melihat daftar produk kami.`);
        welcomedUsers.push(senderNumber);
        return;
    }

    if (msg === 'halo') {
        message.reply(`Halo! Selamat datang di ${storeName}! Ketik "produk" untuk melihat daftar produk kami.`);
    } else if (msg === 'produk') {
        let response = `Berikut adalah daftar produk kami di ${storeName}:\n`;
        products.forEach(product => {
            response += `${product.id}. ${product.name}\n`;
        });
        response += 'Ketik "detail <nomor produk>" untuk melihat detail produk.';
        message.reply(response);
    } else if (msg.startsWith('detail ')) {
        const productId = parseInt(msg.split(' ')[1], 10);
        const product = products.find(p => p.id === productId);
        if (product) {
            let response = `Detail Produk:\nNama: ${product.name}\nDeskripsi: ${product.description}\nPilihan:\n`;
            product.options.forEach(option => {
                response += `${option.optionId}. ${option.description} - Rp ${option.price}\n`;
            });
            response += 'Ketik "pilih <nomor produk> <nomor pilihan>" untuk memilih.';
            message.reply(response);
        } else {
            message.reply('Produk tidak ditemukan. Ketik "produk" untuk melihat daftar produk.');
        }
    } else if (msg.startsWith('pilih ')) {
        const [_, productId, optionId] = msg.split(' ');
        const product = products.find(p => p.id === parseInt(productId, 10));
        const option = product ? product.options.find(o => o.optionId === parseInt(optionId, 10)) : null;

        if (product && option) {
            order = { productId: product.id, optionId: option.optionId, price: option.price };
            message.reply(`Anda memilih:\nProduk: ${product.name}\nPilihan: ${option.description}\nHarga: Rp ${option.price}\nSilakan kirim link URL produk.`);
        } else {
            message.reply('Pilihan tidak ditemukan. Ketik "detail <nomor produk>" untuk melihat pilihan produk.');
        }
    } else if (msg.startsWith('http')) {
        if (order.productId && order.optionId) {
            order.url = msg;
            message.reply('Berapa jumlah produk yang ingin Anda pesan? Ketik "jumlah <angka>".');
        } else {
            message.reply('Silakan pilih produk terlebih dahulu dengan mengetik "detail <nomor produk>".');
        }
    } else if (msg.startsWith('jumlah ')) {
        const quantity = parseInt(msg.split(' ')[1], 10);
        if (order.productId && order.optionId && quantity) {
            const totalPrice = order.price * quantity;
            message.reply(`Jumlah: ${quantity}\nTotal Harga: Rp ${totalPrice}\nKetik "bayar qris" atau "bayar dana" untuk memilih metode pembayaran.`);
        } else {
            message.reply('Jumlah tidak valid. Ketik "jumlah <angka>" untuk mengatur jumlah produk.');
        }
    } else if (msg === 'bayar qris') {
        if (order.productId && order.optionId && order.url) {
            const totalPrice = order.price * quantity;
            message.reply(`Silakan lakukan pembayaran melalui QRIS dengan total harga Rp ${totalPrice}.\n` +
                'Gambar QRIS:\n' +
                '![QRIS](https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhL8NzUWehpcLuTU8d8zxR9bFHPQkV8uj-FR0-CWAs35AOy-0YyWZnjL_GI-ZwptJiHk9ZU1nuo5sGFnfkRUEe1e9XqCfN3LRFhru8nfqioFxbqEbkWOmLds9sgYaxsPpp076MKFrpNref0jX37KISaH2c0I5tHs741Hvyrix9Jr1NMuynrPBLd-STNcN0/s408/WhatsApp%20Image%202024-03-31%20at%2005.08.40%20(1).jpeg)\n' + // Ganti dengan URL gambar QRIS Anda
                'Kirimkan foto bukti pembayaran setelah selesai.');
        } else {
            message.reply('Anda belum melengkapi semua informasi. Mohon pastikan Anda sudah memilih produk, memasukkan URL, dan mengatur jumlah.');
        }
    } else if (msg === 'bayar dana') {
        if (order.productId && order.optionId && order.url) {
            const totalPrice = order.price * quantity;
            message.reply(`Silakan lakukan pembayaran melalui DANA dengan total harga Rp ${totalPrice}.\n` +
                'Informasi DANA Admin:\n' +
                'Nama: Admin ALTOMEDIA\n' +
                'Nomor DANA: 083872543697\n' + // Ganti dengan nomor DANA Anda
                'Kirimkan foto bukti pembayaran setelah selesai.');
        } else {
            message.reply('Anda belum melengkapi semua informasi. Mohon pastikan Anda sudah memilih produk, memasukkan URL, dan mengatur jumlah.');
        }
    } else if (msg.startsWith('bukti pembayaran')) {
        message.reply('Terima kasih! Pembayaran Anda telah diterima. Kami akan memproses pesanan Anda dan menghubungi Anda segera.');
        order = {}; // Reset order setelah pembayaran
    } else {
        message.reply(`Perintah tidak dikenal. Ketik "produk" untuk melihat daftar produk atau "halo" untuk menyapa kami.`);
    }
});

app.get('/', (req, res) => {
    res.send('Toko ALTOMEDIA sudah aktif!');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

client.initialize();
