/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React from 'react';

const DebugPanel = ({ output, variables, currentLine }) => {
  return (
    <div className="debug-panel">
      <div className="debug-panel-section">
        <h3>Variables</h3>
        <div className="variables-list">
          {variables.length > 0 ? (
            <table className="variable-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {variables.map((variable, index) => (
                  <tr 
                    key={index}
                    className={variable.line === currentLine ? 'current-variable' : ''}
                  >
                    <td>{variable.name}</td>
                    <td>{variable.value}</td>
                    <td>{variable.line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No variables detected</p>
          )}
        </div>
      </div>
      
      <div className="debug-panel-section">
        <h3>Console Output</h3>
        <pre className="debug-output">{output}</pre>
      </div>
    </div>
  );
};

export default DebugPanel;