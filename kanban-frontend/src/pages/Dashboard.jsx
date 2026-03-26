import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { boardApi } from '../api/boardApi';
import { Link } from 'react-router-dom';
import { ArrowRight, Layout, Plus, Sparkles } from 'lucide-react';

const MotionLink = motion(Link);

const Dashboard = () => {
    const [boards, setBoards] = useState([]);
    const [newBoardName, setNewBoardName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const res = await boardApi.getBoards();
            setBoards(res.data);
            setError('');
        } catch (err) {
            setError('We could not load your boards. Make sure the backend is running and you are signed in.');
        }
    };

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        if (!newBoardName.trim()) return;

        try {
            await boardApi.createBoard({ name: newBoardName.trim() });
            setNewBoardName('');
            fetchBoards();
        } catch (err) {
            setError('Board creation failed. Please try again.');
        }
    };

    return (
        <div className="page-shell min-h-screen px-4 py-4 text-white sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:gap-8">
                <section className="glass-panel animate-float-in overflow-hidden rounded-[32px] p-5 sm:p-8 lg:p-10">
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm uppercase tracking-[0.3em] text-cyan-200/70">
                                <Sparkles size={16} />
                                Team Focus Space
                                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] tracking-[0.28em] text-slate-300">
                                    Responsive + animated
                                </span>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Build momentum across every board.
                            </h1>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                                Create boards, organize tasks, and keep collaborators aligned with live updates that feel immediate on desktop, tablet, and mobile.
                            </p>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </div>

                        <form
                            onSubmit={handleCreateBoard}
                            className="aurora-ring glass-panel flex w-full max-w-xl animate-rise-in flex-col gap-4 rounded-[28px] p-4 sm:flex-row sm:items-center sm:p-5"
                        >
                            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                                <Layout className="text-cyan-300" size={18} />
                                <input
                                    type="text"
                                    placeholder="Name your next board"
                                    value={newBoardName}
                                    onChange={(e) => setNewBoardName(e.target.value)}
                                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                                />
                            </div>
                            <button
                                type="submit"
                                className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <Plus size={18} />
                                    Create Board
                                </span>
                            </button>
                        </form>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {boards.map((board, index) => (
                        <MotionLink
                            key={board.id}
                            to={`/board/${board.id}`}
                            initial={{ opacity: 0, y: 18, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.35, delay: index * 0.06 }}
                            whileHover={{ y: -6, rotate: 0.15 }}
                            whileTap={{ scale: 0.99 }}
                            className="glass-panel surface-card group relative overflow-hidden rounded-[28px] p-6"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(244,114,182,0.12),transparent_28%)] opacity-0 transition duration-300 group-hover:opacity-100" />
                            <div className="relative">
                                <div className="mb-10 flex items-start justify-between gap-4">
                                    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">
                                        Active Board
                                    </span>
                                    <ArrowRight className="text-slate-500 transition duration-300 group-hover:translate-x-1 group-hover:text-cyan-300" size={18} />
                                </div>
                                <h3 className="text-2xl font-bold tracking-tight text-white">
                                    {board.name}
                                </h3>
                                <p className="mt-3 text-sm leading-6 text-slate-300">
                                    Created on {new Date(board.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </MotionLink>
                    ))}

                    {!boards.length && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-panel animate-rise-in col-span-1 rounded-[28px] p-8 text-center sm:col-span-2 xl:col-span-3"
                        >
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                                <Layout size={30} />
                            </div>
                            <h2 className="mt-5 text-2xl font-bold text-white">No boards yet</h2>
                            <p className="mt-2 text-sm text-slate-300">
                                Start with your first board and turn ideas into a live planning workspace.
                            </p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
