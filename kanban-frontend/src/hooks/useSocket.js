import { useEffect, useRef, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/';
const SOCKET_BASE_URL = import.meta.env.VITE_WS_BASE_URL || API_BASE_URL
    .replace(/^https:/, 'wss:')
    .replace(/^http:/, 'ws:')
    .replace(/\/$/, '');

export const useSocket = (boardId, onMessage) => {
    const socketRef = useRef(null);
    const callbackRef = useRef(onMessage);
    const reconnectTimeoutRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState('connecting');

    useEffect(() => {
        callbackRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!boardId) return;

        let isActive = true;

        const connect = () => {
            setConnectionState('connecting');
            const socket = new WebSocket(`${SOCKET_BASE_URL}/ws/boards/${boardId}/`);
            socketRef.current = socket;

            socket.onopen = () => {
                if (!isActive) return;
                setIsConnected(true);
                setConnectionState('connected');
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (callbackRef.current) {
                    callbackRef.current(data);
                }
            };

            socket.onerror = () => {
                if (!isActive) return;
                setIsConnected(false);
                setConnectionState('error');
            };

            socket.onclose = () => {
                if (!isActive) return;
                setIsConnected(false);
                setConnectionState('disconnected');
                reconnectTimeoutRef.current = window.setTimeout(connect, 2500);
            };
        };

        connect();

        return () => {
            isActive = false;
            setIsConnected(false);
            setConnectionState('disconnected');
            if (reconnectTimeoutRef.current) {
                window.clearTimeout(reconnectTimeoutRef.current);
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [boardId]);

    const sendMessage = (message, type = 'update') => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ message, type }));
        }
    };

    return { sendMessage, isConnected, connectionState };
};
