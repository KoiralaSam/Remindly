import React, {
  createContext,
  useContext,
  ReactNode,
  useCallback,
} from "react";

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  username: string;
  created_at: string;
  updated_at: string;
}

interface MessageContextType {
  // Clear all messages across all groups
  clearAllMessages: () => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error("useMessages must be used within a MessageProvider");
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({
  children,
}) => {
  const clearAllMessages = useCallback(() => {
    // No-op for now, can be extended if needed
    console.log("clearAllMessages called");
  }, []);

  const value: MessageContextType = {
    clearAllMessages,
  };

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
};
