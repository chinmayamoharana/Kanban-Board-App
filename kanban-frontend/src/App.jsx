import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BoardPage = lazy(() => import('./components/Board/BoardPage'));

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center px-4 text-white">
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel rounded-[28px] px-8 py-10 text-center"
                >
                    <div className="mx-auto h-12 w-12 animate-soft-pulse rounded-full bg-cyan-400/20" />
                    <p className="mt-4 text-sm uppercase tracking-[0.32em] text-cyan-200/70">Loading workspace</p>
                </motion.div>
            </div>
        );
    }
    if (!user) return <Navigate to="/login" />;
    return (
        <>
            <Navbar />
            {children}
        </>
    );
};

function AppContent() {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Suspense
                fallback={
                    <div className="flex min-h-screen items-center justify-center px-4 text-white">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-panel rounded-[28px] px-8 py-10 text-center"
                        >
                            <div className="mx-auto h-12 w-12 animate-soft-pulse rounded-full bg-cyan-400/20" />
                            <p className="mt-4 text-sm uppercase tracking-[0.32em] text-cyan-200/70">Loading workspace</p>
                        </motion.div>
                    </div>
                }
            >
                <Routes location={location} key={location.pathname}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/board/:id" element={
                        <ProtectedRoute>
                            <BoardPage />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
