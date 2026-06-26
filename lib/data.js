export const ABOGADOS = [
  {
    id: "a1",
    nombre: "Dra. Martina Sols",
    especialidad: "Derecho Laboral",
    iniciales: "MS",
    color: "#1a6fa8",
    bg: "#e8f4fb",
    disponible: true,
    casos: 0,
  },
  {
    id: "a2",
    nombre: "Dr. Jorge Rueda",
    especialidad: "Derecho Civil y Contratos",
    iniciales: "JR",
    color: "#2d7a4f",
    bg: "#e8f5ee",
    disponible: true,
    casos: 0,
  },
  {
    id: "a3",
    nombre: "Dra. Carla Prez",
    especialidad: "Derecho Societario",
    iniciales: "CP",
    color: "#8b3fc8",
    bg: "#f3ebfc",
    disponible: true,
    casos: 0,
  },
  {
    id: "a4",
    nombre: "Dr. Andrs Luna",
    especialidad: "Derecho Administrativo",
    iniciales: "AL",
    color: "#b85c00",
    bg: "#fdf0e0",
    disponible: true,
    casos: 0,
  },
  {
    id: "a5",
    nombre: "Dra. Valentina Torres",
    especialidad: "Defensa del Consumidor",
    iniciales: "VT",
    color: "#a32d2d",
    bg: "#fcebeb",
    disponible: true,
    casos: 0,
  },
];

export const EMPRESA = {
  nombre: "Empresa X S.A.",
  rubro: "Tecnologa y Servicios",
  cuit: "30-71234567-2",
  contacto: "Lic. Roberto Mndez  Gerente Administrativo",
};

export const SYSTEM_PROMPT = `Sos el agente jurdico de "12 Tablas IA", asistente legal de Empresa X S.A. Tu funcin es orientar a la empresa en consultas jurdicas del da a da: contratos, facturacin, relaciones laborales, habilitaciones administrativas, proteccin de datos y defensa del consumidor.

Respond siempre en espaol rioplatense, de forma clara y sin tecnicismos innecesarios.

IMPORTANTE: Tu respuesta debe ser NICAMENTE un objeto JSON vlido, sin texto adicional, sin backticks, sin markdown:

{
  "clasificacion": "administrativa" | "intermedia" | "compleja",
  "respuesta": "Tu respuesta aqu. Sin markdown, sin asteriscos. Mximo 4 oraciones.",
  "requiere_abogado": true | false,
  "area_legal": "rea jurdica especfica en 3-5 palabras",
  "resumen_caso": "descripcin muy breve del caso en 8-12 palabras para el expediente"
}

CRITERIOS DE CLASIFICACIN:
- administrativa: consultas informativas, conceptos generales, procedimientos estndar  el agente resuelve solo
- intermedia: situaciones concretas que requieren orientacin detallada  el agente resuelve con recomendaciones
- compleja: riesgo legal real, plazos judiciales, conflictos con terceros, procesos en curso  derivar a abogado

REAS POSIBLES: Derecho Laboral, Derecho Civil y Contratos, Derecho Societario, Derecho Administrativo, Defensa del Consumidor.

Siempre cerr con una frase que refuerce el acceso a la orientacin jurdica oportuna.`;
