import React, {
  useState,
  createContext,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { apiConfig } from "@/config/api";

type Conn = WebSocket | null;

interface WebSocketContextType {
  conn: Conn;
  connect: (groupId: string) => void;
  disconnect: () => void;
  sendMessage: (content: string) => boolean;
  isConnected: boolean;
}

export const WebsocketContext = createContext<WebSocketContextType>({
  conn: null,
  connect: () => {},
  disconnect: () => {},
  sendMessage: () => false,
  isConnected: false,
});

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [conn, setConn] = useState<Conn>(null);

  /** ---------- REFS (logic only, no renders) ---------- */
  const connRef = useRef<Conn>(null);
  const currentGroupIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectAttemptsRef = useRef(0);
  const reconnectDelayRef = useRef(1000);
  const pendingMessagesRef = useRef<string[]>([]);
  const isConnectingRef = useRef(false);

  const MAX_RECONNECT_ATTEMPTS = 5;

  /** ---------- DERIVED STATE ---------- */
  const isConnected = conn?.readyState === WebSocket.OPEN;

  /** ---------- KEEP REF IN SYNC ---------- */
  useEffect(() => {
    connRef.current = conn;
  }, [conn]);

  /** ---------- DISCONNECT ---------- */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const socket = connRef.current;
    if (socket) {
      // Remove all event listeners first to prevent reconnection attempts
      socket.onopen = null;
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;

      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close(1000, "Client disconnect");
      }
    }

    connRef.current = null;
    setConn(null);
    currentGroupIdRef.current = null;
    reconnectAttemptsRef.current = 0;
    isConnectingRef.current = false;
  }, []);

  /** ---------- CONNECT ---------- */
  const connect = useCallback(
    (groupId: string) => {
      // Prevent multiple simultaneous connection attempts
      if (isConnectingRef.current) {
        return;
      }

      const existing = connRef.current;

      // Already connected to same group and connection is open
      if (
        existing &&
        existing.readyState === WebSocket.OPEN &&
        currentGroupIdRef.current === groupId
      ) {
        return;
      }

      // Switching groups - disconnect old connection completely
      if (existing && currentGroupIdRef.current !== groupId) {
        disconnect();
        // Wait a bit for old connection to fully close
        setTimeout(() => {
          connect(groupId);
        }, 100);
        return;
      }

      // If we have an existing connection in a bad state, clean it up
      if (existing && existing.readyState !== WebSocket.OPEN) {
        disconnect();
      }

      isConnectingRef.current = true;
      currentGroupIdRef.current = groupId;

      const token = localStorage.getItem("token");
      if (!token) {
        isConnectingRef.current = false;
        return;
      }

      // Clean the token - remove "Bearer " prefix if present
      const cleanToken = token.replace(/^Bearer\s+/i, "").trim();

      // If API_BASE_URL is empty (relative URLs in production), use current origin
      let protocol: string;
      let host: string;
      if (!apiConfig.baseURL || apiConfig.baseURL === "") {
        // Production: use current origin with wss/ws based on page protocol
        protocol = window.location.protocol === "https:" ? "wss" : "ws";
        host = window.location.host;
      } else {
        // Local dev: use API_BASE_URL
        protocol = apiConfig.baseURL.startsWith("https") ? "wss" : "ws";
        host = apiConfig.baseURL.replace(/^https?:\/\//, "");
      }

      // OPTION 1: Pass token as query parameter (most reliable)
      const wsUrl = `${protocol}://${host}/api/groups/${groupId}/ws/joinRoom/${groupId}?token=${encodeURIComponent(
        cleanToken
      )}`;

      // Create WebSocket without subprotocol
      const ws = new WebSocket(wsUrl);
      connRef.current = ws;

      ws.onopen = () => {
        // Guard against stale socket
        if (connRef.current !== ws) {
          ws.close();
          return;
        }

        setConn(ws);
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;
        isConnectingRef.current = false;

        // Flush queued messages
        if (pendingMessagesRef.current.length > 0) {
          pendingMessagesRef.current.forEach((msg) => {
            try {
              ws.send(msg);
            } catch {
              // Failed to send queued message
            }
          });
          pendingMessagesRef.current = [];
        }

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onerror = () => {
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        isConnectingRef.current = false;

        // Guard against stale socket
        if (connRef.current !== ws) {
          return;
        }

        setConn(null);

        // Only attempt reconnection if:
        // 1. Close was not clean (unexpected)
        // 2. Close code is not 1000 (normal closure)
        // 3. We haven't exceeded max reconnect attempts
        // 4. We're still supposed to be connected to this group
        const shouldReconnect =
          !event.wasClean &&
          event.code !== 1000 &&
          event.code !== 1001 && // Going away
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS &&
          currentGroupIdRef.current === groupId;

        if (shouldReconnect) {
          const delay = reconnectDelayRef.current;
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectDelayRef.current = Math.min(delay * 2, 30000);
            connect(groupId);
          }, delay);
        }
      };
    },
    [disconnect]
  );

  /** ---------- SEND MESSAGE ---------- */
  const sendMessage = useCallback((content: string): boolean => {
    const socket = connRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      pendingMessagesRef.current.push(content);
      return false;
    }

    try {
      socket.send(content);
      return true;
    } catch {
      pendingMessagesRef.current.push(content);
      return false;
    }
  }, []);

  /** ---------- CLEANUP ---------- */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  /** ---------- PROVIDER ---------- */
  return (
    <WebsocketContext.Provider
      value={{
        conn,
        connect,
        disconnect,
        sendMessage,
        isConnected,
      }}
    >
      {children}
    </WebsocketContext.Provider>
  );
};
