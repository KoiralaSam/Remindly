import { FC, useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Folder } from "lucide-react";

interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
}

export const DeleteTaskModal: FC<DeleteTaskModalProps> = ({
  isOpen,
  onClose,
  groupId,
}) => {
  const { user } = useUser();
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [folder, setFolder] = useState("default");
  const [folderName, setFolderName] = useState("");
  const [isNewFolder, setIsNewFolder] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  // Fetch tasks for the group
  useEffect(() => {
    if (!isOpen || !user?.token) return;

    const fetchTasks = async () => {
      try {
        const response = await fetch(apiConfig.groups.tasks(groupId), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks || []);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      }
    };

    fetchTasks();
  }, [isOpen, groupId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTaskId) {
      setError("Please select a task to delete");
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
      const response = await fetch(
        apiConfig.groups.taskById(groupId, selectedTaskId),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setError((data as { error?: string }).error || "Failed to delete task");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setSelectedTaskId("");
      setFolder("default");
      setFolderName("");
      setIsNewFolder(false);
      setLoading(false);

      // Refresh tasks list
      const tasksResponse = await fetch(apiConfig.groups.tasks(groupId), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData.tasks || []);
      }

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

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 pointer-events-auto">
      <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-md p-6 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">
            Delete a task
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Task
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || tasks.length === 0}
            >
              <option value="">
                {tasks.length === 0 ? "No tasks available" : "Select a task"}
              </option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.status})
                </option>
              ))}
            </select>
            {selectedTask && (
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedTask.description}
              </p>
            )}
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
              Task deleted successfully!
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
            <Button
              type="submit"
              disabled={loading || !selectedTaskId}
              variant="destructive"
              className="flex-1"
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
