
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { playChime } from '../utils/sound';

const QueueContext = createContext(null);

export const QueueProvider = ({ children }) => {
  const [lastEvent, setLastEvent] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws;
    let timer;
    let shouldReconnect = true;

    const connectWs = () => {
      const backendUrl = import.meta.env.VITE_API_URL;

      const wsUrl = backendUrl
        ? `${backendUrl.replace(/\/+$/, '').replace(/^http/, 'ws')}/ws/queue`
        : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/queue`;

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
          // Ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        setConnected(false);

        if (shouldReconnect) {
          timer = setTimeout(connectWs, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    return () => {
      shouldReconnect = false;
      clearTimeout(timer);

      if (ws) {
        ws.close();
      }
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
