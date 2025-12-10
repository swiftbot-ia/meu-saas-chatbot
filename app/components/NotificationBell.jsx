'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Clock, X, Phone, Users, Mail, ClipboardCheck, MessageCircle, MapPin, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const ACTIVITY_TYPE_ICONS = {
    call: Phone,
    meeting: Users,
    email: Mail,
    task: ClipboardCheck,
    whatsapp: MessageCircle,
    visit: MapPin,
    closing: CheckCircle2
};

const ACTIVITY_TYPE_LABELS = {
    call: 'Ligação',
    meeting: 'Reunião',
    email: 'E-mail',
    task: 'Tarefa',
    whatsapp: 'WhatsApp',
    visit: 'Visita',
    closing: 'Fechamento'
};

const NotificationBell = ({ instanceName }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const fetchNotifications = useCallback(async () => {
        if (!instanceName) return;

        try {
            setLoading(true);
            const response = await axios.get('/api/crm/notifications', {
                params: { instance_name: instanceName }
            });
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [instanceName]);

    // Fetch on mount and every 60 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.notification-bell-container')) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleNotificationClick = (notification) => {
        // Navigate to CRM page - the modal will need to be opened separately
        router.push('/crm');
        setIsOpen(false);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const hasNotifications = notifications.length > 0;

    return (
        <div className="notification-bell-container relative">
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-xl transition-all ${hasNotifications
                        ? 'text-[#00FF99] bg-[#00FF99]/10 hover:bg-[#00FF99]/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
            >
                <Bell size={22} />
                {hasNotifications && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-[#00FF99] text-black text-xs font-bold rounded-full px-1">
                        {notifications.length}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#1E1E1E] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 bg-[#2A2A2A]">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Clock size={16} className="text-[#00FF99]" />
                            Próximas Atividades
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center text-gray-500">
                                <div className="animate-spin w-6 h-6 border-2 border-[#00FF99] border-t-transparent rounded-full mx-auto"></div>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-500">
                                <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Nenhuma atividade nos próximos 30 minutos</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {notifications.map((notification) => {
                                    const TypeIcon = ACTIVITY_TYPE_ICONS[notification.type] || ClipboardCheck;
                                    return (
                                        <button
                                            key={notification.id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className="w-full p-4 hover:bg-white/5 transition-colors text-left"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 rounded-xl bg-[#00FF99]/10">
                                                    <TypeIcon size={16} className="text-[#00FF99]" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium text-[#00FF99] bg-[#00FF99]/10 px-2 py-0.5 rounded-full">
                                                            em {notification.minutes_until} min
                                                        </span>
                                                    </div>
                                                    <p className="font-medium text-white truncate">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-400 truncate">
                                                        {notification.contact_name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {ACTIVITY_TYPE_LABELS[notification.type]} às {formatTime(notification.scheduled_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-3 bg-[#2A2A2A]">
                            <button
                                onClick={() => {
                                    router.push('/crm');
                                    setIsOpen(false);
                                }}
                                className="w-full py-2 text-sm font-medium text-[#00FF99] hover:bg-[#00FF99]/10 rounded-xl transition-colors"
                            >
                                Ver todas no CRM
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
