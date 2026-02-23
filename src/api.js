const API_URL = import.meta.env.VITE_API_URL;

export async function sendMessage(sessionId, message) {
  const response = await fetch(`${API_URL}/chat`, {
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
    throw new Error("Error en la comunicación con el servidor");
  }

  return response.json();
}

export async function uploadVPNFile(sessionId, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  const response = await fetch(`${API_URL}/vpn/upload`, {
    method: "POST",
    body: formData,
  });

  return response.json();
}

export function getVPNFormatUrl() {
  return `${API_URL}/vpn/formato`;
}