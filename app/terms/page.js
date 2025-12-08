'use client'
import { useRouter } from 'next/navigation'
// Importação do Header padrão
import Header from '../components/Header'

export default function TermsOfUsePage() {
  const router = useRouter()

  return (
    // Fundo preto
    <div className="min-h-screen bg-black text-gray-700 relative overflow-x-hidden">

      {/* Header Padrão */}
      <Header />

      {/* Main Content */}
      <main className="relative z-10">

        {/* SEÇÃO 1: HERO (FUNDO PRETO) */}
        <section className="py-20 relative overflow-hidden bg-black">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-black/50 to-black" />

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="text-center mb-12">
              <div className="inline-block bg-white/5 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
                <span className="text-gray-300 font-semibold text-sm">Contrato Legal</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-light text-white mb-4 leading-tight">
                Termos de <span className="font-normal bg-gradient-to-r from-[#00FF99] via-[#00E88C] to-[#00D97F] bg-clip-text text-transparent">Uso</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto font-light">
                <strong className="text-black">Última atualização:</strong> 10 de outubro de 2025
              </p>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: CONTEÚDO (FUNDO BEGE) */}
        <section className="py-24 bg-[#E1DFDB] rounded-t-[40px] md:rounded-t-[80px] relative overflow-visible -mt-16 md:-mt-20">
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Card Branco com o conteúdo */}
            <div className="bg-white rounded-3xl p-8 md:p-12">

              <div className="space-y-8 text-gray-700 font-light leading-relaxed">

                {/* Seção 1 */}
                <section>
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    1. Aceitação dos Termos
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      Bem-vindo à <strong className="text-black font-medium">SwiftBot</strong>! Estes Termos de Uso ("Termos") regem seu acesso e uso da nossa
                      plataforma de software como serviço (SaaS) que fornece um assistente de IA para WhatsApp ("Serviço").
                    </p>
                    <p>
                      Ao criar uma conta, acessar ou usar o Serviço, você concorda em se vincular a estes Termos e à nossa
                      <strong className="text-black font-medium"> Política de Privacidade</strong> (disponível em /privacidade).
                      Se você não concorda com estes Termos, não utilize o Serviço.
                    </p>
                  </div>
                </section>

                {/* Seção 2 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    2. Contas, Senhas e Segurança
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      Para usar o Serviço, você deve se registrar e criar uma conta. Você concorda em fornecer
                      informações precisas, atuais e completas durante o processo de registro.
                    </p>
                    <p>
                      Você é o único responsável por manter a confidencialidade de sua senha e conta. Você concorda
                      em notificar imediatamente a SwiftBot sobre qualquer uso não autorizado de sua conta.
                    </p>
                  </div>
                </section>

                {/* Seção 3 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    3. Planos, Pagamentos e Teste Gratuito
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-4">
                    <div className="bg-gray-100 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-2">Período de Teste (Trial)</h3>
                      <p>
                        Oferecemos um período de teste gratuito de 4 (quatro) dias. Durante este período, você pode
                        acessar os recursos do Serviço. Após o término do trial, sua conta será limitada ou suspensa
                        a menos que você forneça um método de pagamento válido e inicie uma assinatura paga.
                      </p>
                    </div>

                    <div className="bg-gray-100 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-2">Assinaturas e Renovações</h3>
                      <p>
                        O Serviço é cobrado com base em uma assinatura (mensal ou anual). As assinaturas são
                        <strong className="text-black font-medium"> renovadas automaticamente</strong> ao final de cada ciclo,
                        a menos que sejam canceladas por você.
                      </p>
                      <p className="mt-2">
                        Utilizamos a <strong className="text-black font-medium">Stripe</strong> para processar todos os pagamentos.
                        Não armazenamos os dados completos do seu cartão de crédito.
                      </p>
                    </div>

                    <div className="bg-gray-100 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-2">Cancelamento</h3>
                      <p>
                        Você pode cancelar sua assinatura a qualquer momento através do painel de controle da sua conta.
                        O cancelamento entrará em vigor ao final do ciclo de faturamento atual.
                        <strong className="text-black font-medium">Não oferecemos reembolsos</strong> por períodos parciais,
                        exceto conforme exigido por lei (como no caso da Lei do Arrependimento nos primeiros 7 dias da compra inicial).
                      </p>
                    </div>
                  </div>
                </section>

                {/* Seção 4 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    4. Uso Aceitável e Restrições
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      Você concorda em usar o Serviço em conformidade com todas as leis aplicáveis,
                      incluindo as políticas do WhatsApp Business. Você <strong className="text-black font-medium">NÃO DEVE</strong> usar o Serviço para:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Enviar SPAM, mensagens em massa não solicitadas ou comunicações ilegais.</li>
                      <li>Transmitir qualquer material que seja assediador, difamatório, obsceno ou ilegal.</li>
                      <li>Violar os direitos de propriedade intelectual de terceiros.</li>
                      <li>Tentar fazer engenharia reversa, descompilar ou desmontar o software da SwiftBot.</li>
                      <li>Distribuir vírus, malware ou qualquer outro código malicioso.</li>
                    </ul>
                  </div>
                </section>

                {/* Seção 5 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    5. Propriedade Intelectual e Conteúdo do Usuário
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-4">
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                      <h4 className="font-semibold text-black mb-2">Propriedade da SwiftBot</h4>
                      <p className="text-sm">
                        O Serviço, incluindo seu software, design, algoritmos de IA, gráficos e marcas registradas ("Propriedade da SwiftBot"),
                        são e permanecerão propriedade exclusiva da SwiftBot e seus licenciadores.
                      </p>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <h4 className="font-semibold text-black mb-2">Propriedade do Usuário (Seus Dados)</h4>
                      <p className="text-sm">
                        Você retém todos os direitos sobre os dados, mensagens e informações que você ou seus clientes
                        (usuários finais do WhatsApp) fornecem ao Serviço ("Conteúdo do Usuário").
                      </p>
                    </div>

                    <div className="bg-gray-100 rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-black mb-2">Licença de Uso para a SwiftBot</h3>
                      <p>
                        Para fornecer o Serviço (especialmente para treinar o agente de IA), você nos concede uma
                        <strong className="text-black font-medium"> licença mundial, não exclusiva, livre de royalties e limitada</strong> para usar,
                        processar, analisar, armazenar e exibir seu Conteúdo do Usuário, estritamente com o propósito de
                        operar, manter e melhorar o Serviço para você.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Seção 6 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    6. Limitação de Responsabilidade
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      O Serviço é fornecido "COMO ESTÁ" (AS IS), sem garantias de qualquer tipo.
                    </p>
                    <p>
                      Na extensão máxima permitida pela lei, a SwiftBot não será responsável por quaisquer danos
                      indiretos, incidentais, especiais, consequenciais ou punitivos, ou qualquer perda de lucros
                      ou receitas (seja incorrida direta ou indiretamente), ou qualquer perda de dados, uso,
                      boa-fé ou outras perdas intangíveis, resultantes de:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Seu acesso ou uso (ou incapacidade de acesso ou uso) do Serviço;</li>
                      <li>Qualquer conduta ou conteúdo de terceiros no Serviço;</li>
                      <li>Acesso não autorizado ou alteração de suas transmissões ou conteúdo.</li>
                    </ul>
                  </div>
                </section>

                {/* Seção 7 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    7. Indenização
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      Você concorda em defender, indenizar e isentar a SwiftBot (e seus diretores, funcionários e agentes)
                      de e contra quaisquer reivindicações, responsabilidades, danos, perdas e despesas (incluindo honorários
                      advocatícios) decorrentes ou de alguma forma relacionados ao seu acesso ou uso do Serviço, ou sua
                      violação destes Termos.
                    </p>
                  </div>
                </section>

                {/* Seção 8 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    8. Modificações nos Termos
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      Reservamo-nos o direito de modificar estes Termos a qualquer momento. Se fizermos alterações
                      significativas, notificaremos você por e-mail (para o endereço associado à sua conta) ou através
                      de um aviso em destaque no Serviço.
                    </p>
                  </div>
                </section>

                {/* Seção 9 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    9. Lei Aplicável e Foro
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      Estes Termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil.
                    </p>
                    <p>
                      Fica eleito o foro da Comarca de [Sua Cidade/Estado, ex: São Paulo/SP], para dirimir quaisquer
                      conflitos oriundos deste contrato, com exclusão de qualquer outro, por mais privilegiado que seja.
                    </p>
                  </div>
                </section>

                {/* Seção 10 */}
                <section className="border-t border-black/10 pt-8">
                  <h2 className="text-3xl font-semibold text-black mb-4">
                    10. Contato
                  </h2>
                  <div className="pl-0 md:pl-8 space-y-3">
                    <p>
                      Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco:
                    </p>
                    <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl p-6 space-y-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        <span className="text-gray-700">Email: <a href="mailto:suporte@swiftbot.com.br" className="text-green-600 hover:underline">suporte@swiftbot.com.br</a></span>
                      </div>
                    </div>
                  </div>
                </section>

              </div>

              {/* CTA Final */}
              <div className="mt-12 text-center flex flex-wrap justify-center gap-4 items-center">
                <button
                  onClick={() => router.push('/privacidade')}
                  className="bg-black/80 hover:bg-black text-white px-8 py-3 rounded-full font-medium transition-all duration-300 inline-flex items-center mx-2"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Ver Política de Privacidade
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(0,255,153,0.5)] inline-flex items-center mx-2"
                >
                  Voltar ao Início
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
                <li><a href="/#" className="text-gray-400 hover:text-[#00FF99] transition-colors text-sm font-light">Sobre Nós</a></li>
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
    </div>
  )
}