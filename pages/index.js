import { useState, useRef, useEffect, useCallback } from "react";
import { ABOGADOS } from "../lib/data";

const EMPRESAS = [
  {
    id: "empresax",
    nombre: "Empresa X S.A.",
    inicial: "X",
    rubro: "Tecnolog\u00eda y Servicios",
    cuit: "30-71234567-2",
    contacto: "Lic. Roberto M\u00e9ndez",
    rol: "Gerente Administrativo",
    color: "#0f2744",
    sugs: [
      "\u00bfQu\u00e9 necesito para contratar un empleado nuevo?",
      "Un cliente no pag\u00f3 una factura hace 60 d\u00edas",
      "Quiero modificar una cl\u00e1usula de mi contrato de alquiler",
      "\u00bfC\u00f3mo hago para habilitar una nueva sucursal?",
    ],
  },
  {
    id: "empresay",
    nombre: "Constructora Y S.R.L.",
    inicial: "Y",
    rubro: "Construcci\u00f3n e Infraestructura",
    cuit: "30-68901234-1",
    contacto: "Ing. Laura Fern\u00e1ndez",
    rol: "Directora de Operaciones",
    color: "#2d5a1b",
    sugs: [
      "Un obrero sufri\u00f3 un accidente en obra, \u00bfqu\u00e9 hago?",
      "El municipio demor\u00f3 el permiso de construcci\u00f3n 3 meses",
      "\u00bfPuedo subcontratar sin modificar el contrato principal?",
      "Tengo una disputa con un proveedor de materiales",
    ],
  },
];

function Avatar({ initials, color, size = 32, style = {} }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, flexShrink: 0, ...style }}>
      {initials}
    </div>
  );
}

function now() {
  return new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

function pickLawyer(areaLegal) {
  const areaMap = {
    "Derecho Laboral": "a1", "Derecho Civil y Contratos": "a2", "Derecho Civil": "a2",
    "Contratos": "a2", "Derecho Societario": "a3", "Derecho Administrativo": "a4",
    "Defensa del Consumidor": "a5", "Derecho del Consumidor": "a5",
  };
  const key = Object.keys(areaMap).find((k) => areaLegal?.toLowerCase().includes(k.toLowerCase()));
  const id = key ? areaMap[key] : "a2";
  return ABOGADOS.find((a) => a.id === id) || ABOGADOS[0];
}

const SYSTEM_PROMPT_EMPRESA = (empresa) => `Sos el agente jur\u00eddico de "12 Tablas IA", asistente legal de ${empresa.nombre} (${empresa.rubro}).

Tu respuesta debe ser UNICAMENTE un objeto JSON v\u00e1lido, sin texto adicional, sin backticks, sin markdown:

{"clasificacion":"administrativa"|"intermedia"|"compleja","respuesta":"texto plano, m\u00e1x 3 oraciones","requiere_abogado":true|false,"area_legal":"una de las 5 \u00e1reas","resumen_caso":"8-12 palabras"}

AREAS: Derecho Laboral, Derecho Civil y Contratos, Derecho Societario, Derecho Administrativo, Defensa del Consumidor.

REGLAS DE DERIVACI\u00d3N (requiere_abogado: true) cuando:
- El usuario pide expl\u00edcitamente un abogado
- Conflicto activo con tercero, deuda vencida +30 d\u00edas, riesgo judicial
- Accidente laboral, sanci\u00f3n administrativa, modificaci\u00f3n de contrato con cl\u00e1usulas sensibles

Respond\u00e9 en espa\u00f1ol rioplatense, claro y directo.`;

// TAB EMPRESA - una por empresa
function TabEmpresa({ empresa, onNewCase, onReset, storageKey }) {
  const initMsg = [{
    role: "bot",
    html: `\u00a1Bienvenida, <strong>${empresa.contacto}</strong>! Soy el agente jur\u00eddico de <strong>12 Tablas IA</strong> asignado a <strong>${empresa.nombre}</strong>.<br/><br/>Pod\u00e9s consultarme sobre contratos, relaciones laborales, habilitaciones, facturaci\u00f3n, protecci\u00f3n de datos y m\u00e1s. \u00bfEn qu\u00e9 te puedo ayudar hoy?`,
  }];

  const [msgs, setMsgs] = useState(() => {
    if (typeof window === "undefined") return initMsg;
    try { const s = localStorage.getItem(storageKey + "_msgs"); return s ? JSON.parse(s) : initMsg; } catch { return initMsg; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try { localStorage.setItem(storageKey + "_msgs", JSON.stringify(msgs)); } catch {}
    }
  }, [msgs, storageKey]);

  function reset() {
    setMsgs(initMsg);
    setHistory([]);
    if (typeof window !== "undefined") localStorage.removeItem(storageKey + "_msgs");
    onReset();
  }

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
        body: JSON.stringify({ messages: newHistory, systemPrompt: SYSTEM_PROMPT_EMPRESA(empresa) }),
      });
      const data = await res.json();
      setHistory((h) => [...h, { role: "assistant", content: data.respuesta || "" }]);

      const clsMap = { administrativa: "adm", intermedia: "int", compleja: "comp" };
      const clsLabel = { administrativa: "Administrativa", intermedia: "Intermedia", compleja: "Compleja" };
      let html = `<div>${data.respuesta || "No se pudo procesar la consulta."}</div>`;
      html += `<div class="badge-row"><span class="badge ${clsMap[data.clasificacion] || "area"}">${clsLabel[data.clasificacion] || data.clasificacion}</span><span class="badge area">${data.area_legal || ""}</span></div>`;

      if (data.requiere_abogado) {
        const lawyer = pickLawyer(data.area_legal);
        html += `<div class="abogado-asig"><div class="abog-av" style="background:${lawyer.color}">${lawyer.iniciales}</div><div class="abog-info"><p>${lawyer.nombre}</p><span>${lawyer.especialidad} \u00b7 Red 12 Tablas IA</span></div><span class="badge area" style="margin-left:auto">Asignado \u2192</span></div>`;
        onNewCase({ lawyer, area: data.area_legal, resumen: data.resumen_caso || text, empresa: empresa.nombre, hora: now() });
      }
      setMsgs((m) => [...m, { role: "bot", html }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", html: "Error al conectar con el agente. Intent\u00e1 de nuevo." }]);
    }
    setLoading(false);
  }

  return (
    <div className="content">
      <div className="grid-chat">
        <div className="card empresa-info">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M3 21h18M9 21V9h6v12"/></svg>
            Cliente
          </div>
          <div className="empresa-header">
            <div className="empresa-av" style={{ background: empresa.color }}>{empresa.inicial}</div>
            <div>
              <div className="empresa-av-name">{empresa.nombre}</div>
              <div className="empresa-av-sub">{empresa.rubro}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            {[["CUIT", empresa.cuit], ["Contacto", empresa.contacto], ["Rol", empresa.rol], ["Plan", "Premium B2B"]].map(([lbl, val]) => (
              <div key={lbl} className="info-row"><span className="lbl">{lbl}</span><span className="val">{val}</span></div>
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

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px 6px", borderBottom:"1px solid var(--border)", marginBottom:8 }}>
            <div style={{ width:22, height:22, borderRadius:"50%", background:"var(--navy)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#c8e8ff", flexShrink:0 }}>\u2696</div>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--text2)" }}>Agente jur\u00eddico 12 Tablas IA</span>
            <span style={{ marginLeft:"auto", fontSize:11, color:"#2d7a4f", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"#2d7a4f", display:"inline-block" }}></span>En l\u00ednea
            </span>
            <button onClick={reset} title="Limpiar conversaci\u00f3n" style={{ marginLeft:8, background:"none", border:"1px solid var(--border2)", borderRadius:6, cursor:"pointer", padding:"3px 10px", fontSize:11, color:"var(--text3)", display:"flex", alignItems:"center", gap:4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
              Reset demo
            </button>
          </div>

          <div className="messages" ref={msgsRef}>
            {msgs.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>
                {m.role === "bot" ? <div className="avatar bot">\u2696</div> : <div className="avatar user">{empresa.inicial[0]}Mx</div>}
                <div className="bubble" dangerouslySetInnerHTML={{ __html: m.html }} />
              </div>
            ))}
            {loading && (
              <div className="msg bot">
                <div className="avatar bot">\u2696</div>
                <div className="bubble"><div className="typing-dots"><div className="dot"/><div className="dot"/><div className="dot"/></div></div>
              </div>
            )}
          </div>

          <div className="sugs">
            {empresa.sugs.map((s) => <button key={s} className="sug" onClick={() => send(s)}>{s}</button>)}
          </div>

          <div className="input-row">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send(input)} placeholder="Escrib\u00ed tu consulta jur\u00eddica..." disabled={loading} />
            <button className="send-btn" onClick={() => send(input)} disabled={loading}>
              <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
          <div className="disclaimer">Este agente brinda orientaci\u00f3n general, no constituye ejercicio de la abogac\u00eda. \u2014 12 Tablas Digital \u00a9 2026</div>
        </div>
      </div>
    </div>
  );
}

// TAB DASHBOARD
function TabDashboard({ cases }) {
  const total = cases.length;
  const derivadas = cases.filter((c) => c.lawyer).length;
  const empresas = [...new Set(cases.map((c) => c.empresa))].length;
  const byLawyer = ABOGADOS.map((a) => ({ ...a, count: cases.filter((c) => c.lawyer?.id === a.id).length }));

  return (
    <div className="content">
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {[
          { val: total, lbl: "Consultas totales (sesi\u00f3n)", sub: "\u2191 en tiempo real", cls: "blue" },
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
        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Consultas recientes
          </div>
          {cases.length === 0 ? (
            <div style={{ color: "var(--text3)", fontSize: 13, padding: "20px 0", textAlign: "center" }}>Esperando consultas de las empresas...</div>
          ) : (
            <table>
              <thead><tr><th>Empresa</th><th>Caso</th><th>\u00c1rea</th><th>Abogado asignado</th><th>Hora</th></tr></thead>
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
                      ) : <span style={{ color: "var(--text3)", fontSize: 12 }}>\u2014</span>}
                    </td>
                    <td style={{ color: "var(--text3)", fontSize: 12 }}>{c.hora}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
            Red de abogados \u2014 carga de casos
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
                    <span style={{ fontSize: 12, fontWeight: 700, color: a.count > 0 ? a.color : "var(--text3)" }}>{a.count} caso{a.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div style={{ marginTop: 4, height: 5, background: "var(--border)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 3, background: a.color, width: `${Math.min(100, a.count * 20)}%`, transition: "width .5s ease" }} />
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

// TAB ABOGADOS
function TabAbogados({ cases }) {
  return (
    <div className="content">
      <div className="profiles-grid">
        {ABOGADOS.map((a) => {
          const myCases = cases.filter((c) => c.lawyer?.id === a.id);
          return (
            <div key={a.id} className="profile-card">
              <div className="profile-header">
                <div className="profile-av" style={{ background: a.color }}>{a.iniciales}</div>
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
                  <div className="empty-cases">Sin casos asignados a\u00fan</div>
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

// ROOT APP
export default function App() {
  const [tab, setTab] = useState("empresax");
  const [cases, setCases] = useState(() => {
    if (typeof window === "undefined") return [];
    try { const s = localStorage.getItem("legalia_cases"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [newCaseCount, setNewCaseCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try { localStorage.setItem("legalia_cases", JSON.stringify(cases)); } catch {}
    }
  }, [cases]);

  const handleNewCase = useCallback((c) => {
    setCases((prev) => [...prev, c]);
    setNewCaseCount((n) => n + 1);
  }, []);

  const handleReset = useCallback((empresaId) => {
    setCases((prev) => {
      const empresa = EMPRESAS.find(e => e.id === empresaId);
      return prev.filter((c) => c.empresa !== empresa?.nombre);
    });
  }, []);

  const tabs = [
    ...EMPRESAS.map((e) => ({
      id: e.id,
      label: e.nombre,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16M3 21h18M9 21V9h6v12"/></svg>,
    })),
    {
      id: "dashboard",
      label: "12 Tablas IA \u2014 Panel",
      dot: newCaseCount > 0,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    },
    {
      id: "abogados",
      label: "Perfiles de abogados",
      dot: cases.length > 0,
      icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    },
  ];

  return (
    <>
      <div className="topbar">
        <div className="topbar-logo">
          <div className="icon" style={{ fontSize:"14px", width:"28px", height:"28px" }}>\u2696</div>
          <div>
            <div className="name">12 Tablas <span>IA</span></div>
            <div className="sub">Plataforma de orientaci\u00f3n jur\u00eddica</div>
          </div>
        </div>
        <div className="topbar-right">
          <span className="empresa-badge">{EMPRESAS.length} empresas activas</span>
          <span className="empresa-badge" style={{ color: "rgba(255,255,255,.5)", fontSize: 11 }}>MVP \u00b7 TFG 2026</span>
        </div>
      </div>

      <nav className="tabs-nav">
        {tabs.map((t) => (
          <button key={t.id} className={`tab-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
            {t.dot && tab !== t.id && <span className="tab-dot" />}
          </button>
        ))}
      </nav>

      {EMPRESAS.map((e) => (
        <div key={e.id} className={`panel ${tab === e.id ? "active" : ""}`}>
          <TabEmpresa empresa={e} onNewCase={handleNewCase} onReset={() => handleReset(e.id)} storageKey={`legalia_${e.id}`} />
        </div>
      ))}
      <div className={`panel ${tab === "dashboard" ? "active" : ""}`}>
        <TabDashboard cases={cases} />
      </div>
      <div className={`panel ${tab === "abogados" ? "active" : ""}`}>
        <TabAbogados cases={cases} />
      </div>
    </>
  );
}
