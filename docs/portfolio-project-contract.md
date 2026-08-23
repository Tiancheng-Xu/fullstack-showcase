# Portfolio project metadata contract

Portfolio Sync only publishes repositories containing
.github/baby2b-publish.yml with schema-version 1 and a project-owned Evidence
URL. Deployed applications use `https://<slug>.baby2b.online/evidence/` on the
same host as their production URL. Skills, internal services, and projects
without an independent site use `https://baby2b.online/evidence/<slug>` so the
TanStack dynamic route and its prerendered HTML use the same canonical path.
The legacy `https://evidence.baby2b.online/` host is redirect-only and is not a
valid source URL for new project metadata.

Repositories may add .github/portfolio-project.json with these fields:

- visible: boolean
- order: number
- title, desc, architecture: string
- status: 已完成 or 进行中
- progress: number
- skills, evidence, details: string arrays

Missing optional metadata falls back to conservative public GitHub metadata.
Learning repositories, Showcase, shared policy repositories, forks, archived
repositories, and repositories without an Evidence URL are excluded. The
browser receives only resulting public project cards; credentials and private
repository contents never enter the index.
