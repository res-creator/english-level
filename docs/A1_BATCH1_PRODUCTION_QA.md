# Batch 1 production and QA — A1.6–A1.8

Preview-only seed/content work. Frozen curriculum documents and production services were not changed.

## Authored dialogue flows

### A1.6 — Знакомство с соседкой (Rosa)

Rosa: “Hi, I'm Rosa. I live in apartment 3. What's your name?”  
Learner: “Hi, I'm Anna.”  
Rosa: “Nice to meet you, Anna. I live upstairs.”  
Learner: “Are you from around here?”  
Rosa: “Yes, I am. I've lived here for five years. How long have you lived here?”  
Learner: “I just moved in.”  
Rosa: “Welcome! The garden is behind the building.”

The Present Perfect sentence is Rosa's receptive-only lexical chunk. The learner's targets are be-positive and be-question forms. The elevator variation changes both the meeting location and the learner's introduction detail.

### A1.7 — Покупка в магазине (Emma)

Emma: “Hi! Are you looking for something?”  
Learner: “Do you have this chocolate bar?”  
Emma: “Yes, we do. It's right here.”  
Learner: “How much is this?”  
Emma: “It's three pounds.”  
Learner: “I'll take it, please.”  
Emma: “Of course. Would you like a bag?”  
Learner: “Can I get a bag?”  
Emma: “Of course. Bags are by the door.”

The notebook variation asks for a different item and colour and checks its different price, so it transfers the product-availability and price exchange rather than repeating the chocolate-bar line.

### A1.8 — Покупка билета (Rosa at the machine)

Rosa: “The ticket machine is free. Where are you going?”  
Learner: “I'm going to Oxford.”  
Rosa: “There are trains to Oxford every hour.”  
Learner: “What time does the first train leave?”  
Rosa: “It leaves at 10:30 from platform two.”  
Learner: “How much is it?”  
Rosa: “It's eight pounds.”  
Learner: “One ticket to Oxford at 10:30, please.”  
Rosa: “All right. Select Oxford and 10:30 on the screen.”

Rosa is a fellow traveller helping at the machine, not a ticket clerk. The variation changes both destination and departure time.

## QA results

- Grammar classification lint: 0 errors, 0 advisory notes.
- Gate A: seed schema/cross-reference checks, unique IDs, contiguous lesson and `lesson_items` ordering, valid activity plans, and idempotent re-seeding passed.
- Gate B: authored line-by-line read-through passed. Each NPC reply follows the preceding learner turn; no repeated reply information, role mismatch, or Cyrillic in the English transcript. Each construction is tagged as a grammar target or lexical chunk.
- Gate C: real React + Hono + disposable SQLite + Chromium run passed on A1.4 and all three new situations. Correct Mission paths passed at 100%; the A1.4 incorrect Mission path scored 0%, retained `learning`, and produced no pass. Transcript assertions ran after every activity and across Mission logs.
- Screenshot and JSON artifacts: `artifacts/qa/session-dialogue/` (ignored local preview output).
