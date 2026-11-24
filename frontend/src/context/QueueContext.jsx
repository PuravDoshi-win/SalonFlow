import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { playChime } from '../utils/sound';

const QueueContext = createContext(null);

export const QueueProvider = ({ children }) => {
  const [lastEvent, setLastEvent] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws;
    let timer;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/queue`;
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);
          if (data.event === 'CUSTOMER_CALLED') {
            playChime();
          }
        } catch (e) {
          // Non-JSON ping message
        }
      };

      ws.onclose = () => {
        setConnected(false);
        // Auto-reconnect after 3 seconds
        timer = setTimeout(connectWs, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    return () => {
      clearTimeout(timer);
      if (ws) ws.close();
    };
  }, []);

  return (
    <QueueContext.Provider value={{ lastEvent, connected }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueueSocket = () => {
  return useContext(QueueContext);
};
