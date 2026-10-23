
function hasProviderKey(env=process.env){return Boolean(env.OPENROUTER_API_KEY||env.OPENAI_API_KEY);}
function esc(v){if(v===null||v===undefined)return '';const s=String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function toCSV(rows,columns){const cols=columns&&columns.length?columns:Object.keys(rows[0]||{});return [cols.join(','),...rows.map(r=>cols.map(c=>esc(r[c])).join(','))].join('\n')+(rows.length?'\n':'');}
function filterRows(rows,{q='',status,priority,...rest}={}){const needle=String(q||'').toLowerCase();return rows.filter(r=>{if(needle&&!Object.values(r).some(v=>v!==null&&v!==undefined&&String(v).toLowerCase().includes(needle)))return false;if(status!==undefined&&status!==''&&String(r.status??'')!==String(status))return false;if(priority!==undefined&&priority!==''&&String(r.priority??'')!==String(priority))return false;for(const[k,v]of Object.entries(rest)){if(v!==undefined&&v!==''&&String(r[k]??'')!==String(v))return false;}return true;});}
function validateTask(b={}){if(!b.title||!String(b.title).trim())return 'title is required';if(b.status&&!['pending','in_progress','completed','cancelled'].includes(b.status))return 'invalid status';return null;}
function section(label,value){return {label,value:value===undefined?null:value};}

function claimTriage(rows=[]){const high=rows.filter(r=>Number(r.urgency_score||0)>=8).length;return {aiGenerated:false,provider:'deterministic-fallback',feature:'claim-triage',sections:[section('Total claims',rows.length),section('High urgency (score >= 8)',high),section('Summary',high+' high-urgency claim(s)')],high,total:rows.length};}
function spreadRisk(rows=[]){const viral=rows.filter(r=>Number(r.spread_rate||0)>0||Number(r.reach||0)>1000).length;return {aiGenerated:false,provider:'deterministic-fallback',feature:'spread-risk',sections:[section('Total claims',rows.length),section('Elevated spread',viral),section('Zero spread preserved',rows.filter(r=>Number(r.spread_rate||0)===0).length)],viral,total:rows.length};}
function credibilitySummary(rows=[]){const pending=rows.filter(r=>r.status==='pending').length;return {aiGenerated:false,provider:'deterministic-fallback',feature:'credibility-summary',sections:[section('Total claims',rows.length),section('Pending claims',pending),section('Summary',pending+' pending verification')],pending,total:rows.length};}

module.exports={hasProviderKey,toCSV,filterRows,validateTask,section,claimTriage,spreadRisk,credibilitySummary};
