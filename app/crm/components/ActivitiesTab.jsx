'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Phone,
    Users,
    Mail,
    ClipboardCheck,
    MessageCircle,
    MapPin,
    CheckCircle2,
    Plus,
    Trash2,
    Calendar,
    Clock,
    Loader2
} from 'lucide-react';

const ACTIVITY_TYPES = {
    call: { label: 'Ligação', icon: Phone },
    meeting: { label: 'Reunião', icon: Users },
    email: { label: 'E-mail', icon: Mail },
    task: { label: 'Tarefa', icon: ClipboardCheck },
    whatsapp: { label: 'WhatsApp', icon: MessageCircle },
    visit: { label: 'Visita', icon: MapPin },
    closing: { label: 'Fechamento', icon: CheckCircle2 }
};

const ActivitiesTab = ({ conversationId, instanceName }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'call',
        title: '',
        description: '',
        scheduled_at: ''
    });

    useEffect(() => {
        if (conversationId) {
            fetchActivities();
        }
    }, [conversationId]);

    const fetchActivities = async () => {
        try {
            const response = await axios.get('/api/crm/activities', {
                params: { conversation_id: conversationId, instance_name: instanceName }
            });
            setActivities(response.data.activities || []);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.scheduled_at) return;

        setSaving(true);
        try {
            const response = await axios.post('/api/crm/activities', {
                conversation_id: conversationId,
                instance_name: instanceName,
                ...formData
            });
            setActivities([...activities, response.data.activity]);
            setFormData({ type: 'call', title: '', description: '', scheduled_at: '' });
            setShowForm(false);
        } catch (error) {
            console.error('Error creating activity:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleComplete = async (activity) => {
        try {
            const response = await axios.patch(`/api/crm/activities/${activity.id}`, {
                completed: !activity.completed_at
            });
            setActivities(activities.map(a =>
                a.id === activity.id ? response.data.activity : a
            ));
        } catch (error) {
            console.error('Error updating activity:', error);
        }
    };

    const handleDelete = async (activityId) => {
        try {
            await axios.delete(`/api/crm/activities/${activityId}`);
            setActivities(activities.filter(a => a.id !== activityId));
        } catch (error) {
            console.error('Error deleting activity:', error);
        }
    };

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#00FF99] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Add Activity Button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#2A2A2A] hover:bg-[#333333] text-white rounded-xl transition-colors"
                >
                    <Plus size={18} />
                    <span className="font-medium">Nova Atividade</span>
                </button>
            )}

            {/* Activity Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-[#2A2A2A] rounded-xl p-4 space-y-4">
                    {/* Activity Type */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Tipo</label>
                        <div className="grid grid-cols-4 gap-2">
                            {Object.entries(ACTIVITY_TYPES).map(([type, { label, icon: Icon }]) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type })}
                                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${formData.type === type
                                            ? 'bg-[#00FF99]/20 text-[#00FF99]'
                                            : 'bg-[#1E1E1E] text-gray-400 hover:text-white hover:bg-[#333333]'
                                        }`}
                                >
                                    <Icon size={16} />
                                    <span className="text-[10px] font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Título</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Ex: Ligar para confirmar reunião"
                            className="w-full px-4 py-3 bg-[#1E1E1E] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 placeholder-gray-500"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">Descrição (opcional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Detalhes adicionais..."
                            rows={2}
                            className="w-full px-4 py-3 bg-[#1E1E1E] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 placeholder-gray-500 resize-none"
                        />
                    </div>

                    {/* Date/Time */}
                    <div>
                        <label className="block text-xs font-medium text-gray-400 mb-2">
                            <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                Data e Hora
                            </span>
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.scheduled_at}
                            onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                            min={getMinDateTime()}
                            className="w-full px-4 py-3 bg-[#1E1E1E] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                            required
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setShowForm(false);
                                setFormData({ type: 'call', title: '', description: '', scheduled_at: '' });
                            }}
                            className="flex-1 px-4 py-3 bg-[#1E1E1E] hover:bg-[#333333] text-gray-400 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !formData.title.trim() || !formData.scheduled_at}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#00FF99] to-[#00E88C] text-black font-bold rounded-xl transition-all hover:shadow-[0_0_20px_rgba(0,255,153,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar'}
                        </button>
                    </div>
                </form>
            )}

            {/* Activities List */}
            <div className="space-y-2">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhuma atividade agendada</p>
                    </div>
                ) : (
                    activities.map((activity) => {
                        const TypeIcon = ACTIVITY_TYPES[activity.type]?.icon || ClipboardCheck;
                        const isCompleted = !!activity.completed_at;
                        const isPast = new Date(activity.scheduled_at) < new Date() && !isCompleted;

                        return (
                            <div
                                key={activity.id}
                                className={`bg-[#2A2A2A] rounded-xl p-4 transition-all ${isCompleted ? 'opacity-60' : ''
                                    } ${isPast ? 'border-l-4 border-[#FF6B6B]' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => handleToggleComplete(activity)}
                                        className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${isCompleted
                                                ? 'bg-[#00FF99] text-black'
                                                : 'bg-[#1E1E1E] hover:bg-[#333333] text-gray-500'
                                            }`}
                                    >
                                        {isCompleted && <CheckCircle2 size={14} />}
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`p-1 rounded ${isCompleted ? 'bg-gray-600' : 'bg-[#00FF99]/10'
                                                }`}>
                                                <TypeIcon size={12} className={isCompleted ? 'text-gray-400' : 'text-[#00FF99]'} />
                                            </div>
                                            <span className={`text-xs font-medium ${isCompleted ? 'text-gray-500' : 'text-gray-400'
                                                }`}>
                                                {ACTIVITY_TYPES[activity.type]?.label || activity.type}
                                            </span>
                                        </div>

                                        <h4 className={`font-medium mb-1 ${isCompleted ? 'text-gray-500 line-through' : 'text-white'
                                            }`}>
                                            {activity.title}
                                        </h4>

                                        {activity.description && (
                                            <p className="text-sm text-gray-500 mb-2">{activity.description}</p>
                                        )}

                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                            <Clock size={12} />
                                            <span>{formatDateTime(activity.scheduled_at)}</span>
                                        </div>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => handleDelete(activity.id)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default ActivitiesTab;
