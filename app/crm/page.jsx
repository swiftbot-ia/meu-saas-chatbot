'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './components/KanbanColumn';
import LeadModal from './components/LeadModal';
import CRMFilters from './components/CRMFilters';
import NewOpportunityModal from './components/NewOpportunityModal';
import axios from 'axios';
import { supabase } from '@/lib/supabase/client'
import NoSubscription from '../components/NoSubscription'
import NotificationBell from '../components/NotificationBell'
import { Plus, ChevronDown } from 'lucide-react'

// ============================================================================
// CONNECTION DROPDOWN
// ============================================================================
const ConnectionDropdown = ({ connections, selectedConnection, onSelectConnection }) => {
    const [isOpen, setIsOpen] = useState(false);

    const selected = connections.find(c => c.id === selectedConnection?.id);
    const displayValue = selected
        ? (selected.profile_name || selected.instance_name)
        : 'Selecione uma instância';

    return (
        <div className="relative">
            <div className="bg-[#1E1E1E] rounded-2xl overflow-hidden">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left outline-none min-w-[220px]"
                >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {selected && (
                            <div className="flex-shrink-0">
                                {selected.profile_pic_url ? (
                                    <img
                                        src={selected.profile_pic_url}
                                        alt={selected.profile_name || 'Conexão'}
                                        className="w-10 h-10 rounded-full object-cover bg-[#333333]"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div
                                    className={`w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold ${selected.profile_pic_url ? 'hidden' : 'flex'}`}
                                    style={{ display: selected.profile_pic_url ? 'none' : 'flex' }}
                                >
                                    {selected.profile_name ? selected.profile_name.charAt(0).toUpperCase() : '?'}
                                </div>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="text-white text-sm font-medium truncate">
                                {displayValue}
                            </div>
                            {selected && (
                                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                    <span className={selected.is_connected ? 'text-[#00FF99]' : 'text-red-400'}>
                                        {selected.is_connected ? '●' : '○'}
                                    </span>
                                    <span className="truncate">
                                        {selected.is_connected ? 'Conectado' : 'Desconectado'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                    />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 backdrop-blur-md bg-[#1E1E1E]/95 rounded-2xl shadow-2xl z-50 max-h-[300px] overflow-y-auto">
                        {connections.map((connection, index) => (
                            <button
                                key={connection.id}
                                type="button"
                                onClick={() => {
                                    onSelectConnection(connection);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full p-3 text-sm text-left transition-all duration-150 border-b border-white/5 last:border-0
                                    ${selectedConnection?.id === connection.id
                                        ? 'bg-[#00FF99]/10 text-[#00FF99]'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                        {connection.profile_pic_url ? (
                                            <img
                                                src={connection.profile_pic_url}
                                                alt={connection.profile_name || `Conexão ${index + 1}`}
                                                className="w-10 h-10 rounded-full object-cover bg-[#333333]"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div
                                            className={`w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center text-white font-semibold ${connection.profile_pic_url ? 'hidden' : 'flex'}`}
                                            style={{ display: connection.profile_pic_url ? 'none' : 'flex' }}
                                        >
                                            {connection.profile_name ? connection.profile_name.charAt(0).toUpperCase() : (index + 1)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {connection.profile_name || connection.instance_name}
                                        </div>
                                        <div className="text-xs flex items-center gap-1.5 mt-0.5">
                                            <span className={connection.is_connected ? 'text-[#00FF99]' : 'text-red-400'}>
                                                {connection.is_connected ? '● Conectado' : '○ Desconectado'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
        </div>
    );
};

const SALES_STAGES = {
    novo: {
        id: 'novo',
        name: 'Novo',
        gradient: 'linear-gradient(to right, #8A2BE2, #00BFFF)'
    },
    apresentacao: {
        id: 'apresentacao',
        name: 'Apresentação',
        gradient: 'linear-gradient(to right, #FF6B6B, #FF8E53, #FBBF24)'
    },
    negociacao: {
        id: 'negociacao',
        name: 'Negociação',
        gradient: 'linear-gradient(to right, #8A2BE2, #A78BFA, #C084FC)'
    },
    fechamento: {
        id: 'fechamento',
        name: 'Fechamento',
        gradient: 'linear-gradient(to right, #00BFFF, #00FF99, #10B981)'
    },
};

const SalesFunnelPage = () => {
    const router = useRouter();
    const [columns, setColumns] = useState(SALES_STAGES);
    const [leads, setLeads] = useState({});
    const [selectedLead, setSelectedLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null)
    const [subscriptionChecked, setSubscriptionChecked] = useState(false)
    const [currentDragDestination, setCurrentDragDestination] = useState(null);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [connections, setConnections] = useState([]);
    const [pagination, setPagination] = useState({
        novo: { cursor: null, hasMore: true, loading: false },
        apresentacao: { cursor: null, hasMore: true, loading: false },
        negociacao: { cursor: null, hasMore: true, loading: false },
        fechamento: { cursor: null, hasMore: true, loading: false }
    });
    const [stageCounts, setStageCounts] = useState({
        novo: 0,
        apresentacao: 0,
        negociacao: 0,
        fechamento: 0
    });

    // Filter states
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        won_from: '',
        won_to: '',
        lost_from: '',
        lost_to: '',
        origin_id: '',
        tag_id: '',
        status: 'active',
        include_manual: false
    });
    const [origins, setOrigins] = useState([]);
    const [tags, setTags] = useState([]);
    const [showNewOpportunityModal, setShowNewOpportunityModal] = useState(false);

    // Read active connection ID and fetch connection details
    useEffect(() => {
        const fetchConnectionDetails = async () => {
            // ✅ Check authentication first
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const activeId = localStorage.getItem('activeConnectionId');

            try {
                // Fetch all connections
                const response = await axios.get('/api/whatsapp/connections');
                const connectionsData = response.data.connections || response.data;
                setConnections(connectionsData);

                if (!connectionsData || connectionsData.length === 0) {
                    console.warn('No connections available for this user');
                    setLoading(false);
                    return;
                }

                let connection;

                if (activeId) {
                    // Try to find the stored connection
                    connection = connectionsData.find(conn => conn.id === activeId);

                    if (connection) {
                        console.log('✅ Active connection loaded:', connection.instance_name);
                    } else {
                        console.warn('Stored connection not found, using first available');
                        connection = connectionsData[0];
                    }
                } else {
                    // No stored connection, use first one
                    console.log('No stored connection, using first available');
                    connection = connectionsData[0];

                    // Save it to localStorage for next time
                    localStorage.setItem('activeConnectionId', connection.id);
                }

                setSelectedConnection(connection);
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await loadSubscription(user.id);
                }

            } catch (error) {
                console.error('Error fetching connection details:', error);
                setLoading(false);
            }
        };

        fetchConnectionDetails();
    }, []);
    const loadSubscription = async (userId) => {
        try {
            // Get owner user ID for team members
            let ownerUserId = userId;
            try {
                const accountResponse = await fetch('/api/account/team');
                const accountData = await accountResponse.json();

                if (accountData.success && accountData.account) {
                    const owner = accountData.members?.find(m => m.role === 'owner');
                    if (owner) {
                        ownerUserId = owner.userId;
                        console.log('👥 [CRM] Team member, using owner subscription:', ownerUserId);
                    }
                }
            } catch (accountError) {
                console.log('⚠️ [CRM] Account check failed:', accountError.message);
            }

            const { data, error } = await supabase
                .from('user_subscriptions')
                .select('*')
                .eq('user_id', ownerUserId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
            if (!error && data) {
                const isActive = ['active', 'trial', 'trialing'].includes(data.status) || data.stripe_subscription_id === 'super_account_bypass'
                const isExpired = data.trial_end_date && new Date() > new Date(data.trial_end_date)

                if (isActive && !isExpired) {
                    setSubscription(data)
                }
            }
        } catch (error) {
            console.error('Erro ao carregar assinatura:', error)
        } finally {
            setSubscriptionChecked(true)
        }
    }
    // Fetch leads when connection or filters change
    useEffect(() => {
        if (selectedConnection) {
            fetchLeads();
            fetchOriginsAndTags();
        }
    }, [selectedConnection, filters]);

    const fetchOriginsAndTags = async () => {
        try {
            const response = await axios.get('/api/contacts', {
                params: { connectionId: selectedConnection.id }
            });
            setOrigins(response.data.origins || []);
            setTags(response.data.tags || []);
        } catch (error) {
            console.error('Error fetching origins/tags:', error);
        }
    };

    const fetchLeads = async () => {
        if (!selectedConnection) {
            console.warn('Cannot fetch leads: no connection selected');
            setLoading(false);
            return;
        }

        try {
            const params = {
                instance_name: selectedConnection.instance_name,
                limit: 20,
                include_manual: filters.include_manual ? 'true' : 'false'
            };

            // Add filter params
            if (filters.date_from) params.date_from = filters.date_from;
            if (filters.date_to) params.date_to = filters.date_to;
            if (filters.won_from) params.won_from = filters.won_from;
            if (filters.won_to) params.won_to = filters.won_to;
            if (filters.lost_from) params.lost_from = filters.lost_from;
            if (filters.lost_to) params.lost_to = filters.lost_to;
            if (filters.origin_id) params.origin_id = filters.origin_id;
            if (filters.tag_id) params.tag_id = filters.tag_id;
            if (filters.status && filters.status !== 'all') params.status = filters.status;

            const response = await axios.get('/api/funnels/vendas', { params });

            // New API returns { stage: { leads: [...], hasMore: bool, nextCursor: string } }
            const stagesData = response.data;
            const leadsData = {};
            const paginationData = {};
            const countsData = {};

            Object.keys(SALES_STAGES).forEach(stageKey => {
                const stageData = stagesData[stageKey];
                if (stageData) {
                    leadsData[stageKey] = stageData.leads || [];
                    paginationData[stageKey] = {
                        cursor: stageData.nextCursor,
                        hasMore: stageData.hasMore || false,
                        loading: false
                    };
                    countsData[stageKey] = stageData.totalCount || 0;
                } else {
                    leadsData[stageKey] = [];
                    paginationData[stageKey] = {
                        cursor: null,
                        hasMore: false,
                        loading: false
                    };
                    countsData[stageKey] = 0;
                }
            });

            setLeads(leadsData);
            setPagination(paginationData);
            setStageCounts(countsData);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadMoreLeads = async (stage) => {
        if (!pagination[stage].hasMore || pagination[stage].loading || !selectedConnection) {
            return;
        }

        // Set loading for this stage
        setPagination(prev => ({
            ...prev,
            [stage]: { ...prev[stage], loading: true }
        }));

        try {
            const response = await axios.get('/api/funnels/vendas', {
                params: {
                    instance_name: selectedConnection.instance_name,
                    stage,
                    cursor: pagination[stage].cursor,
                    limit: 20
                }
            });

            // Append new leads to existing
            setLeads(prev => ({
                ...prev,
                [stage]: [...(prev[stage] || []), ...response.data.leads]
            }));

            // Update pagination
            setPagination(prev => ({
                ...prev,
                [stage]: {
                    cursor: response.data.nextCursor,
                    hasMore: response.data.hasMore,
                    loading: false
                }
            }));
        } catch (error) {
            console.error('Error loading more leads:', error);
            setPagination(prev => ({
                ...prev,
                [stage]: { ...prev[stage], loading: false }
            }));
        }
    };

    const onDragStart = () => {
        setCurrentDragDestination(null);
    };

    const onDragUpdate = (update) => {
        const { destination } = update;
        if (destination) {
            setCurrentDragDestination(destination.droppableId);
        }
    };

    const onDragEnd = async (result) => {
        setCurrentDragDestination(null);
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const startStage = source.droppableId;
        const finishStage = destination.droppableId;

        const startLeads = Array.from(leads[startStage] || []);
        const finishLeads = startStage === finishStage ? startLeads : Array.from(leads[finishStage] || []);

        const [movedLead] = startLeads.splice(source.index, 1);
        movedLead.funnel_stage = finishStage;
        finishLeads.splice(destination.index, 0, movedLead);

        const newLeads = {
            ...leads,
            [startStage]: startLeads,
            [finishStage]: finishLeads,
        };

        setLeads(newLeads);

        try {
            await axios.patch(`/api/funnels/leads/${draggableId}/move`, {
                to_stage: finishStage,
                new_index: destination.index,
                notes: `Moved from ${SALES_STAGES[startStage].name} to ${SALES_STAGES[finishStage].name}`
            });
        } catch (error) {
            console.error('Error moving lead:', error);
            fetchLeads();
            alert('Erro ao mover card. A página será recarregada.');
        }
    };

    const handleConvert = (leadId) => {
        fetchLeads();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0A0A0A]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FF99]"></div>
            </div>
        );
    }

    if (!loading && subscriptionChecked && !subscription) {
        return <NoSubscription />
    }
    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            <main className="px-4 sm:px-6 lg:px-8 pt-16 pb-8">

                {/* Header centralizado com max-width */}
                <div className="max-w-7xl mx-auto mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-bold text-white">
                                Funil de Vendas
                            </h1>
                            <p className="text-[#B0B0B0] text-base sm:text-lg mt-3">
                                Gerencie seus leads e oportunidades
                            </p>
                        </div>
                        {connections.length > 1 && (
                            <ConnectionDropdown
                                connections={connections}
                                selectedConnection={selectedConnection}
                                onSelectConnection={(conn) => {
                                    setSelectedConnection(conn);
                                    localStorage.setItem('activeConnectionId', conn.id);
                                }}
                            />
                        )}
                    </div>

                    <div className="flex items-center gap-3 mt-2 sm:mt-0">
                        <button
                            onClick={() => setShowNewOpportunityModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] transition-all"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Nova Oportunidade</span>
                        </button>
                        <CRMFilters
                            instanceName={selectedConnection?.instance_name}
                            filters={filters}
                            onFiltersChange={setFilters}
                            onClearFilters={() => setFilters({
                                date_from: '',
                                date_to: '',
                                won_from: '',
                                won_to: '',
                                lost_from: '',
                                lost_to: '',
                                origin_id: '',
                                tag_id: '',
                                status: 'active',
                                include_manual: false
                            })}
                            origins={origins}
                            tags={tags}
                        />
                        <NotificationBell instanceName={selectedConnection?.instance_name} />
                        <div className="bg-[#00FF99]/10 text-[#00FF99] px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap">
                            Total: {Object.values(stageCounts).reduce((a, b) => a + b, 0)} Leads
                        </div>
                    </div>
                </div>

                {/* Kanban Board - Largura total */}
                <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                    <DragDropContext
                        onDragStart={onDragStart}
                        onDragUpdate={onDragUpdate}
                        onDragEnd={onDragEnd}
                    >
                        <div className="flex justify-center gap-4 sm:gap-6 pb-8 min-w-max sm:min-w-0">
                            {Object.values(columns).map((stage) => (
                                <KanbanColumn
                                    key={stage.id}
                                    stageId={stage.id}
                                    stage={stage}
                                    leads={leads[stage.id] || []}
                                    totalCount={stageCounts[stage.id] || 0}
                                    onCardClick={setSelectedLead}
                                    currentDragDestination={currentDragDestination}
                                    allStages={SALES_STAGES}
                                    onLoadMore={loadMoreLeads}
                                    hasMore={pagination[stage.id]?.hasMore || false}
                                    loading={pagination[stage.id]?.loading || false}
                                />
                            ))}
                        </div>
                    </DragDropContext>
                </div>

            </main>

            {selectedLead && (
                <LeadModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onConvert={handleConvert}
                    onUpdate={fetchLeads}
                    allStages={SALES_STAGES}
                    instanceName={selectedConnection?.instance_name}
                />
            )}

            <NewOpportunityModal
                isOpen={showNewOpportunityModal}
                onClose={() => setShowNewOpportunityModal(false)}
                onSuccess={fetchLeads}
                instanceName={selectedConnection?.instance_name}
                origins={origins}
            />
        </div>
    );
};

export default SalesFunnelPage;
