import { FC, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useGroups, Group } from "@/context/GroupContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useUser();
  const { groups, setGroups } = useGroups();
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      setError("Group name is required");
      return;
    }

    if (!user?.token) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiConfig.groups.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          name: groupName,
          description: groupDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          (data as { error?: string }).error || "Failed to create group"
        );
        setLoading(false);
        return;
      }

      // Add the new group to the context
      const responseData = data as { group: Group; message?: string };
      if (responseData.group) {
        setGroups([...groups, responseData.group]);
      } else {
        setError("Invalid response from server");
        setLoading(false);
        return;
      }

      // Reset form and close modal
      setGroupName("");
      setGroupDescription("");
      setLoading(false);
      onClose();
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error creating group:", err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 pointer-events-auto">
      <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-md p-6 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">
            Create a New Group
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreateGroup} className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Group Name
            </label>
            <Input
              type="text"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Group Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (optional)
            </label>
            <Input
              type="text"
              placeholder="Enter group description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="w-full text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
