import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { Crown, Pencil, Plus, Radio, UserPlus, Users, WifiOff } from 'lucide-react';

import { boardApi } from '../../api/boardApi';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import ListColumn from './ListColumn';
import TaskDetailsModal from './TaskDetailsModal';

const sortByPosition = (items = []) => [...items].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

const reorderByPosition = (items, id, newPosition) => {
    const nextItems = [...items];
    const index = nextItems.findIndex((item) => item.id === Number(id));
    if (index === -1) return sortByPosition(nextItems);

    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(newPosition, 0, moved);
    return nextItems.map((item, position) => ({ ...item, position }));
};

const mergeById = (items = [], item) => {
    if (!item) return items;
    const index = items.findIndex((entry) => entry.id === item.id);
    if (index === -1) return [...items, item];
    return items.map((entry) => (entry.id === item.id ? item : entry));
};

const getApiErrorMessage = (error, fallbackMessage) => {
    const data = error?.response?.data;
    if (!data) return fallbackMessage;
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) return data.non_field_errors[0];

    const firstError = Object.values(data).flat().find(Boolean);
    return typeof firstError === 'string' ? firstError : fallbackMessage;
};

const BoardPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [board, setBoard] = useState(null);
    const [error, setError] = useState('');
    const [inviteValue, setInviteValue] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [activeTask, setActiveTask] = useState(null);
    const [taskSearch, setTaskSearch] = useState('');
    const [taskFilter, setTaskFilter] = useState('all');
    const deferredTaskSearch = useDeferredValue(taskSearch);

    const members = useMemo(() => [...(board?.members || [])].sort((a, b) => {
        if (a.role === b.role) {
            return a.user_detail.username.localeCompare(b.user_detail.username);
        }
        return a.role === 'admin' ? -1 : 1;
    }), [board?.members]);

    const isAdmin = board?.current_user_role === 'admin';
    const canManageTasks = Boolean(board?.current_user_role);
    const adminCount = members.filter((member) => member.role === 'admin').length;
    const isSoleAdmin = isAdmin && adminCount <= 1;
    const isFilteringTasks = Boolean(deferredTaskSearch.trim()) || taskFilter !== 'all';

    const visibleLists = useMemo(() => {
        if (!board?.lists) return [];

        const query = deferredTaskSearch.trim().toLowerCase();
        const now = Date.now();

        const matchesTask = (task) => {
            if (!query) return true;

            const searchableParts = [
                task.title,
                task.description,
                task.assigned_to_detail?.username,
                task.assigned_to_detail?.email,
                ...(task.comments || []).map((comment) => comment.body),
                ...(task.checklist_items || []).map((item) => item.title),
                ...(task.attachments || []).map((attachment) => attachment.original_name),
            ];

            return searchableParts.some((part) => (part || '').toLowerCase().includes(query));
        };

        const matchesFilter = (task) => {
            switch (taskFilter) {
            case 'assigned':
                return Boolean(task.assigned_to);
            case 'unassigned':
                return !task.assigned_to;
            case 'with_due_date':
                return Boolean(task.due_date);
            case 'due_soon': {
                if (!task.due_date) return false;
                const dueAt = new Date(task.due_date).getTime();
                return !Number.isNaN(dueAt) && dueAt - now <= 1000 * 60 * 60 * 24 * 3;
            }
            case 'with_attachments':
                return (task.attachments || []).length > 0;
            case 'with_comments':
                return (task.comments || []).length > 0;
            default:
                return true;
            }
        };

        return board.lists.map((list) => ({
            ...list,
            tasks: (list.tasks || []).filter((task) => matchesTask(task) && matchesFilter(task)),
        }));
    }, [board?.lists, deferredTaskSearch, taskFilter]);

    const fetchBoard = useCallback(async () => {
        try {
            setError('');
            const res = await boardApi.getBoard(id);
            setBoard({
                ...res.data,
                lists: sortByPosition(res.data.lists || []).map((list) => ({
                    ...list,
                    tasks: sortByPosition(list.tasks || []),
                })),
            });
        } catch (err) {
            setError('Unable to load this board right now.');
        }
    }, [id]);

    const upsertMember = useCallback((member) => {
        setBoard((current) => {
            if (!current) return current;
            const membersMap = new Map(current.members.map((item) => [item.id, item]));
            membersMap.set(member.id, member);
            const nextMembers = [...membersMap.values()].sort((a, b) => a.id - b.id);
            const nextRole = member.user === user?.id ? member.role : current.current_user_role;
            return { ...current, members: nextMembers, current_user_role: nextRole };
        });
    }, [user?.id]);

    const removeMemberFromState = useCallback((memberId, userId = null) => {
        setBoard((current) => {
            if (!current) return current;
            const nextMembers = current.members.filter((member) => member.id !== memberId);
            const isSelf = userId === user?.id;
            return {
                ...current,
                members: nextMembers,
                current_user_role: isSelf ? null : current.current_user_role,
            };
        });
    }, [user?.id]);

    const upsertList = useCallback((list) => {
        setBoard((current) => {
            if (!current) return current;
            const listsMap = new Map(current.lists.map((item) => [item.id, item]));
            listsMap.set(list.id, { ...list, tasks: sortByPosition(list.tasks || []) });
            return { ...current, lists: sortByPosition([...listsMap.values()]) };
        });
    }, []);

    const removeListFromState = useCallback((listId) => {
        setBoard((current) => {
            if (!current) return current;
            return { ...current, lists: current.lists.filter((list) => list.id !== listId) };
        });
    }, []);

    const upsertTask = useCallback((task) => {
        setBoard((current) => {
            if (!current) return current;
            const nextLists = current.lists.map((list) => {
                const filteredTasks = (list.tasks || []).filter((item) => item.id !== task.id);
                if (list.id !== task.list) {
                    return { ...list, tasks: filteredTasks };
                }

                return {
                    ...list,
                    tasks: sortByPosition([...filteredTasks, task]),
                };
            });

            return { ...current, lists: nextLists };
        });
    }, []);

    const removeTaskFromState = useCallback((taskId) => {
        setBoard((current) => {
            if (!current) return current;
            return {
                ...current,
                lists: current.lists.map((list) => ({
                    ...list,
                    tasks: (list.tasks || []).filter((task) => task.id !== taskId),
                })),
            };
        });
    }, []);

    const syncTaskSnapshot = useCallback((task, options = {}) => {
        const { preserveActiveTaskDetails = false } = options;
        upsertTask(task);
        setActiveTask((current) => {
            if (!current || current.id !== task.id) return current;
            if (!preserveActiveTaskDetails) {
                return task;
            }

            const nextTask = { ...current, ...task };
            if (current.activity_logs?.length) {
                nextTask.activity_logs = current.activity_logs;
            }
            return nextTask;
        });
    }, [upsertTask]);

    const mutateTaskInState = useCallback((taskId, mutate) => {
        setBoard((current) => {
            if (!current) return current;

            let didChange = false;
            const nextLists = current.lists.map((list) => {
                let listChanged = false;
                const nextTasks = (list.tasks || []).map((task) => {
                    if (task.id !== taskId) return task;
                    listChanged = true;
                    didChange = true;
                    return mutate(task);
                });

                return listChanged ? { ...list, tasks: nextTasks } : list;
            });

            if (!didChange) return current;
            return { ...current, lists: nextLists };
        });

        setActiveTask((current) => {
            if (!current || current.id !== taskId) return current;
            return mutate(current);
        });
    }, []);

    const reloadTaskDetail = useCallback(async (taskId) => {
        try {
            const res = await boardApi.getTask(taskId);
            syncTaskSnapshot(res.data);
        } catch (err) {
            fetchBoard();
        }
    }, [fetchBoard, syncTaskSnapshot]);

    const handleOpenTask = useCallback(async (task) => {
        setActiveTask(task);
        try {
            const res = await boardApi.getTask(task.id);
            syncTaskSnapshot(res.data);
        } catch (err) {
            setError('Unable to load task details.');
        }
    }, [syncTaskSnapshot]);

    const handleSocketEvent = useCallback((event) => {
        if (!event?.type) return;
        const payload = event.message || {};

        switch (event.type) {
        case 'list_created':
        case 'list_updated':
            if (payload.list) upsertList(payload.list);
            break;
        case 'list_deleted':
            removeListFromState(payload.list_id);
            break;
        case 'list_moved':
            setBoard((current) => {
                if (!current) return current;
                return { ...current, lists: reorderByPosition(current.lists, payload.list_id, payload.position) };
            });
            break;
        case 'task_created':
        case 'task_updated':
            if (payload.task) syncTaskSnapshot(payload.task, { preserveActiveTaskDetails: true });
            break;
        case 'task_deleted':
            removeTaskFromState(payload.task_id);
            if (payload.task_id === activeTask?.id) {
                setActiveTask(null);
            }
            break;
        case 'task_comment_added':
            if (payload.task_id && payload.comment) {
                mutateTaskInState(payload.task_id, (task) => ({
                    ...task,
                    comments: mergeById(task.comments || [], payload.comment),
                }));
            }
            break;
        case 'task_comment_deleted':
            if (payload.task_id) {
                mutateTaskInState(payload.task_id, (task) => ({
                    ...task,
                    comments: (task.comments || []).filter((comment) => comment.id !== payload.comment_id),
                }));
            }
            break;
        case 'task_checklist_item_added':
            if (payload.task_id && payload.item) {
                mutateTaskInState(payload.task_id, (task) => ({
                    ...task,
                    checklist_items: mergeById(task.checklist_items || [], payload.item),
                }));
            }
            break;
        case 'task_checklist_item_updated':
            if (payload.task_id && payload.item) {
                mutateTaskInState(payload.task_id, (task) => ({
                    ...task,
                    checklist_items: (task.checklist_items || []).map((item) => (
                        item.id === payload.item.id ? payload.item : item
                    )),
                }));
            }
            break;
        case 'task_checklist_item_deleted':
            if (payload.task_id) {
                mutateTaskInState(payload.task_id, (task) => ({
                    ...task,
                    checklist_items: (task.checklist_items || []).filter((item) => item.id !== payload.item_id),
                }));
            }
            break;
        case 'task_attachment_added':
            if (payload.task_id && payload.attachment) {
                mutateTaskInState(payload.task_id, (task) => ({
                    ...task,
                    attachments: mergeById(task.attachments || [], payload.attachment),
                }));
            }
            break;
        case 'task_attachment_deleted':
            if (payload.task_id) {
                mutateTaskInState(payload.task_id, (task) => ({
                    ...task,
                    attachments: (task.attachments || []).filter((attachment) => attachment.id !== payload.attachment_id),
                }));
            }
            break;
        case 'task_moved':
            setBoard((current) => {
                if (!current) return current;
                const destinationListId = payload.list_id;
                let movedTask = null;

                const strippedLists = current.lists.map((list) => {
                    const tasks = [...(list.tasks || [])];
                    const taskIndex = tasks.findIndex((item) => item.id === payload.task_id);
                    if (taskIndex !== -1) {
                        [movedTask] = tasks.splice(taskIndex, 1);
                    }
                    return { ...list, tasks };
                });

                if (!movedTask) return current;
                movedTask = { ...movedTask, list: destinationListId, position: payload.position };

                const nextLists = strippedLists.map((list) => {
                    if (list.id !== destinationListId) {
                        return {
                            ...list,
                            tasks: sortByPosition(list.tasks.map((task, index) => ({ ...task, position: index }))),
                        };
                    }

                    const tasks = [...list.tasks];
                    tasks.splice(payload.position, 0, movedTask);
                    return {
                        ...list,
                        tasks: tasks.map((task, index) => ({ ...task, position: index })),
                    };
                });

                return { ...current, lists: nextLists };
            });
            break;
        case 'member_joined':
        case 'member_updated':
            if (payload.member) upsertMember(payload.member);
            break;
        case 'member_removed':
        case 'member_left':
            removeMemberFromState(payload.member_id, payload.user_id);
            break;
        case 'board_updated':
            setBoard((current) => (current ? { ...current, name: payload.name || current.name } : current));
            break;
        case 'board_deleted':
            navigate('/');
            break;
        default:
            fetchBoard();
    }
    }, [activeTask?.id, fetchBoard, mutateTaskInState, navigate, removeListFromState, removeMemberFromState, removeTaskFromState, syncTaskSnapshot, upsertList, upsertMember]);

    const { isConnected, connectionState } = useSocket(id, handleSocketEvent);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    useEffect(() => {
        if (!activeTask?.id || !board) return;
        const freshTask = board.lists.flatMap((list) => list.tasks || []).find((task) => task.id === activeTask.id);
        if (freshTask) {
            setActiveTask(freshTask);
        } else {
            setActiveTask(null);
        }
    }, [activeTask?.id, board]);

    const handleCreateList = useCallback(async () => {
        const title = prompt('List title?');
        if (!title?.trim()) return;

        try {
            const response = await boardApi.createList({ board: id, title: title.trim() });
            upsertList(response.data);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to create the list.'));
        }
    }, [id, upsertList]);

    const handleEditBoard = useCallback(async () => {
        const nextName = prompt('Board name?', board.name);
        if (!nextName || !nextName.trim() || nextName.trim() === board.name) return;

        try {
            const response = await boardApi.updateBoard(id, { name: nextName.trim() });
            setBoard((current) => (current ? { ...current, name: response.data.name } : current));
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to update the board.'));
        }
    }, [board?.name, id]);

    const handleEditList = useCallback(async (listId, currentTitle) => {
        const nextTitle = prompt('List title?', currentTitle);
        if (!nextTitle || !nextTitle.trim() || nextTitle.trim() === currentTitle) return;

        try {
            const response = await boardApi.updateList(listId, { title: nextTitle.trim() });
            upsertList(response.data);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to update the list.'));
        }
    }, [upsertList]);

    const handleDeleteList = useCallback(async (listId, listTitle) => {
        if (!confirm(`Delete "${listTitle}"? This will remove the list and all cards inside it.`)) {
            return;
        }

        try {
            await boardApi.deleteList(listId);
            removeListFromState(listId);
            if (activeTask?.list === listId) {
                setActiveTask(null);
            }
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to delete this list.'));
        }
    }, [activeTask?.list, removeListFromState]);

    const handleCreateTask = useCallback(async (listId, title) => {
        try {
            const response = await boardApi.createTask({ list: listId, title: title.trim() });
            upsertTask(response.data);
        } catch (err) {
            setError('Unable to create the task.');
        }
    }, [upsertTask]);

    const handleDeleteTask = useCallback(async (taskId) => {
        try {
            await boardApi.deleteTask(taskId);
            removeTaskFromState(taskId);
            if (activeTask?.id === taskId) {
                setActiveTask(null);
            }
        } catch (err) {
            setError('Unable to delete the task.');
        }
    }, [activeTask?.id, removeTaskFromState]);

    const handleAssignTask = useCallback(async (taskId, assignedTo) => {
        try {
            const response = await boardApi.updateTask(taskId, { assigned_to: assignedTo });
            upsertTask(response.data);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to assign the task.'));
        }
    }, [upsertTask]);

    const handleSaveTaskDetails = useCallback(async (payload) => {
        if (!activeTask) return;
        try {
            const response = await boardApi.updateTask(activeTask.id, payload);
            syncTaskSnapshot(response.data);
            setError('');
        } catch (err) {
            setError('Unable to update task details.');
        }
    }, [activeTask, syncTaskSnapshot]);

    const handleInviteMember = useCallback(async (event) => {
        event.preventDefault();
        if (!inviteValue.trim()) return;

        try {
            const response = await boardApi.inviteMember(id, {
                identifier: inviteValue.trim(),
                role: inviteRole,
            });
            upsertMember(response.data);
            setInviteValue('');
            setInviteRole('member');
            setError('');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to invite that user.'));
        }
    }, [id, inviteRole, inviteValue, upsertMember]);

    const handleChangeMemberRole = useCallback(async (memberId, role) => {
        try {
            const response = await boardApi.updateMemberRole(id, memberId, role);
            upsertMember(response.data);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to update member role.'));
        }
    }, [id, upsertMember]);

    const handleRemoveMember = useCallback(async (memberId) => {
        try {
            await boardApi.removeMember(id, memberId);
            removeMemberFromState(memberId);
        } catch (err) {
            setError(err.response?.data?.detail || 'Unable to remove member.');
        }
    }, [id, removeMemberFromState]);

    const handleLeaveBoard = useCallback(async () => {
        if (isSoleAdmin) {
            setError('You must promote another admin before leaving this board, or delete the board instead.');
            return;
        }
        if (!confirm('Leave this board?')) return;
        try {
            await boardApi.leaveBoard(id);
            navigate('/');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to leave the board.'));
        }
    }, [id, isSoleAdmin, navigate]);

    const handleDeleteBoard = useCallback(async () => {
        if (!confirm('Delete this board? This cannot be undone.')) return;
        try {
            await boardApi.deleteBoard(id);
            navigate('/');
        } catch (err) {
            setError(getApiErrorMessage(err, 'Unable to delete the board.'));
        }
    }, [id, navigate]);

    const onDragEnd = useCallback(async (result) => {
        const { destination, source, draggableId, type } = result;
        if (!destination || !board) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        if (type === 'list') {
            const previousLists = board.lists;
            setBoard((current) => ({ ...current, lists: reorderByPosition(current.lists, draggableId, destination.index) }));
            try {
                await boardApi.moveList(draggableId, destination.index);
            } catch (err) {
                setBoard((current) => ({ ...current, lists: previousLists }));
                setError('Unable to move this list.');
            }
            return;
        }

        const previousLists = board.lists;
        let movedTask = null;
        const strippedLists = board.lists.map((list) => {
            const tasks = [...(list.tasks || [])];
            if (list.id.toString() === source.droppableId) {
                [movedTask] = tasks.splice(source.index, 1);
            }
            return { ...list, tasks };
        });

        if (!movedTask) return;

        const nextLists = strippedLists.map((list) => {
            if (list.id.toString() !== destination.droppableId) {
                return { ...list, tasks: list.tasks.map((task, index) => ({ ...task, position: index })) };
            }

            const tasks = [...list.tasks];
            tasks.splice(destination.index, 0, { ...movedTask, list: list.id, position: destination.index });
            return { ...list, tasks: tasks.map((task, index) => ({ ...task, position: index })) };
        });

        setBoard((current) => ({ ...current, lists: nextLists }));

        try {
            await boardApi.moveTask(draggableId, destination.droppableId, destination.index);
        } catch (err) {
            setBoard((current) => ({ ...current, lists: previousLists }));
            setError('Unable to move this task.');
        }
    }, [board, navigate]);

    const handleCloseTaskDetails = useCallback(() => {
        setActiveTask(null);
    }, []);

    if (!board) {
        return (
            <div className="flex min-h-[calc(100vh-88px)] items-center justify-center px-6 py-12 text-white">
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel animate-float-in rounded-[28px] px-8 py-10 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-soft-pulse rounded-full bg-cyan-400/20" />
                    <p className="text-sm uppercase tracking-[0.32em] text-cyan-200/70">Loading board</p>
                </motion.div>
            </div>
        );
    }

    const statusChip = isConnected
        ? {
            icon: <Radio size={14} className="text-emerald-300" />,
            label: 'Live sync connected',
            style: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
        }
        : {
            icon: <WifiOff size={14} className="text-amber-300" />,
            label: connectionState === 'connecting' ? 'Connecting to live sync' : 'Trying to reconnect',
            style: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
        };

    return (
        <div className="page-shell flex min-h-[calc(100vh-88px)] flex-col overflow-hidden px-3 pb-4 pt-4 text-white sm:px-4 lg:px-6">
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="glass-panel animate-float-in mb-4 flex flex-col gap-4 rounded-[30px] p-5 sm:p-6"
            >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="max-w-3xl">
                        <p className="mb-2 text-xs uppercase tracking-[0.36em] text-cyan-200/65">Collaborative board</p>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{board.name}</h1>
                            {isAdmin && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-amber-100">
                                    <Crown size={12} />
                                    Admin
                                </span>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={handleEditBoard}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200 transition hover:bg-white/10"
                                >
                                    <Pencil size={12} />
                                    Edit board
                                </button>
                            )}
                        </div>
                        {error && <p className="mt-2 text-sm text-rose-200">{error}</p>}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${statusChip.style}`}>
                            {statusChip.icon}
                            {statusChip.label}
                        </div>
                        {isAdmin && (
                            <button
                                onClick={handleCreateList}
                                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Plus size={16} />
                                    New List
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
                    <div className="rounded-[26px] border border-white/10 bg-slate-950/35 p-4">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                            <Users size={16} className="text-cyan-300" />
                            Board members
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {members.map((member) => (
                                <div key={member.id} className="surface-card rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{member.user_detail.username}</span>
                                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{member.role}</span>
                                    </div>
                                    <div className="text-xs text-slate-400">{member.user_detail.email}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[26px] border border-white/10 bg-slate-950/35 p-4">
                        {isAdmin ? (
                            <form className="grid gap-3" onSubmit={handleInviteMember}>
                                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                                    <UserPlus size={16} className="text-cyan-300" />
                                    Invite member
                                </div>
                                <input
                                    value={inviteValue}
                                    onChange={(event) => setInviteValue(event.target.value)}
                                    placeholder="Username or email"
                                    className="form-input rounded-2xl px-4 py-3 text-sm"
                                />
                                <select
                                    value={inviteRole}
                                    onChange={(event) => setInviteRole(event.target.value)}
                                    className="form-select rounded-2xl px-4 py-3 text-sm"
                                >
                                    <option value="member">Member</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button
                                    type="submit"
                                    className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                                >
                                    Send invite
                                </button>
                            </form>
                        ) : (
                            <div className="grid gap-3">
                                <div className="text-sm font-semibold text-white">Your access</div>
                                <p className="text-sm text-slate-300">
                                    You are a board member. You can manage tasks and collaborate in real time.
                                </p>
                            </div>
                        )}

                        <div className="mt-4 flex flex-col gap-2">
                            {members.map((member) => (
                                <div key={member.id} className="surface-card flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-medium text-white">{member.user_detail.username}</div>
                                            <div className="text-xs text-slate-400">{member.user_detail.email}</div>
                                        </div>
                                        {isAdmin ? (
                                            <select
                                                value={member.role}
                                                onChange={(event) => handleChangeMemberRole(member.id, event.target.value)}
                                                className="form-select rounded-xl px-3 py-2 text-xs uppercase tracking-[0.18em]"
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="member">Member</option>
                                            </select>
                                        ) : (
                                            <span className="text-xs uppercase tracking-[0.18em] text-slate-400">{member.role}</span>
                                        )}
                                    </div>
                                    {isAdmin && member.user !== user?.id && (
                                        <button
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-100 transition hover:bg-rose-500/20"
                                        >
                                            Remove member
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            <button
                                onClick={handleLeaveBoard}
                                disabled={isSoleAdmin}
                                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                            >
                                Leave board
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={handleDeleteBoard}
                                    className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-500/20"
                                >
                                    Delete board
                                </button>
                            )}
                        </div>
                        {isSoleAdmin && (
                            <p className="text-xs text-amber-200/85">
                                Promote another admin before leaving, or delete the board if you want to close it.
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>

            <div className="glass-panel mb-4 rounded-[28px] p-4 sm:p-5">
                <div className="grid gap-3 lg:grid-cols-[1.3fr_0.7fr]">
                    <div className="grid gap-2">
                        <label className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Search tasks</label>
                        <input
                            value={taskSearch}
                            onChange={(event) => setTaskSearch(event.target.value)}
                            placeholder="Search title, description, comments, attachments..."
                            className="form-input rounded-2xl px-4 py-3 text-sm"
                        />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Filter tasks</label>
                        <select
                            value={taskFilter}
                            onChange={(event) => setTaskFilter(event.target.value)}
                            className="form-select rounded-2xl px-4 py-3 text-sm"
                        >
                            <option value="all">All tasks</option>
                            <option value="assigned">Assigned</option>
                            <option value="unassigned">Unassigned</option>
                            <option value="with_due_date">With due date</option>
                            <option value="due_soon">Due soon</option>
                            <option value="with_attachments">With attachments</option>
                            <option value="with_comments">With comments</option>
                        </select>
                    </div>
                </div>
                {isFilteringTasks && (
                    <p className="mt-3 text-xs uppercase tracking-[0.22em] text-amber-200/80">
                        Drag and drop is paused while search or filters are active.
                    </p>
                )}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="all-lists" direction="horizontal" type="list">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="custom-scrollbar flex flex-1 snap-x snap-mandatory items-start gap-4 overflow-x-auto overflow-y-hidden rounded-[28px] pb-4 sm:gap-5"
                        >
                            {visibleLists.map((list, index) => (
                                <ListColumn
                                    key={list.id}
                                    list={list}
                                    index={index}
                                    members={members}
                                    canManageLists={isAdmin}
                                    canManageTasks={canManageTasks}
                                    isDragDisabled={isFilteringTasks}
                                    onEditList={handleEditList}
                                    onDeleteList={handleDeleteList}
                                    onDeleteTask={handleDeleteTask}
                                    onAssignTask={handleAssignTask}
                                    onOpenTask={handleOpenTask}
                                    onCreateTask={handleCreateTask}
                                />
                            ))}
                            {provided.placeholder}

                            {isAdmin && (
                                <button
                                    onClick={handleCreateList}
                                    className="glass-panel flex min-h-[120px] min-w-[260px] snap-start items-center justify-center rounded-[28px] border border-dashed border-white/10 px-6 text-sm font-semibold text-slate-300 transition duration-300 hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-white sm:min-w-[300px] lg:min-w-[320px]"
                                >
                                    <span className="flex items-center gap-2">
                                        <Plus size={18} />
                                        Add another list
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <TaskDetailsModal
                task={activeTask}
                members={members}
                canEdit={canManageTasks}
                onRefreshTask={reloadTaskDetail}
                onTaskChange={mutateTaskInState}
                onClose={handleCloseTaskDetails}
                onSave={handleSaveTaskDetails}
            />
        </div>
    );
};

export default BoardPage;
