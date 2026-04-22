import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Sparkles, ShieldCheck, LayoutGrid } from 'lucide-react';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError('');
            await login(credentials);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check your username and password.');
        }
    };

    return (
        <div className="page-shell min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <motion.section
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className="glass-panel relative overflow-hidden rounded-[32px] p-6 sm:p-8 lg:p-10"
                >
                    <div className="hero-orb hero-orb--teal left-[-4rem] top-[-4rem] h-40 w-40" />
                    <div className="hero-orb hero-orb--pink right-[-2rem] bottom-[-3rem] h-52 w-52" />
                    <div className="relative flex h-full flex-col justify-between gap-10">
                        <div className="max-w-xl">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                                <Sparkles size={14} />
                                Welcome back
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                                Your boards, ideas, and team energy in one place.
                            </h1>
                            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                                Sign in to jump back into a workspace that feels fast, animated, and ready for both focused work and quick collaboration.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="surface-card rounded-[24px] border border-white/10 bg-white/5 p-4">
                                <LayoutGrid className="text-cyan-300" size={20} />
                                <p className="mt-4 text-sm font-semibold text-white">Boards</p>
                                <p className="mt-1 text-xs leading-5 text-slate-400">Keep every project visible and easy to move.</p>
                            </div>
                            <div className="surface-card rounded-[24px] border border-white/10 bg-white/5 p-4">
                                <ShieldCheck className="text-emerald-300" size={20} />
                                <p className="mt-4 text-sm font-semibold text-white">Secure</p>
                                <p className="mt-1 text-xs leading-5 text-slate-400">Authentication is kept simple and protected.</p>
                            </div>
                            <div className="surface-card rounded-[24px] border border-white/10 bg-white/5 p-4">
                                <ArrowRight className="text-fuchsia-300" size={20} />
                                <p className="mt-4 text-sm font-semibold text-white">Live</p>
                                <p className="mt-1 text-xs leading-5 text-slate-400">Realtime updates help the team stay in sync.</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
                    className="flex items-center"
                >
                    <div className="glass-panel surface-card w-full rounded-[32px] p-6 shadow-2xl shadow-slate-950/30 sm:p-8 lg:p-10">
                        <div className="mb-8">
                            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Sign in</p>
                            <h2 className="mt-3 text-3xl font-bold text-white">Jump back into your workspace</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-300">Use your username and password to continue where you left off.</p>
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
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                            />
                            <div className="grid gap-2">
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        className="form-input w-full rounded-2xl px-4 py-3 pr-12 text-sm sm:text-base"
                                        placeholder="Password"
                                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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
                            </div>
                            <button
                                type="submit"
                                className="group rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition duration-300 hover:-translate-y-0.5 hover:bg-cyan-300"
                            >
                                <span className="flex items-center justify-center gap-2">
                                    Sign In
                                    <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                                </span>
                            </button>
                        </form>

                        <p className="mt-6 text-center text-sm text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="font-semibold text-cyan-300 transition hover:text-cyan-200">
                                Register
                            </Link>
                        </p>
                    </div>
                </motion.section>
            </div>
        </div>
    );
};

export default Login;
