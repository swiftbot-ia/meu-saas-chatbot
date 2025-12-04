'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './components/KanbanColumn';
import LeadModal from './components/LeadModal';
import axios from 'axios';
import { supabase } from '../../../lib/supabase/client'
import NoSubscription from '../../components/NoSubscription'

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
    const [columns, setColumns] = useState(SALES_STAGES);
    const [leads, setLeads] = useState({});
    const [selectedLead, setSelectedLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null)
    const [currentDragDestination, setCurrentDragDestination] = useState(null);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [pagination, setPagination] = useState({
        novo: { cursor: null, hasMore: true, loading: false },
        apresentacao: { cursor: null, hasMore: true, loading: false },
        negociacao: { cursor: null, hasMore: true, loading: false },
        fechamento: { cursor: null, hasMore: true, loading: false }
    });

    // Read active connection ID and fetch connection details
    useEffect(() => {
        const fetchConnectionDetails = async () => {
            const activeId = localStorage.getItem('activeConnectionId');

            try {
                // Fetch all connections
                const response = await axios.get('/api/whatsapp/connections');
                const connections = response.data.connections || response.data;

                if (!connections || connections.length === 0) {
                    console.warn('No connections available for this user');
                    setLoading(false);
                    return;
                }

                let connection;

                if (activeId) {
                    // Try to find the stored connection
                    connection = connections.find(conn => conn.id === activeId);

                    if (connection) {
                        console.log('✅ Active connection loaded:', connection.instance_name);
                    } else {
                        console.warn('Stored connection not found, using first available');
                        connection = connections[0];
                    }
                } else {
                    // No stored connection, use first one
                    console.log('No stored connection, using first available');
                    connection = connections[0];

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
        const { data, error } = await supabase
            .from('user_subscriptions')
            .select('*')
            .eq('user_id', userId)
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
    }
}
    // Fetch leads when connection changes
    useEffect(() => {
        if (selectedConnection) {
            fetchLeads();
        }
    }, [selectedConnection]);

    const fetchLeads = async () => {
        if (!selectedConnection) {
            console.warn('Cannot fetch leads: no connection selected');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get('/api/funnels/vendas', {
                params: {
                    instance_name: selectedConnection.instance_name,
                    limit: 20
                }
            });

            // New API returns { stage: { leads: [...], hasMore: bool, nextCursor: string } }
            const stagesData = response.data;
            const leadsData = {};
            const paginationData = {};

            Object.keys(SALES_STAGES).forEach(stageKey => {
                const stageData = stagesData[stageKey];
                if (stageData) {
                    leadsData[stageKey] = stageData.leads || [];
                    paginationData[stageKey] = {
                        cursor: stageData.nextCursor,
                        hasMore: stageData.hasMore || false,
                        loading: false
                    };
                } else {
                    leadsData[stageKey] = [];
                    paginationData[stageKey] = {
                        cursor: null,
                        hasMore: false,
                        loading: false
                    };
                }
            });

            setLeads(leadsData);
            setPagination(paginationData);
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
if (!subscription) {
    return <NoSubscription />
}
    return (
        <div className="min-h-screen bg-[#0A0A0A]">
            <main className="px-4 sm:px-6 lg:px-8 pt-16 pb-8">

                {/* Header centralizado com max-width */}
                <div className="max-w-7xl mx-auto mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-white">
                            Funil de Vendas
                        </h1>
                        <p className="text-[#B0B0B0] text-base sm:text-lg mt-3">
                            Gerencie seus leads e oportunidades
                        </p>
                    </div>

                    <div className="bg-[#00FF99]/10 text-[#00FF99] px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap mt-2 sm:mt-0">
                        Total: {Object.values(leads).flat().length} Leads
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
                    allStages={SALES_STAGES}
                />
            )}
        </div>
    );
};

export default SalesFunnelPage;
