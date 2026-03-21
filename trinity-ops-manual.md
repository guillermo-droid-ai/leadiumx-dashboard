# Trinity Offers — Manual de Operaciones
### Cómo funciona el sistema completo

> **Actualizado:** 2026-03-21 | **Instancia n8n:** leadiumx.app.n8n.cloud | **Proyecto:** Trinity Offers

---

## Visión General

Trinity Offers tiene **3 agentes de voz** (Amy, Olivia, Sofie) que operan sobre leads de Salesforce y GHL. Cada agente tiene un rol distinto: Amy cubre el horario nocturno con nuevos leads, Olivia hace follow-up de día, y Sofie trabaja oportunidades de largo plazo. Un sistema de monitoreo vigila que todo funcione y reporta a Discord.

```
Salesforce CRM
    ↓
  Nuevos leads / Oportunidades
    ↓
  ┌─────────────────────────────────────────┐
  │  AMY        Olivia       Sofie          │
  │  After Hrs  Outbound     Long Term      │
  │  (noche)    (día)        (FU+LT)        │
  └─────────────────────────────────────────┘
    ↓               ↓              ↓
  Retell AI — llamadas automáticas de voz
    ↓               ↓              ↓
  GHL (GoHighLevel) — notas, citas, contactos
    ↓
  Supabase — registro de llamadas y scores QA
    ↓
  Discord — alertas y reportes diarios
```

---

## AGENTE 1 — AMY (After Hours + Inbound)

### ¿Qué hace Amy?
Amy llama a **nuevos leads de Salesforce** que llegaron **fuera del horario de oficina** (noche y madrugada). Si alguien llama al número de la empresa después de las 5pm o antes de las 9am, Amy también atiende esa llamada entrante. Su objetivo es confirmar el interés, recopilar datos y reservar una cita.

### Flujo After Hours (Outbound — AH-1 al AH-5)

```
[AH-1] Cada 10 min (0:00am–2:00pm UTC y 11pm UTC+)
  ↓ Lee Salesforce: nuevos leads sin llamar
  ↓ Para cada lead sin llamada previa:

[AH-2] Webhook recibe el lead
  ↓ Verifica en Supabase si ya fue llamado (evita duplicados)
  ↓ Si es nuevo: registra "calling" en Supabase
  ↓ Dispara llamada a Retell AI → llama al lead

[AH-3] Mid-call: Lead Lookup (herramienta del agente)
  ↓ Cuando Amy pregunta "¿quién eres?", busca el lead en Supabase + GHL
  ↓ Devuelve nombre, caso, detalles al agente

[AH-4] Mid-call: Booking Handler (herramienta del agente)
  ↓ Cuando el lead dice "sí, quiero una cita", calcula horario disponible
  ↓ Crea la cita en el calendario de GHL
  ↓ Agrega nota en GHL: "Cita reservada por Amy AH"

[AH-5] Post-call webhook (llega de Retell al terminar la llamada)
  ↓ Recibe transcript + duración + resultado
  ↓ Crea o actualiza contacto en GHL con los datos del lead
  ↓ Agrega nota con resumen de la llamada
  ↓ Si el lead pidió cita: re-verifica y confirma el booking
```

**Horario activo:** Noches y madrugadas (fuera de horario de negocio en IL, CDT UTC-5)
**Credenciales:** Salesforce, GHL, Supabase
**Tabla Supabase:** `after_hours_calls`

---

### Flujo Inbound (IN-1 al IN-4)

Cuando alguien llama al número de Amy:

```
Lead llama → Retell AI contesta (Amy habla)

[IN-1] Mid-call: Caller Lookup
  ↓ Amy recibe el número → busca en GHL por teléfono
  ↓ Devuelve nombre, historial, caso al agente

[IN-2] Mid-call: Get Availability
  ↓ Amy dice "déjame ver qué horarios tenemos"
  ↓ Consulta calendario GHL → devuelve slots libres

[IN-3] Mid-call: Book Appointment
  ↓ Lead elige horario → Amy confirma
  ↓ Crea la cita en GHL calendar

[IN-4] Post-call
  ↓ Transcript llega a n8n
  ↓ GPT-4o-mini clasifica la llamada (interested / not interested / voicemail / etc.)
  ↓ Inserta registro en Supabase (con continueOnFail por si falla)
```

---

## AGENTE 2 — OLIVIA (Outbound + Inbound)

### ¿Qué hace Olivia?
Olivia llama durante el **horario de oficina** (9am–5pm CDT, lunes a viernes) a nuevos leads de Salesforce. También hace **follow-up**: si un lead no contestó, vuelve a llamar al día siguiente. Adicionalmente gestiona un flujo de **SMS via iMessage** para leads que no responden al teléfono.

### Flujo Outbound (OT-1 al OT-7)

```
[OT-1] Cada hora (9am–5pm CDT, Lun-Vie)
  ↓ Lee Salesforce: leads en stage "New Lead" o similar
  ↓ Verifica en Supabase si ya fue llamado hoy
  ↓ Dispara llamada via Retell AI → Olivia llama al lead

[OT-1b] Cada hora (mismo horario)
  ↓ Lee Salesforce: leads en stage "Follow-up"
  ↓ Agrega a cola de follow-up en Supabase
  ↓ (Estos son leads que ya fueron llamados pero no contestaron o quedaron pendientes)

[OT-2] Post-call webhook (Retell → n8n al terminar cada llamada)
  ↓ Recibe resultado: contestó / no contestó / voicemail / interesado / etc.
  ↓ Actualiza Supabase con status, duración, transcript
  ↓ Actualiza contacto en GHL (nota, tag, status)
  ↓ Si "no answer": marca para follow-up al día siguiente

[OT-3] Cada 10 min (horario de negocio)
  ↓ Revisa leads que necesitan follow-up según OT-2
  ↓ Si pasaron 24h desde la última llamada: re-dispara OT-1

[OT-4] Audit & Fix (cron)
  ↓ Limpieza: detecta registros en Supabase sin GHL contact ID
  ↓ Los crea en GHL si faltan

[OT-5] Webhook → recibe trigger para enviar SMS
  ↓ Cuando un lead no contesta X veces: activa flujo SMS
  ↓ Agrega tag "ai-followup-sms" en GHL contact

[OT-6] Webhook → confirmación de SMS enviado
  ↓ GHL automation envía el iMessage
  ↓ Este webhook confirma que se envió → actualiza Supabase

[OT-7] Webhook → reply del lead
  ↓ Si el lead responde el iMessage, GHL notifica este webhook
  ↓ Clasifica respuesta (interesado / no interesado / pide call)
  ↓ Si HOT: notifica a Discord para acción manual inmediata
```

**Horario activo:** 9am–5pm CDT (14:00–22:00 UTC), Lun-Vie
**Credenciales:** Salesforce, GHL, Supabase
**Tabla Supabase:** `calls` (outbound), `contact_kpi`

---

## AGENTE 3 — SOFIE (Long Term Opportunities)

### ¿Qué hace Sofie?
Sofie llama a **oportunidades de largo plazo en Salesforce** — leads que ya conocen la empresa pero aún no han cerrado. Trabaja stages: `Follow-up`, `Long Term`, `Long Term Followup`. Es más paciente y enfocada en retomar conversaciones con prospectos "tibios".

### Flujo (SF-1, SF-1b, SF-3)

```
[SF-1] Cada hora (horario de negocio)
  ↓ Lee Salesforce: oportunidades en stage "Long Term" o "Long Term Followup"
  ↓ Obtiene ContactId → busca teléfono en Contact object de SF
  ↓ Verifica deduplicación en Supabase
  ↓ Llama via Retell AI → Sofie habla con el prospecto

[SF-1b] Cada hora (mismo horario)
  ↓ Lee Salesforce: oportunidades en stage "Follow-up" y "Long Term Followup"
  ↓ (Captura los casos que SF-1 podría no cubrir)
  ↓ Mismo proceso: dedup → llamada Retell

[SF-3] Cada 10 min (horario de negocio)
  ↓ Follow-up scheduler: si Sofie no contactó en llamada anterior
  ↓ Programa re-llamada para próximo día hábil

[Post Call] Webhook post-llamada
  ↓ Recibe resultado de Retell
  ↓ Actualiza Supabase con status y transcript
  ↓ Si "interesado": actualiza stage en Salesforce
  ↓ Notifica a GHL con nota de la conversación

[Booking] Herramienta mid-call
  ↓ Si el prospecto quiere cita: Sofie llama este webhook
  ↓ Busca disponibilidad en GHL calendar
  ↓ Crea la cita y confirma al agente

[Availability] Herramienta mid-call
  ↓ Sofie consulta slots disponibles para ofrecer opciones al prospecto
```

**Horario activo:** 9am–5pm CDT (14:00–22:00 UTC), Lun-Vie
**Credenciales:** Salesforce, GHL, Supabase
**Tabla Supabase:** `calls` (sofie_outbound)

---

## FLUJO DE SMS / iMESSAGE

Los iMessages **NO los envía n8n directamente**. El flujo es:

```
n8n detecta lead sin respuesta
  ↓
Agrega tag "ai-followup-sms" al contacto en GHL
  ↓
GHL Automation detecta el tag
  ↓
GHL envía el iMessage desde el número de Apple Business
  ↓
Si el lead responde → GHL notifica a OT-7 (Olivia) o New Chatbot
  ↓
New Chatbot (GPT-4o): responde automáticamente via SMS
  ↓
Si el lead dice "llámame" / respuesta HOT → Discord alert para acción manual
```

**iMessage Outreach** (`wOW4GWeUZzFmHY2Z`): workflow separado que corre cada 5 min y procesa la lista de contactos del Google Sheet de campañas.

---

## WORKFLOWS COMPARTIDOS (Shared)

| Workflow | Función |
|---|---|
| SF Opportunities Poller | Sincroniza oportunidades de Salesforce a GHL una vez al día (9am UTC) |
| SF to GHL Leads | Webhook: cuando SF crea un lead, lo replica a GHL en tiempo real |
| Get Availability - Olivia | API interna que Amy/Olivia llaman para consultar horarios del calendario |
| Get Availability - Amy | Igual pero configurado para el calendario de Amy |

---

## MONITOREO (Mon / 1, 2, 3 + QA Agent)

```
[MON-1] Cada 10 minutos — 24/7
  ↓ Consulta ejecuciones con error en los últimos 10 min
  ↓ Compara con lista de errores ya notificados (Supabase)
  ↓ Si hay error NUEVO → envía alerta a Discord #general
  ↓ Marca como "alerted" en Supabase para no repetir

[MON-2] Cada hora (solo horario after hours: 10pm–7am CDT)
  ↓ Watchdog específico para Amy After Hours
  ↓ Cuenta errores recientes → reporta a Discord si hay problemas

[MON-3] Diariamente a las 8am CDT (13:00 UTC)
  ↓ Fetch: todas las ejecuciones de las últimas 24h
  ↓ Fetch: todos los registros en Supabase del día
  ↓ Genera reporte: llamadas realizadas / errores / agents activos
  ↓ Envía resumen completo a Discord

[QA Agent] Diariamente a las 12am CDT (05:00 UTC)
  ↓ Obtiene llamadas del día anterior de Supabase
  ↓ Descarga transcripts de Retell API
  ↓ Envía cada transcript a GPT-4o para análisis de calidad
  ↓ Score 1-10 + feedback por categoría
  ↓ Guarda en Supabase tabla qa_scores
  ↓ Dashboard en Vercel muestra los scores
```

**Discord:** Todas las alertas van a `#general` via webhook

---

## FLUJO COMPLETO DE UN LEAD NUEVO (Ejemplo Real)

```
Lunes 6pm CDT — Alguien completa un formulario web → entra a Salesforce como Lead

↓ [Shared/SF to GHL] copia el lead a GHL en tiempo real

↓ Es después de las 5pm → Amy After Hours toma el caso
  [AH-1] detecta el lead a las 6:10pm (próximo ciclo de 10 min)
  [AH-2] dispara llamada → Amy llama al lead

↓ El lead no contesta
  [AH-5] post-call: registra "no_answer" en Supabase

↓ Amy reintenta 2-3 veces durante la noche (AH-3 scheduler)

↓ Siguiente día 9am CDT — Olivia toma el relevo
  [OT-1] ve el lead en Salesforce (stage actualizado)
  Olivia llama → el lead contesta

↓ Conversación exitosa
  [OT-2] post-call: registra resultado en Supabase
  GHL: se crea nota, se actualiza status del contacto
  Si reservó cita → aparece en el calendario

↓ Al día siguiente
  [QA Agent] analiza la llamada de Olivia
  Score guardado en Supabase
  Dashboard muestra la calidad de la interacción
```

---

## TABLA DE ESTADOS — CUÁNDO ACTÚA CADA AGENTE

| Horario (CDT) | Quién actúa | Qué hace |
|---|---|---|
| 12am – 9am | Amy After Hours | Llama nuevos leads nocturnos |
| 9am – 5pm (L-V) | Olivia Outbound | Llama nuevos + follow-up |
| 9am – 5pm (L-V) | Sofie | Llama Long Term opportunities |
| 5pm – 12am | Amy After Hours | Retoma nuevos leads de tarde |
| Todo el día | MON-1 | Vigilancia de errores cada 10 min |
| 8am diario | MON-3 | Reporte diario a Discord |
| 12am diario | QA Agent | Análisis de calidad de llamadas |

---

## CREDENCIALES — DÓNDE SE USAN

| Credencial | Usada por |
|---|---|
| Salesforce OAuth | OT-1, OT-1b, SF-1, SF-1b (pollers de Salesforce) |
| GHL (HighLevel OAuth) | AH-3, AH-4, AH-5, OT-2, OT-5, Booking, Availability |
| OpenAI | QA Agent (análisis), New Chatbot (respuestas SMS), IN-4 (clasificación) |
| Google Sheets | iMessage Outreach (lee lista de contactos de campaña) |
| Google Service Account | MON-3 (reportes) |
| Supabase (hardcoded key) | Todos los workflows (HTTP Request con apikey en header) |
| Retell API (hardcoded key) | AH-2, OT-1, SF-1, SF-1b (crear llamadas outbound) |

> **Nota sobre Salesforce OAuth:** El token expira periódicamente. Si OT-1 o SF-1b empiezan a fallar con "credential access" errors, hay que reconectar el OAuth en n8n Settings → Credentials → Salesforce account.

---

## CHECKLIST SEMANAL (cada lunes)

### Agents activos
- [ ] OT-1 tuvo ejecuciones exitosas esta semana (revisar tabla en n8n)
- [ ] SF-1b tuvo ejecuciones exitosas esta semana
- [ ] AH-1 corriendo cada 10 min sin errores en horario nocturno
- [ ] MON-3 envió reporte a Discord cada día

### Credenciales
- [ ] Salesforce OAuth vigente (si OT-1/SF-1b fallan, reconectar)
- [ ] GHL token activo (si AH-4/Booking fallan, reconectar)
- [ ] OpenAI no tiene errores 429 (platform.openai.com → Usage)

### Datos
- [ ] Supabase `calls` recibiendo registros nuevos diariamente
- [ ] Supabase `qa_scores` recibiendo scores del QA Agent
- [ ] Dashboard Vercel carga sin errores

### Discord
- [ ] No hay alertas de MON-1 sin resolver en #general
- [ ] Revisar replies de iMessage en GHL (posibles HOT leads)

---

## LINKS RÁPIDOS

| Recurso | URL |
|---|---|
| n8n LeadiumX | https://leadiumx.app.n8n.cloud |
| n8n Case Settlement | https://casesettlement.app.n8n.cloud |
| Dashboard KPIs | https://leadiumx-dashboard.vercel.app |
| GHL LeadiumX | https://app.gohighlevel.com/v2/location/4fJ871nY9iRQZaeghss5 |
| GHL Case Settlement | https://app.gohighlevel.com/v2/location/OEvyZgDZMvPWYEYrBTxR |
| Supabase LeadiumX | https://gbuwvtvnrsmlvthqyxkb.supabase.co |
| Supabase Case Settlement | https://kgndqzrluavpnsomckzy.supabase.co |
| Retell AI | https://app.retellai.com |
| OpenAI Usage | https://platform.openai.com/usage |

---

*Manual generado por Trinity — 2026-03-21*
