import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { apiConfig } from "@/config/api";
import { useUser } from "./UserContext";

export interface GroupInvitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id?: string;
  role: string;
  status: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  group_name?: string;
}

interface InvitationContextType {
  invitations: GroupInvitation[];
  setInvitations: (invitations: GroupInvitation[]) => void;
  fetchInvitations: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const InvitationContext = createContext<InvitationContextType | undefined>(
  undefined
);

export const useInvitations = () => {
  const context = useContext(InvitationContext);
  if (context === undefined) {
    throw new Error("useInvitations must be used within an InvitationProvider");
  }
  return context;
};

interface InvitationProviderProps {
  children: ReactNode;
}

export const InvitationProvider: React.FC<InvitationProviderProps> = ({
  children,
}) => {
  const { user } = useUser();
  const [invitations, setInvitationsState] = useState<GroupInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!user?.token) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(apiConfig.invitations.list, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          (data as { error?: string }).error || "Failed to fetch invitations"
        );
      }

      const data = await response.json();
      setInvitationsState(
        (data as { invitations: GroupInvitation[] }).invitations || []
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch invitations";
      setError(errorMessage);
      console.error("Error fetching invitations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.token]);

  const setInvitations = useCallback((invitationsData: GroupInvitation[]) => {
    setInvitationsState(invitationsData);
  }, []);

  return (
    <InvitationContext.Provider
      value={{
        invitations,
        setInvitations,
        fetchInvitations,
        isLoading,
        error,
      }}
    >
      {children}
    </InvitationContext.Provider>
  );
};
