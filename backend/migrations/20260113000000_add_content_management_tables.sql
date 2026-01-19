-- +goose Up
-- +goose StatementBegin

-- Create folders table for organizing files
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- Full path like /folder1/subfolder2
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Optional: associate with a group
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(path, group_id) -- Ensure unique paths within a group
);

-- Create indexes for folders
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_group_id ON folders(group_id);
CREATE INDEX idx_folders_path ON folders(path);
CREATE INDEX idx_folders_created_by ON folders(created_by);

-- Create files table for storing file metadata
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    size BIGINT NOT NULL, -- File size in bytes
    mime_type TEXT NOT NULL, -- e.g., 'image/png', 'application/pdf'
    s3_bucket TEXT NOT NULL, -- S3 bucket name
    s3_key TEXT NOT NULL, -- S3 object key/path
    s3_url TEXT, -- Full S3 URL (can be generated, but cached for convenience)
    folder_id UUID REFERENCES folders(id) ON DELETE SET NULL, -- Optional: file can be in a folder
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Optional: associate with a group
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(s3_bucket, s3_key) -- Ensure unique S3 object references
);

-- Create indexes for files
CREATE INDEX idx_files_folder_id ON files(folder_id);
CREATE INDEX idx_files_group_id ON files(group_id);
CREATE INDEX idx_files_created_by ON files(created_by);
CREATE INDEX idx_files_s3_bucket_key ON files(s3_bucket, s3_key);
CREATE INDEX idx_files_mime_type ON files(mime_type);

-- Create canvases table for storing canvas data
CREATE TABLE canvases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    canvas_data JSONB NOT NULL, -- Canvas structure, nodes, connections, etc.
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Optional: associate with a group
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for canvases
CREATE INDEX idx_canvases_group_id ON canvases(group_id);
CREATE INDEX idx_canvases_created_by ON canvases(created_by);
CREATE INDEX idx_canvases_canvas_data ON canvases USING GIN(canvas_data); -- GIN index for JSONB queries

-- Create workflows table for storing workflow definitions
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    workflow_data JSONB NOT NULL, -- Workflow structure, steps, conditions, etc.
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Optional: associate with a group
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for workflows
CREATE INDEX idx_workflows_group_id ON workflows(group_id);
CREATE INDEX idx_workflows_created_by ON workflows(created_by);
CREATE INDEX idx_workflows_workflow_data ON workflows USING GIN(workflow_data); -- GIN index for JSONB queries

-- Create links table for storing link/bookmark metadata
CREATE TABLE links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    title TEXT,
    description TEXT,
    preview_image_url TEXT, -- URL to preview image (could be from link preview service)
    preview_image_s3_key TEXT, -- Optional: if preview image is stored in S3
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Optional: associate with a group
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for links
CREATE INDEX idx_links_group_id ON links(group_id);
CREATE INDEX idx_links_created_by ON links(created_by);
CREATE INDEX idx_links_url ON links(url);

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS links;
DROP TABLE IF EXISTS workflows;
DROP TABLE IF EXISTS canvases;
DROP TABLE IF EXISTS files;
DROP TABLE IF EXISTS folders;
-- +goose StatementEnd
