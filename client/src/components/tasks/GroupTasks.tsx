import { FC, useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useGroupMembers } from "@/context/GroupMemberContext";
import { apiConfig } from "@/config/api";
import { CheckSquare, Clock, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditTaskModal } from "./EditTaskModal";

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  status: string;
  created_by: string;
}

interface GroupTasksProps {
  groupId: string;
}

export const GroupTasks: FC<GroupTasksProps> = ({ groupId }) => {
  const { user } = useUser();
  const { getGroupMembers } = useGroupMembers();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Check if user is admin or owner
  const groupMembers = getGroupMembers(groupId);
  const currentUserMember = groupMembers.find(
    (member) => member.user_id === user?.id
  );
  const isAdminOrOwner =
    currentUserMember?.role === "admin" || currentUserMember?.role === "owner";

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.token || !groupId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(apiConfig.groups.tasks(groupId), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            (data as { error?: string }).error || "Failed to fetch tasks"
          );
        }

        const data = await response.json();
        setTasks((data as { tasks: Task[] }).tasks || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch tasks";
        setError(errorMessage);
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [groupId, user?.token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-blue-600 dark:text-blue-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "cancelled":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-foreground mb-2">No tasks</p>
          <p className="text-sm text-muted-foreground">
            No tasks have been created for this group yet.
          </p>
        </div>
      </div>
    );
  }

  const handleTaskUpdate = () => {
    // Refresh tasks after update
    const fetchTasks = async () => {
      if (!user?.token || !groupId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(apiConfig.groups.tasks(groupId), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(
            (data as { error?: string }).error || "Failed to fetch tasks"
          );
        }

        const data = await response.json();
        setTasks((data as { tasks: Task[] }).tasks || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch tasks";
        setError(errorMessage);
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
    setEditingTaskId(null);
  };

  return (
    <>
      <EditTaskModal
        isOpen={editingTaskId !== null}
        onClose={() => setEditingTaskId(null)}
        groupId={groupId}
        taskId={editingTaskId || ""}
        onSuccess={handleTaskUpdate}
      />
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckSquare className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium text-foreground">
                        {task.title}
                      </h3>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground ml-8 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-8">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {formatDate(task.due_date)}
                      </span>
                      <span
                        className={`capitalize ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                  {isAdminOrOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingTaskId(task.id)}
                      className="h-8 w-8 shrink-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
