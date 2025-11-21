// app/components/DashboardContent.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import WhatsAppConnectModal from './WhatsAppConnectModal';

// ============================================================================
// MOCK: Hook de Autenticação
// ============================================================================
// TODO: Substituir pelo hook real de autenticação
const useAuth = () => ({
    user: { id: '0574fd83-711b-4c05-9d4c-a7d4d96e8842' },
    isLoading: false
});

// ============================================================================
// TIPOS
// ============================================================================
interface ConnectionData {
    id: string;
    instanceName: string;
    status: string;
    isConnected: boolean;
    profileName: string | null;
    profilePicUrl: string | null;
    phoneNumber: string | null;
    lastConnectedAt: string | null;
    createdAt: string;
}

interface SummaryData {
    success: boolean;
    totalConnectionsPurchased: number;
    currentActiveConnections: number;
    displayStatus: string;
    connections: ConnectionData[];
    canAddNew: boolean;
    subscription: {
        status: string;
        connectionLimit: number;
    };
}

// ============================================================================
// DADOS PADRÃO
// ============================================================================
const DEFAULT_SUMMARY: SummaryData = {
    success: false,
    totalConnectionsPurchased: 0,
    currentActiveConnections: 0,
    displayStatus: "Carregando...",
    connections: [],
    canAddNew: false,
    subscription: { status: 'loading', connectionLimit: 0 },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const DashboardContent: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const [summary, setSummary] = useState<SummaryData>(DEFAULT_SUMMARY);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ========================================================================
    // FUNÇÃO: Buscar Resumo do Dashboard
    // ========================================================================
    const fetchDashboardSummary = useCallback(async () => {
        if (!user?.id) return;

        setIsLoading(true);

        try {
            console.log('📊 [Dashboard] Buscando resumo...');

            const res = await fetch(`/api/whatsapp/dashboard-summary?userId=${user.id}`);

            if (!res.ok) {
                throw new Error("Falha ao buscar resumo do dashboard");
            }

            const data: SummaryData = await res.json();

            console.log('✅ [Dashboard] Dados recebidos:', {
                totalPurchased: data.totalConnectionsPurchased,
                activeConnections: data.currentActiveConnections,
                displayStatus: data.displayStatus,
                connectionsCount: data.connections?.length || 0
            });

            setSummary(data);

        } catch (err) {
            console.error("❌ [Dashboard] Erro ao carregar:", err);
            setSummary({
                ...DEFAULT_SUMMARY,
                displayStatus: "Erro de Conexão"
            });
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    // ========================================================================
    // FUNÇÃO: Abrir Modal de Conexão
    // ========================================================================
    const handleConnect = () => {
        if (isLoading || authLoading || !user?.id) {
            console.warn('⚠️ [Dashboard] Não pode abrir modal: loading ou sem user');
            return;
        }

        // Verificar se pode adicionar nova conexão
        if (!summary.canAddNew) {
            const hasDisconnected = summary.connections.some(c =>
                c.status === 'disconnected'
            );

            if (!hasDisconnected) {
                alert("Limite de conexões atingido. Desconecte uma instância existente para adicionar uma nova.");
                return;
            }
        }

        console.log('🔌 [Dashboard] Abrindo modal de conexão');
        setIsModalOpen(true);
    };

    // ========================================================================
    // FUNÇÃO: Callback de Sucesso do Modal
    // ========================================================================
    const handleModalSuccess = () => {
        console.log('✅ [Dashboard] Conexão bem-sucedida! Recarregando dados...');
        setIsModalOpen(false);
        fetchDashboardSummary(); // Recarrega os dados do dashboard
    };

    // ========================================================================
    // FUNÇÃO: Fechar Modal
    // ========================================================================
    const handleCloseModal = () => {
        console.log('🚪 [Dashboard] Fechando modal');
        setIsModalOpen(false);
    };

    // ========================================================================
    // EFEITO: Carregar Dados Iniciais
    // ========================================================================
    useEffect(() => {
        if (!authLoading && user?.id) {
            fetchDashboardSummary();
        }
    }, [authLoading, user?.id, fetchDashboardSummary]);

    // ========================================================================
    // LÓGICA DE EXIBIÇÃO
    // ========================================================================

    // Texto do contador
    const connectionsCountText = `${summary.currentActiveConnections} de ${summary.subscription.connectionLimit} ativas`;

    // Encontrar conexão principal para exibir
    const mainConnection = summary.connections.find(c =>
        c.status === 'connected' || c.status === 'open'
    ) || summary.connections.find(c =>
        c.status === 'connecting' || c.status === 'pending_qr'
    );

    // Cor do status
    const statusColor = summary.displayStatus === 'Conectado'
        ? 'bg-[#00FF99]'
        : (summary.displayStatus === 'Aguardando QR' ? 'bg-yellow-500' : 'bg-red-500');

    // Texto do status e botão
    let mainStatusText = summary.displayStatus;
    let buttonText = 'Conectar WhatsApp';

    if (mainConnection) {
        if (mainConnection.status === 'connected' || mainConnection.status === 'open') {
            mainStatusText = mainConnection.profileName || 'Conectado';
            buttonText = 'Gerenciar Conexão';
        } else if (mainConnection.status === 'connecting' || mainConnection.status === 'pending_qr') {
            mainStatusText = 'Aguardando QR Code';
            buttonText = 'Continuar Conexão';
        }
    } else {
        mainStatusText = 'Desconectado';
    }

    // Botão desabilitado se:
    // - Está carregando
    // - OU (não pode adicionar nova E não tem nenhuma conexão para gerenciar)
    const isButtonDisabled = isLoading || (!summary.canAddNew && !mainConnection);

    // ========================================================================
    // RENDERIZAÇÃO
    // ========================================================================
    return (
        <div className="p-8 bg-gray-900 min-h-screen text-white font-inter">
            <h1 className="text-3xl font-bold mb-8">Olá, Caio ⚡</h1>
            <p className="text-gray-400 mb-10">Acompanhe suas conexões e estatísticas em tempo real</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ============================================================ */}
                {/* PAINEL: Conexão Ativa */}
                {/* ============================================================ */}
                <div className="bg-[#111111] rounded-2xl p-8 hover:bg-[#1A1A1A] transition-all duration-300 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#00FF99] to-[#00E88C]">
                                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-white">Conexão Ativa</h3>
                        </div>
                    </div>

                    {/* Status da Conexão */}
                    <div className="relative mb-6">
                        <button
                            className="w-full bg-[#0A0A0A] hover:bg-black rounded-xl p-4 transition-all duration-300 text-left"
                            disabled
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {mainConnection?.profilePicUrl && (
                                        <img
                                            src={mainConnection.profilePicUrl}
                                            alt="Foto de Perfil"
                                            className="w-8 h-8 rounded-full border border-[#00FF99]"
                                        />
                                    )}
                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-white">{mainStatusText}</p>
                                        <p className="text-xs text-[#B0B0B0]">{connectionsCountText}</p>
                                    </div>
                                </div>
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </div>
                        </button>
                    </div>

                    {/* Indicador de Status */}
                    <div className="flex items-center gap-2 mb-6">
                        <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></div>
                        <span className="text-sm text-[#B0B0B0]">{mainStatusText}</span>
                    </div>

                    {/* Botão de Ação */}
                    <button
                        onClick={handleConnect}
                        disabled={isButtonDisabled}
                        className="w-full bg-[#222222] text-[#B0B0B0] hover:bg-gradient-to-r hover:from-[#00FF99] hover:to-[#00E88C] hover:text-black font-medium py-3 px-4 rounded-xl transition-all duration-1000 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Carregando...' : buttonText}
                    </button>

                    {/* Outros Painéis */}
                    <div className="mt-8 space-y-4">
                        <div className="bg-[#1A1A1A] p-4 rounded-xl shadow-md">
                            <h4 className="text-md font-semibold mb-2 text-[#00FF99]">Agente IA</h4>
                            <p className="text-sm text-gray-400">Configure a personalidade e comportamento do seu assistente</p>
                            <button className="mt-2 text-sm text-[#00FF99] hover:underline">Configurar Agente</button>
                        </div>
                        <div className="bg-[#1A1A1A] p-4 rounded-xl shadow-md">
                            <h4 className="text-md font-semibold mb-2 text-[#00FF99]">Bate-Papo</h4>
                            <p className="text-sm text-gray-400">Visualize e gerencie conversas em tempo real</p>
                            <button className="mt-2 text-sm text-gray-600 cursor-not-allowed">Em breve</button>
                        </div>
                    </div>
                </div>

                {/* ============================================================ */}
                {/* ESTATÍSTICAS */}
                {/* ============================================================ */}
                <div className="md:col-span-3 mt-12">
                    <h2 className="text-2xl font-bold mb-6">Estatísticas da Conexão</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatCard title="Mensagens Hoje" value="0" />
                        <StatCard title="Conversas Ativas" value="0" />
                        <StatCard title="Taxa de Resposta" value="0%" />
                        <StatCard title="Clientes Atendidos" value="0" />
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* MODAL DE CONEXÃO */}
            {/* ============================================================ */}
            {isModalOpen && user?.id && (
                <WhatsAppConnectModal
                    isOpen={isModalOpen}
                    userId={user.id}
                    onClose={handleCloseModal}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    );
};

// ============================================================================
// COMPONENTE: Card de Estatística
// ============================================================================
const StatCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
    <div className="bg-[#111111] rounded-2xl p-6 text-center hover:bg-[#1A1A1A] transition-all duration-300 shadow-md">
        <p className="text-4xl font-bold text-[#00FF99] mb-1">{value}</p>
        <p className="text-sm text-gray-400">{title}</p>
    </div>
);

export default DashboardContent;
