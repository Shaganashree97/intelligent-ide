import React, { useState, useRef } from "react";
import MonacoEditor from "./components/MonacoEditor";
import LanguageSelector from "./components/LanguageSelector";
import "./App.css";
import { Editor } from "@monaco-editor/react";
import DebugPanel from "./components/DebugPanel ";
import * as monaco from "monaco-editor";
import { debugWithAI } from "./utils/aiHelper";
import AIChatSidebar from "./components/AIChatSidebar";

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

  const handleLanguageChange = (language) => {
    if (language) {
      setSelectedLanguage(language);
      setShowWarning(false);
      document.title = `${language} - Simple Code Editor`;
    }
  };

  const handleEditorChange = (value) => {
    setEditorContent(value);
  };

  const updateEditorContent = (newContent) => {
    setEditorContent(newContent);

    // Update the editor if reference exists
    if (editorRef.current) {
      editorRef.current.setValue(newContent);
    }
  };

  function handleEditorValidation(markers) {
    setErrors(markers);
    markers.forEach((marker) => console.log("onValidate:", marker.message));
  }

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;

    // Add gutter for breakpoints
    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        toggleBreakpoint(e.target.position.lineNumber);
      }
    });
  }

  const toggleBreakpoint = (lineNumber) => {
    // Check if breakpoint already exists
    const breakpointExists = breakpoints.includes(lineNumber);
    let newBreakpoints;

    if (breakpointExists) {
      // Remove breakpoint
      newBreakpoints = breakpoints.filter((bp) => bp !== lineNumber);
    } else {
      // Add breakpoint
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

  const startDebugging = () => {
    if (errors.length > 0) {
      setDebugOutput("Cannot start debugging with syntax errors");
      return;
    }

    setIsDebugging(true);
    setDebugOutput("Debugging started...\n");
    setCurrentLine(1);

    // Parse code to find variables (simplified for demo)
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

    // Highlight first line or first breakpoint
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
    // This is a simplified implementation
    // In a real-world scenario, you would use a proper parser and evaluator
    try {
      // Simple but unsafe - only for demonstration
      return expr.trim();
    } catch (e) {
      return "undefined";
    }
  };

  const highlightCurrentLine = (lineNumber) => {
    setCurrentLine(lineNumber);

    if (editorRef.current) {
      // Highlight current execution line
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
          <div className="toolbar">{/* Toolbar content */}</div>

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
                glyphMargin: true, // Required for breakpoints
              }}
            />

            {/* Add AI Chat Sidebar */}
            <AIChatSidebar
              editorContent={editorContent}
              selectedLanguage={selectedLanguage}
              updateEditorContent={updateEditorContent}
              aiApiCall={handleAIApiCall}
            />
          </div>

          {/* Error display section */}
          {errors.length > 0 && (
            <div className="error-panel">
              <h3>Issues in your code:</h3>

              <ul>
                {errors.map((error, index) => (
                  <div key={index}>
                    <li className="error-item">
                      <span className="error-location">
                        Line {error.startLineNumber}, Column {error.startColumn}
                        :{" "}
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
                        setEditorContent(res);
                      }}
                    >
                      fix this error using ai
                    </button>
                  </div>
                ))}
              </ul>
            </div>
          )}

          {/* Debug panel */}
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
