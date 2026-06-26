# 12 Tablas IA — MVP

Agente de orientación jurídica con IA real. TFG 2026 — Universidad Siglo 21.

## Stack
- **Next.js 14** (Pages Router)
- **Claude API** (claude-sonnet-4-6) — IA real
- **Vercel** — deploy

## Estructura

```
/pages
  index.js          → App completa (3 pestañas)
  /api
    consulta.js     → Proxy seguro a Anthropic API
/lib
  data.js           → Abogados, empresa, system prompt
/styles
  globals.css       → Estilos
```

## Pestañas

| Pestaña | Rol | Descripción |
|---------|-----|-------------|
| Empresa X | Usuario final | Chat con agente IA + asignación automática de abogado |
| 12 Tablas IA | Administrador | Dashboard con consultas en tiempo real y carga por abogado |
| Perfiles | Abogados | Cada abogado ve sus casos asignados |

## Deploy en Vercel (5 pasos)

1. Subí este proyecto a GitHub (repo nuevo o existente)
2. En [vercel.com](https://vercel.com) → **Add New Project** → importá el repo
3. En **Environment Variables** agregá:
   ```
   ANTHROPIC_API_KEY = sk-ant-...
   ```
4. Click **Deploy**
5. ¡Listo! La API key nunca queda expuesta en el frontend

## Desarrollo local

```bash
# 1. Clonar / copiar el proyecto
# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
echo "ANTHROPIC_API_KEY=sk-ant-TU_CLAVE" > .env.local

# 4. Correr en modo dev
npm run dev
# → http://localhost:3000
```

## Abogados de la red

| ID | Nombre | Especialidad |
|----|--------|-------------|
| a1 | Dra. Martina Solís | Derecho Laboral |
| a2 | Dr. Jorge Rueda | Derecho Civil y Contratos |
| a3 | Dra. Carla Pérez | Derecho Societario |
| a4 | Dr. Andrés Luna | Derecho Administrativo |
| a5 | Dra. Valentina Torres | Defensa del Consumidor |

## Nota legal (disclaimer)
Este MVP es una herramienta académica de demostración. No constituye asesoramiento jurídico formal ni ejercicio de la abogacía.
