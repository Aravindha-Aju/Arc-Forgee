'use client';
import { useEffect, useState, useRef } from 'react';

export function useWebSocket(url: string) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => setConnected(false);
      ws.onmessage = (event) => {
        try {
          setLastMessage(JSON.parse(event.data));
        } catch (e) {
          setLastMessage(event.data);
        }
      };

      return () => ws.close();
    } catch (e) {
      setConnected(false);
    }
  }, [url]);

  return { connected, lastMessage, ws: wsRef.current };
}
