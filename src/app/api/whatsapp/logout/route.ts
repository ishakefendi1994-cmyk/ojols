import { NextResponse } from 'next/server';

/**
 * Next.js API Proxy to Logout WhatsApp
 * POST /api/whatsapp/logout
 */
export async function POST() {
    try {
        const targetUrl = (process.env.WHATSAPP_SERVICE_URL || "http://localhost:4000").replace(/\/$/, "");
        const authKey = process.env.WHATSAPP_INTERNAL_KEY;

        const response = await fetch(`${targetUrl}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                key: authKey,
            }),
        });

        const resData = await response.json();

        if (!response.ok) {
            return NextResponse.json(resData, { status: response.status });
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error("API WhatsApp Logout Error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
