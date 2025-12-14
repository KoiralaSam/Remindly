import { FC, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useGroupMembers } from "@/context/GroupMemberContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Folder } from "lucide-react";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export const AddTaskModal: FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  groupId,
}) => {
  const { user } = useUser();
  const { getGroupMembers } = useGroupMembers();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [folder, setFolder] = useState("default");
  const [folderName, setFolderName] = useState("");
  const [isNewFolder, setIsNewFolder] = useState(false);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Get group members from context
  const groupMembers = getGroupMembers(groupId);
  const availableMembers = groupMembers.map((m) => ({
    id: m.user_id,
    name: m.user?.name || m.user?.email || "Unknown",
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    if (!dueDate) {
      setError("Due date is required");
      return;
    }

    if (!assignees.length) {
      setError("At least one assignee is required");
      return;
    }

    if (!user?.token) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Convert datetime-local to RFC3339 format
      const dueDateISO = new Date(dueDate).toISOString();

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDateISO,
        assignees: assignees,
      };

      const response = await fetch(apiConfig.groups.tasks(groupId), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError((data as { error?: string }).error || "Failed to create task");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTitle("");
      setDescription("");
      setDueDate("");
      setFolder("default");
      setFolderName("");
      setIsNewFolder(false);
      setAssignees([]);
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
      <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-md p-6 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Add a task</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Task
            </label>
            <Input
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-foreground placeholder:text-muted-foreground"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Due Date
            </label>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-foreground"
              disabled={loading}
            />
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Assignees
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-input rounded-md p-2">
              {availableMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent p-1 rounded"
                >
                  <input
                    type="checkbox"
                    checked={assignees.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAssignees([...assignees, member.id]);
                      } else {
                        setAssignees(
                          assignees.filter((id) => id !== member.id)
                        );
                      }
                    }}
                    className="rounded border-input"
                    disabled={loading}
                  />
                  <span className="text-sm text-foreground">{member.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Folder */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Folder
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <select
                  value={isNewFolder ? "new" : folder}
                  onChange={(e) => {
                    if (e.target.value === "new") {
                      setIsNewFolder(true);
                    } else {
                      setIsNewFolder(false);
                      setFolder(e.target.value);
                    }
                  }}
                  className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={loading}
                >
                  <option value="default">Default</option>
                  <option value="new">New folder</option>
                </select>
                <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Folder Name (shown when New folder is selected) */}
          {isNewFolder && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Folder Name
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Enter folder name"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  className="w-full pl-9 text-foreground placeholder:text-muted-foreground"
                  disabled={loading}
                />
                <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-2 rounded">
              Task created successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
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
              {loading ? "Creating..." : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
