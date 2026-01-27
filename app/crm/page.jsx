'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './components/KanbanColumn';
import LeadModal from './components/LeadModal';
import CRMFilters from './components/CRMFilters';
import NewOpportunityModal from './components/NewOpportunityModal';
import FunnelConfigModal from './components/FunnelConfigModal'; // [NEW]
import axios from 'axios';
import { supabase } from '@/lib/supabase/client'
import NoSubscription from '../components/NoSubscription'
import NotificationBell from '../components/NotificationBell'
import ConnectionDropdown from '@/app/components/ConnectionDropdown'
import { Plus, ChevronDown, Settings } from 'lucide-react' // [NEW] Settings icon
import { CRM_GRADIENTS } from './constants'; // [NEW]

// ConnectionDropdown agora importado de @/app/components/ConnectionDropdown

const SalesFunnelPage = () => {
    const router = useRouter();
    // const [columns, setColumns] = useState(SALES_STAGES); // REMOVED static
    const [columns, setColumns] = useState({}); // [NEW] Dynamic columns
    const [leads, setLeads] = useState({});
    const [selectedLead, setSelectedLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState(null)
    const [subscriptionChecked, setSubscriptionChecked] = useState(false)
    const [currentDragDestination, setCurrentDragDestination] = useState(null);
    const [selectedConnection, setSelectedConnection] = useState(null);
    const [connections, setConnections] = useState([]);
    const [pagination, setPagination] = useState({}); // [MODIFIED] Dynamic keys
    const [stageCounts, setStageCounts] = useState({}); // [MODIFIED] Dynamic keys
    const [showFunnelConfig, setShowFunnelConfig] = useState(false); // [NEW]

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
    const [teamMembers, setTeamMembers] = useState([]);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentUserPermissions, setCurrentUserPermissions] = useState(null);
    const [showNewOpportunityModal, setShowNewOpportunityModal] = useState(false);
    const [stagesLoaded, setStagesLoaded] = useState(false); // [NEW]

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

        const fetchTeam = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const response = await axios.get('/api/account/team');
                if (response.data.success) {
                    setTeamMembers(response.data.members || []);
                    // Identify current user role and permissions
                    if (user) {
                        const currentMember = response.data.members.find(m => m.userId === user.id);
                        if (currentMember) {
                            setCurrentUserRole(currentMember.role);
                            setCurrentUserPermissions({
                                role: currentMember.role,
                                canAssignSelf: currentMember.canAssignSelf,
                                canAssignOthers: currentMember.canAssignOthers,
                                userId: user.id
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching team:', error);
                // Non-critical, maybe only consultant access
            }
        };

        fetchConnectionDetails();
        fetchTeam();
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
                const isTrial = ['trial', 'trialing'].includes(data.status)
                const isExpired = isTrial && data.trial_end_date && new Date() > new Date(data.trial_end_date)

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

    // [NEW] Fetch stages when connection changes
    useEffect(() => {
        const fetchStages = async () => {
            if (!selectedConnection) return;
            setStagesLoaded(false);
            try {
                const response = await axios.get('/api/crm/stages', {
                    params: { connectionId: selectedConnection.id }
                });

                const stagesList = response.data.stages || [];
                const newColumns = {};
                const newPagination = {};
                const newCounts = {};

                // Default if empty (shouldn't happen with migration, but safe fallback)
                if (stagesList.length === 0) {
                    // Keep existing fallback logic if DB empty? 
                    // Or assume migration worked. Let's assume migration logic handles defaults.
                }

                stagesList.forEach(stage => {
                    newColumns[stage.stage_key] = {
                        id: stage.stage_key,
                        db_id: stage.id,
                        name: stage.name,
                        position: stage.position,
                        gradient: CRM_GRADIENTS[stage.color_key]?.value || CRM_GRADIENTS['purple_blue'].value,
                        color_key: stage.color_key
                    };
                    newPagination[stage.stage_key] = { cursor: null, hasMore: true, loading: false };
                    newCounts[stage.stage_key] = 0;
                });

                setColumns(newColumns);
                setPagination(newPagination);
                setStageCounts(newCounts);
                setStagesLoaded(true);

            } catch (error) {
                console.error('Error fetching stages:', error);

                // Fallback to defaults to prevent white screen
                const fallbackColumns = {
                    novo: { id: 'novo', name: 'Novo', gradient: CRM_GRADIENTS['purple_blue'].value },
                    apresentacao: { id: 'apresentacao', name: 'Apresentação', gradient: CRM_GRADIENTS['orange_yellow'].value },
                    negociacao: { id: 'negociacao', name: 'Negociação', gradient: CRM_GRADIENTS['purple_pink'].value },
                    fechamento: { id: 'fechamento', name: 'Fechamento', gradient: CRM_GRADIENTS['blue_green'].value }
                };
                setColumns(fallbackColumns);
                setStagesLoaded(true);
            }
        };

        fetchStages();
    }, [selectedConnection]);


    // Fetch leads when connection, filters, OR stages change
    useEffect(() => {
        if (selectedConnection && stagesLoaded) {
            fetchLeads();
            fetchOriginsAndTags();
        }
    }, [selectedConnection, filters, stagesLoaded]);

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
            if (filters.tag_id) params.tag_id = filters.tag_id;
            if (filters.status && filters.status !== 'all') params.status = filters.status;
            if (filters.assigned_to) params.assigned_to = filters.assigned_to;

            const response = await axios.get('/api/funnels/vendas', { params });

            // New API returns { stage: { leads: [...], hasMore: bool, nextCursor: string } }
            const stagesData = response.data;
            const leadsData = {};
            const paginationData = {};
            const countsData = {};

            Object.keys(columns).forEach(stageKey => {
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
        if (!pagination[stage]?.hasMore || pagination[stage]?.loading || !selectedConnection) {
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
                notes: `Moved from ${columns[startStage].name} to ${columns[finishStage].name}`
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

    // [NEW] Refresh stages and leads after config update
    const handleConfigSuccess = () => {
        // Trigger re-fetch of stages (and then leads)
        setStagesLoaded(false);
        const fetchStages = async () => {
            // Redundant code duplication? We can just force a re-trigger by toggle selectedConnect... 
            // Or better, extract fetchStages function.
            // For simplicity, just reload the page or re-run the effect dependency? 
            // Effect depends on selectedConnection.
            // Let's just create a refresh trigger mechanism or extract function.
            // I'll manually call:
            window.location.reload(); // Simplest for now given complexity, but let's try to be better.
        };
        fetchStages();
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
        <div className="h-screen bg-[#0A0A0A] flex flex-col overflow-hidden">
            <main className="flex-1 flex flex-col pt-6 pb-2 px-4 sm:px-6 lg:px-8">

                {/* Header with max-width - kept centered but flexible */}
                <div className="flex-none mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                        {/* [NEW] Config Button */}
                        {(currentUserRole === 'owner' || currentUserRole === 'manager') && (
                            <button
                                onClick={() => setShowFunnelConfig(true)}
                                className="p-2.5 bg-[#1E1E1E] text-gray-400 hover:text-white hover:bg-[#333] rounded-xl transition-all border border-[#333] hover:border-[#00FF99]"
                                title="Configurar Funil"
                            >
                                <Settings size={20} />
                            </button>
                        )}

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
                                include_manual: false,
                                assigned_to: ''
                            })}
                            origins={origins}
                            tags={tags}
                            teamMembers={teamMembers}
                            currentUserRole={currentUserRole}
                        />
                        <NotificationBell instanceName={selectedConnection?.instance_name} />
                        <div className="bg-[#00FF99]/10 text-[#00FF99] px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap">
                            Total: {Object.values(stageCounts).reduce((a, b) => a + b, 0)} Leads
                        </div>
                    </div>
                </div>

                {/* Kanban Board - Layout Ajustado */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                    <DragDropContext
                        onDragStart={onDragStart}
                        onDragUpdate={onDragUpdate}
                        onDragEnd={onDragEnd}
                    >
                        <div className="flex h-full gap-4 sm:gap-6 min-w-max">
                            {Object.values(columns)
                                .sort((a, b) => a.position - b.position) // Ensure sorted by position
                                .map((stage) => (
                                    <KanbanColumn
                                        key={stage.id}
                                        stageId={stage.id}
                                        stage={stage}
                                        leads={leads[stage.id] || []}
                                        totalCount={stageCounts[stage.id] || 0}
                                        onCardClick={setSelectedLead}
                                        currentDragDestination={currentDragDestination}
                                        allStages={columns}
                                        onLoadMore={loadMoreLeads}
                                        hasMore={pagination[stage.id]?.hasMore || false}
                                        loading={pagination[stage.id]?.loading || false}
                                        teamMembers={teamMembers}
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

                    allStages={columns}
                    instanceName={selectedConnection?.instance_name}
                    teamMembers={teamMembers}
                    currentUserPermissions={currentUserPermissions}
                />
            )}

            <NewOpportunityModal
                isOpen={showNewOpportunityModal}
                onClose={() => setShowNewOpportunityModal(false)}
                onSuccess={fetchLeads}
                instanceName={selectedConnection?.instance_name}
                origins={origins}
            />

            {/* [NEW] Config Modal */}
            <FunnelConfigModal
                isOpen={showFunnelConfig}
                onClose={() => setShowFunnelConfig(false)}
                onSuccess={handleConfigSuccess}
                connectionId={selectedConnection?.id}
                currentStages={columns}
            />
        </div>
    );
};

export default SalesFunnelPage;
