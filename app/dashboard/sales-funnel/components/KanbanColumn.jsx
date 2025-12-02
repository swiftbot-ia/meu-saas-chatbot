import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import LeadCard from './LeadCard';

const KanbanColumn = ({ stageId, stage, leads, onCardClick, currentDragDestination, allStages }) => {
    return (
        // Container com altura fixa e scroll
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px] min-w-[280px] w-[280px] sm:min-w-[320px] sm:w-[320px] md:w-[360px]">
            {/* Wrapper com BORDA GRADIENTE - exatamente como no dashboard.js */}
            <div
                className="flex flex-col h-full rounded-2xl p-[2px]"
                style={{
                    border: '2px solid transparent',
                    backgroundImage: `linear-gradient(#1E1E1E, #1E1E1E), ${stage.gradient}`,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box'
                }}
            >
                {/* Container interno */}
                <div className="flex flex-col h-full bg-[#1E1E1E] rounded-[14px] overflow-hidden">

                    {/* Header com fundo #2A2A2A */}
                    <div className="p-4 sm:p-5 flex justify-between items-center flex-shrink-0 bg-[#2A2A2A]">
                        <h3 className="font-bold text-white text-base sm:text-lg">
                            {stage.name}
                        </h3>
                        <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full min-w-[32px] text-center">
                            {leads.length}
                        </span>
                    </div>

                    {/* Droppable Area com SCROLL */}
                    <Droppable droppableId={stageId}>
                        {(provided, snapshot) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex-1 p-3 sm:p-4 overflow-y-auto transition-colors"
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#00FF99 #1E1E1E'
                                }}
                            >
                                {leads.map((lead, index) => (
                                    <LeadCard
                                        key={lead.id}
                                        lead={lead}
                                        index={index}
                                        onClick={onCardClick}
                                        currentStageId={stageId}
                                        currentDragDestination={currentDragDestination}
                                        allStages={allStages}
                                    />
                                ))}
                                {provided.placeholder}

                                {/* Mensagem quando vazio */}
                                {leads.length === 0 && (
                                    <div className="text-center text-gray-500 text-sm py-8">
                                        Nenhum lead nesta etapa
                                    </div>
                                )}
                            </div>
                        )}
                    </Droppable>
                </div>
            </div>
        </div>
    );
};

export default KanbanColumn;
