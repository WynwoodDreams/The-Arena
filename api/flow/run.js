// Fixed Grant Radar destination; webhook URL and optional auth stay server-side.
module.exports = async function handler(req, res) {
 res.setHeader("Cache-Control", "no-store");
 if (req.method !== "POST") return res.status(405).json({success:false,status:"Failed",message:"Method not allowed"});
 const origin=req.headers?.origin;
 if(origin){try{if(new URL(origin).host!==req.headers.host)return res.status(403).json({success:false,status:"Failed",message:"Request origin not allowed"});}catch{return res.status(403).json({success:false,status:"Failed",message:"Request origin not allowed"});}}
 let url;
 try{
  if(process.env.N8N_GRANT_RADAR_WEBHOOK_URL)url=new URL(process.env.N8N_GRANT_RADAR_WEBHOOK_URL);
  else {
   // This workflow uses the same n8n instance as the already configured Scout.
   const scout=new URL(process.env.N8N_SCOUT_WEBHOOK_URL);
   url=new URL("/webhook/agent-arena-grant-radar",scout.origin);
  }
  if(url.protocol!=="https:"||url.username||url.password)throw new Error("Invalid configuration");
 }catch{
  return res.status(500).json({success:false,status:"Failed",message:"Grant Radar webhook is not configured. Set N8N_GRANT_RADAR_WEBHOOK_URL on Vercel."});
 }
 try{
  const headers={"Content-Type":"application/json"};
  if(process.env.N8N_GRANT_RADAR_AUTH_HEADER_VALUE)headers[process.env.N8N_GRANT_RADAR_AUTH_HEADER_NAME||"X-Agent-Arena-Key"]=process.env.N8N_GRANT_RADAR_AUTH_HEADER_VALUE;
  const response=await fetch(url.toString(),{
   method:"POST",headers,redirect:"error",
   body:JSON.stringify({agent:"flow",workflow:"grant-radar",source:"agent-arena",requestedAt:new Date().toISOString()}),
   signal:AbortSignal.timeout(15000)
  });
  if(!response.ok){
   const message=response.status===404?"Grant Radar webhook is not registered. Publish the workflow in n8n and retry.":"n8n rejected the Grant Radar request (HTTP "+response.status+").";
   return res.status(502).json({success:false,status:"Failed",message});
  }
  // Immediately acknowledges receipt. Never infer final completion from HTTP success.
  return res.status(202).json({success:true,agent:"flow",workflow:"grant-radar",status:"Started",message:"Grant Radar started in n8n. Check n8n Executions for the completed grant results."});
 }catch{
  return res.status(502).json({success:false,status:"Failed",message:"Could not confirm Grant Radar acceptance. Check n8n Executions before retrying."});
 }
};
