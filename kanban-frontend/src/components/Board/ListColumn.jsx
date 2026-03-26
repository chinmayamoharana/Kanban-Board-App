import React from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { GripHorizontal, Plus } from 'lucide-react';

const ListColumn = ({
    list,
    index,
    members,
    canManageTasks,
    onDeleteTask,
    onAssignTask,
    onOpenTask,
    onCreateTask,
}) => {
    const handleAddTask = async () => {
        const title = prompt('Task title?');
        if (title) {
            await onCreateTask(list.id, title);
        }
    };

    return (
        <Draggable draggableId={list.id.toString()} index={index}>
            {(provided) => (
                <div
                    {...provided.draggableProps}
                    ref={provided.innerRef}
                    className="glass-panel animate-float-in flex max-h-full min-w-[260px] max-w-[260px] snap-start flex-col rounded-[28px] sm:min-w-[300px] sm:max-w-[300px] lg:min-w-[320px] lg:max-w-[320px]"
                >
                    <div {...provided.dragHandleProps} className="flex items-center justify-between rounded-t-[28px] border-b border-white/10 bg-slate-950/45 px-4 py-4">
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-100">{list.title}</h3>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                                {list.tasks?.length || 0} cards
                            </p>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400">
                            <GripHorizontal size={15} />
                        </span>
                    </div>

                    <Droppable droppableId={list.id.toString()} type="task">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="custom-scrollbar min-h-[140px] flex-1 overflow-y-auto px-3 py-3"
                            >
                                {list.tasks && list.tasks.map((task, index) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        members={members}
                                        canEdit={canManageTasks}
                                        onDeleteTask={onDeleteTask}
                                        onAssignTask={onAssignTask}
                                        onOpenTask={onOpenTask}
                                    />
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>

                    <div className="p-3 pt-1">
                        <button
                            onClick={handleAddTask}
                            disabled={!canManageTasks}
                            className="w-full rounded-2xl border border-dashed border-white/10 bg-white/5 p-3 text-sm font-medium text-slate-300 transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Plus size={16} /> Add a card
                            </span>
                        </button>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default React.memo(ListColumn);
