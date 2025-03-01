import React, { useState, useRef } from "react";
import MonacoEditor from "./components/MonacoEditor";
import LanguageSelector from "./components/LanguageSelector";
import "./App.css";
import { Editor } from "@monaco-editor/react";
import DebugPanel from "./components/DebugPanel";
import * as monaco from "monaco-editor";
import { debugWithAI, extractCodeFromResponse } from "./utils/aiHelper";
import AIChatSidebar from "./components/AIChatSidebar";
import FileTree from "./components/FileTree"; // Import the new FileTree component

const App = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [showWarning, setShowWarning] = useState(true);
  const [editorContent, setEditorContent] = useState("");
  const [errors, setErrors] = useState([]);
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugOutput, setDebugOutput] = useState("");
  const [variables, setVariables] = useState([]);
  const [currentLine, setCurrentLine] = useState(null);
  const editorRef = useRef(null);
  const [breakpoints, setBreakpoints] = useState([]);

  // New state for managing files
  const [currentFile, setCurrentFile] = useState(null);
  const [files, setFiles] = useState({});
  const [showFileTree, setShowFileTree] = useState(true);

  const handleLanguageChange = (language) => {
    if (language) {
      setSelectedLanguage(language);
      setShowWarning(false);
      document.title = `${language} - Simple Code Editor`;
    }
  };

  const handleEditorChange = (value) => {
    setEditorContent(value);

    // Save content to current file
    if (currentFile) {
      setFiles((prev) => ({
        ...prev,
        [currentFile.id]: {
          ...prev[currentFile.id],
          content: value,
        },
      }));
    }
  };

  const updateEditorContent = (newContent) => {
    setEditorContent(newContent);

    if (editorRef.current) {
      editorRef.current.setValue(newContent);
    }

    // Save to current file
    if (currentFile) {
      setFiles((prev) => ({
        ...prev,
        [currentFile.id]: {
          ...prev[currentFile.id],
          content: newContent,
        },
      }));
    }
  };

  function handleEditorValidation(markers) {
    setErrors(markers);
    markers.forEach((marker) => console.log("onValidate:", marker.message));
  }

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        toggleBreakpoint(e.target.position.lineNumber);
      }
    });
  }

  const toggleBreakpoint = (lineNumber) => {
    const breakpointExists = breakpoints.includes(lineNumber);
    let newBreakpoints;

    if (breakpointExists) {
      newBreakpoints = breakpoints.filter((bp) => bp !== lineNumber);
    } else {
      newBreakpoints = [...breakpoints, lineNumber];
    }

    setBreakpoints(newBreakpoints);

    // Update editor decorations
    if (editorRef.current) {
      const decorations = newBreakpoints.map((line) => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: "breakpoint-decoration",
          glyphMarginClassName: "breakpoint-glyph",
        },
      }));

      editorRef.current.deltaDecorations([], decorations);
    }
  };

  // File tree handlers
  const handleFileSelect = (file) => {
    if (file.type === "file") {
      // Save current file before switching
      if (currentFile) {
        setFiles((prev) => ({
          ...prev,
          [currentFile.id]: {
            ...prev[currentFile.id],
            content: editorContent,
          },
        }));
      }

      // Load the selected file
      setCurrentFile(file);

      // Get file content from our files state or use empty string
      const fileContent = files[file.id]?.content || file.content || "";
      setEditorContent(fileContent);

      // Set language based on file extension
      const extension = file.name.split(".").pop().toLowerCase();
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
      };

      if (languageMap[extension] && !selectedLanguage) {
        setSelectedLanguage(languageMap[extension]);
      }
    }
  };

  const handleFileCreate = (file) => {
    // Add new file to our files dictionary
    setFiles((prev) => ({
      ...prev,
      [file.id]: { ...file, content: "" },
    }));
  };

  const handleFolderCreate = (folder) => {
    // No need to store folder content
  };

  const handleDelete = (fileIds) => {
    // Remove files from our files dictionary
    const newFiles = { ...files };
    fileIds.forEach((id) => {
      delete newFiles[id];
    });
    setFiles(newFiles);

    // If current file was deleted, clear editor
    if (currentFile && fileIds.includes(currentFile.id)) {
      setCurrentFile(null);
      setEditorContent("");
    }
  };

  const toggleFileTree = () => {
    setShowFileTree((prev) => !prev);
  };

  const startDebugging = () => {
    if (errors.length > 0) {
      setDebugOutput("Cannot start debugging with syntax errors");
      return;
    }

    setIsDebugging(true);
    setDebugOutput("Debugging started...\n");
    setCurrentLine(1);

    const lines = editorContent.split("\n");
    let extractedVars = [];

    switch (selectedLanguage) {
      case "javascript":
        extractedVars = parseJavaScriptVariables(lines);
        break;
      case "python":
        extractedVars = parsePythonVariables(lines);
        break;
      default:
        extractedVars = [];
    }

    setVariables(extractedVars);

    highlightCurrentLine(breakpoints.length > 0 ? breakpoints[0] : 1);
  };

  const parseJavaScriptVariables = (lines) => {
    const variables = [];
    const varRegex =
      /(let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+)/g;

    lines.forEach((line, index) => {
      let match;
      while ((match = varRegex.exec(line)) !== null) {
        variables.push({
          name: match[2],
          value: evaluateExpression(match[3]),
          line: index + 1,
        });
      }
    });

    return variables;
  };

  const parsePythonVariables = (lines) => {
    const variables = [];
    const varRegex = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)/g;

    lines.forEach((line, index) => {
      let match;
      while ((match = varRegex.exec(line)) !== null) {
        variables.push({
          name: match[1],
          value: evaluateExpression(match[2]),
          line: index + 1,
        });
      }
    });

    return variables;
  };

  const evaluateExpression = (expr) => {
    try {
      return expr.trim();
    } catch (e) {
      return "undefined";
    }
  };

  const highlightCurrentLine = (lineNumber) => {
    setCurrentLine(lineNumber);

    if (editorRef.current) {
      editorRef.current.revealLineInCenter(lineNumber);

      const decorations = [
        {
          range: new monaco.Range(lineNumber, 1, lineNumber, 1),
          options: {
            isWholeLine: true,
            className: "current-line-decoration",
            glyphMarginClassName: "current-line-glyph",
          },
        },
      ];

      editorRef.current.deltaDecorations([], decorations);
    }
  };

  const stepNext = () => {
    if (!isDebugging || !currentLine) return;

    const lines = editorContent.split("\n").length;
    let nextLine = currentLine + 1;

    // Find next line or breakpoint
    if (breakpoints.length > 0) {
      const nextBreakpoint = breakpoints.find((bp) => bp > currentLine);
      if (nextBreakpoint) {
        nextLine = nextBreakpoint;
      }
    }

    if (nextLine <= lines) {
      highlightCurrentLine(nextLine);
      setDebugOutput((prev) => prev + `Executing line ${nextLine}\n`);
    } else {
      stopDebugging();
    }
  };

  const stopDebugging = () => {
    setIsDebugging(false);
    setCurrentLine(null);
    setDebugOutput((prev) => prev + "Debugging finished\n");

    if (editorRef.current) {
      editorRef.current.deltaDecorations([], []);
    }
  };

  const handleAIApiCall = async (prompt) => {
    try {
      console.log("Sending request to AI API:", prompt);

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-coder",
          prompt,
          stream: false,
        }),
      });
      const respJson = await response.json();
      console.log(respJson);
      return respJson.response;
    } catch (error) {
      console.error("AI API error:", error);
      throw error;
    }
  };

  return (
    <div className="app">
      {showWarning && (
        <h1 className="warning">
          Please select a programming language to start
          <br />
          <br />
          <i>
            note: you cannot change this later.
            <br />
            In doing so, <strong>you will lose your progress</strong>
          </i>
        </h1>
      )}
      <LanguageSelector
        onLanguageChange={handleLanguageChange}
        onCodeGenerated={updateEditorContent}
      />
      {selectedLanguage && (
        <div className="main-content">
          <div className="toolbar">
            <div className="file-info">
              {currentFile && (
                <span className="current-file">{currentFile.name}</span>
              )}
            </div>
            <button
              className="toggle-filetree-btn"
              onClick={toggleFileTree}
              title={showFileTree ? "Hide File Tree" : "Show File Tree"}
            >
              {showFileTree ? "← Hide Files" : "Show Files →"}
            </button>
          </div>

          <div className="editor-with-panels">
            {showFileTree && (
              <div className="file-tree-panel">
                <FileTree
                  onFileSelect={handleFileSelect}
                  onFileCreate={handleFileCreate}
                  onFolderCreate={handleFolderCreate}
                  onDelete={handleDelete}
                />
              </div>
            )}

            <div className="editor-container">
              <Editor
                language={selectedLanguage}
                defaultValue="// let's write some broken code"
                value={editorContent}
                onChange={handleEditorChange}
                onValidate={handleEditorValidation}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  lineNumbers: "on",
                  glyphMargin: true,
                }}
              />

              <AIChatSidebar
                editorContent={editorContent}
                selectedLanguage={selectedLanguage}
                updateEditorContent={updateEditorContent}
                aiApiCall={handleAIApiCall}
              />
            </div>
          </div>

          <div className="error-panel h-[50%]">
            {errors.length > 0 && (
              <>
                <h3>Issues in your code:</h3>

                <ul>
                  {errors.map((error, index) => (
                    <div key={index}>
                      <li className="error-item">
                        <span className="error-location">
                          Line {error.startLineNumber}, Column{" "}
                          {error.startColumn}:{" "}
                        </span>
                        <span className="error-message">{error.message}</span>
                      </li>
                      <button
                        onClick={async () => {
                          const res = await debugWithAI(
                            error,
                            editorContent,
                            selectedLanguage,
                          );
                          console.log("This is res: ", res);
                          setEditorContent(extractCodeFromResponse(res));
                        }}
                      >
                        fix this error using ai
                      </button>
                    </div>
                  ))}
                </ul>
              </>
            )}
          </div>

          {isDebugging && (
            <DebugPanel
              output={debugOutput}
              variables={variables}
              currentLine={currentLine}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default App;
