import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, LockKeyhole, X } from 'lucide-react';

const ProfileModal = ({ user, open, onClose, onSave, onChangePassword }) => {
    const [profileData, setProfileData] = useState({
        username: '',
        email: '',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [error, setError] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    useEffect(() => {
        if (!user) return;
        setProfileData({
            username: user.username || '',
            email: user.email || '',
        });
        setPasswordData({
            current_password: '',
            new_password: '',
            confirm_password: '',
        });
        setError('');
    }, [user, open]);

    const handleSaveProfile = async () => {
        try {
            setSavingProfile(true);
            setError('');
            const payload = {
                username: profileData.username.trim(),
                email: profileData.email.trim(),
            };
            await onSave(payload);
            onClose();
        } catch (err) {
            const data = err?.response?.data;
            const usernameError = data?.username?.[0];
            const emailError = data?.email?.[0];
            const detailError = data?.detail;
            setError(usernameError || emailError || detailError || 'Unable to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async () => {
        try {
            setSavingPassword(true);
            setError('');
            await onChangePassword(passwordData);
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: '',
            });
        } catch (err) {
            const data = err?.response?.data;
            const message = data?.detail || Object.values(data || {}).flat().find(Boolean);
            setError(message || 'Unable to change password.');
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="profile-modal"
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
                        className="glass-panel w-full max-w-4xl rounded-t-[32px] p-5 text-white sm:rounded-[28px] sm:p-6"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">Profile</p>
                                <h2 className="mt-2 text-2xl font-bold">Edit your account</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-4 sm:p-5">
                                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                                    <Camera size={16} className="text-cyan-300" />
                                    Profile info
                                </div>
                                <div className="grid gap-4">
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-slate-300">Username</span>
                                        <input
                                            value={profileData.username}
                                            onChange={(e) => setProfileData((current) => ({ ...current, username: e.target.value }))}
                                            className="form-input rounded-2xl px-4 py-3"
                                        />
                                    </label>

                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-slate-300">Email</span>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => setProfileData((current) => ({ ...current, email: e.target.value }))}
                                            className="form-input rounded-2xl px-4 py-3"
                                        />
                                    </label>

                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile}
                                        className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingProfile ? 'Saving...' : 'Save profile'}
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-4 sm:p-5">
                                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
                                    <LockKeyhole size={16} className="text-fuchsia-300" />
                                    Change password
                                </div>
                                <div className="grid gap-4">
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-slate-300">Current password</span>
                                        <input
                                            type="password"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData((current) => ({ ...current, current_password: e.target.value }))}
                                            className="form-input rounded-2xl px-4 py-3"
                                        />
                                    </label>
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-slate-300">New password</span>
                                        <input
                                            type="password"
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData((current) => ({ ...current, new_password: e.target.value }))}
                                            className="form-input rounded-2xl px-4 py-3"
                                        />
                                    </label>
                                    <label className="grid gap-2">
                                        <span className="text-sm font-medium text-slate-300">Confirm new password</span>
                                        <input
                                            type="password"
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData((current) => ({ ...current, confirm_password: e.target.value }))}
                                            className="form-input rounded-2xl px-4 py-3"
                                        />
                                    </label>
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={savingPassword}
                                        className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-3 text-sm font-semibold text-fuchsia-100 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {savingPassword ? 'Updating...' : 'Change password'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                                {error}
                            </div>
                        )}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                                onClick={onClose}
                                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default React.memo(ProfileModal);
