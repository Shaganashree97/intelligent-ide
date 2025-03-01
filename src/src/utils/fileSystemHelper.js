// src/utils/fileSystemHelper.js

/**
 * Utility functions for working with the File System Access API
 */

// Store the directory handle for later access
let directoryHandle = null;

/**
 * Opens a file system directory picker and returns the selected directory handle
 * @returns {Promise<FileSystemDirectoryHandle|null>}
 */
export const openDirectory = async () => {
  try {
    // Check if the File System Access API is supported
    if (!("showDirectoryPicker" in window)) {
      alert(
        "Your browser does not support the File System Access API. Please use Chrome, Edge, or Opera.",
      );
      return null;
    }

    // Show the directory picker
    const handle = await window.showDirectoryPicker({
      id: "code-editor",
      mode: "readwrite",
      startIn: "documents",
    });

    directoryHandle = handle;
    return handle;
  } catch (error) {
    console.error("Error opening directory:", error);
    return null;
  }
};

/**
 * Gets the current directory handle
 * @returns {FileSystemDirectoryHandle|null}
 */
export const getCurrentDirectoryHandle = () => {
  return directoryHandle;
};

/**
 * Reads all files and directories recursively from a directory handle
 * @param {FileSystemDirectoryHandle} dirHandle - Directory handle to read from
 * @param {string|null} parentId - ID of the parent directory
 * @returns {Promise<Array>} Array of file and directory objects
 */
export const readDirectoryContents = async (dirHandle, parentId = null) => {
  const entries = [];
  const baseId = parentId || "root";

  // Add the directory itself if it's not the root
  if (parentId !== null) {
    entries.push({
      id: baseId,
      name: dirHandle.name,
      type: "folder",
      parentId: parentId === "root" ? null : parentId,
      handle: dirHandle,
    });
  } else {
    // Add the root directory
    entries.push({
      id: "root",
      name: dirHandle.name,
      type: "folder",
      parentId: null,
      handle: dirHandle,
    });
  }

  try {
    // Iterate through all entries in the directory
    for await (const [name, handle] of dirHandle.entries()) {
      const entryId = `${baseId}-${name.replace(/[^a-zA-Z0-9]/g, "-")}`;

      if (handle.kind === "file") {
        entries.push({
          id: entryId,
          name,
          type: "file",
          parentId: baseId,
          handle,
        });
      } else if (handle.kind === "directory") {
        // Recursively read subdirectories
        const subEntries = await readDirectoryContents(handle, entryId);
        entries.push(...subEntries);
      }
    }

    return entries;
  } catch (error) {
    console.error("Error reading directory contents:", error);
    return entries;
  }
};

/**
 * Reads the content of a file
 * @param {FileSystemFileHandle} fileHandle - Handle of the file to read
 * @returns {Promise<string>} Content of the file
 */
export const readFileContent = async (fileHandle) => {
  try {
    const file = await fileHandle.getFile();
    const content = await file.text();
    return content;
  } catch (error) {
    console.error("Error reading file:", error);
    return "";
  }
};

/**
 * Writes content to a file
 * @param {FileSystemFileHandle} fileHandle - Handle of the file to write to
 * @param {string} content - Content to write
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export const writeFileContent = async (fileHandle, content) => {
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (error) {
    console.error("Error writing to file:", error);
    return false;
  }
};

/**
 * Creates a new file in the specified directory
 * @param {FileSystemDirectoryHandle} dirHandle - Directory to create the file in
 * @param {string} fileName - Name of the file to create
 * @param {string} initialContent - Initial content of the file
 * @returns {Promise<{success: boolean, handle: FileSystemFileHandle|null}>}
 */
export const createFile = async (dirHandle, fileName, initialContent = "") => {
  try {
    // Check if file already exists
    try {
      await dirHandle.getFileHandle(fileName);
      // If we get here, the file exists
      if (
        !confirm(
          `File "${fileName}" already exists. Do you want to overwrite it?`,
        )
      ) {
        return { success: false, handle: null };
      }
    } catch (e) {
      // File doesn't exist, which is good
    }

    // Create the file
    const fileHandle = await dirHandle.getFileHandle(fileName, {
      create: true,
    });

    // Write initial content
    if (initialContent) {
      await writeFileContent(fileHandle, initialContent);
    }

    return { success: true, handle: fileHandle };
  } catch (error) {
    console.error("Error creating file:", error);
    return { success: false, handle: null };
  }
};

/**
 * Creates a new directory
 * @param {FileSystemDirectoryHandle} parentDirHandle - Parent directory
 * @param {string} dirName - Name of the directory to create
 * @returns {Promise<{success: boolean, handle: FileSystemDirectoryHandle|null}>}
 */
export const createDirectory = async (parentDirHandle, dirName) => {
  try {
    const dirHandle = await parentDirHandle.getDirectoryHandle(dirName, {
      create: true,
    });
    return { success: true, handle: dirHandle };
  } catch (error) {
    console.error("Error creating directory:", error);
    return { success: false, handle: null };
  }
};

/**
 * Determines the language based on file extension
 * @param {string} fileName - Name of the file
 * @returns {string} The language identifier
 */
export const getLanguageFromFileName = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();

  const languageMap = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    go: "go",
    rb: "ruby",
    php: "php",
    rs: "rust",
    swift: "swift",
    kt: "kotlin",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sh: "shell",
    bash: "shell",
    txt: "plaintext",
  };

  return languageMap[extension] || "plaintext";
};
