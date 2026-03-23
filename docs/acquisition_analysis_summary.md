# Acquisition Call QA Analysis Summary
## Case Settlement Now — 751 Real Calls Analyzed

---

## Dataset Overview

| Metric | Value |
|--------|-------|
| Total QA Records | 751 |
| Voicemail Calls | 498 (66.3%) |
| Actual Live Calls | 253 |
| Qualified Leads | 48 |
| Booked Appointments | 14 |
| High-Scoring Calls (≥60) | 7 |
| Avg Score (live calls) | 31.6 / 100 |

**Key insight:** Average call quality is critically low (31.6/100). The vast majority of leads are lost due to procedural errors, not because they didn't qualify.

---

## Qualification Checklist — All 7 Questions Found

These are the exact qualification checklist fields extracted across all 751 records:

| # | Field Key | Times Appeared | % Asked Correctly |
|---|-----------|----------------|-------------------|
| 1 | `when_was_accident` | 751/751 | 22.8% (True) |
| 2 | `were_you_injured` | 751/751 | 16.1% (True) |
| 3 | `passenger_injury_followup` | 751/751 | Conditional (n/a: 98.9%) |
| 4 | `received_medical_treatment` | 751/751 | 21.3% (True) |
| 5 | `were_you_at_fault` | 751/751 | 2.9% (True = DQ) |
| 6 | `working_with_attorney` | 751/751 | 4.4% (True = potential DQ) |
| 7 | `looking_to_switch_attorney` | 751/751 | Conditional (n/a: 99.7%) |

**Critical finding:** Agents asked ALL required qualification questions correctly in fewer than 25% of calls. The attorney and fault questions were the most commonly skipped.

---

## Top 5 Most Common Mistakes

### 1. Wrong Script Order / Not Following Qualification Script
- **Frequency:** 223 what_went_wrong mentions, 137 script violation entries, 230 top priority flags
- **Impact:** Leads disqualified incorrectly, key information missed, compliance risk
- **Fix:** Strict step-by-step flow with no deviation from the question order

### 2. Missing the Attorney Status Question
- **Frequency:** 78 script violations, 90 priority flags
- **Impact:** Qualified leads pushed to attorneys who already have representation; compliance violations
- **Fix:** Always ask "Are you currently working with an attorney?" — it's #6 in the script

### 3. No Proper Introduction / Not Referencing Prior Submission
- **Frequency:** 87 what_went_wrong entries, 52 script violations, 66 priority flags
- **Impact:** Leads hang up thinking it's a scam call; lost engagement
- **Fix:** Always say: "You had reached out recently about your auto accident"

### 4. Incorrect Disqualification (Gap in Treatment)
- **Frequency:** 30+ risk statements, multiple DQ reason flags
- **Impact:** Valid leads lost; agents were cited repeatedly for DQ'ing for treatment gaps
- **Fix:** Gap in treatment is NOT a DQ reason. Never disqualify for this.

### 5. No Booking Attempt After Qualification
- **Frequency:** 48 what_went_wrong entries, 78 priority flags, 27 script violations
- **Impact:** Qualified leads not converted; wasted qualification effort
- **Fix:** Every qualified lead MUST be moved to a booking close

---

## Top 5 Things That Led to Successful Bookings

### 1. Proper Introduction + Referencing Prior Submission
All 14 booked calls included an intro that referenced the lead's prior inquiry. This legitimized the call and prevented hang-ups.
> Example: "You had reached out recently about your auto accident, and I'm just following up."

### 2. Building Rapport and Empathy Before Qualification
Booked calls consistently showed agents expressing empathy about the accident before diving into questions.
> Example: "I'm so sorry to hear you went through that. Let me just verify a few quick details."

### 3. Confirming Medical Treatment + Probing Injury Details
Every booked call confirmed medical treatment and followed up on injury specifics. This built the case narrative.
> Example: "Did you see a doctor or go to the ER? When was the last time you were treated?"

### 4. Explaining No Cost / Contingency Structure
Booked calls consistently mentioned that the consultation is free and there's no upfront cost. This removed the financial objection.
> Example: "This is completely free — no cost, no obligation."

### 5. Flexible Scheduling and Clear Booking Close
Successful agents offered specific time slots, accommodated the lead's schedule, and confirmed appointment details clearly.
> Example: "What works better — morning or afternoon? I have 10 AM or 2 PM available."

---

## Script Order Reconstruction

Based on all 751 qualification_checklist fields, the exact intended script order is:

```
1. when_was_accident        → "When did the accident happen?"
2. were_you_injured         → "Were you injured in the accident?"
3. passenger_injury_followup → [CONDITIONAL] "Were any passengers injured?"
4. received_medical_treatment → "Did you receive medical treatment?"
5. were_you_at_fault        → "Were you at fault, or was the other driver responsible?"
6. working_with_attorney    → "Are you currently working with an attorney?"
7. looking_to_switch_attorney → [CONDITIONAL] "Are you looking to switch attorneys?"
```

---

## DQ Analysis — Valid vs Invalid Reasons

### Valid DQ Reasons (from data):
- Caller was clearly at fault
- No injuries to anyone in the vehicle
- Already has attorney + not switching

### Repeatedly Misused DQ Reasons (agents were WRONG):
- **Gap in treatment** — cited 30+ times as a DQ reason by agents; this is NOT valid
- **No police report** — not a DQ criterion
- **No insurance information** — not a DQ criterion
- **Unclear fault** — should be escalated to attorney, not DQ'd

---

## Risk Statement Patterns Found

- **30+** cases: Agents incorrectly DQ'd for "gap in treatment"
- **31+** cases: Agents named specific law firms on intake calls
- **16+** cases: Agents promised to "prepare a retainer" (not their role)
- **9+** cases: Agents made settlement/compensation promises
- **4+** cases: Agents made police report a requirement

---

## Score Comparison: Booked vs Not Booked

| Metric | Booked Calls | Not Booked |
|--------|-------------|------------|
| Overall Score | 55.3 | 34.6 |
| Script Following | 48.2 | 32.1 |
| All Questions Asked | 45.7 | 26.0 |
| Call Flow Control | 63.6 | 44.3 |
| Objection Handling | 67.5 | 36.1 |
| Booking Attempt | 61.1 | 22.0 |

**The single biggest differentiator between booked and unbooked calls was objection handling (67.5 vs 36.1) and making an actual booking attempt (61.1 vs 22.0).**

---

## Output Files

- `/tmp/acquisition_agent_prompt.md` — Complete Retell AI agent system prompt
- `/tmp/acquisition_analysis_summary.md` — This file

---

*Analysis based on 751 QA records from Case Settlement Now intake calls.*
*AI QA system data; extracted patterns reflect human agent performance from ~March 2026.*
