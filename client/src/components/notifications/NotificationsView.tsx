import { FC, useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Bell, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  task_id: string;
  user_id: string;
  notification_type: string;
  scheduled_at: string;
  sent_at?: string;
  status: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export const NotificationsView: FC = () => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchNotifications = async () => {
    if (!user?.token) {
      setError("Not authenticated");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiConfig.notifications.list, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch notifications";
        try {
          const errorData = await response.json();
          errorMessage =
            (errorData as { error?: string }).error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      setNotifications(
        (data as { notifications: Notification[] }).notifications || []
      );
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.token]);

  const getNotificationIcon = (_type: string, status: string) => {
    if (status === "sent") {
      return (
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      );
    }
    if (status === "failed") {
      return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
    return <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      assignment: "Task Assignment",
      reminder: "Task Reminder",
      due_date: "Task Due Date",
      status_change: "Status Change",
      update: "Task Update",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      case "cancelled":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-muted-foreground";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-foreground" />
        <span className="ml-2 text-foreground">Loading notifications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg font-medium text-foreground mb-2">
            No notifications
          </p>
          <p className="text-sm text-muted-foreground">
            You don't have any notifications yet.
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
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            View your task notifications
          </p>
        </div>

        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="border border-border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getNotificationIcon(
                    notification.notification_type,
                    notification.status
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-foreground">
                        {getNotificationTypeLabel(
                          notification.notification_type
                        )}
                      </h3>
                      <span
                        className={`text-xs capitalize ${getStatusColor(
                          notification.status
                        )}`}
                      >
                        {notification.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Task ID: {notification.task_id.slice(0, 8)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        Scheduled: {formatDate(notification.scheduled_at)}
                      </span>
                      {notification.sent_at && (
                        <span>Sent: {formatDate(notification.sent_at)}</span>
                      )}
                      {notification.retry_count > 0 && (
                        <span>Retries: {notification.retry_count}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
