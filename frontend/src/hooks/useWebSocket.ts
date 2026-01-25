import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaygroundStore } from '../store/playgroundStore';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | undefined>(undefined);
  const { setUserId, setUserContainer, setConnected } = usePlaygroundStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket('ws://localhost:3000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'container_ready') {
            setUserId(data.userId);
            setUserContainer({ image: data.image, publicPort: data.publicPort });
          }
        } catch {
          console.log('WS message:', event.data);
        }
      };

ws.onclose = () => {
        setIsConnected(false);
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
    }
  }, [setUserId, setUserContainer, setConnected]);

  const sendTerminalData = useCallback((terminalId: string, data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'data', terminalId, data }));
    }
  }, []);

  const createTerminal = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'new_terminal' }));
    }
  }, []);

  const resizeTerminal = useCallback((terminalId: string, cols: number, rows: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'resize', terminalId, cols, rows }));
    }
  }, []);

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, []);

  return { connect, sendTerminalData, createTerminal, resizeTerminal, isConnected };
}
