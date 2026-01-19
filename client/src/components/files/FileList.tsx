import { FC, useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Download, Trash2, File as FileIcon, Loader2 } from "lucide-react";

interface File {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  s3_url?: string;
  created_at: string;
  created_by: string;
}

interface FileListProps {
  groupId: string;
  folderId?: string;
  refreshTrigger?: number; // When this changes, refresh the list
}

export const FileList: FC<FileListProps> = ({
  groupId,
  folderId,
  refreshTrigger,
}) => {
  const { user } = useUser();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!user?.token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = apiConfig.files.list(groupId, folderId);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch files";
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
      setFiles((data as { files: File[] }).files || []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [groupId, folderId, user?.token, refreshTrigger]);

  const handleDownload = async (fileId: string) => {
    if (!user?.token) return;

    try {
      const response = await fetch(apiConfig.files.download(groupId, fileId), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(
          (errorData as { error?: string }).error ||
            "Failed to get download URL"
        );
        return;
      }

      const data = await response.json();
      const downloadUrl = (data as { download_url: string }).download_url;

      // Open download URL in new tab
      window.open(downloadUrl, "_blank");
    } catch (err) {
      console.error("Error getting download URL:", err);
      alert("Failed to download file");
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!user?.token) return;

    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    setDeletingId(fileId);

    try {
      const response = await fetch(apiConfig.files.delete(groupId, fileId), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete file";
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

      // Remove file from list
      setFiles(files.filter((f) => f.id !== fileId));
    } catch (err) {
      console.error("Error deleting file:", err);
      alert("Failed to delete file");
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-foreground" />
        <span className="ml-2 text-foreground">Loading files...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 dark:text-red-400">
        <p>{error}</p>
        <Button onClick={fetchFiles} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <FileIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No files found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileIcon className="w-5 h-5 text-foreground shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} •{" "}
                {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(file.id)}
              className="h-8"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(file.id)}
              disabled={deletingId === file.id}
              className="h-8 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              {deletingId === file.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
