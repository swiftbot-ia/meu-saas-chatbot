'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Header from '../components/Header'
import { Check, Users, DollarSign, Wallet, TrendingUp, ShieldCheck, ArrowRight, Sparkles, Star } from 'lucide-react'

export default function PublicAffiliatesPage() {
    const router = useRouter()

    // Intersection Observer for animations
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in')
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.15, rootMargin: '0px 0px -100px 0px' }
        )

        const elements = document.querySelectorAll('.animate-on-scroll')
        elements.forEach((el) => observer.observe(el))

        return () => observer.disconnect()
    }, [])

    return (
        <div className="min-h-screen bg-[#E1DFDB] relative overflow-x-hidden">
            <Header />

            <main className="relative z-10">
                {/* SEÇÃO 1: HERO */}
                <section className="relative min-h-screen md:min-h-[90vh] flex items-center justify-center overflow-visible bg-transparent pb-12 md:pb-20">
                    <div className="absolute inset-0 bg-black rounded-b-[40px] md:rounded-b-[80px] overflow-hidden">
                        {/* Overlay escuro */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />

                        {/* Decorative gradients matching homepage vibe */}
                        <div className="absolute -top-[500px] -right-[500px] w-[1000px] h-[1000px] bg-[#00FF99] opacity-[0.05] blur-[120px] rounded-full pointer-events-none"></div>
                    </div>

                    {/* Hero Content */}
                    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000 pt-32 md:pt-0">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 border border-white/10 rounded-full text-[#00FF99] text-xs font-bold mb-8 backdrop-blur-md uppercase tracking-wider shadow-lg">
                            <Sparkles size={14} className="text-[#00FF99]" />
                            Programa de Parceria Oficial
                        </div>

                        <h1
                            className="text-6xl md:text-8xl font-black text-white mb-8 leading-tight"
                            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                        >
                            Transforme sua influência <br />
                            em <span className="text-[#00FF99]">Renda Recorrente.</span>
                        </h1>

                        <p className="text-lg md:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 leading-relaxed font-light">
                            Ganhe <b>20% de comissão</b> por cada venda realizada. <br />
                            <span className="text-[#00FF99] font-semibold">Quer ganhar 30%?</span> Assine a SwiftBot e turbine seus ganhos automaticamente.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => router.push('/login/register?ref=affiliate_free')}
                                className="px-8 py-4 bg-white/10 text-white rounded-full font-medium text-base transition-all duration-300 hover:bg-white/20 backdrop-blur-sm border border-white/10 flex items-center justify-center gap-2"
                            >
                                Começar Grátis (20%)
                            </button>

                            <button
                                onClick={() => router.push('/login/register?ref=affiliate_30')}
                                className="px-8 py-4 bg-[#00FF99] text-black rounded-full font-bold text-base transition-all duration-300 hover:scale-105 hover:bg-[#00E88C] shadow-[0_0_30px_rgba(0,255,153,0.3)] flex items-center justify-center gap-2"
                            >
                                Assinar e Ganhar 30%
                                <ArrowRight size={18} />
                            </button>
                        </div>

                        <p className="mt-8 text-sm text-gray-500 font-light">
                            * Upgrade automático assim que sua assinatura é ativada.
                        </p>
                    </div>
                </section>

                {/* SEÇÃO 2: COMPARATIVO DE GANHOS (Cards estilo HomePage) */}
                <section className="py-24 bg-[#E1DFDB] relative overflow-hidden">
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
                            <h2 className="text-4xl md:text-6xl font-light text-black mb-6 leading-tight">
                                Escolha como você quer <br />
                                <span className="font-normal text-black">começar a lucrar.</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            {/* Card 20% */}
                            <div className="bg-white/70 backdrop-blur-sm rounded-[32px] p-10 hover:bg-white/80 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10" style={{ transitionDelay: '0ms' }}>
                                <div className="text-gray-500 text-sm font-bold uppercase tracking-widest mb-4">Plano Gratuito</div>
                                <h3 className="text-5xl font-black text-black mb-4">20% <span className="text-xl font-medium text-gray-500">comissão</span></h3>
                                <p className="text-gray-600 leading-relaxed font-light mb-8 text-lg">
                                    Ideal para quem quer começar sem investimento inicial. Você recebe 20% de cada venda realizada com seu link.
                                </p>
                                <button
                                    onClick={() => router.push('/login/register?ref=affiliate_free')}
                                    className="w-full py-4 bg-gray-200 hover:bg-gray-300 text-black font-bold rounded-2xl transition-colors"
                                >
                                    Começar Grátis
                                </button>
                            </div>

                            {/* Card 30% */}
                            <div className="bg-black text-white rounded-[32px] p-10 relative overflow-hidden animate-on-scroll opacity-0 translate-y-10" style={{ transitionDelay: '200ms' }}>
                                <div className="absolute top-0 right-0 p-6">
                                    <div className="bg-[#00FF99] text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Recomendado
                                    </div>
                                </div>
                                <div className="text-[#00FF99] text-sm font-bold uppercase tracking-widest mb-4">Cliente SwiftBot</div>
                                <h3 className="text-5xl font-black text-white mb-4">30% <span className="text-xl font-medium text-gray-400">comissão</span></h3>
                                <p className="text-gray-300 leading-relaxed font-light mb-8 text-lg">
                                    Para quem usa e confia. Ao assinar qualquer plano SwiftBot, sua comissão sobe automaticamente para o nível máximo.
                                </p>
                                <button
                                    onClick={() => router.push('/login/register?ref=affiliate_30')}
                                    className="w-full py-4 bg-[#00FF99] hover:bg-[#00E88C] text-black font-bold rounded-2xl transition-colors shadow-[0_0_20px_rgba(0,255,153,0.3)]"
                                >
                                    Assinar e Ganhar 30%
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SEÇÃO 3: BENEFÍCIOS (Estilo HomePage) */}
                <section className="py-24 bg-black rounded-t-[40px] md:rounded-t-[80px] rounded-b-[40px] md:rounded-b-[80px] relative overflow-hidden -mt-1">
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-20 animate-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
                            <h2 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight">
                                Mais que um programa de afiliados. <br />
                                <span className="font-normal bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Uma parceria de verdade.</span>
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {[
                                {
                                    icon: <TrendingUp size={32} className="text-green-400" />,
                                    title: "Escala Ilimitada",
                                    text: "Não há teto de ganhos. Quanto mais você indica, mais você ganha. E com a comissão de 30%, seu ROI é altíssimo.",
                                    gradient: "from-white/10 to-white/5"
                                },
                                {
                                    icon: <Wallet size={32} className="text-blue-400" />,
                                    title: "Pagamento Automático",
                                    text: "Usamos o Stripe Connect. Sua comissão cai direto na sua conta bancária a cada venda, sem burocracia ou pedidos de saque.",
                                    gradient: "from-white/10 to-white/5"
                                },
                                {
                                    icon: <ShieldCheck size={32} className="text-purple-400" />,
                                    title: "Produto Validado",
                                    text: "Venda um software que as empresas realmente precisam. O SwiftBot tem alta retenção, satisfação e NPS.",
                                    gradient: "from-white/10 to-white/5"
                                }
                            ].map((item, idx) => (
                                <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-[32px] p-8 hover:bg-white/10 transition-all duration-500 animate-on-scroll opacity-0 translate-y-10" style={{ transitionDelay: `${idx * 100}ms` }}>
                                    <div className="w-16 h-16 mb-6 rounded-2xl bg-white/5 flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-2xl font-normal text-white mb-4">{item.title}</h3>
                                    <p className="text-gray-400 leading-relaxed font-light">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* SEÇÃO 4: CTA FINAL */}
                <section className="py-32 bg-[#E1DFDB] relative overflow-hidden -mt-1">
                    <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-on-scroll opacity-0 scale-95 transition-all duration-1000">
                        <h2 className="text-5xl md:text-7xl font-light text-black mb-8 leading-tight">
                            Pronto para começar?
                        </h2>
                        <p className="text-xl text-gray-700 max-w-2xl mx-auto mb-12 font-light">
                            Junte-se a centenas de parceiros que estão transformando sua rede de contatos em um negócio lucrativo.
                        </p>

                        <button
                            onClick={() => router.push('/login/register?ref=affiliate_cta')}
                            className="group relative px-12 py-5 bg-black text-white rounded-full font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                        >
                            <span className="relative z-10 text-[#00FF99]">Garantir minha comissão de 30%</span>
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer igual da Home */}
            <footer className="relative z-10 bg-black border-t border-white/10 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-5 gap-12 mb-12">

                        {/* Coluna 1: Logo e descrição */}
                        <div className="md:col-span-2">
                            <div className="flex items-center mb-6">
                                <div className="w-8 h-8 mr-3 flex items-center justify-center">
                                    <svg width="32" height="32" viewBox="0 0 1564 1564" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1001.683,23.139L433.941,727.705C433.941,727.705 414.727,752.657 429.123,757.818C454,766.738 783.43,754.723 771.86,756.415C771.86,756.415 799.555,753.473 791.713,787.082C784.04,819.968 735.527,1088.176 721.925,1130.644C708.323,1173.112 714.745,1159.731 714.745,1159.731C712.575,1159.731 711.288,1182.876 723.478,1185.568C736.204,1188.379 743.209,1188.065 756.911,1174.333C771.677,1159.534 861.262,1028.542 863.24,1028.542L1226.88,546.873C1227.906,548.514 1248.393,525.692 1221.45,522.235M1221.45,522.235L1115.236,520.972L902.566,520.972C902.566,520.972 885.36,525.188 897.567,497.267C909.774,469.345 912.072,456.497 912.072,456.497L1022.331,70.647L1028.875,32.645C1028.875,32.645 1026.615,9.308 1001.808,23.139" fill="#04F5A0" />
                                        <path d="M507.177,1105.829C493.786,1121.663 477.201,1132.121 457.867,1137.955L690.658,1372.989C705.266,1359.456 721.561,1351.518 738.923,1347.115L507.177,1105.829ZM429.844,939.939C485.576,939.939 530.824,985.187 530.824,1040.92C530.824,1096.653 485.576,1141.901 429.844,1141.901C374.111,1141.901 328.863,1096.653 328.863,1040.92C328.863,985.187 374.111,939.939 429.844,939.939ZM429.844,981.253C462.775,981.253 489.511,1007.989 489.511,1040.92C489.511,1073.851 462.775,1100.587 429.844,1100.587C396.912,1100.587 370.176,1073.851 370.176,1040.92C370.176,1007.989 396.912,981.253 429.844,981.253ZM1028.441,1105.372L797.555,1352.091C814.771,1359.117 830.462,1370.383 842.586,1387.319L1073.308,1136.429C1056.017,1130.603 1041.204,1119.974 1028.441,1105.372ZM760.432,1345.038C816.124,1345.076 861.398,1390.3 861.413,1446.019C861.428,1501.752 816.165,1547 760.432,1547C704.699,1547 659.451,1501.752 659.451,1446.019C659.451,1390.286 704.699,1345 760.432,1345.038ZM760.432,1386.352C793.363,1386.352 820.1,1413.088 820.1,1446.019C820.1,1478.951 793.363,1505.687 760.432,1505.687C727.501,1505.687 700.765,1478.951 700.765,1446.019C700.765,1413.088 727.501,1386.352 760.432,1386.352ZM1106.156,939.939C1161.889,939.939 1207.137,985.187 1207.137,1040.92C1207.137,1096.653 1161.889,1141.901 1106.156,1106.156C1050.424,1141.901 1005.176,1096.653 1005.176,1040.92C1005.176,985.187 1050.424,939.939 1106.156,939.939ZM1106.156,981.253C1139.088,981.253 1165.824,1007.989 1165.824,1040.92C1165.824,1073.851 1139.088,1100.587 1106.156,1100.587C1073.225,1100.587 1046.489,1073.851 1046.489,1040.92C1046.489,1007.989 1073.225,981.253 1106.156,981.253Z" fill="#04F5A0" stroke="#04F5A0" strokeWidth="1" />
                                    </svg>
                                </div>
                                <span className="text-xl font-semibold text-white">SwiftBot</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-6 font-light max-w-sm">
                                Clone seu atendimento e escale sua expertise infinitamente.
                                Transforme seu WhatsApp em uma máquina de crescimento autônoma.
                            </p>
                            <div className="flex space-x-4">
                                {/* Social Icons */}
                                <a href="https://www.facebook.com/SwiftBott" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 hover:border-[#00FF99]">
                                    <svg className="w-5 h-5 text-gray-400 hover:text-[#00FF99]" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>
                                <a href="https://www.instagram.com/swiftbot.ia" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all duration-300 hover:border-[#00FF99]">
                                    <svg className="w-5 h-5 text-gray-400 hover:text-[#00FF99]" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Coluna 2: Produto */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Produto</h4>
                            <ul className="space-y-3">
                                <li><a href="/#funcionalidades" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Funcionalidades</a></li>
                                <li><a href="/#segmentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Segmentos</a></li>
                                <li><a href="/pricing" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Preços</a></li>
                            </ul>
                        </div>

                        {/* Coluna 3: Empresa */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Empresa</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Sobre Nós</a></li>
                                <li><a href="/#depoimentos" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Depoimentos</a></li>
                            </ul>
                        </div>

                        {/* Coluna 4: Suporte */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Suporte</h4>
                            <ul className="space-y-3">
                                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Central de Ajuda</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Documentação</a></li>
                                <li><a href="mailto:suporte@swiftbot.com.br" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">suporte@swiftbot.com.br</a></li>
                                <li><a href="https://wa.me/5511915311105" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">(11) 91531-1105</a></li>

                            </ul>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm font-light">
                            © 2025 SwiftBot. Todos os direitos reservados.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-6">
                            <a href="/privacy" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Privacidade</a>
                            <a href="/terms" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Termos de Uso</a>
                            <a href="/cookies" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Política de Cookies/LGPD</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* CSS Global copied from Home */}
            <style jsx global>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }

                .animate-on-scroll {
                    transition-property: opacity, transform;
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                }

                .animate-on-scroll.animate-in {
                    opacity: 1 !important;
                    transform: translate(0, 0) scale(1) !important;
                }
            `}</style>
        </div>
    )
}
