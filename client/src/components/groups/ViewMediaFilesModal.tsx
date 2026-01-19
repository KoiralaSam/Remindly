import { FC, useState, useEffect } from "react";
import { X, File, Folder, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileList } from "@/components/files/FileList";
import { FolderList } from "@/components/files/FolderList";
import { LinkList } from "@/components/files/LinkList";

interface ViewMediaFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
}

export const ViewMediaFilesModal: FC<ViewMediaFilesModalProps> = ({
  isOpen,
  onClose,
  groupId,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<
    string | undefined
  >();
  const [refreshKey, setRefreshKey] = useState(0);

  // Refresh file list when modal opens
  useEffect(() => {
    if (isOpen) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <File className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Media, Files and Links
            </h2>
          </div>
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
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6">
            {/* Files Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Files</h3>
                {selectedFolderId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFolderId(undefined)}
                    className="text-xs"
                  >
                    <Folder className="h-3 w-3 mr-1" />
                    View All Files
                  </Button>
                )}
              </div>
              <FileList
                groupId={groupId}
                folderId={selectedFolderId}
                refreshTrigger={refreshKey}
              />
            </div>

            {/* Folders and Links */}
            <div className="border-t border-border pt-6">
              <div className="grid grid-cols-2 gap-4">
                {/* Folders Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Folder className="h-4 w-4 text-foreground" />
                    <h3 className="text-sm font-medium text-foreground">
                      Folders
                    </h3>
                  </div>
                  <FolderList
                    groupId={groupId}
                    parentId={selectedFolderId}
                    onFolderClick={(folderId) => setSelectedFolderId(folderId)}
                    refreshTrigger={refreshKey}
                  />
                </div>

                {/* Links Section */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <LinkIcon className="h-4 w-4 text-foreground" />
                    <h3 className="text-sm font-medium text-foreground">
                      Links
                    </h3>
                  </div>
                  <LinkList groupId={groupId} refreshTrigger={refreshKey} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
