const guard = require('../../lib/guard');
module.exports = async (req,res) => {
 res.setHeader('Cache-Control','no-store');
 // Completion only. The Arena reports whether a run finished, not what it produced; open n8n Executions for the data.
 if(req.method!=='POST')return res.status(405).json({success:false,message:'Method not allowed'});
 const hit=guard.check(req);if(hit)return guard.reject(res,hit);
 const missing=['N8N_API_KEY','ARENA_ACCESS_KEY'].filter(name=>!process.env[name]);
 if(missing.length)return res.status(200).json({success:true,configured:false,message:'Results are not connected yet. Add '+missing.join(' and ')+' to this Vercel project, then redeploy.'});
 let body=req.body;try{if(typeof body==='string')body=JSON.parse(body)}catch{body={}}
 const id=body?.requestId;
 if(!/^[a-f0-9-]{36}$/i.test(id||''))return res.status(400).json({success:false,message:'Invalid request ID'});
 try {
  const base=new URL(process.env.N8N_SCOUT_WEBHOOK_URL);if(base.protocol!=='https:')throw Error('configuration');
  const url=new URL('/api/v1/executions',base.origin);url.searchParams.set('limit','100');url.searchParams.set('includeData','true');
  const response=await fetch(url,{headers:{'X-N8N-API-KEY':process.env.N8N_API_KEY},redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error('n8n API returned HTTP '+response.status);
  const data=await response.json();
  const execution=(data.data||[]).find(e=>Object.values(e.data?.resultData?.runData||{}).some(runs=>runs.some(run=>(run.data?.main||[]).some(items=>items.some(item=>item.json?.body?.arenaRequestId===id)))));
  if(!execution)return res.json({success:true,configured:true,status:'Started',message:'Waiting for this run in n8n execution history.'});
  const status=execution.status==='success'?'Completed':['error','crashed','canceled'].includes(execution.status)?'Failed':'Running';
  return res.json({success:true,configured:true,status,executionId:execution.id,finishedAt:execution.stoppedAt||null,message:status==='Failed'?'n8n execution failed. Open n8n Executions for the error.':status==='Completed'?'n8n execution completed.':'n8n is executing this mission.'});
 }catch(error){return res.status(502).json({success:false,message:error.message==='configuration'?'Invalid n8n configuration.':'Unable to read n8n executions. Check API access and saved execution data.'})}
};
