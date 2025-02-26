import React, { useState, useRef, useEffect } from "react";
import "./AIChatSidebar.css";

const ChatMessage = ({
  message,
  onAcceptCode,
  setMessages,
  language,
  setIsLoading,
  aiApiCall,
}) => {
  const { role, content, type } = message;

  const formatContent = (content) => {
    if (type === "code") {
      return (
        <div className="code-block-container">
          <pre className="code-block">{content}</pre>
          <div className="code-actions">
            <button onClick={() => onAcceptCode(content)}>Accept Code</button>
            <button onClick={() => onExplainCode(content)}>Explain</button>
          </div>
        </div>
      );
    }

    return <p>{content}</p>;
  };

  const extractCodeFromResponse = (response) => {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
    const match = response.match(codeBlockRegex);
    return match ? match[1] : response;
  };

  const onExplainCode = async (code) => {
    const userMessage = { role: "user", content: "Explain it", type: "text" };
    setIsLoading(true);
    setMessages((prev) => [...prev, userMessage]);
    try {
      const response = await aiApiCall(
        `just explain the code precisely very shortly and nothing else :,
code:${extractCodeFromResponse(code)}, programming language:${language}, with no comments please`,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          type: "text",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}`,
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`chat-message ${role}`}>
      <div className="message-avatar">{role === "user" ? "👤" : "🤖"}</div>
      <div className="message-content">{formatContent(content)}</div>
    </div>
  );
};

const AIChatSidebar = ({
  editorContent,
  selectedLanguage,
  updateEditorContent,
  aiApiCall,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === "") return;

    const userMessage = { role: "user", content: inputValue, type: "text" };
    setMessages((prev) => [...prev, userMessage]);

    setInputValue("");

    setIsLoading(true);

    try {
      const response = await aiApiCall(
        `answer precisely with zero comments with reference to the code provided genrate code if asked, and if code is asked don't give me anything other than code, question:${inputValue},
code:${editorContent}, programming language:${selectedLanguage}, with no comments please`,
      );

      const responseType = detectCodeInResponse(response, selectedLanguage);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          type: responseType,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}`,
          type: "text",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const detectCodeInResponse = (response, language) => {
    const codeBlockRegex = /```[\w]*[\s\S]*?```/;
    return codeBlockRegex.test(response) ? "code" : "text";
  };

  const extractCodeFromResponse = (response) => {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
    const match = response.match(codeBlockRegex);
    return match ? match[1] : response;
  };

  const handleAcceptCode = (codeContent) => {
    const cleanCode = extractCodeFromResponse(codeContent);

    updateEditorContent(cleanCode);
  };

  return (
    <div className={`chat-sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "→" : "←"}
      </div>

      {isOpen && (
        <>
          <div className="chat-header">
            <h3>AI Assistant</h3>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-chat">
                <p>Ask me anything about your code!</p>
              </div>
            )}

            {messages.map((message, index) => (
              <ChatMessage
                setMessages={setMessages}
                language={selectedLanguage}
                key={index}
                message={message}
                onAcceptCode={handleAcceptCode}
                setIsLoading={setIsLoading}
                aiApiCall={aiApiCall}
              />
            ))}

            {isLoading && (
              <div className="chat-message assistant">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <p className="loading-indicator">Thinking...</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about your code..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || inputValue.trim() === ""}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AIChatSidebar;
