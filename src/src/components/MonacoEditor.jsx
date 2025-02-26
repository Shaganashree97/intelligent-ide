/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useRef, useEffect, useState } from "react";
import "../../monacoWorker"
import * as monaco from "monaco-editor";

const MonacoEditor = ({ language, value, onChange }) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    if (containerRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: value,
        language: language,
        theme: "vs-dark",
        automaticLayout: true,
        minimap: { enabled: false },
        formatOnPaste: true,
        formatOnType: true,
        scrollBeyondLastLine: false,
        wordWrap: "on",
        // Add more advanced error checking options
        diagnostics: {
          noSemanticValidation: false,
          noSyntaxValidation: false,
        }
      });

      editorRef.current.onDidChangeModelContent(() => {
        onChange(editorRef.current.getValue());
      });

      // Listen for error markers
      const model = editorRef.current.getModel();
      if (model) {
        monaco.editor.onDidChangeMarkers(([resource]) => {
          if (model.uri.toString() === resource.toString()) {
            const editorMarkers = monaco.editor.getModelMarkers({ resource });
            setMarkers(editorMarkers);
          }
        });
      }

      return () => {
        editorRef.current?.dispose();
      };
    }
  }, [language]);

  useEffect(() => {
    if (editorRef.current) {
      if (value !== editorRef.current.getValue()) {
        editorRef.current.setValue(value);
      }
    }
  }, [value]);

  return (
    <div className="monaco-editor-container">
      <div ref={containerRef} className="monaco-editor" />
      {markers.length > 0 && (
        <div className="monaco-editor-errors">
          <div className="error-count">{markers.length} issues found</div>
        </div>
      )}
    </div>
  );
};

export default MonacoEditor;