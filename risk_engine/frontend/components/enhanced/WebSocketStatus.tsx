'use client';
import { useEffect, useState } from 'react';

export default function WebSocketStatus() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connect = () => {
      try {
        ws = new WebSocket('ws://localhost:8001/ws/risk');
        ws.onopen = () => setConnected(true);
        ws.onclose = () => {
          setConnected(false);
          // Attempt reconnect after 3 seconds
          setTimeout(connect, 3000);
        };
        ws.onerror = () => {
          setConnected(false);
          if (ws) ws.close();
        };
      } catch (e) { 
        setConnected(false); 
      }
    };

    connect();

    return () => {
      if (ws) ws.close();
    };
  }, []);

  return (
    <div style={{position: 'fixed', bottom: '1rem', right: '1rem', padding: '0.5rem 1rem', background: connected ? 'var(--accent-green)' : 'var(--accent-red)', color: connected ? '#000' : '#fff', border: '3px solid #111', boxShadow: '4px 4px 0 #111', fontFamily: 'var(--font-heading)', fontSize: '0.85rem', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '4px'}}>
      <span style={{width: '10px', height: '10px', borderRadius: '50%', background: connected ? '#000' : '#fff', animation: connected ? 'pulse 1.5s infinite' : 'none'}}></span>
      {connected ? 'LIVE_TELEMETRY' : 'DISCONNECTED'}
      <style jsx>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}
