/**
 * Layout específico para Landing Pages
 * Otimizado para conversão e rastreamento de campanhas
 */

import Script from 'next/script'

export const metadata = {
    robots: {
        index: true,
        follow: true,
    },
}

export default function LandingPageLayout({ children }) {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1946279805928418'
    const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-KG57659R'

    return (
        <div className="min-h-screen bg-black">
            {/* Google Tag Manager */}
            {gtmId && (
                <Script
                    id="gtm-script"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                            })(window,document,'script','dataLayer','${gtmId}');
                        `,
                    }}
                />
            )}

            {/* Meta Pixel Script */}
            {pixelId && (
                <>
                    <Script
                        id="meta-pixel"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
                                !function(f,b,e,v,n,t,s)
                                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                                n.queue=[];t=b.createElement(e);t.async=!0;
                                t.src=v;s=b.getElementsByTagName(e)[0];
                                s.parentNode.insertBefore(t,s)}(window, document,'script',
                                'https://connect.facebook.net/en_US/fbevents.js');
                                fbq('init', '${pixelId}');
                                fbq('track', 'PageView');
                            `,
                        }}
                    />
                    <noscript>
                        <img
                            height="1"
                            width="1"
                            style={{ display: 'none' }}
                            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                            alt=""
                        />
                    </noscript>
                </>
            )}

            {/* GTM noscript fallback */}
            {gtmId && (
                <noscript>
                    <iframe
                        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                        height="0"
                        width="0"
                        style={{ display: 'none', visibility: 'hidden' }}
                    />
                </noscript>
            )}

            {children}
        </div>
    )
}
