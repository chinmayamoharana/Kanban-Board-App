import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { User, Trash2 } from 'lucide-react';

const TaskCard = ({ task, index, members, canEdit, onDeleteTask, onAssignTask, onOpenTask }) => {
    const handleDelete = async (event) => {
        event.stopPropagation();
        if (confirm('Delete this task?')) {
            await onDeleteTask(task.id);
        }
    };

    return (
        <Draggable draggableId={task.id.toString()} index={index}>
            {(provided) => (
                <div
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    ref={provided.innerRef}
                    onClick={() => onOpenTask(task)}
                    className="surface-card animate-rise-in group mb-3 select-none rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30"
                >
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-6 text-slate-100">{task.title}</p>
                        <Trash2 
                            size={14} 
                            className="mt-1 cursor-pointer flex-shrink-0 text-slate-500 opacity-0 transition-opacity hover:text-rose-300 group-hover:opacity-100" 
                            onClick={handleDelete}
                        />
                    </div>
                    
                    {task.description && (
                        <p className="mb-4 line-clamp-2 text-xs leading-5 text-slate-400">{task.description}</p>
                    )}

                    <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-300">
                            <User size={12} className="text-cyan-300" />
                            {canEdit ? (
                                <select
                                    value={task.assigned_to || ''}
                                    onClick={(event) => event.stopPropagation()}
                                    onChange={(event) => onAssignTask(task.id, event.target.value || null)}
                                    className="max-w-[120px] truncate bg-transparent outline-none"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={member.user}>
                                            {member.user_detail.username}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <span className="truncate">
                                    {task.assigned_to_detail ? task.assigned_to_detail.username : 'Unassigned'}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            {new Date(task.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default React.memo(TaskCard);
