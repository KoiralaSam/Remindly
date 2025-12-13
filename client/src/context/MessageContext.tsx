import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { apiConfig } from '@/config/api';

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface GroupMessages {
  [groupId: string]: Message[];
}

interface MessageContextType {
  // Get all messages for a specific group (fetches from API and caches)
  getGroupMessages: (groupId: string) => Promise<Message[]>;
  
  // Add messages to a group
  addMessagesToGroup: (groupId: string, messages: Message[]) => void;
  
  // Add a single message to a group
  addMessageToGroup: (groupId: string, message: Message) => void;
  
  // Replace all messages for a group (used when loading)
  setGroupMessages: (groupId: string, messages: Message[]) => void;
  
  // Clear messages for a specific group
  clearGroupMessages: (groupId: string) => void;
  
  // Clear all messages across all groups
  clearAllMessages: () => void;
  
  // Remove a specific message from a group
  removeMessageFromGroup: (groupId: string, messageId: string) => void;
  
  // Update a message in a group
  updateMessageInGroup: (groupId: string, messageId: string, updates: Partial<Message>) => void;
  
  // Get cached messages (synchronous)
  getCachedMessages: (groupId: string) => Message[];
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [groupMessages, setGroupMessagesState] = useState<GroupMessages>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCachedMessages = useCallback((groupId: string): Message[] => {
    return groupMessages[groupId] || [];
  }, [groupMessages]);

  const getGroupMessages = useCallback(
    async (groupId: string): Promise<Message[]> => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const url = `${apiConfig.websocket.roomMessages(groupId)}?limit=50&offset=0`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.statusText}`);
        }

        const data = await response.json() as { messages: Message[] };
        const messages = data.messages || [];

        // Store messages in context
        setGroupMessagesState((prev) => ({
          ...prev,
          [groupId]: messages,
        }));

        setIsLoading(false);
        return messages;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    []
  );

  const addMessagesToGroup = useCallback((groupId: string, messages: Message[]) => {
    setGroupMessagesState((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), ...messages],
    }));
  }, []);

  const addMessageToGroup = useCallback((groupId: string, message: Message) => {
    setGroupMessagesState((prev) => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), message],
    }));
  }, []);

  const setGroupMessages = useCallback((groupId: string, messages: Message[]) => {
    setGroupMessagesState((prev) => ({
      ...prev,
      [groupId]: messages,
    }));
  }, []);

  const clearGroupMessages = useCallback((groupId: string) => {
    setGroupMessagesState((prev) => {
      const updated = { ...prev };
      delete updated[groupId];
      return updated;
    });
  }, []);

  const clearAllMessages = useCallback(() => {
    setGroupMessagesState({});
  }, []);

  const removeMessageFromGroup = useCallback((groupId: string, messageId: string) => {
    setGroupMessagesState((prev) => ({
      ...prev,
      [groupId]: (prev[groupId] || []).filter((msg) => msg.id !== messageId),
    }));
  }, []);

  const updateMessageInGroup = useCallback(
    (groupId: string, messageId: string, updates: Partial<Message>) => {
      setGroupMessagesState((prev) => ({
        ...prev,
        [groupId]: (prev[groupId] || []).map((msg) =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        ),
      }));
    },
    []
  );

  const value: MessageContextType = {
    getGroupMessages,
    addMessagesToGroup,
    addMessageToGroup,
    setGroupMessages,
    clearGroupMessages,
    clearAllMessages,
    removeMessageFromGroup,
    updateMessageInGroup,
    getCachedMessages,
    isLoading,
    error,
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};
