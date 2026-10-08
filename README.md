# Agent Arena + n8n Scout

## Deploy to Vercel

1. Upload this folder to a **private GitHub repository** (keep sensitive information out of the repository).
2. On vercel.com, select **Add New > Project**, import that repository and deploy with framework preset **Other**. No build command is required. The site is `public/index.html` and the server endpoint is `api/scout/run.js`.
3. In the Vercel project, open **Settings > Environment Variables**. Add `N8N_SCOUT_WEBHOOK_URL` and paste the **Production URL** from your published n8n Webhook node (it contains `/webhook/`, not `/webhook-test/`). Select Production environment.
4. If n8n Webhook uses Header Auth, also add `N8N_SCOUT_AUTH_HEADER_NAME` (the header name) and `N8N_SCOUT_AUTH_HEADER_VALUE` (the secret). For a new n8n Header Auth credential, use `X-Agent-Arena-Key` as name and a random secret value, then match both environment variables.
5. **Redeploy** in Vercel: Deployments > latest deployment > ... > Redeploy (so environment settings apply).
6. Open the Vercel URL, select Scout, click **Run Scout**. It will call `/api/scout/run` on the Vercel server, which calls n8n and displays the returned message.

## Important

- The HTML on your computer (`file:///...`) is only a preview; Scout requires the deployed site.
- n8n Webhook node must respond **Using Respond to Webhook Node**, and each reachable branch must return JSON like `{ "success": true, "agent": "scout", "status": "completed", "message": "Job search completed" }`.
- Other agents and aggregate dashboard metrics remain demo values.
- **Security**: The n8n webhook is not exposed in browser source. However, `/api/scout/run` is callable by anybody who can access your deployed site. Before sharing it publicly, enable access controls (for example, Vercel Deployment Protection / authentication) and use Header Auth in n8n. An unauthenticated public endpoint can trigger repeated paid Apify runs.
- Very long n8n runs (over ~55s) can time out even if n8n continues processing. A background job/status approach is needed for longer workflows.
