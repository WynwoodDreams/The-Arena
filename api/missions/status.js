const guard = require('../../lib/guard');
module.exports = async (req,res) => {
 res.setHeader('Cache-Control','no-store');
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
  const result=execution.data?.resultData||{};
  const status=execution.status==='success'?'Completed':['error','crashed','canceled'].includes(execution.status)?'Failed':'Running';
  const last=result.lastNodeExecuted;
  const runs=result.runData?.[last]||[];
  const finalOutput=(runs.at(-1)?.data?.main||[]).flat().slice(0,20).map(item=>item.json);
  // Prefer content-producing nodes over acknowledgements, counters and transport receipts.
  const candidates=Object.entries(result.runData||{}).filter(([name])=>!/webhook|trigger|credential|log success|respond to webhook/i.test(name)).map(([name,nodeRuns])=>{
   const items=(nodeRuns.at(-1)?.data?.main||[]).flat().slice(0,20).map(item=>item.json);
   const meaningful=items.some(item=>item&&Object.entries(item).some(([key,value])=>/^(output|text|content|summary|ideas?|jobs?|results?|title|description|message)$/i.test(key)&&(typeof value==='string'?value.length>100:Array.isArray(value)?value.length>0:typeof value==='object'&&value!==null)));
   const score=(meaningful?100:0)+(/summar|generat|agent|idea|result|format|analy/i.test(name)?20:0)-(/slack|log|status|count/i.test(name)?40:0);
   return {node:name,items,score};
  }).filter(candidate=>candidate.items.length).sort((a,b)=>b.score-a.score);
  const selected=candidates[0];
  const useful=selected&&selected.score>0;
  const output=useful?selected.items:finalOutput;
  const outputNode=useful?selected.node:last;
  const outputs=candidates.slice(0,8).map(candidate=>({node:candidate.node,output:JSON.stringify(candidate.items).slice(0,30000)}));
  return res.json({success:true,configured:true,status,executionId:execution.id,finishedAt:execution.stoppedAt||null,message:status==='Failed'?'n8n execution failed.':status==='Completed'?'n8n execution completed.':'n8n is executing this mission.',output:JSON.stringify(output).slice(0,30000),lastNode:outputNode||null,outputs,finalNode:last||null});
 }catch(error){return res.status(502).json({success:false,message:error.message==='configuration'?'Invalid n8n configuration.':'Unable to read n8n executions. Check API access and saved execution data.'})}
};
