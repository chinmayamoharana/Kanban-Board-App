import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FilePlus2, Paperclip, MessageSquare, Trash2, X } from 'lucide-react';

import { boardApi } from '../../api/boardApi';

const toDateTimeLocalValue = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const localOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - localOffset).toISOString().slice(0, 16);
};

const toIsoDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
};

const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
};

const mergeById = (items = [], item) => {
    if (!item) return items;
    const index = items.findIndex((entry) => entry.id === item.id);
    if (index === -1) return [...items, item];
    return items.map((entry) => (entry.id === item.id ? item : entry));
};

const uniqueById = (items = []) => {
    const seen = new Set();
    return items.filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

const TaskDetailsModal = ({ task, members, canEdit, onClose, onSave, onRefreshTask, onTaskChange }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assigned_to: '',
        due_date: '',
    });
    const [commentBody, setCommentBody] = useState('');
    const [checklistTitle, setChecklistTitle] = useState('');
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!task) return;
        setFormData({
            title: task.title || '',
            description: task.description || '',
            assigned_to: task.assigned_to || '',
            due_date: toDateTimeLocalValue(task.due_date),
        });
        setCommentBody('');
        setChecklistTitle('');
        setAttachmentFile(null);
        setError('');
    }, [task]);

    const checklistProgress = useMemo(() => {
        const checklistItems = uniqueById(task?.checklist_items || []);
        const total = checklistItems.length;
        const done = checklistItems.filter((item) => item.is_done).length;
        return { total, done };
    }, [task]);

    const comments = useMemo(() => uniqueById(task?.comments || []), [task?.comments]);
    const checklistItems = useMemo(() => uniqueById(task?.checklist_items || []), [task?.checklist_items]);
    const attachments = useMemo(() => uniqueById(task?.attachments || []), [task?.attachments]);

    const refreshTask = async () => {
        if (onRefreshTask && task?.id) {
            await onRefreshTask(task.id);
        }
    };

    const applyTaskChange = async (mutator) => {
        if (onTaskChange && task?.id) {
            onTaskChange(task.id, mutator);
            return;
        }

        await refreshTask();
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError('');
            await onSave({
                title: formData.title.trim(),
                description: formData.description.trim(),
                assigned_to: formData.assigned_to || null,
                due_date: toIsoDateTime(formData.due_date),
            });
        } catch (err) {
            setError('Unable to save task changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddComment = async (event) => {
        event.preventDefault();
        if (!commentBody.trim() || !task) return;

        try {
            setError('');
            const response = await boardApi.addTaskComment(task.id, { body: commentBody.trim() });
            setCommentBody('');
            await applyTaskChange((current) => ({
                ...current,
                comments: mergeById(current.comments || [], response.data),
            }));
        } catch (err) {
            setError('Unable to add comment.');
        }
    };

    const handleAddChecklistItem = async (event) => {
        event.preventDefault();
        if (!checklistTitle.trim() || !task) return;

        try {
            setError('');
            const response = await boardApi.addChecklistItem(task.id, { title: checklistTitle.trim() });
            setChecklistTitle('');
            await applyTaskChange((current) => ({
                ...current,
                checklist_items: mergeById(current.checklist_items || [], response.data),
            }));
        } catch (err) {
            setError('Unable to add checklist item.');
        }
    };

    const handleToggleChecklist = async (item) => {
        if (!task) return;

        try {
            setError('');
            const response = await boardApi.updateChecklistItem(task.id, item.id, { is_done: !item.is_done });
            await applyTaskChange((current) => ({
                ...current,
                checklist_items: (current.checklist_items || []).map((entry) => (
                    entry.id === response.data.id ? response.data : entry
                )),
            }));
        } catch (err) {
            setError('Unable to update checklist item.');
        }
    };

    const handleDeleteChecklist = async (itemId) => {
        if (!task) return;

        try {
            setError('');
            await boardApi.deleteChecklistItem(task.id, itemId);
            await applyTaskChange((current) => ({
                ...current,
                checklist_items: (current.checklist_items || []).filter((entry) => entry.id !== itemId),
            }));
        } catch (err) {
            setError('Unable to delete checklist item.');
        }
    };

    const handleUploadAttachment = async (event) => {
        event.preventDefault();
        if (!task || !attachmentFile) return;

        try {
            setError('');
            const formData = new FormData();
            formData.append('file', attachmentFile);
            const response = await boardApi.addTaskAttachment(task.id, formData);
            setAttachmentFile(null);
            await applyTaskChange((current) => ({
                ...current,
                attachments: mergeById(current.attachments || [], response.data),
            }));
        } catch (err) {
            setError('Unable to upload attachment.');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!task) return;

        try {
            setError('');
            await boardApi.deleteTaskComment(task.id, commentId);
            await applyTaskChange((current) => ({
                ...current,
                comments: (current.comments || []).filter((comment) => comment.id !== commentId),
            }));
        } catch (err) {
            setError('Unable to delete comment.');
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!task) return;

        try {
            setError('');
            await boardApi.deleteTaskAttachment(task.id, attachmentId);
            await applyTaskChange((current) => ({
                ...current,
                attachments: (current.attachments || []).filter((attachment) => attachment.id !== attachmentId),
            }));
        } catch (err) {
            setError('Unable to delete attachment.');
        }
    };

    return (
        <AnimatePresence>
            {task && (
                <motion.div
                    key="task-modal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-4 sm:py-4"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 36, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                        className="glass-panel flex max-h-[calc(100vh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-t-[30px] text-white sm:max-h-[90vh] sm:rounded-[30px]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6">
                            <div className="min-w-0">
                                <p className="text-[10px] uppercase tracking-[0.32em] text-cyan-200/70">Task details</p>
                                <h2 className="mt-2 truncate text-xl font-bold sm:text-2xl">{task.title}</h2>
                                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.22em] text-slate-300">
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                        {checklistProgress.done}/{checklistProgress.total} checklist
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                        {comments.length} comments
                                    </span>
                                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                        {attachments.length} attachments
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="shrink-0 rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5">
                            <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
                                <div className="grid gap-4">
                                    <section className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4 sm:p-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Task info</p>
                                                <h3 className="mt-1 text-base font-semibold text-white sm:text-lg">Edit task details</h3>
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
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
                                                    className="form-textarea min-h-[120px] rounded-2xl px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                                                />
                                            </label>

                                            <div className="grid gap-4 sm:grid-cols-2">
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

                                                <label className="grid gap-2">
                                                    <span className="text-sm font-medium text-slate-300">Due date</span>
                                                    <input
                                                        type="datetime-local"
                                                        disabled={!canEdit}
                                                        value={formData.due_date}
                                                        onChange={(e) => setFormData((current) => ({ ...current, due_date: e.target.value }))}
                                                        className="form-input rounded-2xl px-4 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                                                    />
                                                </label>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                                            <button
                                                onClick={onClose}
                                                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                                            >
                                                Close
                                            </button>
                                            {canEdit && (
                                                <button
                                                    onClick={handleSave}
                                                    disabled={saving}
                                                    className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {saving ? 'Saving...' : 'Save changes'}
                                                </button>
                                            )}
                                        </div>
                                    </section>

                                    <section className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4 sm:p-5">
                                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                                            <FilePlus2 size={16} className="text-cyan-300" />
                                            Checklist
                                        </div>

                                        <form className="mb-4 flex flex-col gap-2 sm:flex-row" onSubmit={handleAddChecklistItem}>
                                            <input
                                                value={checklistTitle}
                                                onChange={(e) => setChecklistTitle(e.target.value)}
                                                placeholder="Add checklist item"
                                                className="form-input rounded-2xl px-4 py-3 text-sm"
                                            />
                                            <button
                                                type="submit"
                                                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                                            >
                                                Add
                                            </button>
                                        </form>

                                        <div className="grid gap-2">
                                            {checklistItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <label className="flex min-w-0 items-center gap-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={item.is_done}
                                                            onChange={() => handleToggleChecklist(item)}
                                                            className="h-4 w-4 rounded border-white/20 bg-slate-900"
                                                        />
                                                        <span className={`truncate text-sm ${item.is_done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                                                            {item.title}
                                                        </span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteChecklist(item.id)}
                                                        className="self-end rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200 sm:self-auto"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {!checklistItems.length && (
                                                <p className="text-sm text-slate-400">No checklist items yet.</p>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <div className="grid gap-4">
                                    <section className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4 sm:p-5">
                                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                                            <Paperclip size={16} className="text-fuchsia-300" />
                                            Attachments
                                        </div>

                                        <form className="mb-4 grid gap-3" onSubmit={handleUploadAttachment}>
                                            <input
                                                type="file"
                                                onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                                                className="form-input rounded-2xl px-4 py-3 text-sm"
                                            />
                                            <button
                                                type="submit"
                                                className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20"
                                            >
                                                Upload attachment
                                            </button>
                                        </form>

                                        <div className="grid gap-2">
                                            {attachments.map((attachment) => (
                                                <div
                                                    key={attachment.id}
                                                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <a
                                                        href={attachment.file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="min-w-0 truncate text-sm text-cyan-200 hover:underline"
                                                    >
                                                        {attachment.original_name}
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAttachment(attachment.id)}
                                                        className="self-end rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200 sm:self-auto"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {!attachments.length && (
                                                <p className="text-sm text-slate-400">No attachments yet.</p>
                                            )}
                                        </div>
                                    </section>

                                    <section className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4 sm:p-5">
                                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                                            <MessageSquare size={16} className="text-emerald-300" />
                                            Comments
                                        </div>

                                        <form className="mb-4 grid gap-3" onSubmit={handleAddComment}>
                                            <textarea
                                                rows={3}
                                                value={commentBody}
                                                onChange={(e) => setCommentBody(e.target.value)}
                                                placeholder="Write a comment..."
                                                className="form-textarea min-h-[100px] rounded-2xl px-4 py-3 text-sm"
                                            />
                                            <button
                                                type="submit"
                                                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                                            >
                                                Add comment
                                            </button>
                                        </form>

                                        <div className="grid gap-3">
                                            {comments.map((comment) => (
                                                <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                                    <div className="mb-2 flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="truncate text-sm font-semibold text-white">
                                                                {comment.author_detail?.username || 'Unknown user'}
                                                            </div>
                                                            <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                                                {formatTime(comment.created_at)}
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                    <p className="text-sm leading-6 text-slate-300">{comment.body}</p>
                                                </div>
                                            ))}
                                            {!comments.length && (
                                                <p className="text-sm text-slate-400">No comments yet.</p>
                                            )}
                                        </div>
                                    </section>

                                    <section className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4 sm:p-5">
                                        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                                            <MessageSquare size={16} className="text-amber-300" />
                                            Activity history
                                        </div>

                                        <div className="grid gap-3">
                                            {(task.activity_logs || []).map((entry) => (
                                                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                                    <div className="truncate text-sm font-semibold text-white">
                                                        {entry.actor_detail?.username || 'System'}
                                                    </div>
                                                    <div className="text-sm leading-6 text-slate-300">{entry.message}</div>
                                                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                                        {formatTime(entry.created_at)}
                                                    </div>
                                                </div>
                                            ))}
                                            {!task.activity_logs?.length && (
                                                <p className="text-sm text-slate-400">No activity yet.</p>
                                            )}
                                        </div>
                                    </section>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                    {error}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default React.memo(TaskDetailsModal);
