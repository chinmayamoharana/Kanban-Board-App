import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, CircleAlert, Info, Loader2, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_TYPES = {
    success: {
        icon: CheckCircle2,
        ring: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100',
    },
    error: {
        icon: CircleAlert,
        ring: 'border-rose-400/25 bg-rose-500/10 text-rose-100',
    },
    info: {
        icon: Info,
        ring: 'border-cyan-400/25 bg-cyan-500/10 text-cyan-100',
    },
    loading: {
        icon: Loader2,
        ring: 'border-white/15 bg-white/8 text-slate-100',
    },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());

    const removeToast = useCallback((id) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
        const timer = timersRef.current.get(id);
        if (timer) {
            window.clearTimeout(timer);
            timersRef.current.delete(id);
        }
    }, []);

    const pushToast = useCallback((message, type = 'info', options = {}) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const toast = {
            id,
            message,
            type,
        };

        setToasts((current) => [toast, ...current].slice(0, 4));

        if (options.duration !== 0) {
            const duration = options.duration ?? 3200;
            const timer = window.setTimeout(() => removeToast(id), duration);
            timersRef.current.set(id, timer);
        }

        return id;
    }, [removeToast]);

    useEffect(() => () => {
        timersRef.current.forEach((timer) => window.clearTimeout(timer));
        timersRef.current.clear();
    }, []);

    const value = useMemo(() => ({
        success: (message, options) => pushToast(message, 'success', options),
        error: (message, options) => pushToast(message, 'error', options),
        info: (message, options) => pushToast(message, 'info', options),
        loading: (message, options) => pushToast(message, 'loading', { ...options, duration: 0 }),
        dismiss: removeToast,
    }), [pushToast, removeToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(92vw,22rem)] flex-col gap-3">
                <AnimatePresence>
                    {toasts.map((toast) => {
                        const config = TOAST_TYPES[toast.type] || TOAST_TYPES.info;
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: -14, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                                transition={{ duration: 0.22 }}
                                className={`pointer-events-auto rounded-3xl border px-4 py-3 shadow-2xl shadow-slate-950/35 backdrop-blur-xl ${config.ring}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 rounded-full border border-white/10 bg-white/10 p-2">
                                        <Icon size={16} className={toast.type === 'loading' ? 'animate-spin' : undefined} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold">{toast.message}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeToast(toast.id)}
                                        className="rounded-full p-1 text-current/70 transition hover:bg-white/10 hover:text-white"
                                        aria-label="Dismiss toast"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
