// PreToolUse guard for the Resend MCP server.
// Blocks any email that would reach someone other than Resend's test
// addresses (@resend.dev) or my own address (MY_EMAIL).
// Exit 0 = allow, exit 2 = block (the reason on stderr is shown to Claude).

const LIST_TOOLS = [
  "send-broadcast",
  "create-automation",
  "send-inbox-draft",
  "send-new-inbox-email",
];
const SEND_TOOLS = ["send-email", "send-batch-emails"];

function block(reason) {
  process.stderr.write(`Blocked by send-guard: ${reason}\n`);
  process.exit(2);
}

function toList(value) {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.flatMap(toList);
  return String(value).split(",").map((s) => s.trim()).filter(Boolean);
}

// "Name <me@x.com>" -> "me@x.com"
function bareAddress(addr) {
  const match = addr.match(/<([^>]+)>/);
  return (match ? match[1] : addr).trim().toLowerCase();
}

function isAllowed(addr, myEmail) {
  const a = bareAddress(addr);
  if (a.endsWith("@resend.dev")) return true;
  return myEmail !== "" && a === myEmail;
}

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (raw += chunk));
process.stdin.on("end", () => {
  let call;
  try {
    call = JSON.parse(raw);
  } catch {
    block("could not read the tool call, so it was not allowed.");
  }

  const toolName = String(call.tool_name || "");
  const shortName = toolName.replace(/^mcp__resend__/, "");
  const input = call.tool_input || {};
  const myEmail = String(process.env.MY_EMAIL || "").trim().toLowerCase();

  if (LIST_TOOLS.includes(shortName)) {
    block(`${shortName} can reach whole lists of people, so it is always blocked.`);
  }

  if (SEND_TOOLS.includes(shortName)) {
    // send-batch-emails takes a list of emails; send-email takes one.
    const emails = Array.isArray(input.emails)
      ? input.emails
      : Array.isArray(input)
        ? input
        : [input];

    for (const email of emails) {
      const addresses = [
        ...toList(email.to),
        ...toList(email.cc),
        ...toList(email.bcc),
      ];
      if (addresses.length === 0) {
        block("no recipient address was found to check.");
      }
      for (const addr of addresses) {
        if (!isAllowed(addr, myEmail)) {
          block(`${bareAddress(addr)} is not an @resend.dev test address or MY_EMAIL.`);
        }
      }
    }
  }

  process.exit(0);
});
