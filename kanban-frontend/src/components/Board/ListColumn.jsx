import React from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { GripHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

const ListColumn = ({
    list,
    index,
    members,
    canManageLists,
    canManageTasks,
    isDragDisabled,
    onEditList,
    onDeleteList,
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

    const handleDeleteList = async (event) => {
        event.stopPropagation();
        await onDeleteList(list.id, list.title);
    };

    const handleEditList = async (event) => {
        event.stopPropagation();
        await onEditList(list.id, list.title);
    };

    return (
        <Draggable draggableId={list.id.toString()} index={index} isDragDisabled={isDragDisabled}>
            {(provided) => (
                <div
                    {...provided.draggableProps}
                    ref={provided.innerRef}
                    className="glass-panel animate-float-in flex max-h-full min-w-[84vw] max-w-[84vw] snap-start flex-col rounded-[28px] sm:min-w-[300px] sm:max-w-[300px] lg:min-w-[320px] lg:max-w-[320px]"
                >
                    <div {...provided.dragHandleProps} className="flex items-center justify-between gap-3 rounded-t-[28px] border-b border-white/10 bg-slate-950/45 px-4 py-4">
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-100">{list.title}</h3>
                            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-slate-500">
                                {list.tasks?.length || 0} cards
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {canManageLists && (
                                <button
                                    type="button"
                                    onClick={handleEditList}
                                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
                                    aria-label={`Edit ${list.title} list`}
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
                            {canManageLists && (
                                <button
                                    type="button"
                                    onClick={handleDeleteList}
                                    className="rounded-full border border-rose-400/20 bg-rose-500/10 p-2 text-rose-100 transition hover:bg-rose-500/20"
                                    aria-label={`Delete ${list.title} list`}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            <span className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400">
                                <GripHorizontal size={15} />
                            </span>
                        </div>
                    </div>

                    <Droppable droppableId={list.id.toString()} type="task">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="custom-scrollbar min-h-[140px] flex-1 overflow-y-auto px-2 py-3 sm:px-3"
                            >
                                {list.tasks && list.tasks.map((task, index) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        index={index}
                                        members={members}
                                        canEdit={canManageTasks}
                                        isDragDisabled={isDragDisabled}
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
