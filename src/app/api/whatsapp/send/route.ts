import { NextResponse } from 'next/server';

/**
 * Next.js API Proxy to Send WhatsApp Messages
 * POST /api/whatsapp/send
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, message } = body;

        if (!phone || !message) {
            return NextResponse.json({ error: "Missing phone or message" }, { status: 400 });
        }

        const targetUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:4000";
        const authKey = process.env.WHATSAPP_INTERNAL_KEY;

        if (!authKey) {
            console.error("DEBUG: WHATSAPP_INTERNAL_KEY not configured in .env.local");
            return NextResponse.json({ error: "Internal Configuration Error" }, { status: 500 });
        }

        const response = await fetch(`${targetUrl}/send-message`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone,
                message,
                key: authKey,
            }),
        });

        const resData = await response.json();

        if (!response.ok) {
            console.error("DEBUG: WhatsApp Service Error:", resData);
            return NextResponse.json(resData, { status: response.status });
        }

        return NextResponse.json({ success: true, ...resData });

    } catch (err: any) {
        console.error("API WhatsApp Send Error:", err);
        return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
    }
}
