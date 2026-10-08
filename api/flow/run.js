const {randomUUID}=require('crypto');
// Starts one registered n8n workflow. Webhook hosts and optional auth stay server-side.
const guard = require("../../lib/guard.js");
const workflows = require("../../workflows.js");
module.exports = async function handler(req, res) {
 res.setHeader("Cache-Control", "no-store");
 if (req.method !== "POST") return res.status(405).json({success:false,status:"Failed",message:"Method not allowed"});
 // These workflows call paid APIs from n8n, so they need the page's origin and, when configured, the access key.
 const hit = guard.check(req, {requireKey:true});
 if (hit) return guard.reject(res, hit);
 let body = req.body;
 if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
 const wanted = String((body && body.workflow) || "grant-radar");
 const wf = workflows.find(w => w.id === wanted && w.path);
 if (!wf) return res.status(400).json({success:false,status:"Failed",message:"Unknown workflow."});
 let url;
 try{
  if(process.env[wf.envUrl])url=new URL(process.env[wf.envUrl]);
  else {
   // Same n8n instance as the already configured Scout.
   const scout=new URL(process.env.N8N_SCOUT_WEBHOOK_URL);
   url=new URL(wf.path,scout.origin);
  }
  if(url.protocol!=="https:"||url.username||url.password)throw new Error("Invalid configuration");
 }catch{
  return res.status(500).json({success:false,status:"Failed",message:wf.name+" webhook is not configured. Set "+wf.envUrl+" on Vercel."});
 }
 const requestId=randomUUID();
 try{
  const headers={"Content-Type":"application/json"};
  if(process.env[wf.envHeaderValue])headers[process.env[wf.envHeaderName]||"X-Agent-Arena-Key"]=process.env[wf.envHeaderValue];
  const response=await fetch(url.toString(),{
   method:"POST",headers,redirect:"error",
   body:JSON.stringify({agent:"flow",workflow:wf.id,arenaRequestId:requestId,source:"agent-arena",requestedAt:new Date().toISOString()}),
   signal:AbortSignal.timeout(15000)
  });
  if(!response.ok){
   const message=response.status===404?wf.name+" webhook is not registered. Add a Webhook trigger with path "+wf.path.replace("/webhook/","")+" and publish the workflow in n8n.":"n8n rejected the "+wf.name+" request (HTTP "+response.status+").";
   return res.status(502).json({success:false,status:"Failed",message});
  }
  // Immediately acknowledges receipt. Never infer final completion from HTTP success.
  return res.status(202).json({success:true,requestId,agent:"flow",workflow:wf.id,status:"Started",message:wf.name+" started in n8n. Check n8n Executions for the completed results."});
 }catch{
  return res.status(502).json({success:false,status:"Failed",message:"Could not confirm "+wf.name+" acceptance. Check n8n Executions before retrying."});
 }
};
