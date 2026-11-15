# studio-kit

A Claude Code plugin with the reusable parts of an email campaign studio. Load it into any client's repo to personalize campaign emails per lead group, keep Resend sends to safe test addresses, and review emails against that client's brand rules.

## What's inside

| Path | What it does |
|---|---|
| `.claude-plugin/plugin.json` | The plugin's name (`studio-kit`), version and description. |
| `.claude-plugin/marketplace.json` | A one-plugin marketplace, so the kit can be installed with `/plugin`. |
| `skills/personalize/SKILL.md` | `/studio-kit:personalize <campaign>` writes one copy of each campaign email per lead group. Runs in a forked context and returns only a summary. |
| `hooks/hooks.json` + `hooks/send-guard.mjs` | A PreToolUse hook on every `mcp__resend__.*` tool. It blocks (exit 2) any send to an address other than `@resend.dev` or your own `MY_EMAIL`, and always blocks tools that can reach whole lists. |
| `agents/email-reviewer.md` | `studio-kit:email-reviewer`, a read-only subagent (Read, Glob, Grep) that reviews email files against the client's brand voice and email rules. |
| `scripts/review.mjs` + `review/findings.schema.json` | A headless review: runs `claude -p` with the schema, writes `review/findings.json` in the client repo, and exits 1 on any high-severity finding. |

## Install

**Try it from a local folder** (for example, with the kit next to the client repo):

```
cd client-repo
claude --plugin-dir ../studio-kit
```

**Install it through the marketplace:**

```
/plugin marketplace add ../studio-kit        (or <github-user>/studio-kit once it's on GitHub)
/plugin install studio-kit@studio-kit
```

Check it is loaded: the skill shows as `studio-kit:personalize` and the agent as `studio-kit:email-reviewer`.

**Run the headless review** from the client repo's root folder:

```
node ../studio-kit/scripts/review.mjs campaigns/<campaign>
```

`${CLAUDE_PLUGIN_ROOT}` is only set inside Claude Code, so from a terminal use the path to wherever the kit lives.

## What each client repo must provide

The kit holds no brand details. Every tool reads them from the client repo, using these paths:

```
client-repo/
├── CLAUDE.md                 studio rules, with @brand/voice.md
├── brand/voice.md            voice, words to avoid, claims never to make, approved reviews, email layout, sign-off
├── leads/
│   ├── leads.csv             needs a "group" column; practice addresses only (@example.com)
│   └── CLAUDE.md             leads rules, plus a "Groups" section with one line per group
├── campaigns/<name>/
│   ├── plan.md               optional: suggested review per group
│   └── emails/*.md           the final emails
├── .claude/rules/emails.md   the layout every email file must follow (link, footer)
├── .claude/settings.local.json   gitignored; sets MY_EMAIL for the guard
└── .mcp.json                 the Resend server, named "resend", in practice mode by default
```

## Why brand voice, leads, campaigns and email rules stay in each client's repo

- **They are different for every client.** A plugin is copied unchanged into every project that loads it. One client's voice, sign-off, links or reviews inside the kit would leak into the next client's emails.
- **They are the client's data.** Leads are people, and campaigns and voice guides belong to the client. They should be versioned, shared and deleted with that client's repo, not carried around in a toolbox.
- **Rules need to load where the work happens.** `CLAUDE.md` and `.claude/rules/` load from the project, and path-scoped rules only apply to that project's files. The client's team gets them just by cloning the repo.
- **The kit stays reusable.** Because it only knows the folder layout above, the same version works for every client, and fixing a tool fixes it everywhere.

## Things to know

- **The guard only watches a server named `resend`.** The kit doesn't ship `.mcp.json`; each client brings its own. If the server has another name, the matcher misses it and nothing is guarded.
- **The guard is an allow-list for two send tools and a block-list for four list tools** (`send-broadcast`, `create-automation`, `send-inbox-draft`, `send-new-inbox-email`). Other Resend tools that can email someone, such as replying to or forwarding an inbox thread, or `send-event` (which can trigger automations), are not checked yet. Review this list when you upgrade the Resend MCP server.
- **Don't also register the guard in the client's `.claude/settings.json`**, or it runs twice on every Resend call.
- **Real sends** need `RESEND_API_KEY` and `RESEND_BASE_URL` set in the terminal, never in a file. The guard still applies.
