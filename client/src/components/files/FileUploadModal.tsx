import { FC, useState, ChangeEvent } from "react";
import { X } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  folderId?: string;
  onUploadSuccess?: () => void;
}

export const FileUploadModal: FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  groupId,
  folderId,
  onUploadSuccess,
}) => {
  const { user } = useUser();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
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
      // Create FormData object
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (folderId) {
        formData.append("folder_id", folderId);
      }

      // Make POST request
      const response = await fetch(apiConfig.files.upload(groupId), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          // Don't set Content-Type - browser will set it with boundary for multipart/form-data
        },
        body: formData,
      });

      // Check response status
      if (!response.ok) {
        let errorMessage = "Failed to upload file";
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

      // Parse response
      try {
        await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
      }

      // File uploaded successfully
      setSelectedFile(null);
      setSuccess(true);
      
      // Reset file input
      const fileInput = document.getElementById("file-upload-input") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      // Call success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Close modal after a short delay
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 pointer-events-auto">
      <div className="bg-background border border-border rounded-lg shadow-2xl w-full max-w-md p-6 pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Upload File</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">
              Select File
            </label>
            <Input
              id="file-upload-input"
              type="file"
              onChange={handleFileSelect}
              className="cursor-pointer"
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-2 rounded">
              File uploaded successfully!
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
