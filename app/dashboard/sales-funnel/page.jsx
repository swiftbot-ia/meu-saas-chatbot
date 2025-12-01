'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanColumn from './components/KanbanColumn';
import LeadModal from './components/LeadModal';
import axios from 'axios';

const SALES_STAGES = {
    novo: { id: 'novo', name: 'Novo', color: '#3B82F6' }, // Blue
    apresentacao: { id: 'apresentacao', name: 'Apresentação', color: '#F59E0B' }, // Orange
    negociacao: { id: 'negociacao', name: 'Negociação', color: '#10B981' }, // Green
    fechamento: { id: 'fechamento', name: 'Fechamento', color: '#8B5CF6' }, // Purple
};

const SalesFunnelPage = () => {
    const [columns, setColumns] = useState(SALES_STAGES);
    const [leads, setLeads] = useState({});
    const [selectedLead, setSelectedLead] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const response = await axios.get('/api/funnels/vendas');
            setLeads(response.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result) => {
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

        // Optimistic Update
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

        // API Call
        try {
            await axios.patch(`/api/funnels/leads/${draggableId}/move`, {
                to_stage: finishStage,
                new_index: destination.index,
                notes: `Moved from ${SALES_STAGES[startStage].name} to ${SALES_STAGES[finishStage].name}`
            });
        } catch (error) {
            console.error('Error moving lead:', error);
            // Revert on error (optional, but good practice)
            fetchLeads();
            alert('Erro ao mover card. A página será recarregada.');
        }
    };

    const handleConvert = (leadId) => {
        fetchLeads(); // Refresh to remove converted lead or update status
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="px-8 py-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Funil de Vendas</h1>
                        <p className="text-gray-500 mt-1">Gerencie seus leads e oportunidades</p>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                        Total: {Object.values(leads).flat().length} Leads
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full gap-6 p-8 min-w-max">
                        {Object.values(columns).map((stage) => (
                            <KanbanColumn
                                key={stage.id}
                                stageId={stage.id}
                                stage={stage}
                                leads={leads[stage.id] || []}
                                onCardClick={setSelectedLead}
                            />
                        ))}
                    </div>
                </DragDropContext>
            </div>

            {selectedLead && (
                <LeadModal
                    lead={selectedLead}
                    onClose={() => setSelectedLead(null)}
                    onConvert={handleConvert}
                />
            )}
        </div>
    );
};

export default SalesFunnelPage;
