# Portfolio project metadata contract

Portfolio Sync only publishes repositories containing
.github/baby2b-publish.yml with schema-version 1 and an evidence-url under
https://evidence.baby2b.online/.

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
