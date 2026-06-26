import { useState, useRef, useEffect, useCallback } from "react";
import { ABOGADOS, EMPRESA } from "../lib/data";

//  helpers 
function Avatar({ initials, color, size = 32, style = {} }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: color, color: "white",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
        ...style,
      }}
    >
      {initials}
    </div>
  );
}

function Badge({ type, label }) {
  const cls = { administrativa: "adm", intermedia: "int", compleja: "comp" }[type] || "area";
  return <span className={`badge ${cls}`}>{label}</span>;
}

function now() {
  return new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function pickLawyer(areaLegal, abogados) {
  const areaMap = {
    "Derecho Laboral": "a1",
    "Derecho Civil y Contratos": "a2",
    "Derecho Civil": "a2",
    "Contratos": "a2",
    "Derecho Societario": "a3",
    "Derecho Administrativo": "a4",
    "Defensa del Consumidor": "a5",
    "Derecho del Consumidor": "a5",
  };
  const key = Object.keys(areaMap).find((k) =>
    areaLegal?.toLowerCase().includes(k.toLowerCase())
  );
  const id = key ? areaMap[key] : "a2";
  return abogados.find((a) => a.id === id) || abogados[0];
}

//  TAB: EMPRESA 
function TabEmpresa({ onNewCase }) {
  const [msgs, setMsgs] = useState([
    {
      role: "bot",
      html: `Bienvenido, <strong>${EMPRESA.contacto.split("")[0].trim()}</strong>! Soy el agente jurdico de <strong>12 Tablas IA</strong> asignado a <strong>${EMPRESA.nombre}</strong>.<br/><br/>Pods consultarme sobre contratos, relaciones laborales, habilitaciones, facturacin, proteccin de datos y ms. En qu te puedo ayudar hoy?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  const SUGS = [
    "Qu necesito para contratar un empleado nuevo?",
    "Un cliente no pag una factura hace 60 das",
    "Quiero modificar una clusula de mi contrato de alquiler",
    "Cmo hago para habilitar una nueva sucursal?",
  ];

  async function send(text) {
    if (!text.trim() || loading) return;
    setInput("");
    setLoading(true);
    const newHistory = [...history, { role: "user", content: text }];
    setHistory(newHistory);
    setMsgs((m) => [...m, { role: "user", html: text }]);

    try {
      const res = await fetch("/api/consulta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
      });
      const data = await res.json();
      setHistory((h) => [...h, { role: "assistant", content: data.respuesta || "" }]);

      let html = `<div>${data.respuesta || "No se pudo procesar la consulta."}</div>`;
      html += `<div class="badge-row">
        <span class="badge ${
          data.clasificacion === "administrativa" ? "adm" :
          data.clasificacion === "intermedia" ? "int" : "comp"
        }">${
          data.clasificacion === "administrativa" ? "Administrativa" :
          data.clasificacion === "intermedia" ? "Intermedia" : "Compleja"
        }</span>
        <span class="badge area">${data.area_legal || ""}</span>
      </div>`;

      if (data.requiere_abogado) {
        const lawyer = pickLawyer(data.area_legal, ABOGADOS);
        html += `<div class="abogado-asig">
          <div class="abog-av" style="background:${lawyer.color}">${lawyer.iniciales}</div>
          <div class="abog-info">
            <p>${lawyer.nombre}</p>
            <span>${lawyer.especialidad}  Red 12 Tablas IA</span>
          </div>
          <span class="badge area" style="margin-left:auto">Asignado </span>
        </div>`;
        onNewCase({ lawyer, area: data.area_legal, resumen: data.resumen_caso || text, empresa: EMPRESA.nombre, hora: now() });
      }

      setMsgs((m) => [...m, { role: "bot", html }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", html: "Error al conectar con el agente. Intent de nuevo." }]);
    }
    setLoading(false);
  }

  return (
    <div className="content">
      <div className="grid-chat">
        {/* empresa info */}
        <div className="card empresa-info">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M3 21h18M9 21V9h6v12"/></svg>
            Cliente
          </div>
          <div className="empresa-header">
            <div className="empresa-av">X</div>
            <div>
              <div className="empresa-av-name">{EMPRESA.nombre}</div>
              <div className="empresa-av-sub">{EMPRESA.rubro}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {[
              ["CUIT", EMPRESA.cuit],
              ["Contacto", EMPRESA.contacto.split("")[0].trim()],
              ["Rol", EMPRESA.contacto.split("")[1]?.trim()],
              ["Plan", "Premium B2B"],
            ].map(([lbl, val]) => (
              <div key={lbl} className="info-row">
                <span className="lbl">{lbl}</span>
                <span className="val">{val}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Abogados disponibles</div>
            {ABOGADOS.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Avatar initials={a.iniciales} color={a.color} size={28} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{a.nombre}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)" }}>{a.especialidad}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* chat */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            Agente jurdico 12 Tablas IA
          </div>

          <div className="messages" ref={msgsRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.role === "bot" ? (
                  <div className="avatar bot"></div>
                ) : (
                  <div className="avatar user">RMx</div>
                )}
                <div className="bubble" dangerouslySetInnerHTML={{ __html: m.html }} />
              </div>
            ))}
            {loading && (
              <div className="msg bot">
                <div className="avatar bot"></div>
                <div className="bubble">
                  <div className="typing-dots">
                    <div className="dot" /><div className="dot" /><div className="dot" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="sugs">
            {SUGS.map((s) => (
              <button key={s} className="sug" onClick={() => send(s)}>{s}</button>
            ))}
          </div>

          <div className="input-row">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send(input)}
              placeholder="Escrib tu consulta jurdica..."
              disabled={loading}
            />
            <button className="send-btn" onClick={() => send(input)} disabled={loading}>
              <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div className="disclaimer">Este agente brinda orientacin general, no constituye ejercicio de la abogaca.  12 Tablas Digital  2026</div>
        </div>
      </div>
    </div>
  );
}

//  TAB: 12 TABLAS DASHBOARD 
function TabDashboard({ cases }) {
  const total = cases.length;
  const derivadas = cases.filter((c) => c.lawyer).length;
  const empresas = [...new Set(cases.map((c) => c.empresa))].length;

  const byLawyer = ABOGADOS.map((a) => ({
    ...a,
    count: cases.filter((c) => c.lawyer?.id === a.id).length,
  }));

  return (
    <div className="content">
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { val: total, lbl: "Consultas totales (sesin)", sub: " en tiempo real", cls: "blue" },
          { val: derivadas, lbl: "Derivadas a abogado", sub: "Casos complejos asignados", cls: "amber" },
          { val: empresas, lbl: "Empresas activas", sub: "Clientes B2B conectados", cls: "green" },
        ].map((m) => (
          <div key={m.lbl} className="metric-card">
            <div className="metric-val">{m.val}</div>
            <div className="metric-lbl">{m.lbl}</div>
            <div className={`metric-sub ${m.cls}`}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        {/* consultas recientes */}
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Consultas recientes
          </div>
          {cases.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
              Esperando consultas de las empresas...
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Caso</th>
                  <th>rea</th>
                  <th>Abogado asignado</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {[...cases].reverse().map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: "var(--navy2)" }}>{c.empresa}</td>
                    <td style={{ color: "var(--text2)", maxWidth: 180 }}>{c.resumen}</td>
                    <td><span className="badge area">{c.area}</span></td>
                    <td>
                      {c.lawyer ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar initials={c.lawyer.iniciales} color={c.lawyer.color} size={24} />
                          <span style={{ fontSize: 12 }}>{c.lawyer.nombre}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text3)", fontSize: 12 }}></span>
                      )}
                    </td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{c.hora}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* abogados y carga */}
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Red de abogados  carga de casos
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {byLawyer.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar initials={a.iniciales} color={a.color} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.nombre}</div>
                      <div style={{ fontSize: 11, color: "var(--text3)" }}>{a.especialidad}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: a.count > 0 ? a.color : "var(--text3)" }}>
                      {a.count} caso{a.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      background: a.color,
                      width: `${Math.min(100, a.count * 20)}%`,
                      transition: "width .5s ease",
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

//  TAB: ABOGADOS 
function TabAbogados({ cases }) {
  return (
    <div className="content">
      <div className="profiles-grid">
        {ABOGADOS.map((a) => {
          const myCases = cases.filter((c) => c.lawyer?.id === a.id);
          return (
            <div key={a.id} className="profile-card">
              <div className="profile-header">
                <div className="profile-av" style={{ background: a.color }}>
                  {a.iniciales}
                </div>
                <div>
                  <div className="profile-name">{a.nombre}</div>
                  <div className="profile-esp">{a.especialidad}</div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <span className="badge area">{myCases.length} caso{myCases.length !== 1 ? "s" : ""}</span>
                    <span className="badge adm">Disponible</span>
                  </div>
                </div>
              </div>
              <div className="profile-cases">
                {myCases.length === 0 ? (
                  <div className="empty-cases">Sin casos asignados an</div>
                ) : (
                  [...myCases].reverse().map((c, i) => (
                    <div key={i} className="case-item">
                      <div className="case-empresa">{c.empresa}</div>
                      <div className="case-resumen">{c.resumen}</div>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <span className="badge area">{c.area}</span>
                        <span className="case-time">{c.hora}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

//  ROOT APP 
export default function App() {
  const [tab, setTab] = useState("empresa");
  const [cases, setCases] = useState([]);
  const [newCaseCount, setNewCaseCount] = useState(0);

  const handleNewCase = useCallback((c) => {
    setCases((prev) => [...prev, c]);
    setNewCaseCount((n) => n + 1);
  }, []);

  const tabs = [
    {
      id: "empresa",
      label: "Empresa X  Consultas",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M3 21h18M9 21V9h6v12"/>
        </svg>
      ),
    },
    {
      id: "dashboard",
      label: "12 Tablas IA  Panel",
      dot: newCaseCount > 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
    },
    {
      id: "abogados",
      label: "Perfiles de abogados",
      dot: cases.length > 0,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
        </svg>
      ),
    },
  ];

  return (
    <>
      <div className="topbar">
        <div className="topbar-logo">
          <div className="icon"></div>
          <div>
            <div className="name">12 Tablas <span>IA</span></div>
            <div className="sub">Plataforma de orientacin jurdica</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="empresa-badge">{EMPRESA.nombre}</span>
          <span className="empresa-badge" style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>
            MVP  TFG 2026
          </span>
        </div>
      </div>

      <nav className="tabs-nav">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            {t.label}
            {t.dot && tab !== t.id && <span className="tab-dot" />}
          </button>
        ))}
      </nav>

      <div className={`panel ${tab === "empresa" ? "active" : ""}`}>
        <TabEmpresa onNewCase={handleNewCase} />
      </div>
      <div className={`panel ${tab === "dashboard" ? "active" : ""}`}>
        <TabDashboard cases={cases} />
      </div>
      <div className={`panel ${tab === "abogados" ? "active" : ""}`}>
        <TabAbogados cases={cases} />
      </div>
    </>
  );
}
