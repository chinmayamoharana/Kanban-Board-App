import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const TaskDetailsModal = ({ task, members, canEdit, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
    });

    useEffect(() => {
        if (!task) return;
        setFormData({
            title: task.title || '',
            description: task.description || '',
            assigned_to: task.assigned_to || '',
        });
    }, [task]);

    return (
        <AnimatePresence>
            {task && (
                <motion.div
                    key="task-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                        className="glass-panel w-full max-w-2xl rounded-t-[32px] p-5 text-white sm:rounded-[28px] sm:p-6"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Task details</p>
                                <h2 className="mt-2 text-2xl font-bold">{task.title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid gap-5">
                            <label className="grid gap-2">
                                <span className="text-sm font-medium text-slate-300">Title</span>
                                <input
                                    disabled={!canEdit}
                                    value={formData.title}
                                    onChange={(e) => setFormData((current) => ({ ...current, title: e.target.value }))}
                                    className="form-input rounded-2xl px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-medium text-slate-300">Description</span>
                                <textarea
                                    disabled={!canEdit}
                                    rows={5}
                                    value={formData.description}
                                    onChange={(e) => setFormData((current) => ({ ...current, description: e.target.value }))}
                                    className="form-textarea rounded-2xl px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                                />
                            </label>

                            <label className="grid gap-2">
                                <span className="text-sm font-medium text-slate-300">Assigned to</span>
                                <select
                                    disabled={!canEdit}
                                    value={formData.assigned_to}
                                    onChange={(e) => setFormData((current) => ({ ...current, assigned_to: e.target.value }))}
                                    className="form-select rounded-2xl px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <option value="">Unassigned</option>
                                    {members.map((member) => (
                                        <option key={member.id} value={member.user}>
                                            {member.user_detail.username} ({member.role})
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={onClose}
                                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                            >
                                Close
                            </button>
                            {canEdit && (
                                <button
                                    onClick={() =>
                                        onSave({
                                            title: formData.title.trim(),
                                            description: formData.description.trim(),
                                            assigned_to: formData.assigned_to || null,
                                        })
                                    }
                                    className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                                >
                                    Save changes
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default React.memo(TaskDetailsModal);
