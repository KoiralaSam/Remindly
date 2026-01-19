import { FC, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useInvitations, GroupInvitation } from "@/context/InvitationContext";
import { useGroups } from "@/context/GroupContext";
import { apiConfig } from "@/config/api";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Check, X, Mail } from "lucide-react";
import { useGroupMembers } from "@/context/GroupMemberContext";

interface InvitationsListProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export const InvitationsList: FC<InvitationsListProps> = ({
  onAccept,
  onDecline,
}) => {
  const { user } = useUser();
  const { invitations, fetchInvitations, isLoading, error } = useInvitations();
  const { groups } = useGroups();
  const { refreshGroupMembers } = useGroupMembers();
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (user?.token) {
      fetchInvitations();
    }
  }, [user?.token, fetchInvitations]);

  const handleAccept = async (invitation: GroupInvitation) => {
    if (processing) return;

    try {
      setProcessing(invitation.id);
      const response = await fetch(
        apiConfig.invitations.accept(invitation.id),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          (data as { error?: string }).error || "Failed to accept invitation"
        );
      }

      // Refresh invitations and group members
      await fetchInvitations();
      await refreshGroupMembers(invitation.group_id);
      onAccept?.();
    } catch (err) {
      console.error("Error accepting invitation:", err);
      alert(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (invitation: GroupInvitation) => {
    if (processing) return;

    try {
      setProcessing(invitation.id);
      const response = await fetch(
        apiConfig.invitations.decline(invitation.id),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          (data as { error?: string }).error || "Failed to decline invitation"
        );
      }

      // Refresh invitations
      await fetchInvitations();
      onDecline?.();
    } catch (err) {
      console.error("Error declining invitation:", err);
      alert(
        err instanceof Error ? err.message : "Failed to decline invitation"
      );
    } finally {
      setProcessing(null);
    }
  };

  // Group invitations by status
  const invitationsByStatus = invitations.reduce((acc, invitation) => {
    const status = invitation.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(invitation);
    return acc;
  }, {} as Record<string, GroupInvitation[]>);

  const statusOrder = ["pending", "accepted", "declined", "expired"];
  const statusLabels: Record<string, string> = {
    pending: "Pending",
    accepted: "Accepted",
    declined: "Declined",
    expired: "Expired",
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    return group?.name || "Unknown Group";
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Loading invitations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">No invitations</p>
      </div>
    );
  }

  return (
    <div className="p-1">
      {statusOrder.map((status) => {
        const statusInvitations = invitationsByStatus[status] || [];
        if (statusInvitations.length === 0) return null;

        return (
          <div key={status} className="mb-4">
            <div className="px-2 py-1.5 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
                {statusLabels[status]}
              </span>
            </div>
            {statusInvitations.map((invitation) => (
              <SidebarMenuItem key={invitation.id}>
                <div className="flex flex-col w-full">
                  <SidebarMenuButton className="w-full justify-start">
                    <Mail className="h-4 w-4" />
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm truncate">
                        {getGroupName(invitation.group_id)}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        Role: {invitation.role}
                      </div>
                    </div>
                  </SidebarMenuButton>
                  {status === "pending" && (
                    <div className="flex gap-1 px-2 pb-2">
                      <button
                        onClick={() => handleAccept(invitation)}
                        disabled={processing === invitation.id}
                        className="flex-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDecline(invitation)}
                        disabled={processing === invitation.id}
                        className="flex-1 px-2 py-1 text-xs bg-muted text-foreground rounded hover:bg-accent disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </SidebarMenuItem>
            ))}
          </div>
        );
      })}
    </div>
  );
};
