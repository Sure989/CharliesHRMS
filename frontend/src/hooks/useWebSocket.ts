import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketOptions {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  protocols?: string | string[];
}

export function useWebSocket<T = any>(
  url: string | (() => string),
  {
    onOpen,
    onClose,
    onError,
    protocols,
  }: WebSocketOptions = {}
): [T | null, boolean, boolean, ((data: any) => void)] {
  const [data, setData] = useState<T | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);

  const send = useCallback((msg: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    const wsUrl = typeof url === 'function' ? url() : url;
    // ...existing code...
    
    const ws = new WebSocket(wsUrl, protocols);
    wsRef.current = ws;

    ws.onopen = (event) => {
      // ...existing code...
      setConnected(true);
      setLoading(false);
      onOpen?.(event);
    };
    
    ws.onclose = (event) => {
      // ...existing code...
      setConnected(false);
      setLoading(false);
      onClose?.(event);
    };
    
    ws.onerror = (event) => {
      // ...existing code...
      setLoading(false);
      setConnected(false);
      onError?.(event);
    };
    
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        // ...existing code...
        setData(parsed);
      } catch (err) {
        // ...existing code...
        setData(event.data as T);
      }
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof url === 'function' ? url() : url]);

  return [data, connected, loading, send];
}
