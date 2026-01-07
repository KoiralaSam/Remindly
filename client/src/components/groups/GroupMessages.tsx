import { FC, useState, useEffect, useRef, useContext } from "react";
import { useGroups } from "@/context/GroupContext";
import { useUser } from "@/context/UserContext";
import { WebsocketContext } from "@/context/WebSocketContext";
import { MessageTemplate } from "@/components/messages/MessageTemplate";
import { apiConfig } from "@/config/api";
import { Message } from "@/context/MessageContext";
interface GroupMessagesProps {
  groupId: string;
}

export const GroupMessages: FC<GroupMessagesProps> = ({ groupId }) => {
  const { groups } = useGroups();
  const { user } = useUser();
  const { conn, connect, sendMessage } = useContext(WebsocketContext);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const group = groups.find((g) => g.id === groupId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Normalize WebSocket message to Message format
  const normalizeMessage = (wsMessage: any): Message => {
    return {
      id: wsMessage.id,
      room_id: wsMessage.room_id || wsMessage.roomId || groupId,
      user_id: wsMessage.user_id || wsMessage.userId,
      content: wsMessage.content,
      username: wsMessage.username,
      created_at:
        wsMessage.created_at || wsMessage.createdAt || new Date().toISOString(),
      updated_at:
        wsMessage.updated_at ||
        wsMessage.updatedAt ||
        wsMessage.created_at ||
        wsMessage.createdAt ||
        new Date().toISOString(),
    };
  };

  useEffect(() => {
    // Component mounted
  }, [groupId, user]);

  // Fetch initial messages from DB
  useEffect(() => {
    if (!groupId || !user) return;

    const fetchMessages = async () => {
      try {
        setIsLoading(true);

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No auth token found");
        }

        const messagesUrl = `${apiConfig.websocket.roomMessages(
          groupId
        )}?limit=50&offset=0`;
        const messagesResponse = await fetch(messagesUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!messagesResponse.ok) {
          throw new Error("Failed to fetch messages");
        }

        const messagesData = await messagesResponse.json();
        const initialMessages = messagesData.messages || [];
        setMessages(initialMessages);
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [groupId, user]);

  useEffect(() => {
    if (!groupId || !user) return;

    connect(groupId);

    // no cleanup needed
  }, [groupId, user, connect]);

  // Listen for incoming WebSocket messages (GroupMessages only listens)
  useEffect(() => {
    if (!conn) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const wsMessage = JSON.parse(event.data);

        // Skip system messages like "user joined/left"
        if (
          wsMessage.content === "A new user has joined the room" ||
          wsMessage.content?.includes("has joined the chat") ||
          wsMessage.content?.includes("has left the chat")
        ) {
          return;
        }

        const normalizedMessage = normalizeMessage(wsMessage);

        setMessages((prev) => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some((msg) => msg.id === normalizedMessage.id);
          if (exists) {
            return prev;
          }

          // Check if this matches an optimistic message and replace it
          const optimisticIndex = prev.findIndex(
            (msg) =>
              msg.id?.startsWith("temp-") &&
              msg.user_id === normalizedMessage.user_id &&
              msg.content === normalizedMessage.content &&
              Math.abs(
                new Date(msg.created_at).getTime() -
                  new Date(normalizedMessage.created_at).getTime()
              ) < 5000
          );

          if (optimisticIndex !== -1) {
            // Replace optimistic message with real one
            const updated = [...prev];
            updated[optimisticIndex] = normalizedMessage;
            return updated;
          }

          // Add new message
          return [...prev, normalizedMessage];
        });
      } catch {
        // Error parsing WebSocket message
      }
    };

    conn.addEventListener("message", handleMessage);

    return () => {
      conn.removeEventListener("message", handleMessage);
    };
  }, [conn]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user || !groupId) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const now = new Date().toISOString();

    const optimisticMessage: Message = {
      id: tempId,
      room_id: groupId,
      user_id: user.id,
      username: user.name || user.email || "Unknown",
      content: content.trim(),
      created_at: now,
      updated_at: now,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessage("");
    setIsSending(true);

    const success = sendMessage(content.trim());

    if (!success) {
      // Provider queued it — optimistic UI stays
      setIsSending(false);
      return;
    }

    setIsSending(false);
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading messages...</p>
      </div>
    );
  }

  return (
    <>
      <MessageTemplate
        group={{
          id: group.id,
          name: group.name,
          description: group.description,
          type: group.type,
        }}
        messages={messages}
        message={message}
        onMessageChange={setMessage}
        onSendMessage={handleSendMessage}
        isSending={isSending}
      />
      <div ref={messagesEndRef} />
    </>
  );
};
