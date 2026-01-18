require('dotenv').config({ path: '.env.local' });

async function testFetch() {
    console.log('--- Testing Fetch to Stripe API (With Version Header) ---');
    try {
        const response = await fetch('https://api.stripe.com/v1/promotion_codes', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Stripe-Version': '2024-06-20'
            },
            body: new URLSearchParams({
                'coupon': 'AFFILIATE40',
                'code': 'CAIOGUEDES'
            })
        });
        const data = await response.json();
        console.log('API Response:', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}
testFetch();
