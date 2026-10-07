let credential='', state=null, view='Incoming';
const $=id=>document.getElementById(id);
const views=['Incoming','Auto-refreshed','Needs Review','Conflicts','Rejected','Stale Sources','Change Feed'];
function element(tag,text,className){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(className)e.className=className;return e;}
function message(text){$('message').textContent=text;}
async function api(path,data){const response=await fetch(`/v1/owner/${path}`,{method:data?'POST':'GET',headers:{authorization:`Bearer ${credential}`,...(data?{'content-type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});const value=await response.json();if(!response.ok)throw new Error(value.error);return value;}
async function refresh(){try{state=await api('state');$('workspace').hidden=false;$('login').hidden=true;render();message('Evidence loaded.');}catch(e){message(e.message);}}
function inspect(card,title,data){const details=element('details');details.append(element('summary',title),element('pre',JSON.stringify(data,null,2)));card.append(details);}
function render(){
  $('list').replaceChildren();$('count').textContent=`${state.candidates.length} ingested candidates`;
  for(const button of $('views').children)button.setAttribute('aria-current',String(button.textContent===view));
  if(view==='Stale Sources'){
    for(const source of state.sources.filter(s=>s.reconciliation?.status!=='in_sync')){
      const card=element('article',undefined,'card');card.append(element('h2',source.source),element('p',source.reconciliation?.status??'Not checked','badge'));inspect(card,'Reconciliation',source);
      const ignore=element('button','Ignore alerts for 24 hours');ignore.onclick=async()=>{try{await api('ignore',{source:source.source,until:new Date(Date.now()+86400000).toISOString()});await refresh();}catch(e){message(e.message);}};card.append(ignore);$('list').append(card);
    }
  }else if(view==='Change Feed'){
    for(const change of state.changes){const card=element('article',undefined,'card');card.append(element('h2',change.system),element('p',`${change.status} • ${change.timestamp}`));inspect(card,'Engineering change',change);$('list').append(card);}
    const audit=element('article',undefined,'card');inspect(audit,'Accepted and rejected event audit',state.audit);$('list').append(audit);
  }else{
    const statuses={'Auto-refreshed':['auto_refreshed'],'Needs Review':['needs_review'],'Conflicts':['conflict'],'Rejected':['rejected']};
    const rows=state.candidates.filter(c=>!statuses[view]||statuses[view].includes(c.status));
    for(const candidate of rows){
      const card=element('article',undefined,'card');const m=candidate.normalized.manifest;
      card.append(element('p',`${candidate.source} • ${candidate.status} • ${m.maturity}`,'badge'),element('h2',m.title),element('p',m.summary),element('p',m.limitations.join(' ')));
      inspect(card,'Normalized diff & deterministic policy',candidate.policy);inspect(card,'Provenance & normalized evidence',candidate.normalized);
      if(['needs_review','conflict'].includes(candidate.status)){
        const label=element('label','Safe reviewer note');const note=element('textarea');note.maxLength=1000;note.rows=2;label.append(note);card.append(label);
        for(const action of candidate.status==='conflict'?['reject','archive','keep']:['approve','reject','archive','keep']){
          const button=element('button',{approve:'Approve & publish',reject:'Reject',archive:'Archive',keep:'Keep existing value'}[action]);
          button.onclick=async()=>{button.disabled=true;try{await api('review',{eventId:candidate.id,action,note:note.value});await refresh();message(`Candidate ${action} completed.`);}catch(e){message(e.message);}finally{button.disabled=false;}};card.append(button);
        }
      }
      $('list').append(card);
    }
    if(view==='Rejected')for(const audit of state.audit.filter(a=>a.kind==='rejected')){
      const card=element('article',undefined,'card');card.append(element('h2','Rejected request'),element('p',`${audit.code} • ${audit.at}`,'badge'),element('p','Unsafe request bodies and credentials are never retained in audit records.'));$('list').append(card);
    }
  }
  if(!$('list').children.length)$('list').append(element('p','No records in this view.'));
}
for(const name of views){const b=element('button',name);b.onclick=()=>{view=name;render();};$('views').append(b);}
$('connect').onsubmit=async e=>{e.preventDefault();credential=$('credential').value;$('credential').value='';await refresh();};
$('refresh').onclick=refresh;
$('disconnect').onclick=()=>{credential='';state=null;$('workspace').hidden=true;$('login').hidden=false;$('list').replaceChildren();message('Disconnected.');};
$('reconcile').onclick=async()=>{try{const observations=JSON.parse($('observations').value);await api('reconcile',{observations});await refresh();message('Reconciliation finished.');}catch(e){message(e.message);}};
