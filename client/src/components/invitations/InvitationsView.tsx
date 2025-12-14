import { FC, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useInvitations, GroupInvitation } from "@/context/InvitationContext";
import { useGroups, Group } from "@/context/GroupContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Check, X, Mail, Clock } from "lucide-react";
import { useGroupMembers } from "@/context/GroupMemberContext";

export const InvitationsView: FC = () => {
  const { user } = useUser();
  const { invitations, fetchInvitations, isLoading, error } = useInvitations();
  const { groups, setGroups } = useGroups();
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

      // Refresh invitations, groups, and group members
      await fetchInvitations();

      // Fetch groups to include the newly joined group
      try {
        const groupsResponse = await fetch(apiConfig.groups.list, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        });

        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          setGroups((groupsData as { groups: Group[] }).groups || []);
        }
      } catch (err) {
        console.error("Error fetching groups after accepting invitation:", err);
      }

      await refreshGroupMembers(invitation.group_id);
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

  const statusColors: Record<string, string> = {
    pending: "text-yellow-600 dark:text-yellow-400",
    accepted: "text-green-600 dark:text-green-400",
    declined: "text-red-600 dark:text-red-400",
    expired: "text-gray-600 dark:text-gray-400",
  };

  const getGroupName = (invitation: GroupInvitation) => {
    // Prefer group_name from invitation if available (from backend JOIN)
    if (invitation.group_name) {
      return invitation.group_name;
    }
    // Fallback to finding group in context
    const group = groups.find((g) => g.id === invitation.group_id);
    return group?.name || "Unknown Group";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">Loading invitations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground mb-2">
            No invitations
          </p>
          <p className="text-sm text-muted-foreground">
            You don't have any group invitations at the moment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Invitations
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your group invitations
          </p>
        </div>

        <div className="space-y-8">
          {statusOrder.map((status) => {
            const statusInvitations = invitationsByStatus[status] || [];
            if (statusInvitations.length === 0) return null;

            return (
              <div key={status}>
                <div className="mb-4 flex items-center gap-2">
                  <h2
                    className={`text-lg font-semibold ${
                      statusColors[status] || "text-foreground"
                    }`}
                  >
                    {statusLabels[status]}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({statusInvitations.length})
                  </span>
                </div>

                <div className="space-y-3">
                  {statusInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <h3 className="font-medium text-foreground">
                                {getGroupName(invitation)}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Role:{" "}
                                <span className="capitalize">
                                  {invitation.role}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground ml-8">
                            <span>
                              Invited: {formatDate(invitation.created_at)}
                            </span>
                            {invitation.expires_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Expires: {formatDate(invitation.expires_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        {status === "pending" && (
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleAccept(invitation)}
                              disabled={processing === invitation.id}
                              className="flex items-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDecline(invitation)}
                              disabled={processing === invitation.id}
                              className="flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
