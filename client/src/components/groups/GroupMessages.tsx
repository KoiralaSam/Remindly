import { FC, useState, useEffect, useRef } from "react";
import { useGroups } from "@/context/GroupContext";
import { useUser } from "@/context/UserContext";
import { useMessages } from "@/context/MessageContext";
import { MessageTemplate } from "@/components/messages/MessageTemplate";
import { apiConfig } from "@/config/api";

interface GroupMessagesProps {
  groupId: string;
}

export const GroupMessages: FC<GroupMessagesProps> = ({ groupId }) => {
  const { groups } = useGroups();
  const { user } = useUser();
  const { getGroupMessages, addMessageToGroup } = useMessages();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  const group = groups.find((g) => g.id === groupId);

  // Join WebSocket room when group is selected
  useEffect(() => {
    if (!groupId || !user) return;

    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    // Clean token (remove Bearer prefix if present)
    const cleanToken = token.replace(/^Bearer\s+/i, "").trim();

    const wsProtocol = apiConfig.baseURL.startsWith("https") ? "wss" : "ws";
    const host = apiConfig.baseURL.replace(/^https?:\/\//, "");
    const wsUrl = `${wsProtocol}://${host}/api/groups/${groupId}/ws/joinRoom/${groupId}`;

    // Pass token as protocol (maps to Sec-WebSocket-Protocol header)
    // Backend middleware checks Sec-WebSocket-Protocol header for token
    const ws = new WebSocket(wsUrl, cleanToken);

    ws.onmessage = (event) => {
      try {
        const receivedMessage = JSON.parse(event.data);
        setMessages((prev) => [...prev, receivedMessage]);
      } catch (err) {
        // Silently handle parse errors
      }
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        // Only close if connection is open or connecting
        if (
          wsRef.current.readyState === WebSocket.CONNECTING ||
          wsRef.current.readyState === WebSocket.OPEN
        ) {
          wsRef.current.close(1000, "Component unmounting");
        }
        wsRef.current = null;
      }
    };
  }, [groupId, user]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!groupId) return;

      try {
        const fetchedMessages = await getGroupMessages(groupId);
        setMessages(fetchedMessages);
      } catch (err) {
        // Silently handle fetch errors
      }
    };

    if (groupId) {
      fetchMessages();
    }
  }, [groupId, getGroupMessages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user || !groupId) return;

    try {
      setIsSending(true);

      // Get auth token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No auth token found");
      }

      // Send message to WebSocket endpoint
      const response = await fetch(
        `${apiConfig.baseURL}/api/groups/${groupId}/ws/rooms/${groupId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            content: content.trim(),
          }),
        }
      );

      const responseData = await response.json();

      // Only add message if statusOk is true
      if (responseData.statusOk) {
        const newMessage = responseData.data;
        // Add message to context
        addMessageToGroup(groupId, newMessage);
        setMessages([...messages, newMessage]);
        setMessage(""); // Clear input after successful send
      } else {
        throw new Error(responseData.message || "Failed to send message");
      }
    } catch (err) {
      // Silently handle send errors
    } finally {
      setIsSending(false);
    }
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  return (
    <MessageTemplate
      group={{
        id: group.id,
        name: group.name,
        description: group.description,
      }}
      messages={messages}
      message={message}
      onMessageChange={setMessage}
      onSendMessage={handleSendMessage}
      isSending={isSending}
    />
  );
};
