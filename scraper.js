import fs from 'fs';
import puppeteer from 'puppeteer-core';

/**
 * GOOGLE MAPS WEB SCRAPER (Tanpa API Key / Gratis)
 * 
 * Cara Pakai:
 * 1. install nodejs (jika belum)
 * 2. jalankan: npm install puppeteer-core
 * 3. jalankan: node scraper.js "sekolah di Bangko"
 */

// Cari lokasi Chrome/Edge di Windows secara otomatis
const getBrowserPath = () => {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const path of paths) {
        if (fs.existsSync(path)) return path;
    }
    return null;
};

const keyword = process.argv[2] || "restoran di Bangko";
const maxResults = 50;

async function scrape() {
    const browserPath = getBrowserPath();
    if (!browserPath) {
        console.error("❌ ERROR: Chrome atau Edge tidak ditemukan di PC Anda.");
        console.log("Silakan instal Chrome atau ganti isi variable 'paths' di scraper.js ke lokasi browser Anda.");
        return;
    }

    console.log(`🔎 Memulai pencarian untuk: "${keyword}"...`);
    const browser = await puppeteer.launch({ 
        executablePath: browserPath,
        headless: "new" 
    });
    const page = await browser.newPage();

    // Navigate to Google Maps
    await page.goto(`https://www.google.com/maps/search/${encodeURIComponent(keyword)}`);

    let results = [];
    let lastHeight = 0;

    // Scroll to load results
    let previousResultsCount = 0;
    let scrollRetries = 0;

    while (results.length < maxResults && scrollRetries < 5) {
        // Scroll the results container to the bottom
        await page.evaluate(() => {
            const container = document.querySelector('div[role="feed"]');
            if (container) {
                container.scrollTo(0, container.scrollHeight);
            }
        });

        // Wait for potential loading
        await new Promise(r => setTimeout(r, 3000));

        const items = await page.evaluate(() => {
            const feed = document.querySelector('div[role="feed"]');
            if (!feed) return [];
            
            const elements = feed.querySelectorAll('div[role="article"]');
            return Array.from(elements).map(el => {
                const name = el.querySelector('.fontHeadlineSmall')?.innerText;
                const address = el.querySelector('.fontBodyMedium:nth-child(2)')?.innerText || 
                               el.querySelector('.W4P9ed')?.innerText; // Alternative selector
                const link = el.querySelector('a')?.href;
                
                let lat = null, lng = null;
                if (link) {
                    const match = link.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                    if (match) {
                        lat = parseFloat(match[1]);
                        lng = parseFloat(match[2]);
                    }
                }

                return { name, address, latitude: lat, longitude: lng };
            }).filter(item => item.name);
        });

        results = items;
        console.log(`📦 Terkumpul ${results.length} lokasi...`);

        if (results.length === previousResultsCount) {
            scrollRetries++;
            console.log(`⏳ Sedang mencoba memuat lebih banyak (${scrollRetries}/5)...`);
        } else {
            scrollRetries = 0;
        }
        
        previousResultsCount = results.length;

        // Check if we hit the "End of results"
        const isEnd = await page.evaluate(() => {
            return document.body.innerText.includes("You've reached the end of the list") || 
                   document.body.innerText.includes("Anda telah mencapai akhir daftar");
        });
        if (isEnd) break;
    }

    const fileName = `results_${Date.now()}.json`;
    fs.writeFileSync(fileName, JSON.stringify(results, null, 2));
    
    console.log(`✅ Selesai! ${results.length} lokasi disimpan ke ${fileName}`);
    console.log(`👉 Silakan upload file ini ke Dashboard Admin Anda.`);

    await browser.close();
}

scrape();
