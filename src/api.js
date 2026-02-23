const API_URL = import.meta.env.VITE_API_URL;

// ===============================
// 💬 Enviar mensaje al chat
// ===============================
export async function sendMessage(sessionId, message) {
  const response = await fetch(`${API_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      message: message,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Error backend:", text);
    throw new Error("Error en la comunicación con el servidor");
  }

  return response.json();
}

// ===============================
// 📎 Subir archivo VPN
// ===============================
export async function uploadVPNFile(sessionId, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  const response = await fetch(`${API_URL}/vpn/upload/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("Error backend:", text);
    throw new Error("Error subiendo archivo");
  }

  return response.json();
}

// ===============================
// 📄 Descargar formato VPN
// ===============================
export function getVPNFormatUrl() {
  return `${API_URL}/vpn/formato/`;
}