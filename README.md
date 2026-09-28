\# MemoryOS



\### AI Incident Response That Learns From Experience



MemoryOS is an AI incident-response copilot for software and DevOps teams.



The idea is simple: when an incident has already been investigated, the next investigation should be able to use what was learned before.



MemoryOS uses \*\*Hindsight\*\* as its persistent memory layer. It recalls relevant past incidents before investigating a new one, then stores useful investigation results for future incidents.



> Investigate once. Remember the resolution. Respond faster next time.



\---



\## Why MemoryOS?



Production incidents often repeat themselves.



The wording may change, the logs may look different, and the affected service may have a different traffic pattern. The underlying failure can still be similar.



Without persistent memory, an AI assistant can analyze the current incident but cannot reliably use the team's previous incident experience.



MemoryOS adds that missing layer.



\### Without Memory



```text

New Incident

&#x20;    |

&#x20;    v

Analyze current evidence

&#x20;    |

&#x20;    v

Generate diagnosis

&#x20;    |

&#x20;    v

Engineer investigates

&#x20;    |

&#x20;    v

Incident resolved

&#x20;    |

&#x20;    v

Useful knowledge may be lost

With Hindsight

New Incident

&#x20;    |

&#x20;    v

Recall previous incidents

&#x20;    |

&#x20;    v

Compare history with current evidence

&#x20;    |

&#x20;    v

Investigate with historical context

&#x20;    |

&#x20;    v

Resolve the incident

&#x20;    |

&#x20;    v

Retain useful knowledge



The goal is not to replace engineers. It is to make each investigation more informed by previous experience.



How It Works



MemoryOS follows a simple memory loop:



Incident

&#x20;  |

&#x20;  v

Recall

(Hindsight)

&#x20;  |

&#x20;  v

Reason

(Groq)

&#x20;  |

&#x20;  v

Resolve

&#x20;  |

&#x20;  v

Retain

(Hindsight)

&#x20;  |

&#x20;  v

Future investigations

Recall



Before reasoning about an incident, MemoryOS queries Hindsight for relevant previous experiences.



Current Incident

&#x20;     |

&#x20;     v

Hindsight Recall

&#x20;     |

&#x20;     v

Relevant Memories

&#x20;     |

&#x20;     v

AI Investigation



The recalled memories provide historical operational context for the current investigation.



Retain



After an investigation, MemoryOS stores useful information back into Hindsight.



The retained incident focuses on:



Root cause

Evidence

Immediate actions

Memory match

Confidence

Lessons for future incidents



This gives future investigations something useful to recall instead of simply storing large amounts of raw incident data.



Example Incident



A payment service reports:



2026-09-27 14:32:41 ERROR

payments-api

DB pool exhausted

active=100

idle=0

waiting=47

POST /payments -> 503



Suppose Hindsight already contains a previous incident:



payments-api

Database connection pool exhaustion



Root cause:

Long-running database queries consumed all

available connections.



Resolution:

Identify blocked queries, increase pool capacity,

restart affected instances, and fix the connection leak.



The current incident does not need to use exactly the same wording.



MemoryOS combines the current evidence with the recalled experience:



Current Evidence

&#x20;      +

Previous Incident Memory

&#x20;      |

&#x20;      v

Structured Investigation

&#x20;      |

&#x20;      +---- Root Cause

&#x20;      +---- Evidence

&#x20;      +---- Immediate Actions

&#x20;      +---- Memory Match

&#x20;      +---- Confidence

&#x20;      +---- Lessons for Future

Example Investigation



Incident: Payment Service Degradation



Service:



payments-api



Retrieved memory:



6 memories retrieved



Memory match:



Strong match



Root cause:



Database connection pool exhaustion caused requests

to block and eventually return 503 responses.



Immediate actions:



1\. Inspect connection pool metrics.

2\. Check active database sessions.

3\. Identify long-running queries.

4\. Temporarily increase pool capacity if required.

5\. Restart affected instances.

6\. Verify connection leak handling.



Lesson:



Monitor connection-pool utilization, detect connection leaks, and alert before the pool becomes exhausted.



Before vs. After Persistent Memory

Without Persistent Memory	With Hindsight

Treats incidents independently	Retrieves relevant previous incidents

Generic troubleshooting	Investigation with historical context

Repeats parts of the investigation	Reuses previous experience

Knowledge can be lost	Useful resolutions are retained

Limited historical context	Incident knowledge grows over time



This is why memory is part of the core investigation workflow rather than just another feature.



Architecture

&#x20;                   +----------------------+

&#x20;                   |      Next.js UI      |

&#x20;                   | React + Tailwind CSS |

&#x20;                   +----------+-----------+

&#x20;                              |

&#x20;                              v

&#x20;                   +----------------------+

&#x20;                   |   Incident API Route |

&#x20;                   |  Next.js / TypeScript|

&#x20;                   +-------+-------+------+

&#x20;                           |       |

&#x20;                +----------+       +----------+

&#x20;                |                           |

&#x20;                v                           v

&#x20;       +------------------+       +------------------+

&#x20;       |     Hindsight    |       |       Groq       |

&#x20;       | Persistent       |       |       LLM        |

&#x20;       | Memory Layer     |       | Investigation    |

&#x20;       +--------+---------+       +--------+---------+

&#x20;                |                          |

&#x20;                +------------+-------------+

&#x20;                             |

&#x20;                             v

&#x20;                   +----------------------+

&#x20;                   | Structured Incident  |

&#x20;                   |      Analysis        |

&#x20;                   +----------------------+

Tech Stack

Layer	Technology

Frontend	Next.js / React

Styling	Tailwind CSS

Animation	Framer Motion

Icons	Lucide React

Backend	Next.js API Routes

Language	TypeScript

LLM	Groq

Memory	Hindsight

Memory API	Hindsight REST API

Runtime	Node.js

Containerization	Docker

Project Structure

memoryos/

|

+-- README.md

+-- .gitignore

|

+-- web/

&#x20;   |

&#x20;   +-- public/

&#x20;   |

&#x20;   +-- src/

&#x20;   |   |

&#x20;   |   +-- app/

&#x20;   |       |

&#x20;   |       +-- api/

&#x20;   |       |   |

&#x20;   |       |   +-- incidents/

&#x20;   |       |       +-- route.ts

&#x20;   |       |

&#x20;   |       +-- globals.css

&#x20;   |       +-- layout.tsx

&#x20;   |       +-- page.tsx

&#x20;   |

&#x20;   +-- package.json

&#x20;   +-- package-lock.json

&#x20;   +-- next.config.ts

&#x20;   +-- postcss.config.mjs

&#x20;   +-- eslint.config.mjs

&#x20;   +-- tsconfig.json

Getting Started

Prerequisites

Node.js

npm

Docker Desktop

Groq API key

Hindsight running locally

1\. Clone

git clone https://github.com/Chaitanya-CSP/memoryos.git

cd memoryos

2\. Install dependencies

cd web

npm install

3\. Configure environment variables



Create:



web/.env.local



Add:



HINDSIGHT\_API\_URL=http://localhost:8888

HINDSIGHT\_BANK\_ID=memoryos



GROQ\_API\_KEY=your\_groq\_api\_key

GROQ\_MODEL=openai/gpt-oss-20b



Do not commit .env.local or real API keys.



Hindsight Setup



MemoryOS expects Hindsight to be available locally.



Hindsight API

http://localhost:8888



The control plane is:



http://localhost:9999



Hindsight also needs to be configured with the required LLM provider and credentials before running investigations.



Run MemoryOS



From the web directory:



npm run dev



Open:



http://localhost:3000

API Flow



The main endpoint is:



POST /api/incidents



The backend follows this sequence:



Receive Incident

&#x20;     |

&#x20;     v

Build Incident Context

&#x20;     |

&#x20;     v

Recall Hindsight Memories

&#x20;     |

&#x20;     v

Send Incident + Memories to Groq

&#x20;     |

&#x20;     v

Generate Structured Analysis

&#x20;     |

&#x20;     v

Return Investigation to UI

&#x20;     |

&#x20;     v

Retain Useful Incident Knowledge



Memory interaction therefore happens inside the incident investigation itself.



What MemoryOS Returns



Each investigation is structured into:



Root Cause



The most likely underlying failure.



Evidence



Signals from the current incident and relevant historical memories.



Immediate Actions



Concrete steps an engineer can take to investigate or stabilize the service.



Memory Match



Whether previous incident experience is relevant.



Confidence



The model's confidence in the investigation.



Lesson for Future



Operational knowledge that can be retained for later incidents.



A Real Limitation



MemoryOS is a focused incident-response project, not a complete enterprise incident-management platform.



Current limitations include:



Incident data is currently provided through the application rather than directly from production observability platforms.

Recall quality depends on the memories available in Hindsight.

Similar-looking incidents can still require human verification.

The system suggests remediation steps but does not automatically execute production changes.

Hindsight and the application are currently configured for a local development environment.



One practical lesson during development was that storing more information does not automatically make memory more useful. The retained incident was therefore kept focused on root cause, evidence, actions, and lessons so that future recall has useful operational context.



MemoryOS assists engineers with investigation and knowledge retrieval rather than replacing engineering judgment.



Demo Scenario

Incident 1



A payment service starts returning 503 responses because its database connection pool is exhausted.



MemoryOS investigates the incident and retains the useful resolution.



Incident 2



A later payment-service incident appears with different wording but similar symptoms.



Hindsight recalls the earlier experience:



Current Symptoms

&#x20;      +

Previous Incident

&#x20;      |

&#x20;      v

Relevant Memory Match

&#x20;      |

&#x20;      v

Known Root Cause

&#x20;      |

&#x20;      v

Previous Troubleshooting Actions



The second investigation can therefore start with historical context instead of starting completely from zero.



Why Hindsight Matters



Hindsight is not just used as a database for storing old incidents.



The important part is the loop:



Past Incident

&#x20;     |

&#x20;     v

Remember

&#x20;     |

&#x20;     v

Use During Investigation

&#x20;     |

&#x20;     v

Resolve

&#x20;     |

&#x20;     v

Remember the New Result



This makes persistent memory part of the core behavior of MemoryOS.



Future Improvements



Potential next steps include:



Connect directly to observability platforms

Integrate application and infrastructure logs

Add incident timelines

Connect monitoring alerts

Add service dependency graphs

Retrieve relevant runbooks automatically

Add Slack or Microsoft Teams workflows

Generate post-incident reviews

Track incident resolution time

Detect recurring failure patterns

Add role-based access control

Deploy MemoryOS and Hindsight as production services

Current Status



The current version demonstrates:



Persistent incident memory

Hindsight recall

Hindsight retention

Historical incident matching

Structured AI investigations

Root-cause analysis

Evidence extraction

Immediate remediation suggestions

Lessons for future incidents

Production-oriented dashboard UI

Author



V Chaitanya



Computer Science / AI \& ML Student



Building software projects around AI, full-stack development, and practical automation.



Acknowledgements



MemoryOS uses Hindsight as its persistent memory layer.



Built with:



Next.js

React

Tailwind CSS

Framer Motion

Groq

TypeScript

Docker

License



This project is currently intended as a demonstration and learning project.



Add an explicit open-source license before distributing the repository for external reuse.

