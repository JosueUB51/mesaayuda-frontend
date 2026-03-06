import { useState } from "react";
import "./App.css";
import logoTecno from "./assets/tecno.png";

function App() {
  const [incidencia, setIncidencia] = useState("");
  const [solucion, setSolucion] = useState("");
  const [caseId, setCaseId] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);

  const API_URL = "http://localhost:8000";

const buscarSolucion = async () => {
  if (!incidencia.trim()) return;

  const res = await fetch(`${API_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: incidencia }),
  });

  const data = await res.json();

  if (!data.found) {
    alert("No se encontró solución. Puedes registrar un nuevo caso.");
    setModoNuevo(true);
    setSolucion("");
    return;
  }

  setSolucion(data.solution_text);
  setCaseId(data.case_id);
  setModoNuevo(false);
};

  const marcarCorrecta = async () => {
    if (!caseId) return;

    await fetch(`${API_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId, helpful: true }),
    });

    alert("Gracias por confirmar la solución.");
  };

  const guardarNuevoCaso = async () => {
    if (!incidencia.trim() || !solucion.trim()) {
      alert("Debes escribir incidencia y solución.");
      return;
    }

    await fetch(`${API_URL}/cases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        incident_text: incidencia,
        solution_text: solucion,
      }),
    });

    alert("Nuevo caso registrado correctamente.");
    setModoNuevo(false);
  };

  return (
    <div className="container">

      <div className="header">
        <img src={logoTecno} alt="Tecnologías" className="logo" />
      </div>

      <h1 className="titulo">
        Sistema de Registro y Gestión de Atención Telefónica
      </h1>

      <p className="subtitulo">
        Registre el asunto de la llamada para consultar soluciones existentes
        o documentar un nuevo caso en la base de conocimiento institucional.
      </p>

      <div className="card-principal">
        <textarea
          placeholder="Ingresa la incidencia o cuestión..."
          value={incidencia}
          onChange={(e) => setIncidencia(e.target.value)}
        />
        <button className="btn-buscar" onClick={buscarSolucion}>
          Buscar solución
        </button>
      </div>

      <h2 className="solucion-label">Solución Sugerida:</h2>

      <div className="card-solucion">
        <textarea
          value={solucion}
          onChange={(e) => setSolucion(e.target.value)}
          readOnly={!modoNuevo}
          style={{
            width: "100%",
            height: "140px",
            border: "none",
            outline: "none",
            resize: "none",
            fontSize: "16px",
            background: modoNuevo ? "#fff" : "#f9f9f9",
          }}
        />
      </div>

      <div className="botones-inferiores">
        {modoNuevo ? (
          <button className="btn-secundario" onClick={guardarNuevoCaso}>
            Guardar Nuevo Caso
          </button>
        ) : (
          <>
            <button className="btn-secundario" onClick={() => setModoNuevo(true)}>
              Nuevo Caso
            </button>
            <button className="btn-secundario" onClick={marcarCorrecta}>
              Solución Correcta
            </button>
          </>
        )}
      </div>

    </div>
  );
}

export default App;