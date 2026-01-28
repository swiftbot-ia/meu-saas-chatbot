'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import axios from 'axios';

const NewOpportunityModal = ({
    isOpen,
    onClose,
    onSuccess,
    instanceName,
    origins = [],
    stages = {} // [NEW] Receive dynamic stages
}) => {
    // Convert stages object to sorted array
    const availableStages = Object.values(stages).sort((a, b) => a.position - b.position);

    // Default to 'novo' key if exists, else first stage
    const defaultStage = availableStages.find(s => s.stage_key === 'novo')?.id || availableStages[0]?.id || 'novo';

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        origin_id: '',
        funnel_stage: defaultStage
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                phone: '',
                origin_id: '',
                funnel_stage: defaultStage
            });
            setError('');
        }
    }, [isOpen, defaultStage]); // Add defaultStage dependency

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Nome é obrigatório');
            return;
        }

        if (!formData.phone) {
            setError('Telefone é obrigatório');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const response = await axios.post('/api/contacts/create', {
                name: formData.name.trim(),
                phone: formData.phone,
                origin_id: formData.origin_id || null,
                funnel_stage: formData.funnel_stage, // Send ID
                instance_name: instanceName
            });

            if (response.data.success) {
                onSuccess?.();
                onClose();
            }
        } catch (err) {
            console.error('Error creating opportunity:', err);
            setError(err.response?.data?.error || 'Erro ao criar oportunidade');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#1E1E1E] rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 bg-[#2A2A2A]">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="text-[#00FF99]" size={24} />
                        Nova Oportunidade
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                            Nome *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Nome do contato"
                            className="w-full px-4 py-3 bg-[#2A2A2A] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 placeholder-gray-500"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                            Telefone *
                        </label>
                        <PhoneInput
                            international
                            defaultCountry="BR"
                            value={formData.phone}
                            onChange={(value) => setFormData({ ...formData, phone: value || '' })}
                            placeholder="Número do WhatsApp"
                            className="phone-input-dark w-full px-4 py-3 bg-[#2A2A2A] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50"
                        />
                    </div>

                    {/* Origin */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                            <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                Origem (opcional)
                            </span>
                        </label>
                        <select
                            value={formData.origin_id}
                            onChange={(e) => setFormData({ ...formData, origin_id: e.target.value })}
                            className="w-full px-4 py-3 bg-[#2A2A2A] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 appearance-none cursor-pointer"
                        >
                            <option value="">Selecione uma origem</option>
                            {origins.map(origin => (
                                <option key={origin.id} value={origin.id}>
                                    {origin.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Funnel Stage - DYNAMIC */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                            Etapa Inicial
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {availableStages.map(stage => (
                                <button
                                    key={stage.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, funnel_stage: stage.id })}
                                    className={`px-3 py-2 text-sm rounded-xl transition-all truncate ${formData.funnel_stage === stage.id
                                        ? 'bg-[#00FF99]/20 text-[#00FF99] ring-1 ring-[#00FF99]'
                                        : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#333333]'
                                        }`}
                                    title={stage.name}
                                >
                                    {stage.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-[#2A2A2A] hover:bg-[#333333] text-gray-400 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Criar'
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Custom styles for phone input */}
            <style jsx global>{`
                .phone-input-dark .PhoneInputInput {
                    background: transparent;
                    border: none;
                    outline: none;
                    color: white;
                    font-size: 14px;
                }
                .phone-input-dark .PhoneInputInput::placeholder {
                    color: #6B7280;
                }
                .phone-input-dark .PhoneInputCountry {
                    margin-right: 8px;
                }
                .phone-input-dark .PhoneInputCountrySelect {
                    background: #2A2A2A;
                    color: white;
                    border: none;
                }
                .phone-input-dark .PhoneInputCountrySelectArrow {
                    border-color: #6B7280;
                }
            `}</style>
        </div>
    );
};

export default NewOpportunityModal;
