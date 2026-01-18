require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const AFFILIATE_COUPON_ID = 'AFFILIATE40';

async function checkAndCreateCoupon() {
    console.log('🔍 Checking for master coupon:', AFFILIATE_COUPON_ID);

    try {
        const coupon = await stripe.coupons.retrieve(AFFILIATE_COUPON_ID);
        console.log('✅ Coupon exists:', coupon.name, `(${coupon.percent_off}% OFF)`);
    } catch (error) {
        if (error.code === 'resource_missing') {
            console.log('⚠️ Coupon not found. Creating...');
            try {
                const newCoupon = await stripe.coupons.create({
                    id: AFFILIATE_COUPON_ID,
                    name: 'Desconto de Afiliado (40%)',
                    percent_off: 40,
                    duration: 'forever',
                });
                console.log('🎉 Coupon created successfully:', newCoupon.id);
            } catch (createError) {
                console.error('❌ Error creating coupon:', createError.message);
            }
        } else {
            console.error('❌ Error retrieving coupon:', error.message);
        }
    }
}

checkAndCreateCoupon();
