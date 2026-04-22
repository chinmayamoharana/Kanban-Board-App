import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { register } = useAuth();

    const formatRegisterError = (responseData) => {
        if (!responseData) {
            return 'Registration failed. Please try again.';
        }

        const usernameError = responseData.username?.[0];
        const emailError = responseData.email?.[0];
        const passwordError = responseData.password?.[0];
        const detailError = responseData.detail;

        const messages = [usernameError, emailError, passwordError, detailError].filter(Boolean);
        if (messages.length) {
            return messages.join(' ');
        }

        return Object.values(responseData).flat().filter(Boolean).join(' ') || 'Registration failed. Please try again.';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            await register(formData);
            navigate('/');
        } catch (err) {
            setError(formatRegisterError(err.response?.data));
        }
    };

    return (
        <div className="page-shell min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-stretch gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="glass-panel surface-card order-2 flex items-center rounded-[32px] p-6 sm:p-8 lg:order-1 lg:p-10"
                >
                    <div className="w-full">
                        <div className="mb-8">
                            <p className="text-xs uppercase tracking-[0.32em] text-fuchsia-200/75">Create account</p>
                            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Start building a smoother workflow.</h1>
                            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                                Set up your workspace in minutes and get a board system that feels responsive, lively, and easy to use on every screen.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                                <UserPlus className="text-cyan-300" size={20} />
                                <p className="mt-4 text-sm font-semibold text-white">Fast setup</p>
                                <p className="mt-1 text-xs leading-5 text-slate-400">Create your account and jump in quickly.</p>
                            </div>
                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                                <ShieldCheck className="text-emerald-300" size={20} />
                                <p className="mt-4 text-sm font-semibold text-white">Protected</p>
                                <p className="mt-1 text-xs leading-5 text-slate-400">Built to feel secure and dependable.</p>
                            </div>
                            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                                <Sparkles className="text-fuchsia-300" size={20} />
                                <p className="mt-4 text-sm font-semibold text-white">Polished</p>
                                <p className="mt-1 text-xs leading-5 text-slate-400">Motion and spacing that feel intentionally designed.</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
                    className="order-1 flex items-center lg:order-2"
                >
                    <div className="glass-panel surface-card relative w-full overflow-hidden rounded-[32px] p-6 shadow-2xl shadow-slate-950/30 sm:p-8 lg:p-10">
                        <div className="hero-orb hero-orb--teal left-[-3rem] top-[-3rem] h-36 w-36" />
                        <div className="hero-orb hero-orb--pink right-[-2rem] bottom-[-3rem] h-48 w-48" />

                        <div className="relative mb-8">
                            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-fuchsia-100">
                                <Sparkles size={14} />
                                Join KanbanFlow
                            </div>
                            <h2 className="mt-4 text-3xl font-bold text-white">Create your account</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-300">A quick setup for organizing tasks, teams, and realtime board updates.</p>
                        </div>

                        <form className="grid gap-4" onSubmit={handleSubmit}>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                                >
                                    {error}
                                </motion.div>
                            )}
                            <input
                                type="text"
                                required
                                className="form-input rounded-2xl px-4 py-3 text-sm sm:text-base"
                                placeholder="Username"
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                            <input
                                type="email"
                                required
                                className="form-input rounded-2xl px-4 py-3 text-sm sm:text-base"
                                placeholder="Email"
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    className="form-input w-full rounded-2xl px-4 py-3 pr-12 text-sm sm:text-base"
                                    placeholder="Password"
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    aria-pressed={showPassword}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <button
                                type="submit"
                                className="group rounded-2xl bg-fuchsia-500 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-fuchsia-400"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Register
                                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                                </span>
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold text-fuchsia-200 transition hover:text-fuchsia-100">
                                Login
                            </Link>
                        </p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

export default Register;
