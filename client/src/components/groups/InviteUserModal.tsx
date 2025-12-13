import { FC, useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
}

export const InviteUserModal: FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  groupId,
}) => {
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Fetch user's role in the group and determine available roles
  useEffect(() => {
    if (!isOpen || !user?.token || !user?.rolePermissions) return;

    const fetchUserRole = async () => {
      try {
        const response = await fetch(apiConfig.groups.members(groupId), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const members = (data.group_members || []) as GroupMember[];
          const currentUserMember = members.find(
            (member) => member.user_id === user.id
          );

          if (currentUserMember && user.rolePermissions) {
            // Get roles the user can modify based on their role
            const modifiableRoles =
              user.rolePermissions[currentUserMember.role] || [];
            setAvailableRoles(modifiableRoles);

            setAvailableRoles(modifiableRoles);

            // Set default role to first available role
            if (modifiableRoles.length > 0) {
              setRole(modifiableRoles[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch user role:", err);
      }
    };

    fetchUserRole();

    // Reset when modal closes
    if (!isOpen) {
      setEmail("");
      setRole("member");
      setError("");
      setSuccess(false);
      setAvailableRoles([]);
    }
  }, [isOpen, groupId, user]);

  // Update role if current selection is not in available roles
  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(role)) {
      setRole(availableRoles[0]);
    }
  }, [availableRoles, role]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!user?.token) {
      setError("Not authenticated");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(apiConfig.groups.members(groupId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          role: role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError((data as { error?: string }).error || "Failed to invite user");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setEmail("");
      setLoading(false);

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1000);
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 pointer-events-auto">
      <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-sm p-6 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Invite Teammate
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleInvite} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email
            </label>
            <Input
              type="email"
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-foreground placeholder:text-muted-foreground"
              disabled={loading}
            />
          </div>

          {/* Role Select */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Role
            </label>
            {availableRoles.length > 0 ? (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                {availableRoles.map((availableRole) => (
                  <option key={availableRole} value={availableRole}>
                    {availableRole.charAt(0).toUpperCase() +
                      availableRole.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-muted-foreground">
                You don't have permission to invite users with any roles.
              </div>
            )}
          </div>

          {/* Success Message */}
          {success && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-2 rounded">
              User invited successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || availableRoles.length === 0}
              className="flex-1"
            >
              {loading ? "Inviting..." : "Invite"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
