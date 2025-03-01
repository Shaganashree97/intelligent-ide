import React, { useState, useEffect } from "react";
import {
  FaFolder,
  FaFolderOpen,
  FaFile,
  FaPlus,
  FaFolderPlus,
  FaTrash,
  FaSync,
} from "react-icons/fa";
import "./filetree.css";
import {
  readDirectoryContents,
  readFileContent,
  createFile,
  createDirectory,
  openDirectory,
  getCurrentDirectoryHandle,
} from "../utils/fileSystemHelper";

const FileTree = ({ onFileSelect, onProjectOpen }) => {
  const [files, setFiles] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({ root: true });
  const [newItemName, setNewItemName] = useState("");
  const [creatingIn, setCreatingIn] = useState(null); // null or folderId
  const [createType, setCreateType] = useState(null); // 'file' or 'folder'
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenProject = async () => {
    setIsLoading(true);
    try {
      const dirHandle = await openDirectory();

      if (dirHandle) {
        // Read all files and folders recursively
        const entries = await readDirectoryContents(dirHandle);
        setFiles(entries);
        setProjectOpen(true);

        // Notify parent component that a project was opened
        if (onProjectOpen) {
          onProjectOpen(dirHandle.name);
        }

        // Expand the root folder
        setExpandedFolders({ root: true });
      }
    } catch (error) {
      console.error("Error opening project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProject = async () => {
    setIsLoading(true);
    try {
      const dirHandle = getCurrentDirectoryHandle();
      if (dirHandle) {
        const entries = await readDirectoryContents(dirHandle);
        setFiles(entries);
      }
    } catch (error) {
      console.error("Error refreshing project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const selectFile = async (file) => {
    if (file.type === "file") {
      setSelectedFileId(file.id);

      try {
        // Read the file content
        const content = await readFileContent(file.handle);

        // Pass the file and its content to the parent component
        if (onFileSelect) {
          onFileSelect({
            ...file,
            content,
          });
        }
      } catch (error) {
        console.error("Error selecting file:", error);
      }
    }
  };

  const startCreating = (type, parentId) => {
    setCreateType(type);
    setCreatingIn(parentId);
    setNewItemName("");
  };

  const cancelCreating = () => {
    setCreateType(null);
    setCreatingIn(null);
    setNewItemName("");
  };

  const handleCreate = async () => {
    if (!newItemName.trim()) return;

    // Find the parent folder handle
    const parent = files.find((f) => f.id === creatingIn);
    if (!parent || !parent.handle) {
      console.error("Parent folder not found or has no handle");
      return;
    }

    try {
      if (createType === "file") {
        // Create a new file in the file system
        const { success, handle } = await createFile(
          parent.handle,
          newItemName,
          "",
        );

        if (success && handle) {
          // Refresh the file tree
          await refreshProject();

          // Optionally select the new file
          const newFileId = `${creatingIn}-${newItemName.replace(/[^a-zA-Z0-9]/g, "-")}`;
          const newFile = files.find((f) => f.id === newFileId);
          if (newFile) {
            selectFile(newFile);
          }
        }
      } else if (createType === "folder") {
        // Create a new folder in the file system
        const { success } = await createDirectory(parent.handle, newItemName);

        if (success) {
          // Refresh the file tree
          await refreshProject();

          // Expand the parent folder
          setExpandedFolders((prev) => ({
            ...prev,
            [creatingIn]: true,
          }));
        }
      }
    } catch (error) {
      console.error("Error creating item:", error);
    } finally {
      cancelCreating();
    }
  };

  const getFolderById = (id) => {
    return files.find((f) => f.id === id && f.type === "folder");
  };

  const renderFileTree = (parentId) => {
    const children = files.filter((file) => file.parentId === parentId);

    if (children.length === 0 && parentId === "root" && !projectOpen) {
      return (
        <div className="no-project-open">
          <p>No project open</p>
          <button className="open-project-btn" onClick={handleOpenProject}>
            Open Folder
          </button>
        </div>
      );
    }

    return (
      <ul className="file-tree-list">
        {children.map((item) => (
          <li key={item.id} className="file-tree-item">
            {item.type === "folder" ? (
              <div className="file-tree-folder">
                <div
                  className={`folder-label ${expandedFolders[item.id] ? "expanded" : ""} ${item.parentId === null ? "root-folder" : ""}`}
                  onClick={() => toggleFolder(item.id)}
                >
                  {expandedFolders[item.id] ? <FaFolderOpen /> : <FaFolder />}
                  <span>{item.name}</span>
                </div>

                <div className="file-tree-actions">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startCreating("file", item.id);
                    }}
                    title="New File"
                  >
                    <FaPlus size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startCreating("folder", item.id);
                    }}
                    title="New Folder"
                  >
                    <FaFolderPlus size={12} />
                  </button>
                </div>

                {expandedFolders[item.id] && (
                  <>
                    {renderFileTree(item.id)}
                    {createType && creatingIn === item.id && (
                      <div className="create-new-item">
                        <input
                          autoFocus
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCreate();
                            if (e.key === "Escape") cancelCreating();
                          }}
                          placeholder={`New ${createType} name...`}
                        />
                        <div className="create-actions">
                          <button onClick={handleCreate}>Create</button>
                          <button onClick={cancelCreating}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div
                className={`file-label ${selectedFileId === item.id ? "selected" : ""}`}
                onClick={() => selectFile(item)}
              >
                <FaFile />
                <span>{item.name}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="file-tree-container">
      <div className="file-tree-header">
        <h3>Files</h3>
        <div className="file-tree-controls">
          <button
            className="refresh-btn"
            onClick={refreshProject}
            disabled={!projectOpen || isLoading}
            title="Refresh Project"
          >
            <FaSync size={14} className={isLoading ? "spinning" : ""} />
          </button>
          <button
            className="open-folder-btn"
            onClick={handleOpenProject}
            disabled={isLoading}
            title="Open Folder"
          >
            <FaFolderOpen size={14} />
          </button>
        </div>
      </div>
      {renderFileTree("root")}
    </div>
  );
};

export default FileTree;
