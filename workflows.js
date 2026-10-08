// Shared n8n workflow registry. Names and webhook paths only: hosts, URLs and credentials stay in Vercel env vars.
// A workflow with a `path` is started by Flow through /api/flow/run. The host comes from N8N_SCOUT_WEBHOOK_URL
// unless the workflow's own `envUrl` is set. Add a Webhook trigger (POST, Respond Immediately) with that path in n8n.
(function(){
  const workflows = [
  {
    "id": "grant-radar",
    "name": "Grant Radar",
    "detail": "Register pull from USAspending and NIH RePORTER for your configured colleges",
    "path": "/webhook/agent-arena-grant-radar",
    "envUrl": "N8N_GRANT_RADAR_WEBHOOK_URL",
    "envHeaderName": "N8N_GRANT_RADAR_AUTH_HEADER_NAME",
    "envHeaderValue": "N8N_GRANT_RADAR_AUTH_HEADER_VALUE"
  },
  {
    "id": "agent-ideas",
    "name": "Agent Ideas",
    "detail": "RSS automation that collects new agent ideas",
    "path": "/webhook/agent-arena-agent-ideas",
    "envUrl": "N8N_AGENT_IDEAS_WEBHOOK_URL",
    "envHeaderName": "N8N_AGENT_IDEAS_AUTH_HEADER_NAME",
    "envHeaderValue": "N8N_AGENT_IDEAS_AUTH_HEADER_VALUE"
  },
  {
    "id": "ai-jobs-monitor",
    "name": "AI Jobs Monitor",
    "detail": "Indeed v3 with Slack summaries. Runs from the Scout station.",
    "station": "scout"
  },
  {
    "id": "jev-gate-ai-jobs-monitor",
    "name": "(Jev gate) AI Jobs Monitor",
    "detail": "AI jobs monitor behind the Jev gate (n8n workflow IzqCVxf9pis8m69R)",
    "path": "/webhook/agent-arena-jev-gate-ai-jobs-monitor",
    "envUrl": "N8N_JEV_GATE_AI_JOBS_MONITOR_WEBHOOK_URL",
    "envHeaderName": "N8N_JEV_GATE_AI_JOBS_MONITOR_AUTH_HEADER_NAME",
    "envHeaderValue": "N8N_JEV_GATE_AI_JOBS_MONITOR_AUTH_HEADER_VALUE"
  }
];
  if(typeof module === "object" && module.exports) module.exports = workflows;
  else window.ARENA_WORKFLOWS = workflows;
})();
