import React, {
  useState,
  createContext,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { apiConfig } from "@/config/api";

type SignalingConn = WebSocket | null;

export interface SignalingMessage {
  id: string;
  type: string;
  room_id: string;
  sender_id: string;
  target_id: string;
  username: string;
  data?: any;
  timestamp: string;
}

interface SignalingContextType {
  conn: SignalingConn;
  connect: (groupId: string) => void;
  disconnect: () => void;
  sendSignal: (
    message: Omit<
      SignalingMessage,
      "id" | "room_id" | "sender_id" | "created_at" | "username"
    >
  ) => boolean;
  isConnected: boolean;
  onMessage?: (message: SignalingMessage) => void;
  setOnMessage: (handler: (message: SignalingMessage) => void) => void;
}

export const SignalingContext = createContext<SignalingContextType>({
  conn: null,
  connect: () => {},
  disconnect: () => {},
  sendSignal: () => false,
  isConnected: false,
  onMessage: undefined,
  setOnMessage: () => {},
});

export const SignalingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [conn, setConn] = useState<SignalingConn>(null);
  const connRef = useRef<SignalingConn>(null);
  const currentGroupIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const reconnectAttemptsRef = useRef(0);
  const reconnectDelayRef = useRef(1000);
  const isConnectingRef = useRef(false);
  const onMessageHandlerRef = useRef<
    ((message: SignalingMessage) => void) | null
  >(null);

  const MAX_RECONNECT_ATTEMPTS = 5;

  const isConnected = conn?.readyState === WebSocket.OPEN;

  // Debug connection state
  useEffect(() => {
    if (conn) {
      console.log("🔌 Connection state changed:", {
        readyState: conn.readyState,
        isOpen: conn.readyState === WebSocket.OPEN,
        isConnected,
        url: conn.url?.replace(/token=[^&]+/, "token=***"),
      });
    } else {
      console.log("🔌 Connection is null");
    }
  }, [conn, isConnected]);

  useEffect(() => {
    connRef.current = conn;
  }, [conn]);

  const disconnect = useCallback(() => {
    console.log("🎥 Signaling disconnect() called");

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const socket = connRef.current;
    if (socket) {
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

  const connect = useCallback(
    (groupId: string) => {
      console.log("🎥🎥🎥 SIGNALING CONNECT FUNCTION EXECUTING 🎥🎥🎥");
      console.log("🎥 Signaling connect() called with groupId:", groupId);
      console.log("🎥 isConnectingRef.current:", isConnectingRef.current);
      console.log(
        "🎥 connRef.current:",
        !!connRef.current,
        connRef.current?.readyState
      );

      if (isConnectingRef.current) {
        console.log("🎥 Signaling already connecting, skipping...");
        return;
      }

      const existing = connRef.current;

      if (
        existing &&
        existing.readyState === WebSocket.OPEN &&
        currentGroupIdRef.current === groupId
      ) {
        console.log("🎥 Signaling already connected to this group");
        return;
      }

      if (existing && currentGroupIdRef.current !== groupId) {
        console.log(
          "🎥 Signaling switching groups, disconnecting old connection"
        );
        disconnect();
        setTimeout(() => {
          connect(groupId);
        }, 100);
        return;
      }

      if (existing && existing.readyState !== WebSocket.OPEN) {
        console.log("🎥 Signaling cleaning up stale connection");
        disconnect();
      }

      isConnectingRef.current = true;
      currentGroupIdRef.current = groupId;

      const token = localStorage.getItem("token");
      if (!token) {
        console.error("🎥 Signaling: no auth token");
        isConnectingRef.current = false;
        return;
      }

      const cleanToken = token.replace(/^Bearer\s+/i, "").trim();
      // Use groupId as roomId for signaling (they're the same in our case)
      const wsUrl = `${apiConfig.signaling.ws(
        groupId,
        groupId
      )}?token=${encodeURIComponent(cleanToken)}`;

      console.log(
        "🎥 Signaling connecting →",
        wsUrl.replace(/token=[^&]+/, "token=***")
      );
      console.log("🎥 Full WebSocket URL (for debugging):", wsUrl);

      const ws = new WebSocket(wsUrl);
      console.log("🎥 WebSocket instance created, readyState:", ws.readyState);
      connRef.current = ws;

      // Store connection globally for checking (temporary debugging)
      (window as any).__signalingConn = ws;

      ws.onopen = () => {
        console.log("🎥 Signaling WS OPEN ✅", ws.url);
        console.log(
          "🎥 WebSocket readyState:",
          ws.readyState,
          "OPEN =",
          WebSocket.OPEN
        );

        if (connRef.current !== ws) {
          console.log("🎥 Signaling stale socket detected in onopen, closing");
          ws.close();
          return;
        }

        console.log("🎥 Signaling connected to group:", groupId);
        setConn(ws);
        reconnectAttemptsRef.current = 0;
        reconnectDelayRef.current = 1000;
        isConnectingRef.current = false;

        // Verify connection state after setting
        setTimeout(() => {
          console.log("🎥 Connection state after setConn:", {
            conn: !!connRef.current,
            readyState: connRef.current?.readyState,
            isOpen: connRef.current?.readyState === WebSocket.OPEN,
          });
        }, 100);

        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: SignalingMessage = JSON.parse(event.data);
          if (onMessageHandlerRef.current) {
            onMessageHandlerRef.current(message);
          }
        } catch (err) {
          // Error parsing signaling message
        }
      };

      ws.onerror = (err) => {
        console.error("🎥 Signaling WebSocket error:", err);
        console.error("🎥 WebSocket error details:", {
          readyState: ws.readyState,
          url: ws.url?.replace(/token=[^&]+/, "token=***"),
          error: err,
        });
        isConnectingRef.current = false;
      };

      ws.onclose = (event) => {
        console.log("🎥 Signaling WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          groupId: currentGroupIdRef.current,
        });

        // Log close code meanings
        if (event.code === 1006) {
          console.error(
            "🎥 WebSocket closed abnormally (1006) - connection failed"
          );
        } else if (event.code === 1002) {
          console.error("🎥 WebSocket closed (1002) - protocol error");
        } else if (event.code === 1003) {
          console.error("🎥 WebSocket closed (1003) - unsupported data");
        } else if (event.code >= 4000) {
          console.error(
            "🎥 WebSocket closed with custom code:",
            event.code,
            "- likely server error"
          );
        }

        isConnectingRef.current = false;

        if (connRef.current !== ws) {
          console.log(
            "🎥 Signaling stale socket detected in onclose, ignoring"
          );
          return;
        }

        setConn(null);

        const shouldReconnect =
          !event.wasClean &&
          event.code !== 1000 &&
          event.code !== 1001 &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS &&
          currentGroupIdRef.current === groupId;

        if (shouldReconnect) {
          const delay = reconnectDelayRef.current;
          reconnectAttemptsRef.current += 1;

          console.log(
            `🎥 Signaling reconnecting (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectDelayRef.current = Math.min(delay * 2, 30000);
            connect(groupId);
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.error("🎥 Signaling max reconnection attempts reached");
        }
      };
    },
    [disconnect]
  );

  const sendSignal = useCallback(
    (
      message: Omit<
        SignalingMessage,
        "id" | "room_id" | "sender_id" | "created_at" | "username"
      >
    ): boolean => {
      const socket = connRef.current;

      console.log("🎥 Signaling sendSignal called:", {
        type: message.type,
        targetId: message.target_id,
        hasSocket: !!socket,
        readyState: socket?.readyState,
      });

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.warn("🎥 Signaling not ready");
        return false;
      }

      try {
        socket.send(JSON.stringify(message));
        console.log("✅ Signaling message sent:", message.type);
        return true;
      } catch (err) {
        console.error("🎥 Signaling send failed:", err);
        return false;
      }
    },
    []
  );

  const setOnMessage = useCallback(
    (handler: (message: SignalingMessage) => void) => {
      onMessageHandlerRef.current = handler;
    },
    []
  );

  useEffect(() => {
    return () => {
      console.log("🎥 Signaling provider unmounting, cleaning up");
      disconnect();
    };
  }, [disconnect]);

  return (
    <SignalingContext.Provider
      value={{
        conn,
        connect,
        disconnect,
        sendSignal,
        isConnected,
        onMessage: onMessageHandlerRef.current || undefined,
        setOnMessage,
      }}
    >
      {children}
    </SignalingContext.Provider>
  );
};
