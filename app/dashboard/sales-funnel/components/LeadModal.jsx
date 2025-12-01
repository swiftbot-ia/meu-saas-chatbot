import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

const LeadModal = ({ lead, onClose, onConvert }) => {
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [converting, setConverting] = useState(false);

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
            onConvert(lead.id); // Notify parent to refresh/update UI
            onClose();
        } catch (error) {
            console.error('Error converting lead:', error);
            alert('Erro ao converter lead. Tente novamente.');
        } finally {
            setConverting(false);
        }
    };

    if (!lead) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold border-4 border-white shadow-sm">
                            {lead.profile_pic_url ? (
                                <img src={lead.profile_pic_url} alt={lead.name} referrerPolicy="no-referrer" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User size={32} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{lead.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium text-xs uppercase tracking-wide">
                                    {lead.funnel_stage}
                                </span>
                                <span>•</span>
                                <span>Criado em {new Date(lead.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Info Column */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User size={16} /> Informações de Contato
                                </h3>
                                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                                            <Mail size={16} />
                                        </div>
                                        <span className="text-sm">{lead.email || 'Não informado'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-gray-400 shadow-sm border border-gray-100">
                                            <Phone size={16} />
                                        </div>
                                        <span className="text-sm">{lead.phone || 'Não informado'}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <CheckCircle size={16} /> Ações
                                </h3>
                                <button
                                    onClick={handleConvert}
                                    disabled={converting}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {converting ? (
                                        'Convertendo...'
                                    ) : (
                                        <>
                                            Converter em Cliente <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* History Column */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Clock size={16} /> Histórico
                            </h3>
                            <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 pl-6 pb-2">
                                {loadingHistory ? (
                                    <div className="text-sm text-gray-400 italic">Carregando histórico...</div>
                                ) : history.length === 0 ? (
                                    <div className="text-sm text-gray-400 italic">Nenhum histórico encontrado.</div>
                                ) : (
                                    history.map((item) => (
                                        <div key={item.id} className="relative">
                                            <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-white border-2 border-blue-500 shadow-sm"></div>
                                            <div className="text-sm font-medium text-gray-900">
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
                </div>
            </div>
        </div>
    );
};

export default LeadModal;
