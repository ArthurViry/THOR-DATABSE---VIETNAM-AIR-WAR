/**
 * THOR — Operation Linebacker II  v5
 * Orange points · Blue flux gradient · Persistent lasso · Intro tab
 */

const DATA_URL = 'data/data_linebacker2.json';
const LB2_DAYS = [18,19,20,21,22,23,24,25,26,27,28,29];

const AIRBASE_COORDS = {
  'DA NANG':[16.0439,108.1992],'DANANG':[16.0439,108.1992],
  'BIEN HOA':[10.973,106.819],'BIEN HOA AB':[10.973,106.819],
  'TAN SON NHUT':[10.8184,106.652],'SAIGON':[10.8231,106.6297],
  'PHU CAT':[13.955,109.042],'PHU BAI':[16.401,107.702],
  'CAM RANH':[11.9982,109.2194],'CAN THO':[10.085,105.712],
  'PHAN RANG':[11.6333,108.9833],
  'KORAT':[14.934,102.079],
  'UBON':[15.251,104.873],'UBON AB':[15.251,104.873],
  'UDORN':[17.3864,102.788],'UDORN AB':[17.3864,102.788],
  'TAKHLI':[15.2774,100.2964],
  'NKP':[17.3864,102.744],'NAKHON PHANOM':[17.3864,102.744],
  'U-TAPAO':[12.6799,101.0051],'UTAPAO':[12.6799,101.0051],'U TAPAO':[12.6799,101.0051],
  'BANGKOK':[13.6811,100.747],
  'CHING CHUAN KANG':[24.1427,120.6206],'CCK':[24.1427,120.6206],
  'KADENA':[26.3556,127.7678],
  'ANDERSEN':[13.5836,144.9304],'ANDERSEN AFB':[13.5836,144.9304],'GUAM':[13.5836,144.9304],
  'CLARK':[15.1858,120.56],'CLARK AB':[15.1858,120.56],
  'CUBI POINT':[14.7944,120.2678],
  'YANKEE STATION':[17.5,108],'TONKIN GULF':[17.5,108],
  'DIXIE STATION':[12,110],'CORAL SEA':[16,110],
  'CONSTELLATION':[17,109],'MIDWAY':[17.5,108.5],
  'ENTERPRISE':[16.5,109.5],'KITTY HAWK':[17,108],
  'QUI NHON':[13.7752,109.2236],'NHA TRANG':[12.2388,109.1967],
  'PLEIKU':[13.9739,108.0088],'CHU LAI':[15.4043,108.7053],
  'DONG HA':[16.8456,107.098],'BINH THUY':[10.0953,105.7225],
  'NAM PHONG':[16.0,102.6],'LONG TIEN':[19.1,102.6],
  'PAKSE':[15.1333,105.7833],'SAVANAKHET':[16.5569,104.7522],
  'PONCHENTONG':[11.5467,104.844],'LOUANG PHRAB':[19.897,102.134],
  'OSAN':[37.0903,127.0296],'YOKOTA':[35.7485,139.3484]
};

const BASE_CANONICAL = {
  'DANANG':'DA NANG','BIEN HOA AB':'BIEN HOA','SAIGON':'TAN SON NHUT',
  'UBON AB':'UBON','UDORN AB':'UDORN','U-TAPAO':'U TAPAO','UTAPAO':'U TAPAO',
  'ANDERSEN AFB':'ANDERSEN','GUAM':'ANDERSEN','CCK':'CHING CHUAN KANG',
  'CLARK AB':'CLARK','YANKEE STATION':'TONKIN GULF','NAKHON PHANOM':'NKP',
};

const AIRBASE_COUNTRY = {
  'DA NANG':'South Vietnam','BIEN HOA':'South Vietnam','TAN SON NHUT':'South Vietnam',
  'PHU CAT':'South Vietnam','PHU BAI':'South Vietnam','CAM RANH':'South Vietnam',
  'CAN THO':'South Vietnam','PHAN RANG':'South Vietnam','QUI NHON':'South Vietnam',
  'NHA TRANG':'South Vietnam','PLEIKU':'South Vietnam','CHU LAI':'South Vietnam',
  'DONG HA':'South Vietnam','BINH THUY':'South Vietnam',
  'KORAT':'Thailand','UBON':'Thailand','UDORN':'Thailand','TAKHLI':'Thailand',
  'NKP':'Thailand','U TAPAO':'Thailand','BANGKOK':'Thailand','NAM PHONG':'Thailand',
  'CHING CHUAN KANG':'Taiwan','KADENA':'Japan (Okinawa)',
  'ANDERSEN':'Guam (USA)','CLARK':'Philippines','CUBI POINT':'Philippines',
  'TONKIN GULF':'Gulf of Tonkin (Carrier)','DIXIE STATION':'Gulf of Tonkin (Carrier)',
  'CORAL SEA':'Gulf of Tonkin (Carrier)','CONSTELLATION':'Gulf of Tonkin (Carrier)',
  'MIDWAY':'Gulf of Tonkin (Carrier)','ENTERPRISE':'Gulf of Tonkin (Carrier)',
  'KITTY HAWK':'Gulf of Tonkin (Carrier)',
  'LONG TIEN':'Laos','PAKSE':'Laos','SAVANAKHET':'Laos',
  'PONCHENTONG':'Cambodia','LOUANG PHRAB':'Laos',
  'OSAN':'South Korea','YOKOTA':'Japan',
};

function canonBase(raw){const u=(raw||'').toUpperCase().trim();return BASE_CANONICAL[u]||u;}

const TGT_KW = {
  'INFRASTRUCTURE':['ROAD','BRIDGE','RAILROAD','RAIL','HIGHWAY','FERRY','FORD','TUNNEL','PIPELINE','POL','PETROLEUM','STORAGE','SUPPLY','DEPOT','WAREHOUSE'],
  'MILITARY':['MILITARY','ARMY','BARRACKS','TROOPS','PERSONNEL','AAA','SAM','RADAR','AIRFIELD','AIRBASE','AIRSTRIP','NAVY','VESSEL','BOAT','SHIP','JUNK','SAMPAN'],
  'INDUSTRY':['FACTORY','PLANT','POWER','ELECTRIC','STEEL','IRON','CEMENT','MANUFACTURING'],
  'VEGETATION':['FOREST','JUNGLE','VEGETATION','DEFOLIAT','AREA','ZONE','GRID','COORDINATE'],
  'POPULATION':['VILLAGE','TOWN','CITY','HAMLET','BUILDING','STRUCTURE','INHABITED']
};
function getTgtCat(tt){if(!tt)return'OTHER';const u=tt.toUpperCase();for(const[c,kws]of Object.entries(TGT_KW))if(kws.some(k=>u.includes(k)))return c;return'OTHER';}

const BASEMAPS={
  dark:    {url:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',    attr:'© CARTO'},
  positron:{url:'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',   attr:'© CARTO'},
  ortho:   {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',attr:'© Esri'}
};
const AC_ROOT_TO_PRIMARY = {"A-1": "FIGHTER", "A-26": "BOMBER", "A-37": "ATTACK", "A-4": "FIGHTER", "A-5": "BOMBER", "A-6": "ATTACK", "A-7": "ATTACK", "AC-119": "TRANSPORT", "AC-123": "TRANSPORT", "AC-130": "ATTACK", "AC-47": "ATTACK", "AH-1": "HELICOPTER", "B-1": "STRATEGIC", "B-52": "STRATEGIC", "B-57": "TACTICAL", "B-66": "BOMBER", "C-1": "TRANSPORT", "C-117": "TRANSPORT", "C-119": "TRANSPORT", "C-123": "TRANSPORT", "C-130": "TRANSPORT", "C-47": "TRANSPORT", "C-54": "TRANSPORT", "C-7": "TRANSPORT", "C-76": "TRANSPORT", "CH-46": "CARGO", "CH-53": "CARGO", "CH-3": "CARGO", "CH-47": "TRANSPORT", "DC-4": "TRANSPORT", "DC-8": "TRANSPORT", "E-2": "EARLY_WARNING", "E-3": "EARLY_WARNING", "EA-3": "ATTACK", "EA-1": "ATTACK", "EA-6": "FIGHTER", "EB-66": "TACTICAL", "EC-121": "EARLY_WARNING", "EC-47": "TRANSPORT", "EF-10": "FIGHTER", "EKA-3": "STRATEGIC", "EP-3": "INTEL", "F-8": "FIGHTER", "F-100": "FIGHTER", "F-104": "FIGHTER", "F-105": "FIGHTER", "F-111": "FIGHTER", "F-14": "FIGHTER", "F-4": "FIGHTER", "F-5": "FIGHTER", "F-10": "FIGHTER", "F-9": "FIGHTER", "FC-47": "CLOSE_SUPPORT", "H-34": "CLOSE_SUPPORT", "H-47": "TRANSPORT", "HC-130": "RESCUE", "HC-47": "TRANSPORT", "HH-3": "RESCUE", "HH-43": "RESCUE", "HH-53": "HELICOPTER", "KA3": "STRATEGIC", "KC-135": "REFUEL", "L-19": "OBSERV", "LC-130": "TRANSPORT", "NC-123": "TRANSPORT", "O-1": "OBSERV", "O-2": "OBSERV", "OH-6": "OBSERV", "OV-1": "ATTACK", "OV-10": "ATTACK", "P-3": "OTHER", "QU-22": "UTILITY", "R44": "UTILITY", "RA-3": "STRATEGIC", "RB-66": "BOMBER", "RC-135": "RECON", "RC-47": "RECON", "RF-101": "FIGHTER", "RF-4": "FIGHTER", "RF-8": "FIGHTER", "SH-3": "UTILITY", "T-28": "TRAIN", "T-29": "TRAIN", "T-39": "TRAIN", "T-41": "TRAIN", "TA-4": "FIGHTER", "TF9": "FIGHTER", "U-1": "CARGO", "U-10": "UTILITY", "U-17": "UTILITY", "U-21": "UTILITY", "U-3": "UTILITY", "U-6": "TRAIN", "UH-1": "UTILITY", "UH-2": "HELICOPTER", "VC-54": "TRANSPORT", "WC-130": "RECON", "YQU-22": "UTILITY", "E-1": "CARRIER", "F-102": "FIGHTER", "A-3": "STRATEGIC", "DC-6": "TRANSPORT", "C-121": "TRANSPORT"};

const PALETTES={
  MILSERVICE:d3.schemeTableau10,MFUNC_DESC:d3.schemePaired,
  _wpnClass:d3.schemeSet2,_acApp:d3.schemeSet2,
  _tgtCat:['#7a9248','#b04848','#c8a84c','#5a8a4a','#8a7aaa','#7a9aa8']
};

// ─── STATE ────────────────────────────────────────────────────────────
const S={
  allData:[],filtered:[],
  filters:{days:new Set(LB2_DAYS),services:new Set(),mfuncs:new Set(),countries:new Set(),acapps:new Set(),wpns:new Set(),acPrimary:'',wpnClass:''},
  layers:{points:true,flux:false},
  colorBy:'',colorScale:null,statsOpen:true,
  lassoSelection:null,  // array of agg points, persists until clearLasso()
  lassoRecords:null,    // raw filtered records inside lasso polygon
  lassoDrawing:false    // true only while actively drawing
};
let BASE_STATS={};
let map=null,baseTile=null,pointsLyr=null,fluxLyr=null,basesLyr=null,lassoHighlightLyr=null;
let animMap=null,animLyr=null,animFluxLyr=null,animBasesLyr=null,animMapInited=false;
let animPlaying=false,animTimer=null,animDay=18,animHour=0,animByHour=false,animSpeed=1500;
let updateTimer=null;
let lassoPolygon=null,lassoPoints=[],lassoLatLngs=[],lassoSvg=null,lassoPath=null;

// ─── UTILS ────────────────────────────────────────────────────────────
const ttEl=document.getElementById('tooltip');
const showTT=(html,e)=>{ttEl.innerHTML=html;ttEl.style.display='block';moveTT(e);};
const moveTT=e=>{ttEl.style.left=(e.clientX+16)+'px';ttEl.style.top=(e.clientY-12)+'px';};
const hideTT=()=>{ttEl.style.display='none';};
function fmtN(n,d=0){if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(d===0?0:d)+'K';return(+n).toFixed(d);}
function sample(arr,n){if(arr.length<=n)return arr;const step=arr.length/n;return Array.from({length:n},(_,i)=>arr[Math.floor(i*step)]);}
function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function setLoader(p,m){document.getElementById('loader-bar').style.width=p+'%';document.getElementById('loader-msg').textContent=m;}
function hideLoader(){const l=document.getElementById('loader');l.style.transition='opacity .5s';l.style.opacity='0';setTimeout(()=>l.style.display='none',600);}

// ─── DATA ─────────────────────────────────────────────────────────────
async function loadData(){
  setLoader(10,'Loading mission records…');
  const r=await fetch(DATA_URL);
  if(!r.ok)throw new Error(`HTTP ${r.status}`);
  setLoader(55,'Parsing JSON…');
  const raw=await r.json();
  setLoader(80,'Processing records…');
  // Keep only missions with WEAPONTYPEWEIGHT > 0 (1,228 records)
  S.allData=raw.filter(d=>(d.ww||0)>0).map(d=>{
    let wpnClass=(WEAPON_CLASS_MAP&&d.wt)?WEAPON_CLASS_MAP[d.wt]||null:null;
    if(!wpnClass){
      const md=(d.md||'').toUpperCase();
      if(/STRIKE|INTERDICT|SUPPRESS/.test(md))             wpnClass='STRIKE';
      else if(/CLOSE AIR|DIRECT AIR|AIR SUPPORT/.test(md)) wpnClass='CLOSE AIR SUPPORT';
      else if(/ARMED RECCE|RECCE/.test(md))                wpnClass='ARMED RECCE';
      else if(/CARGO|TRANSPORT|LOG/.test(md))              wpnClass='LOGISTICS';
      else if(/PATROL|ESCORT|COVER/.test(md))              wpnClass='PATROL';
      else if(/RESCUE|SEARCH/.test(md))                    wpnClass='RESCUE/SAR';
      else if(/FLAK/.test(md))                             wpnClass='FLAK SUPPRESSION';
      else wpnClass=d.md||'OTHER';
    }
    const baseKey=canonBase(d.tl||'');
    return{...d,
      _lat:d.la,_lon:d.lo,_wpns:d.nw||0,
      _wt:(d.ww||0)*(d.nw||0),
      _bomb:(d.ww||0)>0,
      _tgtCat:getTgtCat(d.tt),_wpnClass:wpnClass,
      _acApp:(AIRCRAFT_GLOSS&&AIRCRAFT_GLOSS[d.ar]?.app)||'UNKNOWN',
      _baseKey:baseKey,
      _baseCoords:AIRBASE_COORDS[baseKey]||null,
      _na:d.na||0,
      _day:d.dy||null,
      _timeMin:(function(v){if(!v)return null;try{const n=Math.round(parseFloat(v));const h=Math.floor(n/100),m=n%100;if(h>24||m>59)return null;return h*60+m;}catch(e){return null;}})(d.to),
      MILSERVICE:d.ms,MFUNC_DESC:d.md,TGTCOUNTRY:d.tc
    };
  });
  BASE_STATS={};
  S.allData.forEach(d=>{
    if(!d._baseKey)return;
    if(!BASE_STATS[d._baseKey])BASE_STATS[d._baseKey]={total:0,armed:0};
    BASE_STATS[d._baseKey].total++;
    if(d._bomb)BASE_STATS[d._baseKey].armed++;
  });
}

// ─── RADIUS SCALE ─────────────────────────────────────────────────────
let _aggWtMax=null;
function getAggWtMax(){
  if(_aggWtMax!==null)return _aggWtMax;
  const g={};
  S.allData.filter(d=>d._bomb&&d._lat&&d._lon).forEach(d=>{
    const k=`${d._lat.toFixed(2)},${d._lon.toFixed(2)}`;
    g[k]=(g[k]||0)+d._wt;
  });
  _aggWtMax=Math.max(1,...Object.values(g));
  return _aggWtMax;
}
function wtToRadius(wt){return 2+Math.sqrt(wt/getAggWtMax())*13;}

// ─── FILTER SETUP ─────────────────────────────────────────────────────
function fieldCounts(arr,field){
  const c={};arr.forEach(d=>{const v=d[field]||'UNKNOWN';c[v]=(c[v]||0)+1;});
  return Object.entries(c).sort((a,b)=>b[1]-a[1]);
}
function buildCheckList(listId,entries,filterSet,onToggle){
  const el=document.getElementById(listId);if(!el)return;el.innerHTML='';
  entries.forEach(([val,cnt])=>{
    const div=document.createElement('div');div.className='ci';
    div.innerHTML=`<label class="ci-left"><input type="checkbox" checked data-v="${val}"/><span>${val}</span></label><span class="ci-cnt">${fmtN(cnt)}</span>`;
    div.querySelector('input').addEventListener('change',e=>{
      e.target.checked?filterSet.add(val):filterSet.delete(val);onToggle();
    });
    el.appendChild(div);
  });
}
function toggleFsAll(listId,filterSet){
  const list=document.getElementById(listId);if(!list)return;
  const checks=[...list.querySelectorAll('input[type=checkbox]')];
  const allChecked=checks.every(c=>c.checked);
  checks.forEach(c=>{const v=c.dataset.v;c.checked=!allChecked;if(v){allChecked?filterSet.delete(v):filterSet.add(v);}});
  schedUpdate();
}
function toggleFsAllDays(){
  const list=document.getElementById('list-date');if(!list)return;
  const checks=[...list.querySelectorAll('input[type=checkbox]')];
  const allChecked=checks.every(c=>c.checked);
  checks.forEach((c,i)=>{c.checked=!allChecked;const d=LB2_DAYS[i];allChecked?S.filters.days.delete(d):S.filters.days.add(d);});
  schedUpdate();
}
function populateFilters(){
  const dayEl=document.getElementById('list-date');dayEl.innerHTML='';
  LB2_DAYS.forEach(d=>{
    const cnt=S.allData.filter(r=>r.dy===d).length;
    const div=document.createElement('div');div.className='ci';
    div.innerHTML=`<label class="ci-left"><input type="checkbox" checked/><span>Dec ${d}${d===25?' · Xmas':''}</span></label><span class="ci-cnt">${fmtN(cnt)}</span>`;
    div.querySelector('input').addEventListener('change',e=>{e.target.checked?S.filters.days.add(d):S.filters.days.delete(d);schedUpdate();});
    dayEl.appendChild(div);
  });
  [{id:'list-service',set:S.filters.services,field:'MILSERVICE'},
   {id:'list-mfunc',  set:S.filters.mfuncs,  field:'MFUNC_DESC'},
   {id:'list-country',set:S.filters.countries,field:'TGTCOUNTRY'},
  ].forEach(({id,set,field})=>{
    const entries=fieldCounts(S.allData,field);
    entries.forEach(([v])=>set.add(v));
    buildCheckList(id,entries,set,schedUpdate);
  });
  // Aircraft two-level filter
  const acSel = document.getElementById('sel-acprimary');
  if(acSel){
    const groups=[...new Set(S.allData.map(d=>AC_ROOT_TO_PRIMARY[d.ar]||'OTHER'))].sort();
    groups.forEach(g=>{const o=document.createElement('option');o.value=g;o.textContent=g;acSel.appendChild(o);});
  }
  S.filters.acPrimary='';
  rebuildAcList();
  // Weapon two-level filter
  S.filters.wpnClass='';
  rebuildWpnList();
}

// ─── FILTERING ────────────────────────────────────────────────────────
function applyFilters(){
  S.filtered=S.allData.filter(d=>{
    if(!S.filters.days.has(d.dy))return false;
    if(!S.filters.services.has(d.MILSERVICE||'UNKNOWN'))return false;
    if(!S.filters.mfuncs.has(d.MFUNC_DESC||'UNKNOWN'))return false;
    if(!S.filters.countries.has(d.TGTCOUNTRY||'UNKNOWN'))return false;
    if(S.filters.acapps.size && !S.filters.acapps.has(d.ar||'UNKNOWN'))return false;
    if(S.filters.wpns.size && !S.filters.wpns.has(d.wt||'UNKNOWN'))return false;
    return true;
  });
  // Note: lasso selection is NOT cleared on filter change — it persists
}
function schedUpdate(){
  const dot=document.getElementById('upd-dot');if(dot)dot.classList.add('on');
  clearTimeout(updateTimer);
  updateTimer=setTimeout(()=>{applyFilters();updateMap();updateStats();updateSbCount();if(dot)dot.classList.remove('on');},140);
}
function updateSbCount(){
  const el=document.getElementById('sb-count');if(el)el.textContent=fmtN(S.filtered.length);
  const bc=document.getElementById('mb-count'),bl=document.getElementById('mb-label');
  if(bc&&bl){
    if(S.lassoSelection){bc.textContent=fmtN(S.lassoSelection.length);bl.textContent='selected';}
    else{bc.textContent=fmtN(S.filtered.length);bl.textContent='strikes';}
  }
}
function resetFilters(){
  document.querySelectorAll('#sidebar-scroll input[type=checkbox]').forEach(c=>c.checked=true);
  S.allData.forEach(d=>{
    S.filters.services.add(d.MILSERVICE||'UNKNOWN');S.filters.mfuncs.add(d.MFUNC_DESC||'UNKNOWN');
    S.filters.countries.add(d.TGTCOUNTRY||'UNKNOWN');
    S.filters.acapps.add(d.ar||'UNKNOWN');
    S.filters.wpns.add(d.wt||'UNKNOWN');
  });
  LB2_DAYS.forEach(d=>S.filters.days.add(d));
  schedUpdate();
}

// ─── MAP INIT ─────────────────────────────────────────────────────────
function initMap(){
  map=L.map('map',{center:[15,107],zoom:6,preferCanvas:true});
  baseTile=L.tileLayer(BASEMAPS.dark.url,{attribution:BASEMAPS.dark.attr,subdomains:'abcd',maxZoom:19}).addTo(map);
  initLasso();
}
function setBasemap(key){
  if(!BASEMAPS[key])return;
  if(baseTile)map.removeLayer(baseTile);
  baseTile=L.tileLayer(BASEMAPS[key].url,{attribution:BASEMAPS[key].attr,subdomains:'abcd',maxZoom:19}).addTo(map).bringToBack();
}
function buildColorScale(){
  const f=S.colorBy;if(!f){S.colorScale=null;return;}
  const pal=PALETTES[f]||d3.schemeTableau10;
  const vals=[...new Set(S.allData.map(d=>d[f]||'UNKNOWN'))];
  S.colorScale=d3.scaleOrdinal().domain(vals).range(pal);
}
function setColorBy(f){S.colorBy=f;buildColorScale();updateMap();updateColorLegend();}
function toggleLayer(name){S.layers[name]=!S.layers[name];document.getElementById('lb-'+name)?.classList.toggle('on',S.layers[name]);updateMap();}

// ─── COORD AGGREGATION ────────────────────────────────────────────────
function aggregateArmed(dataArr){
  const g={};
  dataArr.filter(d=>d._bomb&&d._lat&&d._lon).forEach(d=>{
    const k=`${d._lat.toFixed(2)},${d._lon.toFixed(2)}`;
    if(!g[k])g[k]={lat:+d._lat.toFixed(2),lon:+d._lon.toFixed(2),wt:0,count:0,sample:d,services:new Set()};
    g[k].wt+=d._wt;g[k].count++;g[k].services.add(d.MILSERVICE||'?');
  });
  return Object.values(g);
}

// ─── BASE PIE CHART ────────────────────────────────────────────────────
const PIE_COLORS = {
  FIGHTER:'#4a9aff',BOMBER:'#c02828',ATTACK:'#e8631a',TRANSPORT:'#7a9248',
  STRATEGIC:'#9a48c0',TACTICAL:'#c0488a',HELICOPTER:'#48a0c0',EARLY_WARNING:'#c8a84c',
  RECON:'#48c08a',UTILITY:'#6a7650',OBSERV:'#a0c048',RESCUE:'#d47070',
  TRAIN:'#889048',REFUEL:'#608898',INTEL:'#987060',CARGO:'#607090',
  CARRIER:'#4860a0',CLOSE_SUPPORT:'#a06030',OTHER:'#3a4228'
};
function _basePieHTML(records){
  const counts={};
  records.forEach(d=>{const g=d.ar||'OTHER';counts[g]=(counts[g]||0)+1;});
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  if(!total) return '<div style="font-family:JetBrains Mono,monospace;font-size:10px;color:#5a7888;padding:6px 0">Aucune donnée armée</div>';
  let entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  if(entries.length>7){
    const rest=entries.slice(7).reduce((s,[,v])=>s+v,0);
    entries=entries.slice(0,7);
    if(rest>0) entries.push(['Other',rest]);
  }
  // Perceptually-distinct colors per aircraft root
  const _acPalette=['#4a9aff','#e8631a','#48c08a','#c8a84c','#c048a0','#7ad858','#e84848','#48b8d0',
    '#a070e0','#d8a030','#50d8b0','#e07070','#6090e0','#d06828','#80c840','#c880b0',
    '#4080c0','#f0a050','#38a870','#d04040','#5050d0','#a8c848','#e050c0','#40c0e0'];
  function acColor(root){
    if(!root||root==='Other') return '#5a6a7a';
    let h=0; for(let i=0;i<root.length;i++) h=(h*1013904223+root.charCodeAt(i)*1664525)>>>0;
    return _acPalette[h % _acPalette.length];
  }

  const uid = Math.random().toString(36).slice(2,8);
  const cx=48,cy=48,r=38;
  const W=255; // total svg width
  let ang=-Math.PI/2;
  const sliceData=[];
  entries.forEach(([g,cnt],i)=>{
    const s=(cnt/total)*2*Math.PI;
    if(s<0.001){ang+=s;return;}
    const a0=ang, a1=ang+s;
    ang=a1;
    const x1=(cx+r*Math.cos(a0)).toFixed(2);
    const y1=(cy+r*Math.sin(a0)).toFixed(2);
    const x2=(cx+r*Math.cos(a1)).toFixed(2);
    const y2=(cy+r*Math.sin(a1)).toFixed(2);
    sliceData.push({g,cnt,col:acColor(g),x1,y1,x2,y2,large:s>Math.PI?1:0,pct:Math.round(cnt/total*100)});
  });

  let slices='',leg='',ly=6;
  sliceData.forEach((sd,i)=>{
    const pid=`ps_${uid}_${i}`;
    const lid=`pl_${uid}_${i}`;
    const over=`document.getElementById('${pid}').style.opacity='1';document.getElementById('${lid}').style.fontWeight='bold';document.getElementById('${lid}').style.fill='#fff';`;
    const out =`document.getElementById('${pid}').style.opacity='0.82';document.getElementById('${lid}').style.fontWeight='normal';document.getElementById('${lid}').style.fill='#8ab0c8';`;
    slices+=`<path id="${pid}" d="M${cx},${cy}L${sd.x1},${sd.y1}A${r},${r} 0 ${sd.large},1 ${sd.x2},${sd.y2}Z" fill="${sd.col}" opacity="0.82" style="cursor:default;transition:opacity .12s" onmouseover="${over}" onmouseout="${out}"/>`;
    leg+=`<rect x="104" y="${ly}" width="7" height="7" fill="${sd.col}" rx="1"/>`;
    leg+=`<text id="${lid}" x="115" y="${ly+8}" font-family="JetBrains Mono,monospace" font-size="10" fill="#8ab0c8" style="transition:fill .12s">${sd.g}  ${sd.cnt} (${sd.pct}%)</text>`;
    ly+=16;
  });

  const h=Math.max(100,ly+8);
  return`<svg width="${W}" height="${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin-top:4px">${slices}${leg}</svg>`;
}

// ─── TWO-LEVEL AIRCRAFT FILTER ─────────────────────────────────────────────
function rebuildAcList(){
  const primary=S.filters.acPrimary;
  const avail=primary
    ? S.allData.filter(d=>(AC_ROOT_TO_PRIMARY[d.ar]||'OTHER')===primary)
    : S.allData;
  const entries=fieldCounts(avail,'ar');
  S.filters.acapps.clear();
  entries.forEach(([v])=>S.filters.acapps.add(v));
  buildCheckList('list-acapp',entries,S.filters.acapps,schedUpdate);
}
function setAcPrimary(val){S.filters.acPrimary=val;rebuildAcList();schedUpdate();}
function toggleFsAllAc(){toggleFsAll('list-acapp',S.filters.acapps);}

// ─── TWO-LEVEL WEAPON FILTER ────────────────────────────────────────────────
function rebuildWpnList(){
  const cls=S.filters.wpnClass;
  const avail=cls
    ? S.allData.filter(d=>(WEAPON_CLASS_MAP[d.wt]||'SUPPORT')===cls)
    : S.allData;
  const entries=fieldCounts(avail,'wt');
  S.filters.wpns.clear();
  entries.forEach(([v])=>S.filters.wpns.add(v));
  buildCheckList('list-wpn',entries,S.filters.wpns,schedUpdate);
}
function setWpnClass(val){S.filters.wpnClass=val;rebuildWpnList();schedUpdate();}
function toggleFsAllWpn(){toggleFsAll('list-wpn',S.filters.wpns);}

// ─── BASE MARKERS ─────────────────────────────────────────────────────
// Only show bases that have at least 1 mission in the given data
function renderBases(targetMap,layerRef,statsData){
  if(layerRef)targetMap.removeLayer(layerRef);
  const filtCounts={};
  statsData.forEach(d=>{
    if(!d._baseKey)return;
    if(!filtCounts[d._baseKey])filtCounts[d._baseKey]={total:0,armed:0};
    filtCounts[d._baseKey].total++;
    if(d._bomb)filtCounts[d._baseKey].armed++;
  });
  const seen=new Set();const markers=[];
  Object.entries(filtCounts).forEach(([key,cnt])=>{
    if(cnt.total===0)return; // Only show bases with missions
    const coords=AIRBASE_COORDS[key];if(!coords)return;
    const coordKey=`${coords[0].toFixed(3)},${coords[1].toFixed(3)}`;
    if(seen.has(coordKey))return;seen.add(coordKey);
    const displayName=BASE_CANONICAL[key]||key;
    // Diamond marker — dark olive with bright border, larger & more visible
    const sz=14;
    const icon=L.divIcon({
      html:`<div style="width:${sz}px;height:${sz}px;background:#1a3a6a;border:2px solid #4a9aff;transform:rotate(45deg);box-shadow:0 0 6px rgba(74,154,255,.7),0 0 2px rgba(0,0,0,.8)"></div>`,
      className:'',iconAnchor:[sz/2,sz/2],iconSize:[sz,sz]
    });
    const m=L.marker(coords,{icon,interactive:true,zIndexOffset:300});
    const baseMissions = statsData.filter(d => d._baseKey===key);
    const baseCountry = AIRBASE_COUNTRY[displayName] || AIRBASE_COUNTRY[key] || '—';
    m.bindPopup(`
      <div class="tt-head">◆ ${displayName}</div>
      <div class="tr"><span class="tr-l">Country / Zone</span><span class="tr-v">${baseCountry}</span></div>
      <div class="tr"><span class="tr-l">Total sorties</span><span class="tr-v">${cnt.total.toLocaleString('en-US')}</span></div>
      ${_basePieHTML(baseMissions)}
    `,{maxWidth:245,className:''});
    markers.push(m);
  });
  return L.layerGroup(markers).addTo(targetMap);
}

// ─── BLUE FLUX COLOUR ─────────────────────────────────────────────────
// Interpolate from pale blue → deep navy
function fluxColor(f){
  // f in [0,1]: low freq = pale blue, high = bright saturated blue
  return d3.interpolateRgb('#2a4a7a','#00c8ff')(f);
}

// ─── MAP UPDATE ───────────────────────────────────────────────────────
function updateMap(){
  if(!map)return;

  if(pointsLyr){map.removeLayer(pointsLyr);pointsLyr=null;}
  if(fluxLyr){map.removeLayer(fluxLyr);fluxLyr=null;}
  if(basesLyr){map.removeLayer(basesLyr);basesLyr=null;}
  if(lassoHighlightLyr){map.removeLayer(lassoHighlightLyr);lassoHighlightLyr=null;}

  const aggPoints=aggregateArmed(S.filtered);
  const aggMax=Math.max(1,...aggPoints.map(p=>p.wt));

  // HEATMAP
  if(S.layers.heat){
    const pts=aggPoints.map(p=>[p.lat,p.lon,Math.min(p.wt/aggMax*3.5+0.08,1)]);
    heatLyr=L.heatLayer(pts,{
      radius:22,blur:30,minOpacity:0.28,
      gradient:{0.0:'#0a0e14',0.2:'#162030',0.5:'#c07830',0.8:'#ff4400',1.0:'#ffffff'}
    }).addTo(map);
  }

  // ROUTES — added BEFORE points so they render below
  if(S.layers.flux){
    const armedBase=S.filtered.filter(d=>d._bomb&&(d.ww||0)>0&&d._lat&&d._lon&&d._baseCoords);
    const routes={};
    armedBase.forEach(d=>{
      const k=`${d._baseCoords[0].toFixed(2)},${d._baseCoords[1].toFixed(2)}|${d._lat.toFixed(4)},${d._lon.toFixed(4)}`;
      if(!routes[k])routes[k]={base:d._baseCoords,target:[d._lat,d._lon],totalNa:0,count:0,sample:d};
      routes[k].totalNa+=d._na||1;
      routes[k].count++;
    });
    const naVals=Object.values(routes).map(r=>r.totalNa/r.count);
    const naMin=Math.min(...naVals),naMax=Math.max(1,...naVals);
    const wScale=na=>0.8+((na-naMin)/Math.max(1,naMax-naMin))*5.2;
    const lines=Object.values(routes).map(({base,target,totalNa,count,sample})=>{
      const avgNa=totalNa/count;
      const line=L.polyline([base,target],{
        color:'#4a9aff',weight:wScale(avgNa),opacity:0.55,smoothFactor:2,interactive:true
      });
      const ac=sample.AIRCRAFT_ROOT||sample.ao||'—';
      line.on('mouseover',e=>showTT(`
        <div class="tt-head">✈ ${sample._baseKey||'?'} → target</div>
        <div class="tr"><span class="tr-l">Aircraft</span><span class="tr-v">${ac}</span></div>
        <div class="tr"><span class="tr-l">Avg aircraft</span><span class="tr-v">${Math.round(avgNa)}</span></div>
        <div class="tr"><span class="tr-l">Sorties</span><span class="tr-v">${count}</span></div>
      `,e.originalEvent));
      line.on('mousemove',e=>moveTT(e.originalEvent));
      line.on('mouseout',hideTT);
      return line;
    });
    fluxLyr=L.layerGroup(lines).addTo(map);
    // Bases: only ww>0
    const wwFiltered=S.filtered.filter(d=>(d.ww||0)>0);
    basesLyr=renderBases(map,null,wwFiltered);
    _showFluxLegend(Math.round(naMin),Math.round(naMax));
    _showBaseLegend();
  } else {
    _hideEl('flux-legend');_hideEl('base-legend');
  }

  // POINTS — aggregate by coord (~100m), 1 circle per target
  //   radius ∝ sqrt(Σ nw×ww)   |   high NUMOFACFT → rendered first → sits behind
  if(S.layers.points){
    // Group missions by rounded coordinate
    const cg = {};
    S.filtered.forEach(d => {
      if(!d._lat || !d._lon) return;
      const k = `${(+d._lat).toFixed(3)},${(+d._lon).toFixed(3)}`;
      if(!cg[k]) cg[k] = {lat:+d._lat, lon:+d._lon, totalWt:0, totalNa:0, count:0, sample:d, services:new Set()};
      cg[k].totalWt += d._wt;       // Σ NUMWEAPONSDELIVERED × WEAPONTYPEWEIGHT
      cg[k].totalNa += d._na || 1;  // Σ NUMOFACFT
      cg[k].count++;
      cg[k].services.add(d.MILSERVICE||'?');
    });
    const groups = Object.values(cg);
    const wtMax  = Math.max(1, ...groups.map(g => g.totalWt));
    const ptR    = wt => 3 + Math.sqrt(wt / wtMax) * 13;

    // Large totalWt rendered FIRST → behind. Small totalWt last → in front.
    groups.sort((a, b) => b.totalWt - a.totalWt);

    const markers = [];
    groups.forEach(g => {
      const defaultColor = '#c0282880';  // blood red, semi-transparent
      const color = S.colorScale ? (S.colorScale(g.sample[S.colorBy]||'UNKNOWN') || defaultColor) : defaultColor;
      const rad   = ptR(g.totalWt);
      const sel   = S.lassoSelection && S.lassoSelection.some(p => p.lat===g.lat && p.lon===g.lon);

      // Visible dot (non-interactive — hit zone handles events)
      const dot = L.circleMarker([g.lat, g.lon], {
        radius: rad,
        color:  sel ? '#ffffff' : color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: sel ? 1.5 : 0.3,
        interactive: false
      });

      // Transparent hit zone — larger for easy mouse snap
      const hitR = Math.max(rad + 8, 12);
      const hit  = L.circleMarker([g.lat, g.lon], {
        radius: hitR, color:'transparent', fillColor:'transparent',
        fillOpacity: 0, weight: 0, interactive: true
      });
      const svcs    = [...g.services].join(', ');
      const timeStr = g.sample._timeMin != null
        ? (() => { const h=Math.floor(g.sample._timeMin/60),m=g.sample._timeMin%60; return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} UTC`; })()
        : '—';
      hit.on('mouseover', e => showTT(`
        <div class="tt-head">${g.sample.AIRCRAFT_ROOT||g.sample.ao||'—'}</div>
        <div class="tr"><span class="tr-l">Time on tgt</span><span class="tr-v">${timeStr}</span></div>
        <div class="tr"><span class="tr-l">Missions</span><span class="tr-v">${g.count}</span></div>
        <div class="tr"><span class="tr-l">Total aircraft</span><span class="tr-v">${g.totalNa}</span></div>
        <div class="t-sep"></div>
        <div class="tr"><span class="tr-l">Payload Σ(nw×ww)</span><span class="tr-v">${fmtN(g.totalWt)} lbs</span></div>
        <div class="tr"><span class="tr-l">Services</span><span class="tr-v">${svcs}</span></div>
        <div class="tr"><span class="tr-l">Country</span><span class="tr-v">${g.sample.TGTCOUNTRY||'—'}</span></div>
      `, e.originalEvent));
      hit.on('mousemove', e => moveTT(e.originalEvent));
      hit.on('mouseout', hideTT);
      markers.push(dot, hit);
    });
    pointsLyr = L.layerGroup(markers).addTo(map);
  }

  // Lasso highlight: white outline ring around selected points
  if(S.lassoSelection&&S.lassoSelection.length){
    const hl=S.lassoSelection.map(p=>L.circleMarker([p.lat,p.lon],{
      radius:wtToRadius(p.wt)+3,color:'#ffffff',fillColor:'transparent',
      fillOpacity:0,weight:2,interactive:false,dashArray:'4 3'
    }));
    lassoHighlightLyr=L.layerGroup(hl).addTo(map);
  }

  _updateSizeLegend();updateColorLegend();
}

// ─── LEGENDS ──────────────────────────────────────────────────────────
const LEG_CSS = `position:absolute;pointer-events:none;background:rgba(17,20,16,.93);border:1px solid var(--border-2);border-radius:3px;padding:12px 16px;backdrop-filter:blur(4px);z-index:410;`;
const LEG_TT  = `font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.14em;color:var(--text-dim);text-transform:uppercase;margin-bottom:10px;display:block;`;
function _getEl(id,css){let el=document.getElementById(id);if(!el){el=document.createElement('div');el.id=id;el.style.cssText=css;document.getElementById('map-wrap').appendChild(el);}return el;}
function _hideEl(id){const e=document.getElementById(id);if(e)e.style.display='none';}

function _bottomStack(){
  // Returns bottom pixel for next legend stacking from bottom-left
  let b=14;
  const fl=document.getElementById('flux-legend');
  if(fl&&fl.style.display!=='none')b+=fl.offsetHeight+8;
  const bl=document.getElementById('base-legend');
  if(bl&&bl.style.display!=='none')b+=bl.offsetHeight+8;
  return b;
}

function _updateSizeLegend(){
  const el=_getEl('size-legend',LEG_CSS+'bottom:14px;left:10px;');
  if(!S.layers.points||!S.filtered.length){el.style.display='none';return;}
  el.style.display='block';
  const wtMax=Math.max(1,...S.filtered.map(d=>d._wt));
  const ptRadius=wt=>2+Math.sqrt(wt/wtMax)*12;
  const steps=[
    {wt:wtMax*0.05, l:fmtN(wtMax*0.05)+' lbs'},
    {wt:wtMax*0.25, l:fmtN(wtMax*0.25)+' lbs'},
    {wt:wtMax,      l:fmtN(wtMax)+' lbs (max)'}
  ];
  el.innerHTML=`<span style="${LEG_TT}">Payload (nw × ww)</span>`
    +steps.map(s=>{const r=Math.round(ptRadius(s.wt));const b=r*2+4;
      return`<div style="display:flex;align-items:center;gap:9px;margin-bottom:6px">
        <svg width="${b}" height="${b}" style="flex-shrink:0"><circle cx="${b/2}" cy="${b/2}" r="${r}" fill="#c02828" fill-opacity=".55" stroke="#c02828" stroke-width=".5"/></svg>
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-dim)">${s.l}</span>
      </div>`;}).join('');
  // push up if flux/base legends are showing
  setTimeout(()=>{
    let b=14;
    const fl=document.getElementById('flux-legend');if(fl&&fl.style.display!=='none')b+=fl.offsetHeight+8;
    const bl=document.getElementById('base-legend');if(bl&&bl.style.display!=='none')b+=bl.offsetHeight+8;
    el.style.bottom=b+'px';
  },80);
}

function _showFluxLegend(naMin,naMax){
  const el=_getEl('flux-legend',LEG_CSS+'bottom:14px;left:10px;min-width:175px;');
  el.style.display='block';
  const mid=Math.round((naMin+naMax)/2);
  el.innerHTML=`<span style="${LEG_TT}">Strike routes · aircraft count</span>
    <div style="display:flex;flex-direction:column;gap:7px">
      <div style="display:flex;align-items:center;gap:10px">
        <svg width="44" height="8"><line x1="0" y1="4" x2="44" y2="4" stroke="#4a9aff" stroke-width="1" stroke-linecap="round"/></svg>
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-dim)">${naMin} aircraft</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <svg width="44" height="12"><line x1="0" y1="6" x2="44" y2="6" stroke="#4a9aff" stroke-width="3" stroke-linecap="round"/></svg>
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-dim)">~${mid} aircraft</span>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <svg width="44" height="18"><line x1="0" y1="9" x2="44" y2="9" stroke="#4a9aff" stroke-width="6" stroke-linecap="round"/></svg>
        <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-dim)">${naMax} aircraft</span>
      </div>
    </div>`;
  // push size legend up
  setTimeout(()=>{
    const fh=el.offsetHeight||80;
    const bl=document.getElementById('base-legend');
    const bh=bl&&bl.style.display!=='none'?bl.offsetHeight+8:0;
    const sl=document.getElementById('size-legend');
    if(sl&&sl.style.display!=='none')sl.style.bottom=(14+fh+bh+8)+'px';
  },60);
}

function _showBaseLegend(){
  const el=_getEl('base-legend',LEG_CSS+'bottom:14px;left:10px;');
  el.style.display='block';
  el.innerHTML=`<span style="${LEG_TT}">Airbase (ww > 0)</span>
    <div style="display:flex;align-items:center;gap:10px">
      <div style="width:14px;height:14px;background:#1a3a6a;border:2px solid #4a9aff;transform:rotate(45deg);flex-shrink:0;box-shadow:0 0 5px rgba(74,154,255,.6)"></div>
      <span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-dim)">Takeoff base (click for details)</span>
    </div>`;
  setTimeout(()=>{
    const fl=document.getElementById('flux-legend');const fh=fl&&fl.style.display!=='none'?fl.offsetHeight+8:0;
    el.style.bottom=(14+fh)+'px';
    // also push size legend
    const sl=document.getElementById('size-legend');
    if(sl&&sl.style.display!=='none'){
      const bh=el.offsetHeight+8;sl.style.bottom=(14+fh+bh)+'px';
    }
  },80);
}

function updateColorLegend(){
  const el=_getEl('color-legend',LEG_CSS+'bottom:14px;right:10px;max-width:200px;');
  if(!S.colorBy||!S.colorScale){el.style.display='none';return;}
  el.style.display='block';
  const label=({'MILSERVICE':'Military Service','MFUNC_DESC':'Mission Type','_tgtCat':'Target Category','_wpnClass':'Weapon Class','_acApp':'Aircraft Category'})[S.colorBy]||S.colorBy;
  let html=`<span style="${LEG_TT}">${label}</span>`;
  S.colorScale.domain().slice(0,10).forEach(v=>{
    html+=`<div style="display:flex;align-items:center;gap:9px;margin-bottom:5px;font-size:12px;color:var(--text)"><div style="width:10px;height:10px;border-radius:50%;background:${S.colorScale(v)};flex-shrink:0"></div>${v}</div>`;
  });
  el.innerHTML=html;
}

// ─── STATS PANEL ──────────────────────────────────────────────────────
function toggleStats(){
  S.statsOpen=!S.statsOpen;
  document.getElementById('stats-panel').classList.toggle('closed',!S.statsOpen);
  setTimeout(()=>map&&map.invalidateSize(),280);
}
function toggleSec(id){document.getElementById(id)?.classList.toggle('open');}
function updateStats(){
  // Use lasso selection records if active, otherwise full filtered set
  const d = S.lassoRecords || S.filtered;
  const scope = S.lassoRecords
    ? `Lasso: ${fmtN(S.lassoRecords.length)} records`
    : d.length < S.allData.length ? `${fmtN(d.length)} filtered` : 'All data';
  setText('sp-s',fmtN(d.filter(r=>r._bomb).length));
  setText('sp-t',fmtN(d.reduce((s,r)=>s+r._wt,0)/1000,1));
  setText('sp-sv',new Set(d.map(r=>r.MILSERVICE)).size);
  setText('sp-ac',new Set(d.map(r=>r.ar)).size);
  setText('sp-scope',scope);
  // same order as config panel
  drawBar('ch-day',     countF(d,'dy',LB2_DAYS.map(String)),'#4e7ea8',v=>'D'+v);
  drawBar('ch-svc',     countF(d,'MILSERVICE'),'#c8a84c');
  drawBar('ch-mfunc',   countF(d,'MFUNC_DESC'),'#7a9248',null,18);
  drawBar('ch-country', countF(d,'TGTCOUNTRY'),'#4a9070',null,20);
  drawBar('ch-tgtcat',  countF(d,'_tgtCat'),'#5a8a4a');
  drawBar('ch-acapp',   countF(d,'ar'),'#6a8ab8',null,16);
  drawBar('ch-wpn',     countF(d,'_wpnClass'),'#e8631a',null,18);
}
function countF(data,field,order,limit=8){
  const c={};data.forEach(d=>{const v=String(d[field]||'UNKNOWN');c[v]=(c[v]||0)+1;});
  if(order)return order.map(k=>[k,c[k]||0]).filter(([,v])=>v>0);
  return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,limit);
}
function drawBar(svgId,data,color,labelFn,maxLabel=14){
  const svg=document.getElementById(svgId);if(!svg||!data.length)return;
  d3.select(svg).selectAll('*').remove();
  const wrap=svg.parentElement;
  const W=Math.max((wrap?.clientWidth||0)-32, 200);
  const H=+svg.getAttribute('height')||130;
  const ml=Math.min(maxLabel*7+4, 140), mr=46, mt=6, mb=6;
  const iw=Math.max(W-ml-mr,60), ih=H-mt-mb;
  const rowH=Math.min(ih/data.length,24), maxV=Math.max(...data.map(d=>d[1]),1);
  const g=d3.select(svg).attr('width',W).append('g').attr('transform',`translate(${ml},${mt})`);
  data.forEach(([lbl,val],i)=>{
    const y=i*rowH, bw=(val/maxV)*iw;
    g.append('rect').attr('x',0).attr('y',y+2).attr('width',Math.max(bw,2)).attr('height',rowH-3).attr('fill',color).attr('fill-opacity',.52).attr('rx',2);
    const txt=labelFn?labelFn(lbl):lbl.length>maxLabel?lbl.slice(0,maxLabel-1)+'…':lbl;
    g.append('text').attr('x',-6).attr('y',y+rowH/2).attr('dy','0.35em').attr('text-anchor','end').attr('fill','#7a9ab0').attr('font-size',11).attr('font-family','JetBrains Mono').text(txt);
    g.append('text').attr('x',bw+5).attr('y',y+rowH/2).attr('dy','0.35em').attr('fill','#7a9ab0').attr('font-size',10).attr('font-family','JetBrains Mono').text(fmtN(val));
  });
}

// ─── LASSO — PERSISTENT SELECTION ────────────────────────────────────
// Selection stays until user clicks Clear or resetFilters
function initLasso(){
  const mapEl=document.getElementById('map');
  lassoSvg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  lassoSvg.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:600;';
  lassoPath=document.createElementNS('http://www.w3.org/2000/svg','polygon');
  lassoPath.setAttribute('fill','rgba(122,146,72,0.1)');
  lassoPath.setAttribute('stroke','#7a9248');
  lassoPath.setAttribute('stroke-width','1.8');
  lassoPath.setAttribute('stroke-dasharray','5,3');
  lassoSvg.appendChild(lassoPath);
  mapEl.appendChild(lassoSvg);
}

function toggleLasso(){
  if(S.lassoDrawing){
    // Cancel drawing
    S.lassoDrawing=false;
    map.dragging.enable();
    document.getElementById('map').style.cursor='';
    map.off('mousedown',_lD);map.off('mousemove',_lM);map.off('mouseup',_lU);
    lassoPath.setAttribute('points','');
    document.getElementById('lasso-btn')?.classList.remove('on');
  } else {
    // Start drawing
    S.lassoDrawing=true;
    document.getElementById('lasso-btn')?.classList.add('on');
    map.dragging.disable();  // keep scroll zoom enabled so user can zoom while drawing
    document.getElementById('map').style.cursor='crosshair';
    lassoPoints=[];lassoLatLngs=[];lassoPath.setAttribute('points','');
    map.on('mousedown',_lD);
  }
}

function _lD(e){
  e.originalEvent.preventDefault();
  lassoPoints=[e.containerPoint];
  lassoLatLngs=[e.latlng || map.containerPointToLatLng(e.containerPoint)];
  map.on('mousemove',_lM);map.on('mouseup',_lU);
}
function _lM(e){
  lassoPoints.push(e.containerPoint);
  lassoLatLngs.push(e.latlng || map.containerPointToLatLng(e.containerPoint));
  lassoPath.setAttribute('points',lassoPoints.map(p=>p.x+','+p.y).join(' '));
}
function _lU(){
  map.off('mousemove',_lM);map.off('mouseup',_lU);
  S.lassoDrawing=false;
  map.dragging.enable();
  document.getElementById('map').style.cursor='';
  document.getElementById('lasso-btn')?.classList.remove('on');

  if(lassoLatLngs.length<3){lassoPath.setAttribute('points','');return;}
  _applyLasso(lassoLatLngs);
}

function _ptInPoly(lat,lng,poly){
  let inside=false;const n=poly.length;
  for(let i=0,j=n-1;i<n;j=i++){
    const xi=+poly[i].lat,yi=+poly[i].lng,xj=+poly[j].lat,yj=+poly[j].lng;
    if(((yi>lng)!==(yj>lng))&&(lat<(xj-xi)*(lng-yi)/(yj-yi)+xi))inside=!inside;
  }
  return inside;
}

function _applyLasso(polygon){
  const aggPoints=aggregateArmed(S.filtered);
  const selected=aggPoints.filter(p=>_ptInPoly(p.lat,p.lon,polygon));
  S.lassoSelection=selected.length?selected:null;
  // Build a Set of "lat,lon" keys for fast lookup
  if(S.lassoSelection){
    const keys=new Set(S.lassoSelection.map(p=>`${p.lat},${p.lon}`));
    S.lassoRecords=S.filtered.filter(d=>d._bomb&&d._lat&&d._lon&&keys.has(`${+d._lat.toFixed(2)},${+d._lon.toFixed(2)}`));
  } else {
    S.lassoRecords=null;
  }

  // Keep the polygon shape on the map (persists)
  if(lassoPolygon)map.removeLayer(lassoPolygon);
  if(S.lassoSelection){
    lassoPolygon=L.polygon(polygon,{
      color:'#7a9248',weight:1.8,opacity:.85,
      fillColor:'#7a9248',fillOpacity:.07,interactive:false
    }).addTo(map);
  }
  lassoPath.setAttribute('points','');

  // Show/hide the active bar
  const bar=document.getElementById('lasso-active-bar');
  const barTxt=document.getElementById('lasso-bar-text');
  if(bar){
    if(S.lassoSelection){
      bar.classList.add('vis');
      if(barTxt)barTxt.textContent=`✦ Lasso: ${fmtN(S.lassoSelection.length)} strike cluster${S.lassoSelection.length!==1?'s':''} selected`;
    } else {
      bar.classList.remove('vis');
    }
  }

  updateMap();updateSbCount();updateStats();
}

function clearLasso(){
  if(lassoPolygon){map.removeLayer(lassoPolygon);lassoPolygon=null;}
  if(lassoPath)lassoPath.setAttribute('points','');
  lassoPoints=[];S.lassoSelection=null;S.lassoRecords=null;
  if(S.lassoDrawing){
    S.lassoDrawing=false;map.dragging.enable();
    document.getElementById('map').style.cursor='';
    map.off('mousedown',_lD);map.off('mousemove',_lM);map.off('mouseup',_lU);
  }
  document.getElementById('lasso-btn')?.classList.remove('on');
  document.getElementById('lasso-active-bar')?.classList.remove('vis');
  updateMap();updateSbCount();updateStats();
}

// ─── ANIMATION ────────────────────────────────────────────────────────
// RAF-based smooth loop: missions appear at their exact MSNDATE+TIMEONTARGET
// Infinite loop — auto-restarts after Dec 29

const TOTAL_MIN   = 12 * 24 * 60;   // Dec18 00:00 → Dec29 23:59
const FLASH_DUR_MS = 900;
let ANIM_TL     = [];      // [{absMin, d}] sorted ascending
let _animRaf    = null;
let _animActive = false;
let _animDuration = 30000; // 30s = 1× speed
let _animStartTs  = null;
let _animElapsedMs = 0;
const _ptMap = new Map();  // key → {m, flashEnd, r, faded}
let _animWtMax = 1;
let _tonnageBins = [];     // 288 hourly buckets for tonnage chart

let _animIsLight = false;  // independent from dataviz basemap
let _animMemoryMode = false; // when true: only show flash, no persistent red dots
function _animFlashColor(){
  return _animIsLight ? '#111111' : '#ffffff';
}
function _ptRadius(wt){ return 2.5 + Math.sqrt(wt / _animWtMax) * 10; }

function buildAnimTL(){
  _animWtMax = Math.max(1, ...S.allData.map(d => d._wt));
  ANIM_TL = S.allData
    .filter(d => d._day && d._timeMin != null && d._lat && d._lon)
    .map(d => ({ absMin: (d._day - 18)*24*60 + d._timeMin, d }))
    .sort((a, b) => a.absMin - b.absMin);
}

function _buildTonnageChart(){
  _tonnageBins = Array.from({length:288}, (_, i) => ({h:i, wt:0}));
  S.allData.forEach(d => {
    if(!d._day || d._timeMin == null) return;
    const hi = (d._day - 18)*24 + Math.floor(d._timeMin / 60);
    if(hi >= 0 && hi < 288) _tonnageBins[hi].wt += d._wt;
  });
  const wMax = Math.max(1, ..._tonnageBins.map(b => b.wt));
  const wrap = document.getElementById('anim-tonnage-chart');
  if(!wrap) return;
  const W = wrap.clientWidth || 470, H = 160;
  const pl=48, pr=6, pt=10, pb=26;
  const iw = W-pl-pr, ih = H-pt-pb;
  const bw = iw / 288;
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block">`;
  // Y-axis graduations
  [0.25,0.5,0.75,1.0].forEach(frac => {
    const y = (pt + ih*(1-frac)).toFixed(1);
    svg += `<line x1="${pl}" y1="${y}" x2="${pl+iw}" y2="${y}" stroke="#2a2e22" stroke-width="1" stroke-dasharray="3,3"/>`;
    svg += `<text x="${(pl-4)}" y="${y}" dy="0.35em" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="10" fill="#5a6888">${fmtN(wMax*frac)}</text>`;
  });
  // Bars
  _tonnageBins.forEach((b, i) => {
    if(!b.wt) return;
    const bh = Math.max(1, (b.wt/wMax)*ih);
    svg += `<rect x="${(pl+i*bw).toFixed(1)}" y="${(pt+ih-bh).toFixed(1)}" width="${Math.max(0.6,bw-0.2).toFixed(1)}" height="${bh.toFixed(1)}" fill="#c02828" fill-opacity="0.75"/>`;
  });
  // X-axis day markers
  for(let d=0; d<12; d++){
    const x = (pl + d*24*bw).toFixed(1);
    svg += `<line x1="${x}" y1="${pt}" x2="${x}" y2="${pt+ih}" stroke="#2a2e22" stroke-width="1"/>`;
    svg += `<text x="${(+x+2).toFixed(1)}" y="${H-5}" font-family="JetBrains Mono,monospace" font-size="10" fill="#5a7888">D${18+d}</text>`;
  }
  // Axis lines
  svg += `<line x1="${pl}" y1="${pt}" x2="${pl}" y2="${pt+ih}" stroke="#3a4228" stroke-width="1"/>`;
  svg += `<line x1="${pl}" y1="${pt+ih}" x2="${pl+iw}" y2="${pt+ih}" stroke="#3a4228" stroke-width="1"/>`;
  // Playhead needle
  svg += `<line id="chart-needle" x1="${pl}" y1="${pt}" x2="${pl}" y2="${pt+ih}" stroke="#b8982c" stroke-width="1.5"/>`;
  svg += '</svg>';
  wrap.innerHTML = svg;
  _buildCumulChart();
}

function _buildCumulChart(){
  if(!_tonnageBins.length) return;
  const cumul = []; let sum = 0;
  _tonnageBins.forEach(b => { sum += b.wt; cumul.push(sum); });
  const cMax = Math.max(1, sum);
  const wrap = document.getElementById('anim-cumul-chart');
  if(!wrap) return;
  const W = wrap.clientWidth || 470, H = 160;
  const pl=48, pr=6, pt=10, pb=26;
  const iw = W-pl-pr, ih = H-pt-pb;
  const bw = iw / 288;
  let svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" style="display:block">`;
  // Y-axis graduations
  [0.25,0.5,0.75,1.0].forEach(frac => {
    const y = (pt + ih*(1-frac)).toFixed(1);
    svg += `<line x1="${pl}" y1="${y}" x2="${pl+iw}" y2="${y}" stroke="#2a2e22" stroke-width="1" stroke-dasharray="3,3"/>`;
    svg += `<text x="${(pl-4)}" y="${y}" dy="0.35em" text-anchor="end" font-family="JetBrains Mono,monospace" font-size="10" fill="#5a6888">${fmtN(cMax*frac)}</text>`;
  });
  // Area fill
  let areaPts = `${pl},${pt+ih}`;
  cumul.forEach((v,i) => { areaPts += ` ${(pl+i*bw).toFixed(1)},${(pt+ih*(1-v/cMax)).toFixed(1)}`; });
  areaPts += ` ${(pl+288*bw).toFixed(1)},${pt+ih}`;
  svg += `<polygon points="${areaPts}" fill="#7a9248" fill-opacity="0.22"/>`;
  // Line
  let path = '';
  cumul.forEach((v,i) => { path += (i===0?'M':'L')+`${(pl+i*bw).toFixed(1)},${(pt+ih*(1-v/cMax)).toFixed(1)} `; });
  svg += `<path d="${path}" fill="none" stroke="#c8ccaa" stroke-width="1.5" stroke-linejoin="round"/>`;
  // X-axis day markers
  for(let d=0; d<12; d++){
    const x = (pl + d*24*bw).toFixed(1);
    svg += `<line x1="${x}" y1="${pt}" x2="${x}" y2="${pt+ih}" stroke="#2a2e22" stroke-width="1"/>`;
    svg += `<text x="${(+x+2).toFixed(1)}" y="${H-5}" font-family="JetBrains Mono,monospace" font-size="10" fill="#5a7888">D${18+d}</text>`;
  }
  // Axis lines
  svg += `<line x1="${pl}" y1="${pt}" x2="${pl}" y2="${pt+ih}" stroke="#3a4228" stroke-width="1"/>`;
  svg += `<line x1="${pl}" y1="${pt+ih}" x2="${pl+iw}" y2="${pt+ih}" stroke="#3a4228" stroke-width="1"/>`;
  // Playhead needle
  svg += `<line id="chart-needle-cumul" x1="${pl}" y1="${pt}" x2="${pl}" y2="${pt+ih}" stroke="#b8982c" stroke-width="1.5"/>`;
  svg += '</svg>';
  wrap.innerHTML = svg;
}

function _updateChartNeedle(elapsed){
  const frac = elapsed / _animDuration;
  const pl=48, pr=6;
  const W1 = document.getElementById('anim-tonnage-chart')?.clientWidth || 470;
  const W2 = document.getElementById('anim-cumul-chart')?.clientWidth || 470;
  const n1 = document.getElementById('chart-needle');
  if(n1){ const x=(pl+frac*(W1-pl-pr)).toFixed(1); n1.setAttribute('x1',x); n1.setAttribute('x2',x); }
  const n2 = document.getElementById('chart-needle-cumul');
  if(n2){ const x=(pl+frac*(W2-pl-pr)).toFixed(1); n2.setAttribute('x1',x); n2.setAttribute('x2',x); }
  const bin = Math.min(Math.floor(frac*288), 287);
  // hourly payload
  const val = document.getElementById('anim-chart-val');
  if(val) val.textContent = (_tonnageBins[bin]?.wt||0) > 0 ? fmtN(_tonnageBins[bin].wt)+' lbs' : '—';
  // cumulative total
  let cumul = 0;
  for(let i=0;i<=bin;i++) cumul += (_tonnageBins[i]?.wt||0);
  const cval = document.getElementById('anim-cumul-val');
  if(cval) cval.textContent = cumul > 1000 ? fmtN(cumul/2000,1)+' t' : '—';
}

function _initTlScrub(){
  const bar = document.getElementById('anim-tl-bar');
  if(!bar) return;
  bar.style.cursor = 'pointer';
  function scrubTo(e){
    if(_animActive) return;
    const rect = bar.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    _animElapsedMs = frac * _animDuration; _animStartTs = null;
    const pct = (frac*100).toFixed(2)+'%';
    const fill=document.getElementById('anim-tl-fill'); if(fill) fill.style.width=pct;
    const needle=document.getElementById('anim-needle'); if(needle) needle.style.left=pct;
    _updateChartNeedle(_animElapsedMs);
    const curMin=frac*TOTAL_MIN;
    const curDay=18+Math.floor(curMin/(24*60));
    const hInDay=Math.floor((curMin%(24*60))/60);
    const mInHour=Math.floor(curMin%60);
    setText('anim-date',`DEC ${String(Math.min(curDay,29)).padStart(2,'0')}  ${String(hInDay).padStart(2,'0')}:${String(mInHour).padStart(2,'0')}`);
    LB2_DAYS.forEach(d=>{const p=document.getElementById(`pip-${d}`);if(p)p.className='pip'+(d<curDay?' done':d===curDay?' cur':'');});
  }
  let dragging=false;
  bar.addEventListener('mousedown',e=>{dragging=true;scrubTo(e);e.preventDefault();});
  window.addEventListener('mousemove',e=>{if(dragging)scrubTo(e);});
  window.addEventListener('mouseup',()=>{dragging=false;});
}

function animLoop(ts){
  if(!_animActive) return;
  _animRaf = requestAnimationFrame(animLoop);
  if(_animStartTs === null) _animStartTs = ts - _animElapsedMs;
  const raw     = ts - _animStartTs;
  const elapsed = raw % _animDuration;
  _animElapsedMs = elapsed;

  const curMin  = (elapsed / _animDuration) * TOTAL_MIN;
  const curDay  = 18 + Math.floor(curMin / (24*60));
  const hInDay  = Math.floor((curMin % (24*60)) / 60);
  const mInHour = Math.floor(curMin % 60);

  // HUD date
  setText('anim-date', `DEC ${String(Math.min(curDay,29)).padStart(2,'0')}  ${String(hInDay).padStart(2,'0')}:${String(mInHour).padStart(2,'0')}`);

  // Day pips
  LB2_DAYS.forEach(d => {
    const p = document.getElementById(`pip-${d}`);
    if(p) p.className = 'pip' + (d < curDay ? ' done' : d === curDay ? ' cur' : '');
  });

  // Progress bar + needle
  const pct = (elapsed / _animDuration * 100).toFixed(2) + '%';
  const fill = document.getElementById('anim-tl-fill'); if(fill) fill.style.width = pct;
  const needle = document.getElementById('anim-needle'); if(needle) needle.style.left = pct;
  _updateChartNeedle(elapsed);

  // Day stats
  const dayData = S.allData.filter(d => d._day === Math.min(curDay, 29));
  setText('ds-m', fmtN(dayData.length));
  document.getElementById('anim-day-stats')?.classList.add('vis');

  const now = performance.now();
  const flashCol = _animFlashColor();

  // Loop restart: wipe points that are now in the future
  if(elapsed < 300 && _ptMap.size > 0){
    _ptMap.forEach(({m}) => { if(m && animMap) animMap.removeLayer(m); });
    _ptMap.clear();
  }

  // Place missions that have occurred
  ANIM_TL.forEach(({absMin, d}) => {
    if(absMin > curMin) return;
    const key = `${absMin}_${(+d._lat).toFixed(4)}_${(+d._lon).toFixed(4)}`;
    if(!_ptMap.has(key)){
      const r = _ptRadius(d._wt);
      const sz = Math.round(r * 4.4);
      const icon = L.divIcon({
        className: 'anim-impact',
        html: `<div class="impact-wrap" style="--sz:${sz}px;--fc:${flashCol};--dur:0.9s;--delay:0s"><div class="impact-ring"></div><div class="impact-dot"></div></div>`,
        iconSize: [sz, sz], iconAnchor: [sz/2, sz/2]
      });
      const m = L.marker([d._lat, d._lon], {icon, interactive:false}).addTo(animMap);
      _ptMap.set(key, {m, flashEnd: now + FLASH_DUR_MS, r, faded:false, lat:d._lat, lon:d._lon});
    }
    const pt = _ptMap.get(key);
    if(!pt.faded && now > pt.flashEnd){
      animMap.removeLayer(pt.m);
      if(!_animMemoryMode){
        pt.m = L.circleMarker([pt.lat, pt.lon], {
          radius:pt.r, color:'#c02828', fillColor:'#c02828', fillOpacity:0.65, weight:0.4, interactive:false
        }).addTo(animMap);
      } else {
        pt.m = null; // discard — no memory dot
      }
      pt.faded = true;
    }
  });
}

function initAnimMap(){
  animMap = L.map('anim-map',{center:[17,106],zoom:6,zoomControl:false,attributionControl:false,preferCanvas:true});
  _animIsLight = false;
  L.tileLayer(BASEMAPS.dark.url,{subdomains:'abcd',maxZoom:19}).addTo(animMap);

  // Day pips
  const pipsEl = document.getElementById('anim-pips');
  if(pipsEl){ pipsEl.innerHTML = '';
    LB2_DAYS.forEach(d => {
      const pip = document.createElement('div');
      pip.className='pip'; pip.id=`pip-${d}`; pip.title=`Dec ${d}`;
      pip.onclick = () => {
        if(!_animActive) return;
        const frac = (d - 18) / 12;
        _animElapsedMs = frac * _animDuration;
        _animStartTs = performance.now() - _animElapsedMs;
        _ptMap.forEach(({m}) => { if(m && animMap) animMap.removeLayer(m); });
        _ptMap.clear();
      };
      pipsEl.appendChild(pip);
    });
  }

  buildAnimTL();
  // Build hour ticks on the timeline bar
  (function _buildTicks(){
    const wrap = document.getElementById('anim-tl-ticks');
    if(!wrap) return;
    wrap.innerHTML = '';
    for(let day=0; day<12; day++){
      for(let h=0; h<24; h+=6){
        const frac = (day*24+h)/(12*24);
        const pct  = (frac*100).toFixed(2)+'%';
        if(h===0){
          const t=document.createElement('div'); t.className='tl-tick-day'; t.style.left=pct; wrap.appendChild(t);
          const l=document.createElement('div'); l.className='tl-tick-lbl'; l.style.left=pct; l.textContent=`D${18+day}`; wrap.appendChild(l);
        } else {
          const t=document.createElement('div'); t.className='tl-tick-hour'; t.style.left=pct; wrap.appendChild(t);
        }
      }
    }
  })();
  setTimeout(() => { _buildTonnageChart(); }, 250);
  _initTlScrub();
  animMapInited = true;
}

function animTogglePlay(){
  _animActive = !_animActive;
  const btn = document.getElementById('btn-play');
  btn.textContent = _animActive ? '⏸ Pause' : '▶ Play';
  btn.classList.toggle('on', _animActive);
  if(_animActive){ _animStartTs = null; requestAnimationFrame(animLoop); }
  else if(_animRaf){ cancelAnimationFrame(_animRaf); }
}
function animReset(){
  _animActive = false;
  if(_animRaf) cancelAnimationFrame(_animRaf);
  _ptMap.forEach(({m}) => { if(m && animMap) animMap.removeLayer(m); });
  _ptMap.clear(); _animElapsedMs = 0; _animStartTs = null;
  const btn = document.getElementById('btn-play'); btn.textContent='▶ Play'; btn.classList.remove('on');
  setText('anim-date','DEC 18  00:00');
  LB2_DAYS.forEach(d => { const p=document.getElementById(`pip-${d}`); if(p) p.className='pip'; });
  const fill=document.getElementById('anim-tl-fill'); if(fill) fill.style.width='0%';
  const needle=document.getElementById('anim-needle'); if(needle) needle.style.left='0%';
  _updateChartNeedle(0);
  document.getElementById('anim-day-stats')?.classList.remove('vis');
}
function animSetSpeed(ms, id){
  _animDuration = ms;
  // restart loop from beginning
  _animElapsedMs = 0; _animStartTs = null;
  _ptMap.forEach(({m}) => { if(m && animMap) animMap.removeLayer(m); });
  _ptMap.clear();
  ['spd-025','spd-05','spd-1','spd-2'].forEach(i => document.getElementById(i)?.classList.remove('on'));
  document.getElementById(id)?.classList.add('on');
}

// ─── GLOSSARIES ───────────────────────────────────────────────────────
function populateAcCatFilter(){
  const sel=document.getElementById('ac-cat');
  [...new Set(AC_TAB_DATA.map(r=>r.app))].filter(Boolean).sort().forEach(a=>{const o=document.createElement('option');o.value=a;o.textContent=a;sel.appendChild(o);});
}
function renderAc(){
  const s=(document.getElementById('ac-search').value||'').toLowerCase();
  const c=document.getElementById('ac-cat').value;
  const rows=AC_TAB_DATA.filter(r=>{if(c&&r.app!==c)return false;if(s&&!r.name.toLowerCase().includes(s)&&!r.root.toLowerCase().includes(s)&&!(r.sn||'').toLowerCase().includes(s))return false;return true;}).sort((a,b)=>+b.cnt-+a.cnt);
  setText('ac-count',`${rows.length} aircraft`);
  const grid=document.getElementById('ac-grid');grid.innerHTML='';
  rows.forEach(r=>{const c=document.createElement('div');c.className='gc';c.innerHTML=`<div class="gc-top"><div><div class="gc-root">${r.root}${r.sn?' — '+r.sn:''}</div><div class="gc-name">${r.name}</div><div class="gc-type">${r.type}</div></div><span class="gc-tag">${r.app||'—'}</span></div><div class="gc-foot"><span class="gc-uses">${(+r.cnt).toLocaleString('en-US')} sorties</span>${r.url?`<a href="${r.url}" target="_blank" class="gc-link">↗ Info</a>`:''}</div>`;grid.appendChild(c);});
}
function renderWpn(){
  const s=(document.getElementById('wpn-search').value||'').toLowerCase();
  const c=document.getElementById('wpn-cat').value;
  const rows=WPN_TAB_DATA.filter(r=>{if(c&&r.wc!==c)return false;if(s&&!r.wt.toLowerCase().includes(s)&&!r.cn.toLowerCase().includes(s))return false;return true;}).sort((a,b)=>+b.cnt-+a.cnt);
  setText('wpn-count',`${rows.length} weapon types`);
  const grid=document.getElementById('wpn-grid');grid.innerHTML='';
  rows.forEach(r=>{const c=document.createElement('div');c.className='gc';c.innerHTML=`<div class="gc-top"><div><div class="gc-root">${r.cn||r.wt}</div><div class="gc-name" style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--text-dim);margin-top:3px">${r.wt}</div>${r.desc?`<div class="gc-type">${r.desc.slice(0,90)}${r.desc.length>90?'…':''}</div>`:''}</div><span class="wc wc-${r.wc}">${r.wc}</span></div><div class="gc-foot"><span class="gc-uses">${(+r.cnt).toLocaleString('en-US')} uses</span></div>`;grid.appendChild(c);});
}

function toggleAnimMemory(on){
  _animMemoryMode = on;
  // Wipe existing faded dots when switching on
  if(on){
    _ptMap.forEach((pt, k) => {
      if(pt.faded && pt.m && animMap){ animMap.removeLayer(pt.m); pt.m=null; }
    });
  }
}

function toggleAnimPanel(){
  const panel = document.getElementById('anim-side-panel');
  const btn = document.getElementById('anim-panel-toggle');
  panel.classList.toggle('closed');
  const closed = panel.classList.contains('closed');
  btn.textContent = closed ? '▶ Charts' : '◀ Charts';
  if(!closed) setTimeout(()=>{ _buildTonnageChart(); }, 50);
  setTimeout(()=>animMap&&animMap.invalidateSize(), 280);
}

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('page-'+id)?.classList.add('active');
  const tabs=document.querySelectorAll('.nav-tab');
  const idx={intro:0,map:1,anim:2,aircraft:3,weapons:4,infog:5};
  if(idx[id]!==undefined)tabs[idx[id]]?.classList.add('active');
  if(id==='map')setTimeout(()=>map&&map.invalidateSize(),80);
  if(id==='anim'){if(!animMapInited)initAnimMap();else{buildAnimTL();setTimeout(_buildTonnageChart,100);}setTimeout(()=>animMap&&animMap.invalidateSize(),80);}
  if(id==='aircraft')renderAc();if(id==='weapons')renderWpn();
}

function openLightbox(src, caption){
  const lb = document.getElementById('lightbox');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');
  if(!lb||!img) return;
  img.src = src;
  if(cap) cap.textContent = caption || '';
  lb.classList.add('open');
  document.addEventListener('keydown', _lbKey);
}
function closeLightbox(){
  document.getElementById('lightbox')?.classList.remove('open');
  document.removeEventListener('keydown', _lbKey);
}
function _lbKey(e){ if(e.key==='Escape') closeLightbox(); }

function toggleFs(id){document.getElementById(id)?.classList.toggle('open');}
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(()=>{if(map)map.invalidateSize();if(animMap)animMap.invalidateSize();updateStats();},260);});

// ─── INIT ─────────────────────────────────────────────────────────────
(async function init(){
  try{
    await loadData();setLoader(88,'Building interface…');
    populateFilters();populateAcCatFilter();
    applyFilters();updateSbCount();
    const totalWt=S.allData.reduce((s,d)=>s+d._wt,0);
    setText('kpi-missions',fmtN(S.allData.length));
    setText('kpi-strikes', fmtN(S.allData.length)); // all are armed (ww>0 filter)
    setText('kpi-tonnes',  fmtN(totalWt/1000));
    setText('kpi-bases',   Object.keys(BASE_STATS).length);
    setText('is-missions', fmtN(S.allData.length));
    setText('is-strikes',  fmtN(S.allData.length));
    setText('is-tonnes',   fmtN(totalWt/1000));
    setText('is-bases',    Object.keys(BASE_STATS).length);
    initMap();updateMap();updateStats();
    setLoader(100,'Ready');setTimeout(hideLoader,350);
  }catch(err){
    console.error(err);
    document.getElementById('loader-msg').textContent='Error: '+err.message;
    document.getElementById('loader-bar').style.background='#b04848';
  }
})();

// ─── LIGHTBOX ─────────────────────────────────────────────────────────
function openLightbox(img){
  const lb=document.getElementById('lightbox');
  document.getElementById('lightbox-img').src=img.src;
  document.getElementById('lightbox-img').alt=img.alt;
  const cap=img.closest('.intro-photo-block')?.querySelector('.intro-photo-caption')?.textContent||'';
  document.getElementById('lightbox-cap').textContent=cap;
  lb.classList.add('open');
}
function closeLightbox(){
  document.getElementById('lightbox')?.classList.remove('open');
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox();});
