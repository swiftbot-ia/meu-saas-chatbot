import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Mail, Phone, Calendar, User } from 'lucide-react';

const LeadCard = ({ lead, index, onClick, currentStageId, currentDragDestination, allStages }) => {
    // Determina qual gradiente usar baseado em onde o card está sendo arrastado
    const getActiveGradient = (isDragging) => {
        if (!isDragging) return null;

        // Se está sendo arrastado sobre uma coluna específica, usa o gradiente dela
        if (currentDragDestination && allStages[currentDragDestination]) {
            return allStages[currentDragDestination].gradient;
        }

        // Senão, usa o gradiente da coluna de origem
        if (allStages[currentStageId]) {
            return allStages[currentStageId].gradient;
        }

        return null;
    };

    return (
        <Draggable draggableId={lead.id} index={index}>
            {(provided, snapshot) => {
                const activeGradient = getActiveGradient(snapshot.isDragging);

                return (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() => onClick(lead)}
                        className={`
                            bg-[#2A2A2A] p-3 sm:p-4 rounded-xl mb-3 
                            hover:bg-[#333333] cursor-grab active:cursor-grabbing
                            ${snapshot.isDragging ? 'scale-105' : ''}
                        `}
                        style={{
                            ...provided.draggableProps.style,
                            ...(snapshot.isDragging && activeGradient && {
                                border: '2px solid transparent',
                                backgroundImage: `linear-gradient(#2A2A2A, #2A2A2A), ${activeGradient}`,
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box',
                                boxShadow: `0 0 30px rgba(138, 43, 226, 0.4)`,
                                // REMOVIDO: transition para melhorar performance
                                // willChange para otimizar GPU rendering
                                willChange: 'transform',
                            }),
                        }}
                    >
                        <div className="flex items-start gap-2 sm:gap-3">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                                {lead.profile_pic_url ? (
                                    <img
                                        src={lead.profile_pic_url}
                                        alt={lead.name}
                                        referrerPolicy="no-referrer"
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-white/10"
                                    />
                                ) : (
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#00FF99]/10 flex items-center justify-center text-[#00FF99]">
                                        <User size={18} className="sm:w-5 sm:h-5" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-semibold text-white truncate text-xs sm:text-sm" title={lead.name}>
                                        {lead.name}
                                    </h4>
                                    {lead.unread_count > 0 && (
                                        <span className="bg-[#00FF99] text-black text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full min-w-[18px] sm:min-w-[20px] text-center ml-2">
                                            {lead.unread_count}
                                        </span>
                                    )}
                                </div>

                                <div className="text-[10px] sm:text-xs text-gray-400 truncate mb-2">
                                    {lead.last_message || 'Sem mensagens'}
                                </div>

                                <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-gray-500">
                                    {lead.phone && (
                                        <div className="flex items-center gap-1">
                                            <Phone size={9} className="sm:w-[10px] sm:h-[10px]" />
                                            <span className="hidden sm:inline">{lead.phone}</span>
                                            <span className="sm:hidden">Tel</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1 ml-auto">
                                        <Calendar size={9} className="sm:w-[10px] sm:h-[10px]" />
                                        <span>{new Date(lead.last_message_at || lead.created_at).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit'
                                        })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }}
        </Draggable>
    );
};

export default React.memo(LeadCard);
