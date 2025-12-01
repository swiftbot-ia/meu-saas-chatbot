import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Mail, Phone, Calendar, User } from 'lucide-react';

const LeadCard = ({ lead, index, onClick }) => {
    return (
        <Draggable draggableId={lead.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(lead)}
                    className={`
            bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 
            hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500 rotate-2' : ''}
          `}
                    style={{
                        ...provided.draggableProps.style,
                    }}
                >
                    <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {lead.profile_pic_url ? (
                                <img
                                    src={lead.profile_pic_url}
                                    alt={lead.name}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                    <User size={20} />
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-semibold text-gray-800 truncate text-sm" title={lead.name}>
                                    {lead.name}
                                </h4>
                                {lead.unread_count > 0 && (
                                    <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                        {lead.unread_count}
                                    </span>
                                )}
                            </div>

                            <div className="text-xs text-gray-500 truncate mb-2">
                                {lead.last_message || 'Sem mensagens'}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                {lead.phone && (
                                    <div className="flex items-center gap-1">
                                        <Phone size={10} />
                                        <span>{lead.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1 ml-auto">
                                    <Calendar size={10} />
                                    <span>{new Date(lead.last_message_at || lead.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default LeadCard;
