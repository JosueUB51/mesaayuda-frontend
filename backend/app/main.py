from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.db import get_conn
from app.schemas import SearchRequest, SearchResult, CreateCaseRequest, FeedbackRequest
from app.embeddings import embed

app = FastAPI(title="CallCenter KB API")

# 🔥 Puedes ajustar este valor
SIMILARITY_THRESHOLD = 0.31

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"ok": True}


@app.post("/search", response_model=SearchResult)
def search(req: SearchRequest):
    q = (req.text or "").strip()
    if not q:
        raise HTTPException(status_code=400, detail="Texto vacío")

    q_emb = embed(q)

    sql = """
      SELECT id, solution_text,
             1 - (incident_embedding <=> %s::vector) AS similarity
      FROM cases
      ORDER BY incident_embedding <=> %s::vector
      LIMIT 1;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (q_emb, q_emb))
            row = cur.fetchone()

            if not row:
                return SearchResult(found=False)

            case_id, solution_text, similarity = row
            similarity = float(similarity)

            # 🔍 Debug
            print("SIMILARITY:", similarity)

            # 🔥 Filtro semántico
            if similarity < SIMILARITY_THRESHOLD:
                return SearchResult(found=False)

            # Registrar uso
            cur.execute(
                "UPDATE cases SET times_used = times_used + 1 WHERE id = %s",
                (case_id,)
            )
            conn.commit()

    return SearchResult(
        found=True,
        case_id=case_id,
        solution_text=solution_text,
        similarity=similarity
    )


@app.post("/cases")
def create_case(req: CreateCaseRequest):
    incident = (req.incident_text or "").strip()
    solution = (req.solution_text or "").strip()

    if not incident or not solution:
        raise HTTPException(status_code=400, detail="incident_text y solution_text son requeridos")

    emb = embed(incident)

    sql = """
      INSERT INTO cases (incident_text, solution_text, incident_embedding)
      VALUES (%s, %s, %s::vector)
      RETURNING id;
    """

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, (incident, solution, emb))
            new_id = cur.fetchone()[0]
            conn.commit()

    return {"id": new_id}


@app.post("/feedback")
def feedback(req: FeedbackRequest):
    with get_conn() as conn:
        with conn.cursor() as cur:

            cur.execute(
                "UPDATE cases SET times_used = times_used + 0 WHERE id = %s",
                (req.case_id,)
            )

            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="case_id no existe")

            if req.helpful:
                cur.execute(
                    "UPDATE cases SET times_helpful = times_helpful + 1 WHERE id = %s",
                    (req.case_id,)
                )

            conn.commit()

    return {"ok": True}