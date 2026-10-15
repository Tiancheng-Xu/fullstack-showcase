# Portfolio Sync readback

The existing `/projects.json` response remains the complete public envelope.
The efficiency increment adds opt-in bounded reads without changing webhook,
GitHub installation, KV publication, deployment, or project ownership behavior.

## Read-only contract

| Request | Behavior |
| --- | --- |
| `GET /projects.json` | Complete existing envelope, plus a representation-specific weak SHA-256 ETag. |
| `GET /projects.json?view=summary` | Public project identity, status, progress and source/evidence links; 20 projects per page. |
| `GET /projects.json?id=agent-market` | Full details for the exact project ID. |
| `GET /projects.json?view=summary&limit=10` | Explicit page size, from 1 to 50. |
| Same query plus returned `cursor` | Continue the same snapshot. A changed snapshot returns 409; start again without the cursor. |
| `HEAD` for a read URL | Same validator and representation byte length, without a body. |
| `If-None-Match` for an unchanged representation | 304 without a body. |
| `GET /openapi.json` | OpenAPI 3.1.1 contract for the public read endpoint; supports ETag and HEAD too. |

The summary retains `schemaVersion`, `generatedAt`, `status` and total
`projectCount`; it adds `view`, `matchedCount`, `returnedCount` and
`nextCursor`. Summary projects include only `id`, `title`, `status`, `progress`,
`repo`, `evidenceUrl`, `ownerPage` and `sourceUpdatedAt` when present. Detailed
narratives remain available in the original or exact-ID response.

Cursors are opaque continuations, not credentials. Clients must use a returned
cursor with the same view, ID filter and limit. A cursor cannot grant access to
private data; this API only reads the already-public portfolio index.

Conditional headers are parsed in one pass and capped at 8,192 characters.
Malformed or longer values fall back to a normal 200 read; reasonable empty
HTTP list elements are ignored. These checks bound parsing work without
changing the public data or query permissions.

## Verification and limits

Run `npm test` in this worker package. Tests use real Request/Response objects
with a local KV fixture and perform no GitHub, Cloudflare or model calls.

To measure the same public build artifact before and after projection:

```sh
node scripts/measure-readback.mjs /path/to/local/dist/portfolio-projects.json
```

The script checks that all summary pages preserve the original project IDs,
then reports complete/summary/exact-project/304/HEAD response-body bytes.

Response bytes measure input and transfer volume, not tokenizer counts, model
charges, latency or worker CPU. ETag hashing and the KV read still execute on
the server; 304 reduces the returned body. Code and local tests do not imply
the Worker has been deployed. Deploy through the existing release owner.

## Protocol basis

- [HTTP conditional requests, RFC 9110 §13.1.2](https://httpwg.org/specs/rfc9110.html#field.if-none-match)
- [MCP resources and pagination](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP deterministic tool lists and caching](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html)

The HTTP API is useful to CLI, server and browser clients. These changes do not
assert MCP, WebMCP or A2A protocol compatibility.
