import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        // Authenticate the request via Supabase headers
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing auth header' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Verify Admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized. Must be Admin.' }, { status: 403 });
        }

        const digiflazzUser = process.env.DIGIFLAZZ_USERNAME;
        const digiflazzKey = process.env.DIGIFLAZZ_KEY;

        if (!digiflazzUser || !digiflazzKey) {
            return NextResponse.json({ error: 'Missing Digiflazz credentials in .env' }, { status: 500 });
        }

        // Generate Signature
        const msg = digiflazzUser + digiflazzKey + "depo";
        const sign = crypto.createHash('md5').update(msg).digest('hex');

        // Fetch products from Digiflazz
        const digiflazzResponse = await fetch('https://api.digiflazz.com/v1/price-list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                cmd: "prepaid",
                username: digiflazzUser,
                sign: sign,
            }),
        });

        if (!digiflazzResponse.ok) {
            throw new Error(`Digiflazz API error: ${digiflazzResponse.status}`);
        }

        const result = await digiflazzResponse.json();
        const products = result.data;

        if (!products || !Array.isArray(products)) {
            throw new Error('Invalid response from Digiflazz');
        }

        let processedCount = 0;

        // Preserve markup from existing products
        const { data: existingProducts } = await supabase.from('ppob_products').select('product_code, markup');
        const markupMap = new Map();
        if (existingProducts) {
            existingProducts.forEach((p: any) => markupMap.set(p.product_code, p.markup));
        }

        const allowedCategories = ['Pulsa', 'Data', 'PLN'];
        const filteredProducts = products.filter((p: any) => allowedCategories.includes(p.category));

        const upsertData = filteredProducts.map((p: any) => {
            const existingMarkup = markupMap.get(p.buyer_sku_code) || 0;
            return {
                product_code: p.buyer_sku_code,
                product_name: p.product_name,
                category: p.category.toLowerCase(),
                brand: p.brand.toLowerCase(),
                type: p.type,
                seller_name: p.seller_name,
                provider_price: p.price,
                markup: existingMarkup,
                is_active: p.buyer_product_status && p.seller_product_status,
            };
        });

        // Upsert in batches
        const batchSize = 100;
        for (let i = 0; i < upsertData.length; i += batchSize) {
            const batch = upsertData.slice(i, i + batchSize);
            const { error: upsertError } = await supabase
                .from('ppob_products')
                .upsert(batch, { onConflict: 'product_code' });

            if (upsertError) {
                console.error('Upsert batch error:', upsertError);
                throw upsertError;
            }
            processedCount += batch.length;
        }

        return NextResponse.json({
            message: 'Sync completed successfully',
            processed: processedCount
        });

    } catch (error: any) {
        console.error("Sync error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
