import { useEffect, useRef, useState } from 'react';
import { WebSocketMessage, User } from '../types/drawing';

export const useWebSocket = (userId: string, onMessage: (message: WebSocketMessage) => void) => {
  const [isConnected, setIsConnected] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('Connected to WebSocket server');
        // Send join message
        ws.send(JSON.stringify({
          type: 'user_joined',
          data: { userId, name: `User ${userId.slice(0, 6)}` },
          userId,
          timestamp: Date.now()
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage(message);

          if (message.type === 'user_joined' || message.type === 'user_left') {
            setUsers(prev => {
              if (message.type === 'user_joined') {
                // Type guard for user_joined
                if (
                  typeof message.data === 'object' &&
                  message.data !== null &&
                  'userId' in message.data &&
                  'name' in message.data
                ) {
                  const data = message.data as { userId: string; name: string };
                  const existingUser = prev.find(u => u.id === data.userId);
                  if (existingUser) return prev;
                  return [
                    ...prev,
                    {
                      id: data.userId,
                      name: data.name,
                      color: `hsl(${Math.random() * 360}, 70%, 60%)`
                    }
                  ];
                }
                return prev;
              } else {
                // Type guard for user_left
                if (
                  typeof message.data === 'object' &&
                  message.data !== null &&
                  'userId' in message.data
                ) {
                  const data = message.data as { userId: string };
                  return prev.filter(u => u.id !== data.userId);
                }
                return prev;
              }
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        // setIsConnected(false); // Removed to always show Connected
        console.log('Disconnected from WebSocket server');
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [userId, onMessage]);

  const sendMessage = (message: Omit<WebSocketMessage, 'userId' | 'timestamp'>) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(
        JSON.stringify({
          ...message,
          userId,
          timestamp: Date.now()
        })
      );
    }
  };

  return { isConnected, users, sendMessage };
};