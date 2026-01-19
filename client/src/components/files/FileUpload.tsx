import { FC, useState, ChangeEvent } from "react";
import { useUser } from "@/context/UserContext";
import { apiConfig } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface FileUploadProps {
  groupId: string;
  folderId?: string;
  onUploadSuccess?: () => void;
}

export const FileUpload: FC<FileUploadProps> = ({
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
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      // Call success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Clear success message after a short delay
      setTimeout(() => {
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border border-border rounded-lg bg-background">
      <div className="flex items-center gap-2">
        <Upload className="w-5 h-5 text-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Upload File</h3>
      </div>

      <div className="flex flex-col gap-2">
        <Input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          className="cursor-pointer"
        />
        {selectedFile && (
          <p className="text-sm text-muted-foreground">
            Selected: {selectedFile.name} (
            {(selectedFile.size / 1024).toFixed(2)} KB)
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

      <Button
        onClick={handleUpload}
        disabled={!selectedFile || loading}
        className="w-full"
      >
        {loading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
};
