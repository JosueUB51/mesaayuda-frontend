import { useState, useMemo, useEffect, useRef } from "react";
import { sendMessage } from "./api";
import logo from "./assets/mesa.png";

function generateSessionId() {
  return crypto.randomUUID();
}

export default function App() {
  const sessionId = useMemo(() => generateSessionId(), []);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const [currentFlow, setCurrentFlow] = useState(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await sendMessage(sessionId, input);

      let botMessage;

      if (data.type === "vpn_download" || data.type === "correo_download") {
        setCurrentFlow(data.type.includes("vpn") ? "vpn" : "correo");

        botMessage = {
          role: "assistant",
          type: data.type,
          content: data.message,
          fileName: data.fileName,
          url: data.url,
        };
      } else if (data.type === "vpn_success" || data.type === "correo_success") {
        botMessage = {
          role: "assistant",
          content: data.message,
        };
      } else {
        botMessage = {
          role: "assistant",
          content: data.response,
        };
      }

      setMessages((prev) => [...prev, botMessage]);

    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error conectando con el servidor." },
      ]);
    }

    setInput("");
    setLoading(false);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileMessage = {
      role: "user",
      type: "file",
      fileName: file.name,
    };

    setMessages((prev) => [...prev, fileMessage]);

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("file", file);

    let endpoint = "";

    if (currentFlow === "vpn") {
      endpoint = "http://127.0.0.1:8000/vpn/upload";
    }

    if (currentFlow === "correo") {
      endpoint = "http://127.0.0.1:8000/correo/upload";
    }

    await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    const response = await sendMessage(sessionId, "Formato subido");

    let botMessage;

    if (response.type === "vpn_success" || response.type === "correo_success") {
      botMessage = {
        role: "assistant",
        content: response.message,
      };
    } else {
      botMessage = {
        role: "assistant",
        content: response.response,
      };
    }

    setMessages((prev) => [...prev, botMessage]);
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <img src={logo} alt="Mesa de Ayuda" style={styles.logo} />
      </div>

      <div style={styles.titleSection}>
        <h1 style={styles.title}>Hola, Bienvenido(a)</h1>
        <p style={styles.subtitle}>Hagamos tu solicitud más fácil.</p>
      </div>

      <div style={styles.chatContainer}>
        <div ref={chatRef} style={styles.chatMessages}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.messageWrapper,
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  background:
                    msg.role === "user" ? "#E8F0FE" : "#F3F4F6",
                }}
              >
                {msg.type === "vpn_download" ||
                  msg.type === "correo_download" ? (
                  <>
                    <div>{msg.content}</div>
                    <a
                      href={msg.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.downloadLink}
                    >
                      Descargar {msg.fileName}
                    </a>
                  </>
                ) : msg.type === "file" ? (
                  <div style={styles.fileMessage}>
                    📄 {msg.fileName}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} style={styles.inputArea}>
          <input
            type="file"
            accept="application/pdf"
            id="fileUpload"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />

          <label htmlFor="fileUpload" style={styles.plusButton}>
            +
          </label>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            style={styles.input}
          />
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", width: "100%", background: "#EDEDED", padding: "30px 60px" },
  header: { display: "flex", alignItems: "center" },
  logo: { height: 60 },
  titleSection: { textAlign: "center", marginTop: 60, marginBottom: 40 },
  title: { fontSize: 48, fontWeight: 500, margin: 0 },
  subtitle: { fontSize: 32, color: "#BDBDBD", marginTop: 10 },
  chatContainer: { width: "100%", maxWidth: 1100, margin: "0 auto", background: "#FFF", borderRadius: 25, padding: 30, height: "55vh", display: "flex", flexDirection: "column" },
  chatMessages: { flex: 1, overflowY: "auto" },
  messageWrapper: { display: "flex", marginBottom: 15 },
  messageBubble: { padding: "12px 18px", borderRadius: 18, maxWidth: "60%", fontSize: 16 },
  inputArea: { display: "flex", marginTop: 20, gap: 15 },
  plusButton: { width: 40, height: 40, borderRadius: 10, background: "#F3F4F6", fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  input: { flex: 1, padding: 15, borderRadius: 15, border: "1px solid #E5E7EB" },
  downloadLink: { display: "inline-block", marginTop: 10, color: "#2563EB", fontWeight: 600 },
  fileMessage: { fontWeight: 500 }
};