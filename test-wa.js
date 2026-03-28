const fetch = require('node-fetch');

async function testWhatsApp() {
    const phone = "6285157578692"; // GANTI DENGAN NOMOR WA ANDA UNTUK TES
    const message = "Tes OTP OjekKu: Kode Anda adalah 5521. Jangan berikan kode ini kepada siapapun.";

    console.log("-----------------------------------------");
    console.log(`Mencoba mengirim pesan ke: ${phone}...`);

    try {
        const response = await fetch('http://localhost:3000/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, message })
        });

        const result = await response.json();

        if (response.ok) {
            console.log("BERHASIL! ✅");
            console.log("Pesan terkirim ke WhatsApp Anda.");
        } else {
            console.log("GAGAL! ❌");
            console.log("Error:", result.error || result);
        }
    } catch (err) {
        console.error("Terjadi kesalahan saat menghubungi API:", err.message);
    }
    console.log("-----------------------------------------");
}

testWhatsApp();
