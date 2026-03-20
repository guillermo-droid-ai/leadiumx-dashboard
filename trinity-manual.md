# Trinity Offers — Manual de Operaciones n8n

> **Generado:** 2026-03-20  |  **Proyecto:** Trinity Offers (leadiumx.app.n8n.cloud)  |  **Total workflows:** 38

---

## Resumen General

| Workflow | Agente | Trigger | Estado | Último run |
|---|---|---|---|---|
| AH-0 Self Healing | Amy | unknown | 🟢 Activo | success @ 2026-03-20T23:00 |
| AH-1 SF Lead Poller | Amy | Cron: `*/10 0-14,23 * * *` | 🟢 Activo | success @ 2026-03-20T20:50 |
| AH-2 Outbound Trigger | Amy | Webhook (HTTP POST) | 🟡 Activo (último run: error) | error @ 2026-03-14T14:40 |
| AH-3 Lead Lookup | Amy | Webhook (HTTP POST) | 🟢 Activo | success @ 2026-03-18T11:11 |
| AH-4 Booking Handler | Amy | Webhook (HTTP POST) | 🟢 Activo | success @ 2026-03-18T04:17 |
| AH-5 Post Call | Amy | Webhook (HTTP POST) | 🟢 Activo | success @ 2026-03-19T03:29 |
| IN-1 Caller Lookup | Amy | Webhook (HTTP POST) | 🔵 Activo | never @ - |
| IN-2 Get Availability | Amy | Webhook (HTTP POST) | 🟢 Activo | success @ 2026-03-20T20:35 |
| IN-3 Book Appointment | Amy | Webhook (HTTP POST) | 🟡 Activo (último run: error) | error @ 2026-03-12T22:34 |
| IN-4 Post Call Handler | Amy | Webhook (HTTP POST) | 🟡 Activo (último run: error) | error @ 2026-03-19T20:52 |
| Initial Contact | Amy | Webhook (HTTP POST) | 🔵 Activo | never @ - |
| OT-1 SF Poller & Caller | Olivia | Cron: `0 15-22 * * 1-5` | 🟡 Activo (último run: error) | error @ 2026-03-20T23:00 |
| OT-1b Follow-Up SF Puller | Olivia | Cron: `0 14-22 * * 1-5` | 🟡 Activo (último run: error) | error @ 2026-03-20T23:00 |
| OT-2 Post Call Handler | Olivia | Webhook (HTTP POST) | 🟢 Activo | success @ 2026-03-20T13:05 |
| OT-3 Follow-up Scheduler | Olivia | Cron: `*/10 14-22 * * 1-5` | 🟢 Activo | success @ 2026-03-20T23:40 |
| OT-4 Audit & Fix | Olivia | Scheduler | 🟡 Activo (último run: error) | error @ 2026-03-20T22:00 |
| OT-5 SMS Trigger | Olivia | Webhook (HTTP POST) | 🟡 Activo (último run: error) | error @ 2026-03-19T03:26 |
| OT-6 SMS Sent Webhook | Olivia | Webhook (HTTP POST) | 🔵 Activo | never @ - |
| OT-7 SMS Reply Handler | Olivia | Webhook (HTTP POST) | 🔵 Activo | never @ - |
| Initial Contact | Olivia | Webhook (HTTP POST) | 🔵 Activo | never @ - |
| Inbound | Olivia | Webhook (HTTP POST) | 🔵 Activo | never @ - |
| SF-1 LT Caller | Sofie | Cron: `0 14-22 * * 1-5` | 🟡 Activo (último run: error) | error @ 2026-03-20T23:00 |
| SF-1b Follow-Up + LT Caller | Sofie | Cron: `0 14-22 * * 1-5` | 🟡 Activo (último run: error) | error @ 2026-03-20T23:00 |
| SF-3 Follow-up Scheduler | Sofie | Cron: `*/10 14-22 * * 1-5` | 🟢 Activo | success @ 2026-03-20T23:40 |
| Post Call | Sofie | Webhook (HTTP POST) | 🟢 Activo | success @ 2026-03-20T15:00 |
| Booking | Sofie | Webhook (HTTP POST) | 🟡 Activo (último run: error) | error @ 2026-03-13T15:11 |
| Availability | Sofie | Webhook (HTTP POST) | 🟢 Activo | success @ 2026-03-13T15:10 |
| 1 Workflow Monitor | Monitoring | Cron: `*/10 * * * *` | 🟡 Activo (último run: error) | error @ 2026-03-20T23:40 |
| 2 AH Hourly Watchdog | Monitoring | Cron: `0 0-13,22-23 * * *` | 🟡 Activo (último run: error) | error @ 2026-03-20T19:00 |
| 3 Nightly Report | Monitoring | Cron: `0 13 * * *` | 🟡 Activo (último run: error) | error @ 2026-03-20T19:00 |
| QA Agent | Monitoring | Cron: `0 0 * * *` | 🟡 Activo (último run: error) | error @ 2026-03-20T06:00 |
| SF Opportunities Poller | Shared | Cron: `0 9 * * *` | 🟢 Activo | success @ 2026-03-20T15:00 |
| SF to GHL Leads | Shared | Webhook (HTTP POST) | 🔵 Activo | never @ - |
| Get Availability - Olivia | Shared | Webhook (HTTP POST) | 🔵 Activo | never @ - |
| Get Availability - Amy | Shared | Webhook (HTTP POST) | 🔵 Activo | never @ - |
| Chatbot SMS | Outreach | Webhook (HTTP POST) | 🟡 Activo (último run: error) | error @ 2026-03-20T21:21 |
| iMessage | Outreach | Scheduler | 🟢 Activo | success @ 2026-03-20T23:40 |
| Habibi Leads | Outreach | Webhook (HTTP POST) | 🟢 Activo | success @ 2026-03-20T23:01 |

---

## Arquitectura General del Sistema

```
SALESFORCE (CRM)
    |
    |-- [Shared/SF Opportunities Poller] --> GHL Leads
    |-- [Shared/SF to GHL Leads]         --> GHL Contacts
    |
    +---> AGENTES DE VOZ (Retell AI)
           |
           |-- AMY (After Hours / Inbound)
           |    |-- AH-1 Poller --> AH-2 Trigger --> Retell call
           |    |-- AH-3 Lookup + AH-4 Booking (mid-call tools)
           |    |-- AH-5 Post Call --> GHL note + booking
           |    |-- IN-1/2/3 (Inbound tools: lookup, availability, booking)
           |    +-- IN-4 Post Call --> Supabase log + classify
           |
           |-- OLIVIA (Outbound / Inbound)
           |    |-- OT-1 SF Poller --> Retell call
           |    |-- OT-1b Follow-Up Puller --> Supabase queue
           |    |-- OT-2 Post Call --> Supabase + GHL update
           |    |-- OT-3 Follow-up Scheduler --> re-call next day
           |    |-- OT-5/6/7 SMS flow --> GHL tag --> iMessage
           |    +-- Inbound: recibe llamadas entrantes
           |
           +-- SOFIE (Outbound - Long Term Opportunities)
                |-- SF-1 + SF-1b: Pull SF opps --> Retell call
                |-- SF-3: Follow-up scheduler
                |-- Post Call --> Supabase log
                +-- Booking + Availability tools

MONITORING
    |-- MON-1: Cada 10min --> detecta errores --> Discord alert
    |-- MON-2: Cada hora (after hours) --> watchdog AH --> Discord
    +-- MON-3: Diario 13:00 UTC --> reporte completo --> Discord

QA
    +-- QA Agent: Diario 05:00 UTC --> analiza calls --> Supabase scores

OUTREACH
    |-- iMessage: Cada 5min --> Sheet --> GHL tag --> envia iMessage
    |-- Chatbot SMS: Webhook --> recibe reply SMS --> GPT-4o --> responde
    +-- Habibi Leads: campaña específica
```

---

---

# Amy

_Agente de voz para leads **After Hours** (fuera de horario de oficina) e **Inbound** (llamadas entrantes). Llama a leads de Salesforce en horario nocturno y gestiona reservas de citas._

## Amy / AH-0 Self Healing

- **ID:** `zRM1w8RqvrhZVQCG`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/zRM1w8RqvrhZVQCG
- **Estado:** 🟢 Activo
- **Trigger:** unknown
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** success @ 2026-03-20T23:00

**Nodos (4):**
  1. On Workflow Error
  2. Classify & Repair
  3. Format Alert
  4. Send Discord Alert

## Amy / AH-1 SF Lead Poller

- **ID:** `zzipgAz4v9BXDCij`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/zzipgAz4v9BXDCij
- **Estado:** 🟢 Activo
- **Trigger:** Cron: `*/10 0-14,23 * * *`
- **Credenciales:** Salesforce
- **Último run:** success @ 2026-03-20T20:50

**Nodos (7):**
  1. Is After Hours?
  2. Get New SF Leads
  3. Has Phone?
  4. Loop Over Leads
  5. Trigger After Hours Call
  6. Notify Discord

## Amy / AH-2 Outbound Trigger

- **ID:** `4gvkNlMIh8nWqXMp`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/4gvkNlMIh8nWqXMp
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** error @ 2026-03-14T14:40

**Nodos (9):**
  1. Skip Response
  2. Upsert Supabase
  3. Create Retell Call
  4. Update Call ID
  5. Success Response
  6. Check & Route
  7. Should Skip?
  8. Notify Discord

## Amy / AH-3 Lead Lookup

- **ID:** `FyGCXxVtU8XpUFGS`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/FyGCXxVtU8XpUFGS
- **Estado:** 🟢 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** Salesforce
- **Último run:** success @ 2026-03-18T11:11

**Nodos (7):**
  1. Clean Phone
  2. Search MobilePhone
  3. Search Phone
  4. Merge Results
  5. Pick First Match
  6. Respond

## Amy / AH-4 Booking Handler

- **ID:** `z5AmiRE3C0Id1jA7`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/z5AmiRE3C0Id1jA7
- **Estado:** 🟢 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** success @ 2026-03-18T04:17

**Nodos (21):**
  1. Extract Args
  2. Has GHL Contact?
  3. Set Existing Contact
  4. Search GHL Contact
  5. Contact Found?
  6. Set Found Contact
  7. Create GHL Contact
  8. Set New Contact
  9. Book Appointment
  10. Booking Response
  11. Add Contact Note
  12. Notify Discord
  13. Lookup Existing Contact
  14. Set Existing From Lookup
  15. Create Succeeded?
  16. Search By Email
  17. Email Found?
  18. Set Email Contact
  19. Booking Error Response
  20. Booking Succeeded?

## Amy / AH-5 Post Call

- **ID:** `sxEhJS549jLlhrzF`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/sxEhJS549jLlhrzF
- **Estado:** 🟢 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** success @ 2026-03-19T03:29

**Nodos (13):**
  1. Extract Call Data
  2. Call OpenAI
  3. Parse AI Response
  4. Search GHL
  5. Pick Contact
  6. Has Contact?
  7. Create GHL Contact
  8. Set Created ID
  9. Parse Booking Time
  10. Has Appointment?
  11. Book GHL Appointment
  12. Add GHL Note

## Amy / IN-1 Caller Lookup

- **ID:** `4pwrjvUXbcbrzwyb`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/4pwrjvUXbcbrzwyb
- **Estado:** 🔵 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel)
- **Último run:** never @ -

**Nodos (9):**
  1. Get many contacts
  2. Edit Fields
  3. If
  4. Respond to Webhook
  5. Switch
  6. Respond to Webhook1
  7. If1
  8. Respond to Webhook2

## Amy / IN-2 Get Availability

- **ID:** `rLoy8jSTS66kmULC`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/rLoy8jSTS66kmULC
- **Estado:** 🟢 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel)
- **Último run:** success @ 2026-03-20T20:35

**Nodos (3):**
  1. Respond to Webhook
  2. Get free slots of a calendar

## Amy / IN-3 Book Appointment

- **ID:** `Cv3563g2sEfK7qMO`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/Cv3563g2sEfK7qMO
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel)
- **Último run:** error @ 2026-03-12T22:34

**Nodos (7):**
  1. Edit Fields
  2. Get a contact
  3. Respond to Webhook
  4. Code in JavaScript
  5. HTTP Request

## Amy / IN-4 Post Call Handler

- **ID:** `nBrCukZmuQKbmhwM`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/nBrCukZmuQKbmhwM
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** OpenAI
- **Último run:** error @ 2026-03-19T20:52

**Nodos (11):**
  1. Is Call Analyzed?
  2. Parse Call
  3. Insert Call Record
  4. No Interaction?
  5. OpenAI Classify
  6. AI Classify
  7. OpenAI Summarize
  8. AI Summarize
  9. Update Call Record
  10. Add GHL Note

## Amy / Initial Contact

- **ID:** `EdVhPopd7e7gGUGV`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/EdVhPopd7e7gGUGV
- **Estado:** 🔵 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel)
- **Último run:** never @ -

**Nodos (10):**
  1. Get many contacts
  2. Edit Fields
  3. If
  4. Respond to Webhook
  5. Switch
  6. Respond to Webhook1
  7. If1
  8. Respond to Webhook2
  9. HTTP Request

---

# Olivia

_Agente de voz **Outbound** para nuevos leads de Salesforce e **Inbound**. Gestiona todo el ciclo: llamada → post-call → follow-up → SMS._

## Olivia / OT-1 SF Poller & Caller

- **ID:** `DtgGsbj6VjNXI4Gn`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/DtgGsbj6VjNXI4Gn
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Cron: `0 15-22 * * 1-5`
- **Credenciales:** Salesforce
- **Último run:** error @ 2026-03-20T23:00

**Nodos (16):**
  1. Get a lead
  2. Get many leads
  3. Code in JavaScript
  4. If
  5. Search
  6. Create
  7. Update
  8. Loop Over Items
  9. HTTP Request
  10. HTTP Request2
  11. Check & Skip
  12. Should Skip?
  13. Insert into Calls
  14. Make Retell Call
  15. Update Call ID

## Olivia / OT-1b Follow-Up SF Puller

- **ID:** `bb8aAcrbnC9Icz1O`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/bb8aAcrbnC9Icz1O
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Cron: `0 14-22 * * 1-5`
- **Credenciales:** Salesforce
- **Último run:** error @ 2026-03-20T23:00

**Nodos (8):**
  1. Get Follow-Up Leads from SF
  2. Filter Last 1 Hour
  3. Check Supabase (Dedup)
  4. Any New Leads?
  5. Loop Over Leads
  6. Insert/Update Supabase
  7. Is New Lead?

## Olivia / OT-2 Post Call Handler

- **ID:** `QKAIzE2Ew9W2xxud`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/QKAIzE2Ew9W2xxud
- **Estado:** 🟢 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** OpenAI
- **Último run:** success @ 2026-03-20T13:05

**Nodos (16):**
  1. Is Call Analyzed?
  2. No Interaction?
  3. Calc No Answer
  4. Update Supabase No Answer
  5. OpenAI Model - Classify
  6. AI Classify
  7. OpenAI Model - Summarize
  8. AI Summarize
  9. Prepare Update
  10. Update Supabase Result
  11. Is DNC?
  12. Search GHL Contact
  13. Tag GHL Contact
  14. Trigger SMS Flow
  15. Fetch SB Record

## Olivia / OT-3 Follow-up Scheduler

- **ID:** `ynr5P944PqExTDkg`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/ynr5P944PqExTDkg
- **Estado:** 🟢 Activo
- **Trigger:** Cron: `*/10 14-22 * * 1-5`
- **Credenciales:** Salesforce
- **Último run:** success @ 2026-03-20T23:40

**Nodos (10):**
  1. Fetch Due Follow-ups
  2. Loop Over Items
  3. Mark as Calling
  4. Get SF Lead
  5. Make Retell Call
  6. Update Call ID
  7. Tag GHL SMS
  8. Wait SMS Olivia
  9. Remove SMS Tag Olivia

## Olivia / OT-4 Audit & Fix

- **ID:** `ZImIfmyXydobGTHu`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/ZImIfmyXydobGTHu
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Scheduler
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** error @ 2026-03-20T22:00

**Nodos (7):**
  1. Get Stuck Calls
  2. Count Stuck
  3. Fix Stuck Calls
  4. Get Call Stats
  5. Build Summary
  6. Log Audit Result

## Olivia / OT-5 SMS Trigger

- **ID:** `ZsV7q829ldl90len`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/ZsV7q829ldl90len
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** error @ 2026-03-19T03:26

**Nodos (9):**
  1. Should Send?
  2. Add GHL Tag
  3. Log SMS Pending
  4. Wait 5 Min
  5. Remove SMS Tag
  6. Extract Data
  7. Check Active Calls
  8. Guard Check

## Olivia / OT-6 SMS Sent Webhook

- **ID:** `kyVgdHXcr7t44KPd`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/kyVgdHXcr7t44KPd
- **Estado:** 🔵 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** never @ -

**Nodos (2):**
  1. Update SMS Sent

## Olivia / OT-7 SMS Reply Handler

- **ID:** `BWlBxmk2Eyj5wzfk`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/BWlBxmk2Eyj5wzfk
- **Estado:** 🔵 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** never @ -

**Nodos (4):**
  1. Log SMS Reply
  2. Remove GHL Tag
  3. Forward to Chat AI

## Olivia / Initial Contact

- **ID:** `bAFQ50r9fWwKTrNT`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/bAFQ50r9fWwKTrNT
- **Estado:** 🔵 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel)
- **Último run:** never @ -

**Nodos (10):**
  1. Get many contacts
  2. Edit Fields
  3. If
  4. Respond to Webhook
  5. Switch
  6. Respond to Webhook1
  7. If1
  8. Respond to Webhook2
  9. HTTP Request

## Olivia / Inbound

- **ID:** `NrbqBbD8kmmLHO2k`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/NrbqBbD8kmmLHO2k
- **Estado:** 🔵 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel)
- **Último run:** never @ -

**Nodos (9):**
  1. Get many contacts
  2. Edit Fields
  3. If
  4. Respond to Webhook
  5. Switch
  6. Respond to Webhook1
  7. If1
  8. Respond to Webhook2

---

# Sofie

_Agente de voz para oportunidades de **largo plazo** en Salesforce (stages: Follow-up, Long Term, Long Term Followup). Más paciente, enfocada en leads que ya conocen la empresa._

## Sofie / SF-1 LT Caller

- **ID:** `V4m5xYsJBfuCrZ4u`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/V4m5xYsJBfuCrZ4u
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Cron: `0 14-22 * * 1-5`
- **Credenciales:** Salesforce
- **Último run:** error @ 2026-03-20T23:00

**Nodos (17):**
  1. Get Long Term Opps
  2. Get LT Follow Up Opps
  3. Merge
  4. Loop Over Opps
  5. Get Full Opportunity
  6. Get Lead by ContactId
  7. Enrich Lead Data
  8. SB Check by OppID
  9. Decide: Skip or Call
  10. Should Call?
  11. GHL Search
  12. Extract GHL ID
  13. Add GHL Tag
  14. Make Retell Call
  15. Create SB Record
  16. Noop → Loop

## Sofie / SF-1b Follow-Up + LT Caller

- **ID:** `G8pqgK4SPw0NxxJ4`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/G8pqgK4SPw0NxxJ4
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Cron: `0 14-22 * * 1-5`
- **Credenciales:** Salesforce
- **Último run:** error @ 2026-03-20T23:00

**Nodos (17):**
  1. Get Follow Up Opps
  2. Get Long Term Followup Opps
  3. Merge All Stages
  4. Loop Over Opps
  5. Get Full Opportunity
  6. Get Lead by ContactId
  7. Enrich Lead Data
  8. SB Check by OppID
  9. Decide: Skip or Call
  10. Should Call?
  11. GHL Search
  12. Extract GHL ID
  13. Add GHL Tag
  14. Make Retell Call
  15. Create SB Record
  16. Noop → Loop

## Sofie / SF-3 Follow-up Scheduler

- **ID:** `KoVkP6EQ8y1eFbnf`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/KoVkP6EQ8y1eFbnf
- **Estado:** 🟢 Activo
- **Trigger:** Cron: `*/10 14-22 * * 1-5`
- **Credenciales:** Salesforce
- **Último run:** success @ 2026-03-20T23:40

**Nodos (6):**
  1. Fetch Sofie Due Calls
  2. Loop Sofie Calls
  3. Mark as Calling
  4. Get SF Lead
  5. Tag GHL + Call Sofie

## Sofie / Post Call

- **ID:** `p8sRjGU10gInLoub`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/p8sRjGU10gInLoub
- **Estado:** 🟢 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel), OpenAI, google
- **Último run:** success @ 2026-03-20T15:00

**Nodos (30):**
  1. If
  2. Wait
  3. If1
  4. Code in JavaScript
  5. If2
  6. Switch
  7. Get a contact
  8. Update a contact
  9. Basic LLM Chain
  10. OpenAI Chat Model
  11. Update a contact1
  12. Basic LLM Chain1
  13. OpenAI Chat Model1
  14. HTTP Request
  15. Update a contact2
  16. dnd
  17. Get Contact
  18. Update Contact
  19. Call dropped
  20. Start WF
  21. call dropped possible lead
  22. stop requested
  23. Basic LLM Chain2
  24. OpenAI Chat Model2
  25. Code in JavaScript1
  26. Append row in sheet
  27. Update Supabase Follow-up
  28. Fetch SB for Follow-up
  29. Patch SB Follow-up

## Sofie / Booking

- **ID:** `qnUmSkv0dGIQHOen`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/qnUmSkv0dGIQHOen
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** error @ 2026-03-13T15:11

**Nodos (4):**
  1. Code in JavaScript
  2. HTTP Request1
  3. Respond to Webhook1

## Sofie / Availability

- **ID:** `yM1Qrq2nVO7v3ZBZ`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/yM1Qrq2nVO7v3ZBZ
- **Estado:** 🟢 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel)
- **Último run:** success @ 2026-03-13T15:10

**Nodos (3):**
  1. Respond to Webhook
  2. Get free slots of a calendar

---

# Monitoring

_Sistema de **vigilancia automática**. Detecta errores en tiempo real, watchdog de after hours y reporte diario de actividad._

## Mon / 1 Workflow Monitor

- **ID:** `qSpfAI4EfKYeK8hc`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/qSpfAI4EfKYeK8hc
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Cron: `*/10 * * * *`
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** error @ 2026-03-20T23:40

**Nodos (5):**
  1. Fetch Errors
  2. Filter Recent
  3. Has Errors?
  4. Send Discord

## Mon / 2 AH Hourly Watchdog

- **ID:** `gRxm04nQWSEpt2eC`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/gRxm04nQWSEpt2eC
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Cron: `0 0-13,22-23 * * *`
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** error @ 2026-03-20T19:00

**Nodos (3):**
  1. Fetch Failed Execs
  2. Discord Alert

## Mon / 3 Nightly Report

- **ID:** `gmNl1lZ2SFFUYUIR`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/gmNl1lZ2SFFUYUIR
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Cron: `0 13 * * *`
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** error @ 2026-03-20T19:00

**Nodos (6):**
  1. Fetch Executions
  2. Fetch SB Calls
  3. Wait for Both
  4. Format Report
  5. Send Discord

## Mon / QA Agent

- **ID:** `iezUyOBt5N7ti00c`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/iezUyOBt5N7ti00c
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Cron: `0 0 * * *`
- **Credenciales:** Google Sheets, OpenAI
- **Último run:** error @ 2026-03-20T06:00

**Nodos (18):**
  1. Calculate Date Range
  2. Loop Over Agents
  3. Process Calls Response
  4. Loop Over Calls
  5. Format Transcript
  6. LLM Chain - QA Analysis
  7. OpenAI Chat Model
  8. Parse Response
  9. Write to QA Scores
  10. Write to QA Details
  11. Check Management Alert
  12. Write to Management Alerts
  13. Dialpad - List Agent Calls1
  14. Fetch Transcript
  15. Merge Call Meta + Transcript
  16. Limit
  17. parse

---

# Shared

_Workflows **compartidos** entre agentes. Sincronizan Salesforce con GHL y proveen disponibilidad de calendario._

## Shared / SF Opportunities Poller

- **ID:** `kb6FNwFI5ycvJPI5`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/kb6FNwFI5ycvJPI5
- **Estado:** 🟢 Activo
- **Trigger:** Cron: `0 9 * * *`
- **Credenciales:** Google Sheets, Salesforce
- **Último run:** success @ 2026-03-20T15:00

**Nodos (18):**
  1. Get row(s) in sheet
  2. If
  3. Append or update row in sheet
  4. Get an opportunity
  5. Get many leads
  6. Get a lead
  7. Loop Over Items
  8. Get many opportunities
  9. Code in JavaScript1
  10. Get row(s) in sheet2
  11. If1
  12. Search
  13. Create
  14. Update
  15. If2
  16. HTTP Request
  17. HTTP Request2

## Shared / SF to GHL Leads

- **ID:** `zYkb0uO7A4dyrUHU`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/zYkb0uO7A4dyrUHU
- **Estado:** 🔵 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** Google Sheets
- **Último run:** never @ -

**Nodos (13):**
  1. Code in JavaScript
  2. Get row(s) in sheet
  3. Append or update row in sheet
  4. Filter1
  5. If
  6. Search
  7. Create
  8. Update
  9. HTTP Request
  10. Edit Fields
  11. HTTP Request1
  12. HTTP Request2

## Shared / Get Availability - Olivia

- **ID:** `6dATuVHiFDl9Uxch`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/6dATuVHiFDl9Uxch
- **Estado:** 🔵 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel)
- **Último run:** never @ -

**Nodos (3):**
  1. Respond to Webhook
  2. Get free slots of a calendar

## Shared / Get Availability - Amy

- **ID:** `nyGeTN0qZFO1JHoJ`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/nyGeTN0qZFO1JHoJ
- **Estado:** 🔵 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** GHL (GoHighLevel)
- **Último run:** never @ -

**Nodos (3):**
  1. Respond to Webhook
  2. Get free slots of a calendar

---

# Outreach

_Campañas de **outreach masivo** por iMessage y SMS. Chatbot inteligente que responde replies de leads._

## Outreach / Chatbot SMS

- **ID:** `ap8YJXX3j7KoTzh4`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/ap8YJXX3j7KoTzh4
- **Estado:** 🟡 Activo (último run: error)
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** OpenAI
- **Último run:** error @ 2026-03-20T21:21

**Nodos (10):**
  1. OpenAI Chat Model
  2. Simple Memory
  3. Meta Agent
  4. booking
  5. availability
  6. Respond to Webhook
  7. Classify SMS State
  8. Is Terminal?
  9. Update Supabase + GHL

## Outreach / iMessage

- **ID:** `wOW4GWeUZzFmHY2Z`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/wOW4GWeUZzFmHY2Z
- **Estado:** 🟢 Activo
- **Trigger:** Scheduler
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** success @ 2026-03-20T23:40

**Nodos (10):**
  1. Read Sheet CSV
  2. Find Next Contact
  3. Has Contact?
  4. Search GHL
  5. Pick or Prepare
  6. Create GHL Contact
  7. Merge GHL ID
  8. Add Tag
  9. Log Supabase

## Outreach / Habibi Leads

- **ID:** `6O6CpfClUenIZvPc`
- **URL:** https://leadiumx.app.n8n.cloud/workflow/6O6CpfClUenIZvPc
- **Estado:** 🟢 Activo
- **Trigger:** Webhook (HTTP POST)
- **Credenciales:** ninguna (usa keys hardcoded)
- **Último run:** success @ 2026-03-20T23:01

**Nodos (3):**
  1. Send to HabibiLeads
  2. Code in JavaScript1

---

# Checklist de Salud Semanal

Verifica esto cada lunes:

## Agentes de Voz
- [ ] OT-1 (Olivia Outbound) tuvo ejecuciones exitosas esta semana
- [ ] SF-1b (Sofie) tuvo ejecuciones exitosas esta semana
- [ ] Amy AH-1 tuvo ejecuciones exitosas esta semana
- [ ] MON-3 Nightly Report llegó a Discord cada noche

## Credentials
- [ ] Salesforce OAuth token no expiró (revisar SF-1b y OT-1)
- [ ] GHL token activo (revisar cualquier workflow que use HighLevel)
- [ ] OpenAI no tiene errores 429 (ver Chatbot SMS y QA Agent)

## Supabase
- [ ] Tabla `calls` recibiendo registros nuevos
- [ ] Tabla `qa_scores` recibiendo scores
- [ ] No hay filas duplicadas por el mismo `call_id`

## iMessage
- [ ] Workflow iMessage activo y corriendo cada 5 min
- [ ] Revisar replies en GHL para nuevos HOT leads

## MON-1 Workflow Monitor
- [ ] No hay alertas críticas acumuladas en Discord #general
- [ ] Todos los workflows marcados como activos siguen activos