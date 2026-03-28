import { NextResponse } from 'next/server';

/**
 * Next.js API Proxy to Get WhatsApp Status/QR
 * GET /api/whatsapp/status
 */
export async function GET() {
    try {
        const targetUrl = (process.env.WHATSAPP_SERVICE_URL || "http://localhost:4000").replace(/\/$/, "");

        const response = await fetch(`${targetUrl}/qr`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store' // Penting: Jangan biarkan Next.js melakukan cache pada status QR
        });

        const resData = await response.json();

        if (!response.ok) {
            return NextResponse.json(resData, { status: response.status });
        }

        return NextResponse.json(resData);

    } catch (err: any) {
        console.error("API WhatsApp Status Error:", err);
        return NextResponse.json({ error: "Service Down", details: err.message }, { status: 503 });
    }
}
