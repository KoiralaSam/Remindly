import { FC, useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Folder, Trash2, Loader2 } from "lucide-react";

interface FolderType {
  id: string;
  name: string;
  path: string;
  parent_id?: string;
  created_at: string;
  created_by: string;
}

interface FolderListProps {
  groupId: string;
  parentId?: string;
  onFolderClick?: (folderId: string) => void;
  refreshTrigger?: number;
}

export const FolderList: FC<FolderListProps> = ({
  groupId,
  parentId,
  onFolderClick,
  refreshTrigger,
}) => {
  const { user } = useUser();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFolders = async () => {
    if (!user?.token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = apiConfig.folders.list(groupId, parentId);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch folders";
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
      setFolders((data as { folders: FolderType[] }).folders || []);
    } catch (err) {
      console.error("Error fetching folders:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [groupId, parentId, user?.token, refreshTrigger]);

  const handleDelete = async (folderId: string) => {
    if (!user?.token) return;

    if (!confirm("Are you sure you want to delete this folder? All files and subfolders will be deleted.")) {
      return;
    }

    setDeletingId(folderId);

    try {
      const response = await fetch(apiConfig.folders.delete(groupId, folderId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete folder";
        try {
          const errorData = await response.json();
          errorMessage =
            (errorData as { error?: string }).error || errorMessage;
        } catch {
          // If response is not JSON, use default error message
        }
        alert(errorMessage);
        return;
      }

      // Remove folder from list
      setFolders(folders.filter((f) => f.id !== folderId));
      // Refresh list
      fetchFolders();
    } catch (err) {
      console.error("Error deleting folder:", err);
      alert("Failed to delete folder");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-foreground" />
        <span className="ml-2 text-foreground">Loading folders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 dark:text-red-400">
        <p>{error}</p>
        <Button onClick={fetchFolders} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No folders found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {folders.map((folder) => (
        <div
          key={folder.id}
          className="flex items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => onFolderClick?.(folder.id)}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Folder className="w-5 h-5 text-foreground shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {folder.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(folder.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(folder.id);
            }}
            disabled={deletingId === folder.id}
            className="h-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 shrink-0"
          >
            {deletingId === folder.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};
