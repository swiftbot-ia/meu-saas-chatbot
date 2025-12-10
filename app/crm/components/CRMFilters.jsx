'use client';

import React, { useState } from 'react';
import { Filter, X, Calendar, MapPin, Tag, CheckCircle, XCircle, Users, Trophy, Ban } from 'lucide-react';

const CRMFilters = ({
    instanceName,
    filters,
    onFiltersChange,
    onClearFilters,
    origins = [],
    tags = []
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const hasActiveFilters = filters.date_from || filters.date_to ||
        filters.won_from || filters.won_to ||
        filters.lost_from || filters.lost_to ||
        filters.origin_id || filters.tag_id ||
        (filters.status && filters.status !== 'all');

    const handleFilterChange = (key, value) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };

    return (
        <div className="relative">
            {/* Filter Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${hasActiveFilters
                    ? 'bg-[#00FF99]/20 text-[#00FF99]'
                    : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#333333]'
                    }`}
            >
                <Filter size={18} />
                <span className="font-medium hidden sm:inline">Filtros</span>
                {hasActiveFilters && (
                    <span className="bg-[#00FF99] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        Ativo
                    </span>
                )}
            </button>

            {/* Filter Panel - Fixed on mobile */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-40 bg-black/50 sm:bg-transparent"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel - Fixed bottom on mobile, absolute on desktop */}
                    <div className="fixed sm:absolute inset-x-0 bottom-0 sm:inset-x-auto sm:bottom-auto sm:top-full sm:right-0 sm:mt-2 sm:w-96 bg-[#1E1E1E] rounded-t-2xl sm:rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom sm:slide-in-from-top-2 duration-200 max-h-[80vh] sm:max-h-[500px]">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 bg-[#2A2A2A]">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Filter size={16} className="text-[#00FF99]" />
                                Filtros
                            </h3>
                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <button
                                        onClick={() => {
                                            onClearFilters();
                                        }}
                                        className="text-xs text-red-400 hover:text-red-300"
                                    >
                                        Limpar
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-60px)] sm:max-h-[440px]">

                            {/* Date Range - Created */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                                    <Calendar size={12} />
                                    Data de Criação
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={filters.date_from || ''}
                                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                    <input
                                        type="date"
                                        value={filters.date_to || ''}
                                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>

                            {/* Date Range - Won */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-green-400 mb-2">
                                    <Trophy size={12} />
                                    Data de Ganho
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={filters.won_from || ''}
                                        onChange={(e) => handleFilterChange('won_from', e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                    <input
                                        type="date"
                                        value={filters.won_to || ''}
                                        onChange={(e) => handleFilterChange('won_to', e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>

                            {/* Date Range - Lost */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-red-400 mb-2">
                                    <Ban size={12} />
                                    Data de Perda
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={filters.lost_from || ''}
                                        onChange={(e) => handleFilterChange('lost_from', e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                    <input
                                        type="date"
                                        value={filters.lost_to || ''}
                                        onChange={(e) => handleFilterChange('lost_to', e.target.value)}
                                        className="w-full px-3 py-2 bg-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                                    <Users size={12} />
                                    Status
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: 'all', label: 'Todos', icon: null },
                                        { value: 'active', label: 'Ativos', icon: null },
                                        { value: 'won', label: 'Ganhos', icon: CheckCircle },
                                        { value: 'lost', label: 'Perdidos', icon: XCircle },
                                    ].map(status => {
                                        const Icon = status.icon;
                                        const isActive = (filters.status || 'all') === status.value;
                                        return (
                                            <button
                                                key={status.value}
                                                onClick={() => handleFilterChange('status', status.value)}
                                                className={`flex items-center justify-center gap-1 px-3 py-2 text-sm rounded-xl transition-all ${isActive
                                                    ? 'bg-[#00FF99]/20 text-[#00FF99]'
                                                    : 'bg-[#2A2A2A] text-gray-400 hover:text-white hover:bg-[#333333]'
                                                    }`}
                                            >
                                                {Icon && <Icon size={14} />}
                                                {status.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Origin */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                                    <MapPin size={12} />
                                    Origem
                                </label>
                                <select
                                    value={filters.origin_id || ''}
                                    onChange={(e) => handleFilterChange('origin_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 appearance-none cursor-pointer"
                                >
                                    <option value="">Todas as origens</option>
                                    {origins.map(origin => (
                                        <option key={origin.id} value={origin.id}>
                                            {origin.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Tag */}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                                    <Tag size={12} />
                                    Tag
                                </label>
                                <select
                                    value={filters.tag_id || ''}
                                    onChange={(e) => handleFilterChange('tag_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-[#2A2A2A] text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00FF99]/50 appearance-none cursor-pointer"
                                >
                                    <option value="">Todas as tags</option>
                                    {tags.map(tag => (
                                        <option key={tag.id} value={tag.id}>
                                            {tag.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Include Manual */}
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm text-gray-400">Incluir sem mensagens</span>
                                <button
                                    onClick={() => handleFilterChange('include_manual', !filters.include_manual)}
                                    className={`w-10 h-6 rounded-full transition-all ${filters.include_manual
                                        ? 'bg-[#00FF99]'
                                        : 'bg-[#2A2A2A]'
                                        }`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${filters.include_manual
                                        ? 'translate-x-5'
                                        : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CRMFilters;
