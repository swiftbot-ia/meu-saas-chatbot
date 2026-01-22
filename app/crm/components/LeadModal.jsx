import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, ArrowRight, CheckCircle, Clock, Activity, StickyNote, Info, XCircle, RotateCcw, AlertCircle } from 'lucide-react';
import axios from 'axios';
import ActivitiesTab from './ActivitiesTab';
import NotesTab from './NotesTab';

const TABS = {
    info: { id: 'info', label: 'Detalhes', icon: Info },
    activities: { id: 'activities', label: 'Atividades', icon: Activity },
    notes: { id: 'notes', label: 'Notas', icon: StickyNote }
};

const LeadModal = ({ lead, onClose, onConvert, onUpdate, allStages, instanceName, teamMembers = [], currentUserPermissions }) => {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [converting, setConverting] = useState(false);
    const [markingLost, setMarkingLost] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
    const [showLostModal, setShowLostModal] = useState(false);
    const [lostReason, setLostReason] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigning, setAssigning] = useState(false);
    // Error state
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Permission Logic
    const isOwnerOrManager = !currentUserPermissions || ['owner', 'manager'].includes(currentUserPermissions.role);
    const canAssignSelf = isOwnerOrManager || currentUserPermissions?.canAssignSelf;
    const canAssignOthers = isOwnerOrManager || currentUserPermissions?.canAssignOthers;
    const formatRole = (role) => {
        if (role === 'owner') return 'Proprietário';
        if (role === 'manager') return 'Gestor';
        return 'Consultor';
    };

    // ... (rest of useEffects and handlers)

    // I need to be careful with replace_file_content limits. I will do this in chunks if needed.
    // The previous prompt showed line 1 to 112. Handlers are there.
    // Let's replace the top part including imports and state first.



    // ... fetchHistory ...

    // ... handleConvert ...

    // ... handleMarkLost ...

    // ... handleReactivate ...



    // ...

    // I will use replace_file_content to inject the imports, state and update handleAssign.
    // And I need to append the JSX at the end.

    // Wait, the file is long. I can't replace the whole thing.
    // I will replace top block first.


    // ... (rest of useEffects and handlers)

    // (Inside fetchHistory, handleConvert, handleMarkLost, handleReactivate, handleAssign - same as before)
    // To save context, I will just replicate the updated return logic or minimal chunks if possible.
    // Since I need to filter the map loop, I replace the whole modal content or just the AssignModal.
    // Let's replace the top part first to get the prop and logic.

    useEffect(() => {
        if (lead) {
            fetchHistory();
        }
    }, [lead]);

    const fetchHistory = async () => {
        try {
            const response = await axios.get(`/api/funnels/history/conversation/${lead.id}`);
            setHistory(response.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleConvert = async () => {
        try {
            setConverting(true);
            await axios.post(`/api/funnels/leads/${lead.id}/convert`);
            onConvert?.(lead.id);
            onClose();
        } catch (error) {
            console.error('Error converting lead:', error);
            alert('Erro ao converter lead. Tente novamente.');
        } finally {
            setConverting(false);
        }
    };

    const handleMarkLost = async () => {
        try {
            setMarkingLost(true);
            await axios.post(`/api/funnels/leads/${lead.id}/lost`, {
                reason: lostReason || null
            });
            setShowLostModal(false);
            setLostReason('');
            onUpdate?.();
            onClose();
        } catch (error) {
            console.error('Error marking lead as lost:', error);
            alert('Erro ao marcar como perdido. Tente novamente.');
        } finally {
            setMarkingLost(false);
        }
    };

    const handleReactivate = async () => {
        try {
            setMarkingLost(true);
            await axios.delete(`/api/funnels/leads/${lead.id}/lost`);
            onUpdate?.();
            onClose();
        } catch (error) {
            console.error('Error reactivating lead:', error);
            alert('Erro ao reativar. Tente novamente.');
        } finally {
            setMarkingLost(false);
        }
    };

    const handleAssign = async (userId) => {
        setAssigning(true);
        try {
            const res = await fetch(`/api/chat/conversations/${lead.id}/assign`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedTo: userId })
            });

            const data = await res.json();
            if (data.success) {
                setShowAssignModal(false);
                onUpdate?.(); // Refresh list to update card avatar
            } else {
                alert('Erro ao atribuir: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (e) {
            console.error('Error assigning:', e);
            alert('Erro ao atribuir contato.');
        } finally {
            setAssigning(false);
        }
    };

    if (!lead) return null;

    const isLost = !!lead.lost_at;
    const isWon = !!lead.won_at;

    // Pega o gradiente baseado na etapa do lead
    let stageGradient = allStages[lead.funnel_stage]?.gradient || 'linear-gradient(to right, #8A2BE2, #00BFFF)';
    let stageName = allStages[lead.funnel_stage]?.name || lead.funnel_stage;

    if (isLost) {
        stageGradient = 'linear-gradient(to right, #EF4444, #DC2626)';
        stageName = 'Perdido';
    } else if (isWon) {
        stageGradient = 'linear-gradient(to right, #10B981, #059669)';
        stageName = 'Ganho';
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                {/* Modal com borda gradiente baseada na etapa */}
                <div
                    className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200 rounded-2xl p-[2px]"
                    style={{
                        border: '2px solid transparent',
                        backgroundImage: `linear-gradient(#1E1E1E, #1E1E1E), ${stageGradient}`,
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box'
                    }}
                >
                    <div className="bg-[#1E1E1E] rounded-[14px] overflow-hidden flex flex-col h-full">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-[#2A2A2A]">
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4 ${isLost
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                    : isWon
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                        : 'bg-[#00FF99]/10 text-[#00FF99] border-[#00FF99]/20'
                                    }`}>
                                    {lead.profile_pic_url ? (
                                        <img src={lead.profile_pic_url} alt={lead.name} referrerPolicy="no-referrer" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <User size={32} />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{lead.name}</h2>
                                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                        <span
                                            className="px-2 py-0.5 rounded-full font-medium text-xs uppercase tracking-wide text-white"
                                            style={{ backgroundImage: stageGradient }}
                                        >
                                            {stageName}
                                        </span>
                                        <span>•</span>
                                        <span>Criado em {new Date(lead.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="flex border-b border-white/5 bg-[#1E1E1E]">
                            {Object.values(TABS).map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all ${isActive
                                            ? 'text-[#00FF99] border-b-2 border-[#00FF99] bg-[#00FF99]/5'
                                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Info Tab */}
                            {activeTab === 'info' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Info Column */}
                                    <div className="space-y-6">
                                        {/* Contact Info */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <User size={16} /> Informações de Contato
                                            </h3>
                                            <div className="space-y-3 bg-[#2A2A2A] p-4 rounded-xl">
                                                <div className="flex items-center gap-3 text-gray-300">
                                                    <div className="w-8 h-8 rounded-lg bg-[#1E1E1E] flex items-center justify-center text-gray-400">
                                                        <Mail size={16} />
                                                    </div>
                                                    <span className="text-sm">{lead.email || 'Não informado'}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-gray-300">
                                                    <div className="w-8 h-8 rounded-lg bg-[#1E1E1E] flex items-center justify-center text-gray-400">
                                                        <Phone size={16} />
                                                    </div>
                                                    <span className="text-sm">{lead.phone || 'Não informado'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Assignment Section */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <User size={16} /> Responsável
                                            </h3>
                                            <div className="bg-[#2A2A2A] p-4 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    {lead.assigned_to ? (
                                                        <>
                                                            <div className="w-8 h-8 rounded-full bg-[#1E1E1E] flex items-center justify-center text-[#00FF99] border border-[#00FF99]/20">
                                                                <User size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-medium">
                                                                    {teamMembers.find(m => m.userId === lead.assigned_to)?.fullName || 'Consultor'}
                                                                </p>
                                                                <p className="text-xs text-gray-500">Atribuído</p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-8 h-8 rounded-full bg-[#1E1E1E] flex items-center justify-center text-gray-500 border border-white/10">
                                                                <User size={16} />
                                                            </div>
                                                            <div>
                                                                <p className="text-white text-sm font-medium">Ninguém</p>
                                                                <p className="text-xs text-gray-500">Livre para todos</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                {(canAssignSelf || canAssignOthers) && (
                                                    <button
                                                        onClick={() => setShowAssignModal(true)}
                                                        className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#333333] text-[#00FF99] text-xs font-bold rounded-lg transition-colors"
                                                    >
                                                        Alterar
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div>
                                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <CheckCircle size={16} /> Ações
                                            </h3>
                                            <div className="space-y-3">
                                                {isLost ? (
                                                    <button
                                                        onClick={handleReactivate}
                                                        disabled={markingLost}
                                                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                                    >
                                                        {markingLost ? 'Reativando...' : (
                                                            <>
                                                                <RotateCcw size={18} /> Reativar Oportunidade
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={handleConvert}
                                                            disabled={converting || isWon}
                                                            className="w-full bg-gradient-to-r from-[#00FF99] to-[#00E88C] hover:shadow-[0_0_30px_rgba(0,255,153,0.4)] text-black font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                                        >
                                                            {converting ? 'Convertendo...' : (
                                                                <>
                                                                    Converter em Cliente <ArrowRight size={18} />
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => setShowLostModal(true)}
                                                            disabled={markingLost}
                                                            className="w-full bg-[#2A2A2A] hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                                        >
                                                            <XCircle size={18} /> Marcar como Perdido
                                                        </button>
                                                    </>
                                                )}
                                            </div>

                                            {/* Lost reason display */}
                                            {isLost && lead.lost_reason && (
                                                <div className="mt-3 p-3 bg-red-500/10 rounded-xl">
                                                    <p className="text-xs text-red-400 font-medium mb-1">Motivo da perda:</p>
                                                    <p className="text-sm text-gray-300">{lead.lost_reason}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* History Column */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Clock size={16} /> Histórico
                                        </h3>
                                        <div className="relative border-l-2 border-white/10 ml-3 space-y-6 pl-6 pb-2">
                                            {loadingHistory ? (
                                                <div className="text-sm text-gray-400 italic">Carregando histórico...</div>
                                            ) : history.length === 0 ? (
                                                <div className="text-sm text-gray-400 italic">Nenhum histórico encontrado.</div>
                                            ) : (
                                                history.map((item) => (
                                                    <div key={item.id} className="relative">
                                                        <div
                                                            className="absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 shadow-sm"
                                                            style={{
                                                                backgroundColor: '#1E1E1E',
                                                                borderColor: item.to_stage === 'perdido' ? '#EF4444' : '#00FF99'
                                                            }}
                                                        ></div>
                                                        <div className="text-sm font-medium text-white">
                                                            {item.notes || `Moveu de ${item.from_stage} para ${item.to_stage}`}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            {new Date(item.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Activities Tab */}
                            {activeTab === 'activities' && (
                                <ActivitiesTab
                                    conversationId={lead.id}
                                    instanceName={instanceName}
                                />
                            )}

                            {/* Notes Tab */}
                            {activeTab === 'notes' && (
                                <NotesTab
                                    conversationId={lead.id}
                                    instanceName={instanceName}
                                />
                            )}
                        </div>
                    </div>
                </div >
            </div >

            {/* Lost Reason Modal */}
            {showLostModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md bg-[#1E1E1E] rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 bg-[#2A2A2A]">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <XCircle className="text-red-400" size={20} />
                                Marcar como Perdido
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-2">
                                    Motivo (opcional)
                                </label>
                                <textarea
                                    value={lostReason}
                                    onChange={(e) => setLostReason(e.target.value)}
                                    placeholder="Ex: Escolheu concorrente, sem interesse, etc."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-[#2A2A2A] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder-gray-500 resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowLostModal(false);
                                        setLostReason('');
                                    }}
                                    className="flex-1 px-4 py-3 bg-[#2A2A2A] hover:bg-[#333333] text-gray-400 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleMarkLost}
                                    disabled={markingLost}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50"
                                >
                                    {markingLost ? 'Salvando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-[#1E1E1E] rounded-xl border border-white/10 w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
                            <h3 className="text-white font-semibold">Atribuir Oportunidade</h3>
                            <button onClick={() => setShowAssignModal(false)}><X className="text-gray-400 hover:text-white" size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                            <div className="space-y-1">
                                {canAssignOthers && (
                                    <button
                                        onClick={() => handleAssign(null)}
                                        disabled={assigning}
                                        className="w-full flex items-center p-3 hover:bg-white/5 rounded-lg text-left text-gray-300 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 border border-white/5 group-hover:border-[#00FF99]/30 transition-colors">
                                            <User size={20} className="text-gray-400 group-hover:text-[#00FF99]" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white group-hover:text-[#00FF99] transition-colors">Ninguém (Livre)</p>
                                            <p className="text-xs text-gray-500">Qualquer consultor pode ver</p>
                                        </div>
                                    </button>
                                )}

                                {teamMembers
                                    .filter(member => {
                                        if (isOwnerOrManager) return true;
                                        if (member.userId === currentUserPermissions?.userId) return canAssignSelf;
                                        return canAssignOthers;
                                    })
                                    .map(member => (
                                        <button
                                            key={member.id}
                                            onClick={() => handleAssign(member.userId)}
                                            disabled={assigning}
                                            className={`w-full flex items-center p-3 hover:bg-white/5 rounded-lg text-left text-gray-300 transition-colors ${lead.assigned_to === member.userId ? 'bg-white/5 border border-[#00FF99]/20' : ''}`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center mr-3 border border-white/5 text-white font-bold">
                                                {member.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center">
                                                    <p className={`font-medium ${lead.assigned_to === member.userId ? 'text-[#00FF99]' : 'text-white'}`}>{member.fullName}</p>
                                                    {lead.assigned_to === member.userId && <span className="ml-2 text-[10px] bg-[#00FF99]/10 text-[#00FF99] px-1.5 py-0.5 rounded">Atual</span>}
                                                </div>
                                                <p className="text-xs text-gray-500 capitalize">{formatRole(member.role)}</p>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Error Modal */}
            {showErrorModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#1E1E1E] rounded-xl border border-red-500/30 w-full max-w-sm p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-white text-xl font-bold mb-2">Erro ao atribuir</h3>
                        <p className="text-gray-400 mb-6">{errorMessage}</p>
                        <button
                            onClick={() => setShowErrorModal(false)}
                            className="w-full bg-[#333] hover:bg-[#444] text-white font-semibold py-3 rounded-lg transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default LeadModal;
