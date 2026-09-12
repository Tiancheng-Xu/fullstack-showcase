# Dashboard Capability and Interview Narrative Design

## Scope

This change applies only to the current Showcase Dashboard presentation layer:

- the Dashboard capability map;
- the Agent Market interview-oriented project introduction;
- the Personal AI Agent interview-oriented project introduction;
- the matching GitHub Profile project introductions;
- the decorative Babylon particle background reused on the open-source page.

The change does not remove or weaken Evidence gates elsewhere. Evidence pages,
release gates, production-status claims, project verification, and repository
delivery rules retain their current semantics.

## Presentation rule

The capability map is an interview narrative, not an Evidence gate. It may show
skills that the candidate can explain, extend, or prepare around the two project
stories. It does not label every skill as production-verified.

No Evidence status badge is shown in this module. Project and Evidence links may
remain available as optional supporting navigation.

## Capability structure

The map keeps four domains:

- AI / Agent
- Full Stack / Data
- Cloud / Reliability
- Trust / Auth

There is no standalone Web3 domain. Reusable Web3-derived engineering concepts,
including signatures, nonce handling, replay protection, authorization, audit,
and consistency, belong to Trust / Auth.

The following job-specific technologies are omitted:

- C++, C#, Qt, OpenCV
- Kubernetes
- Java, Spring AI, LangChain4j
- Android, QNX, automotive supplier lifecycle material

Each domain renders six featured nodes. Additional skills are accessible from a
More Skills control. Hover and keyboard focus expose a concise tooltip containing
aliases, a plain-language explanation, and the relevant project story. Clicking
a node opens the existing detail panel with a fuller interview explanation.

## Agent Market narrative

The official project name remains Agent Market. Its presentation subtitle is:

> Aladdin - AI Agent trading and task-distribution platform

The introduction describes an AI Agent crowdsourcing workflow covering task
decomposition, candidate filtering and scoring, human or automatic selection,
multi-stage production dispatch, pause and recovery, and auditable delivery. The
interview narrative may discuss LangGraph DAG orchestration, Node/Hono,
Python/Go runtimes, PostgreSQL checkpoints, asynchronous queues, reputation
scoring, LLM evaluation, ranking, cold-start handling, and failure recovery.

## Personal AI Agent narrative

The official project name remains Personal AI Agent. Its presentation subtitle
is:

> AI customer service and private model delivery

The introduction covers intent recognition, domain model fine-tuning, knowledge
graph and RAG retrieval, tool calling, multi-turn support, human escalation, and
private offline delivery. The interview narrative may discuss Qwen3-8B,
QLoRA/NF4, Qwen Embedding, LlamaFactory, GGUF, Ollama, structured business-rule
queries, low-confidence escalation, and reproducible local delivery.

## Open-source background

The open-source index reuses the capability-map Babylon particle scene through a
shared lazy-loaded background component. It remains decorative, does not capture
pointer input, initializes only near the viewport, and keeps the current static
fallback for narrow screens and reduced-motion environments.

## Job alignment

The map may surface interview priorities without adding a separate job-board
page. The current target order is:

> Paimeng / Dingyi / Jieli / Qipei -> Quantoo -> Loctek / Zhejiang University / Geely

The job inventory is eight concrete snapshots plus Geely as a target company
whose specific headcount remains unverified. Xinqiyu remains conditional. DHU is
excluded.

## Files and behavior

Implementation will update the capability data model, capability map interaction,
shared Babylon background lifecycle, Dashboard project copy, portfolio project
copy, GitHub Profile copy, and focused UI tests. All work remains local until the
user explicitly approves a push or publication.
