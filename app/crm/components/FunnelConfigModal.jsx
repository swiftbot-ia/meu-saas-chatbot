'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { X, GripVertical, Plus, Trash2, Save, AlertTriangle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { CRM_GRADIENTS, MAX_STAGES } from '../constants';

const FunnelConfigModal = ({ isOpen, onClose, onSuccess, connectionId, currentStages, stageCounts = {} }) => {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Transfer Modal State
    const [transferModal, setTransferModal] = useState({
        isOpen: false,
        stageToDelete: null,
        leadCount: 0
    });
    const [targetStageId, setTargetStageId] = useState('');
    const [transferLoading, setTransferLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentStages) {
            // Map currentStages (object) to array for editing
            const formattedStages = Object.values(currentStages)
                .sort((a, b) => a.position - b.position)
                .map((stage, index) => ({
                    id: stage.db_id || stage.id, // Use db_id if available, otherwise id
                    name: stage.name,
                    color_key: stage.color_key || 'purple_blue',
                    stage_key: stage.stage_key || stage.id,
                    // Store internal ID for transfer checks
                    originalId: stage.id,
                    position: index
                }));
            setStages(formattedStages);
        }
    }, [isOpen, currentStages]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(stages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Update positions
        const updatedItems = items.map((item, index) => ({
            ...item,
            position: index
        }));

        setStages(updatedItems);
    };

    const handleAddStage = () => {
        if (stages.length >= MAX_STAGES) return;

        const newStage = {
            id: `temp-${Date.now()}`,
            name: 'Nova Etapa',
            color_key: 'purple_blue',
            stage_key: null,
            position: stages.length
        };

        setStages([...stages, newStage]);
    };

    const handleDeleteClick = (index) => {
        const stage = stages[index];

        // 1. Protection: 'novo' key cannot be deleted
        if (stage.stage_key === 'novo') return;

        // 2. Check for leads
        // Get count using originalId (which matches keys in stageCounts)
        // If it's a temp stage, count is 0
        const count = stage.originalId && stageCounts[stage.originalId] ? stageCounts[stage.originalId] : 0;

        if (count > 0) {
            // Open Transfer Modal
            setTransferModal({
                isOpen: true,
                stageToDelete: stage,
                leadCount: count
            });
            setTargetStageId(''); // Reset selection
        } else {
            // Safe to delete immediately
            confirmDelete(stage);
        }
    };

    const confirmDelete = (stage) => {
        const newStages = stages.filter((s) => s !== stage);
        setStages(newStages);
    };

    const handleTransferAndDelete = async () => {
        if (!targetStageId) return;

        setTransferLoading(true);
        try {
            await axios.post('/api/crm/stages/move-leads', {
                connectionId,
                fromStageId: transferModal.stageToDelete.originalId,
                toStageId: targetStageId
            });

            // After move success, delete from local list
            confirmDelete(transferModal.stageToDelete);

            // Close Transfer Modal
            setTransferModal({ isOpen: false, stageToDelete: null, count: 0 });

        } catch (err) {
            console.error('Error moving leads:', err);
            alert('Falha ao mover leads. Tente novamente.');
        } finally {
            setTransferLoading(false);
        }
    };

    const handleUpdateStage = (index, field, value) => {
        const newStages = [...stages];
        newStages[index] = { ...newStages[index], [field]: value };
        setStages(newStages);
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            await axios.post('/api/crm/stages', {
                connectionId,
                stages: stages
            });
            onSuccess(); // Triggers page refresh/fetch
            onClose();
        } catch (err) {
            console.error('Error saving stages:', err);
            const apiError = err.response?.data?.error || 'Erro ao salvar alterações';
            const apiDetails = err.response?.data?.details || '';
            setError(apiDetails ? `${apiError}: ${apiDetails}` : apiError);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Filter available targets (exclude the one being deleted)
    const availableTargets = stages.filter(s =>
        s !== transferModal.stageToDelete &&
        !s.id.toString().startsWith('temp-') // Can only move to existing stages (saved in DB)
    );

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-[#1E1E1E] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[#333]">
                    {/* Header */}
                    <div className="p-6 border-b border-[#333] flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white">Configurar Funil</h2>
                            <p className="text-gray-400 text-sm mt-1">
                                Personalize as etapas do seu funil (Máx. {MAX_STAGES})
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="stages-list">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="space-y-3"
                                    >
                                        {stages.map((stage, index) => (
                                            <Draggable key={stage.id} draggableId={String(stage.id)} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`bg-[#2A2A2A] rounded-xl p-4 flex items-center gap-4 border border-transparent group transition-all ${snapshot.isDragging ? 'shadow-xl ring-2 ring-[#00FF99] scale-[1.02] z-50' : 'hover:border-[#333]'
                                                            }`}
                                                    >
                                                        {/* Drag Handle */}
                                                        <div
                                                            {...provided.dragHandleProps}
                                                            className="text-gray-500 hover:text-white cursor-grab active:cursor-grabbing"
                                                        >
                                                            <GripVertical size={20} />
                                                        </div>

                                                        {/* Color Picker */}
                                                        <div className="relative">
                                                            <div
                                                                className="w-10 h-10 rounded-lg cursor-pointer hover:ring-2 hover:ring-white/20 transition-all flex items-center justify-center text-xs text-transparent hover:text-white font-bold"
                                                                style={{ background: CRM_GRADIENTS[stage.color_key]?.value || CRM_GRADIENTS['purple_blue'].value }}
                                                            >
                                                                <div className="absolute inset-0 opacity-0 cursor-pointer">
                                                                    <select
                                                                        value={stage.color_key}
                                                                        onChange={(e) => handleUpdateStage(index, 'color_key', e.target.value)}
                                                                        className="w-full h-full cursor-pointer"
                                                                    >
                                                                        {Object.entries(CRM_GRADIENTS).map(([key, gradient]) => (
                                                                            <option key={key} value={key}>
                                                                                {gradient.label}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Name Input */}
                                                        <div className="flex-1">
                                                            <input
                                                                type="text"
                                                                value={stage.name}
                                                                onChange={(e) => handleUpdateStage(index, 'name', e.target.value)}
                                                                className="w-full bg-transparent text-white font-medium focus:outline-none placeholder-gray-500"
                                                                placeholder="Nome da etapa"
                                                                maxLength={30}
                                                            />
                                                        </div>

                                                        {/* Delete Button - PROTECTED IF 'novo' */}
                                                        {stage.stage_key !== 'novo' && (
                                                            <button
                                                                onClick={() => handleDeleteClick(index)}
                                                                className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100"
                                                                title="Excluir etapa"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                        {stage.stage_key === 'novo' && (
                                                            <div className="w-9 h-9 flex items-center justify-center" title="Etapa padrão protegida">
                                                                {/* Optional Lock Icon or just empty space to align */}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>

                        {/* Add Button */}
                        {stages.length < MAX_STAGES && (
                            <button
                                onClick={handleAddStage}
                                className="mt-4 w-full py-3 border border-dashed border-[#444] rounded-xl text-gray-400 hover:text-white hover:border-[#00FF99] hover:bg-[#00FF99]/5 transition-all flex items-center justify-center gap-2 font-medium"
                            >
                                <Plus size={20} />
                                Adicionar Nova Etapa
                            </button>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-[#333] flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-[#00FF99] text-black font-bold rounded-xl hover:bg-[#00E88C] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <Save size={18} />
                            )}
                            Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>

            {/* Transfer Modal */}
            {transferModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
                    <div className="bg-[#1E1E1E] rounded-2xl w-full max-w-md border border-red-500/30 shadow-[0_0_50px_rgba(255,50,50,0.1)]">
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="p-3 bg-red-500/10 rounded-xl text-red-500">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Etapa com Leads</h3>
                                    <p className="text-gray-400 text-sm mt-1">
                                        A etapa <strong>"{transferModal.stageToDelete?.name}"</strong> possui <strong>{transferModal.leadCount} leads</strong>.
                                        Para excluí-la, você deve transferir os leads para outra etapa.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-2">
                                        Transferir para:
                                    </label>
                                    <select
                                        value={targetStageId}
                                        onChange={(e) => setTargetStageId(e.target.value)}
                                        className="w-full px-4 py-3 bg-[#2A2A2A] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 cursor-pointer"
                                    >
                                        <option value="">Selecione uma etapa</option>
                                        {availableTargets.map(s => (
                                            <option key={s.originalId} value={s.originalId}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setTransferModal({ isOpen: false, stageToDelete: null, count: 0 })}
                                    className="flex-1 px-4 py-3 bg-[#2A2A2A] hover:bg-[#333] text-gray-400 rounded-xl transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleTransferAndDelete}
                                    disabled={!targetStageId || transferLoading}
                                    className="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex items-center justify-center gap-2 rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {transferLoading ? (
                                        <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Transferir <ArrowRight size={16} /> Excluir
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FunnelConfigModal;
