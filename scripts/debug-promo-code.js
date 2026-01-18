require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const CODE_TO_CHECK = 'CAIOGUEDES';
const AFFILIATE_COUPON_ID = 'AFFILIATE40';

async function debugPromoCode() {
    console.log(`🔍 Debugging Promotion Code: ${CODE_TO_CHECK}`);

    try {
        // 1. Check for Active Code
        console.log('--- Checking Active Codes ---');
        const active = await stripe.promotionCodes.list({
            code: CODE_TO_CHECK,
            active: true,
            limit: 1
        });

        if (active.data.length > 0) {
            console.log('✅ Active Code FOUND:', active.data[0].id);
        } else {
            console.log('❌ No Active Code found.');
        }

        // 2. Check for Inactive Code
        console.log('\n--- Checking All Codes ---');
        const all = await stripe.promotionCodes.list({
            code: CODE_TO_CHECK,
            limit: 10
        });

        // Manual filter
        const matches = all.data.filter(p => p.code === CODE_TO_CHECK);
        if (matches.length > 0) {
            console.log(`⚠️ Found ${matches.length} matches (Active/Inactive):`);
            matches.forEach(p => console.log(`   - ID: ${p.id} | Active: ${p.active} | Coupon: ${p.coupon.id}`));
        }

        // 3. Attempt Creation
        console.log('\n--- Attempting Creation ---');
        try {
            const newPromo = await stripe.promotionCodes.create({
                coupon: AFFILIATE_COUPON_ID,
                code: CODE_TO_CHECK,
                metadata: { source: 'debug_script' }
            });
            console.log('🎉 Creation SUCCESS:', newPromo.id);
        } catch (error) {
            console.log('❌ Creation FAILED');
            console.log('ERROR_MESSAGE:', error.message);
        }

    } catch (err) {
        console.error('🔥 Critical Error:', err);
    }
}

debugPromoCode();
