import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Layout, Pencil, Sparkles } from 'lucide-react';
import ProfileModal from './ProfileModal';

const Navbar = () => {
    const { user, logout, updateProfile, changePassword } = useAuth();
    const navigate = useNavigate();
    const [profileOpen, setProfileOpen] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSaveProfile = async (profileData) => {
        await updateProfile(profileData);
    };

    return (
        <>
            <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 px-3 py-3 backdrop-blur-xl sm:px-4 xl:px-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-3">
                    <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
                        <Link to="/" className="group flex min-w-0 items-center gap-2 text-white transition-transform duration-300 hover:scale-[1.01] sm:gap-3">
                            <span className="aurora-ring animate-soft-pulse flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-slate-900/80 shadow-lg shadow-cyan-500/10 sm:h-11 sm:w-11">
                                <Layout className="text-cyan-300" />
                            </span>
                            <span className="flex min-w-0 flex-col">
                                <span className="truncate text-base font-bold tracking-tight sm:text-lg">KanbanFlow</span>
                                <span className="hidden items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-cyan-200/70 min-[380px]:flex sm:text-xs sm:tracking-[0.28em]">
                                    <Sparkles size={12} />
                                    Realtime Workspace
                                </span>
                            </span>
                        </Link>
                    </motion.div>

                    <div className="flex min-w-0 flex-shrink items-center gap-2 sm:gap-3">
                        <div className="glass-panel flex min-w-0 max-w-[160px] items-center rounded-2xl px-3 py-2 text-slate-200 sm:max-w-none sm:px-4">
                            <span className="min-w-0 truncate text-xs font-medium sm:max-w-[180px] sm:text-sm">{user.username}</span>
                        </div>
                        <button
                            onClick={() => setProfileOpen(true)}
                            className="rounded-2xl border border-white/10 bg-white/5 px-2 py-2 text-sm font-semibold text-slate-100 transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 sm:px-3"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Pencil size={16} />
                                <span className="hidden sm:inline">Edit profile</span>
                            </span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-2 py-2 text-sm font-semibold text-rose-100 transition duration-300 hover:-translate-y-0.5 hover:border-rose-300/40 hover:bg-rose-500/20 sm:px-3 sm:text-sm md:px-4"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <LogOut size={16} />
                                <span className="hidden sm:inline">Logout</span>
                            </span>
                        </button>
                    </div>
                </div>
            </nav>
        <ProfileModal
            user={user}
            open={profileOpen}
            onClose={() => setProfileOpen(false)}
            onSave={handleSaveProfile}
            onChangePassword={changePassword}
        />
        </>
    );
};

export default React.memo(Navbar);
