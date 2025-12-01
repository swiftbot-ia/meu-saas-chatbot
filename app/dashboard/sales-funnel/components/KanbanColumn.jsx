import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import LeadCard from './LeadCard';

const KanbanColumn = ({ stageId, stage, leads, onCardClick }) => {
    return (
        <div className="flex flex-col h-full min-w-[300px] w-[300px] bg-gray-50 rounded-xl border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl">
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-semibold text-gray-700">{stage.name}</h3>
                </div>
                <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                    {leads.length}
                </span>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={stageId}>
                {(provided, snapshot) => (
                    <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`
                            flex-1 p-3 overflow-y-auto transition-colors
                            ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}
                        `}
                    >
                        {leads.map((lead, index) => (
                            <LeadCard
                                key={lead.id}
                                lead={lead}
                                index={index}
                                onClick={onCardClick}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};

export default KanbanColumn;
