import { FC, useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  taskId: string;
  onSuccess?: () => void;
}

export const EditTaskModal: FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  groupId,
  taskId,
  onSuccess,
}) => {
  const { user } = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch task data when modal opens
  useEffect(() => {
    if (!isOpen || !user?.token || !taskId) return;

    const fetchTask = async () => {
      try {
        const response = await fetch(
          apiConfig.groups.taskById(groupId, taskId),
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch task");
        }

        const data = await response.json();
        const task = (data as { task: Task }).task;

        setTitle(task.title);
        setDescription(task.description);
        // Convert ISO date to datetime-local format
        const date = new Date(task.due_date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`);
        setStatus(task.status);
      } catch (err) {
        console.error("Error fetching task:", err);
        setError("Failed to load task details");
      }
    };

    fetchTask();
  }, [isOpen, groupId, taskId, user?.token]);

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

    if (!user?.token) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Convert datetime-local to RFC3339 format
      const dueDateISO = new Date(dueDate).toISOString();

      const taskData = {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDateISO,
        status: status,
      };

      const response = await fetch(apiConfig.groups.taskById(groupId, taskId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(taskData),
      });

      // Check response status
      if (!response.ok) {
        let errorMessage = "Failed to update task";
        try {
          const errorData = await response.json();
          errorMessage =
            (errorData as { error?: string }).error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Parse response (verify it's valid JSON)
      try {
        await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error("Error updating task:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 pointer-events-auto">
      <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-md p-6 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Edit Task</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Task Title
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

          {/* Status (only for admins/owners) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
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
              {loading ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
