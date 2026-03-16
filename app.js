/**
 * THOR — Vietnam Air War v6
 */
const DATA_URL = 'data/data.json';

// ── AIRBASES ────────────────────────────────────────────────────
const AIRBASES = {'DA NANG':[16.0439,108.1992],'DANANG':[16.0439,108.1992],'BIEN HOA':[10.973,106.819],'BIEN HOA AB':[10.973,106.819],'TAN SON NHUT':[10.8184,106.652],'SAIGON':[10.8231,106.6297],'PHU CAT':[13.955,109.042],'PHU BAI':[16.401,107.702],'CAM RANH':[11.9982,109.2194],'CAN THO':[10.085,105.712],'KORAT':[14.934,102.079],'UBON':[15.251,104.873],'UDORN':[17.3864,102.788],'TAKHLI':[15.2774,100.2964],'NKP':[17.3864,102.744],'NAKHON PHANOM':[17.3864,102.744],'U-TAPAO':[12.6799,101.0051],'UTAPAO':[12.6799,101.0051],'BANGKOK':[13.6811,100.747],'CHING CHUAN KANG':[24.1427,120.6206],'CCK':[24.1427,120.6206],'KADENA':[26.3556,127.7678],'ANDERSEN':[13.5836,144.9304],'ANDERSEN AFB':[13.5836,144.9304],'CLARK':[15.1858,120.56],'CLARK AB':[15.1858,120.56],'CUBI POINT':[14.7944,120.2678],'DIXIE STATION':[12,110],'YANKEE STATION':[17.5,108],'CORAL SEA':[16,110],'CONSTELLATION':[17,109],'MIDWAY':[17.5,108.5],'ENTERPRISE':[16.5,109.5],'KITTY HAWK':[17,108],'QUI NHON':[13.7752,109.2236],'NHA TRANG':[12.2388,109.1967],'PLEIKU':[13.9739,108.0088],'CHU LAI':[15.4043,108.7053],'DONG HA':[16.8456,107.098],'BINH THUY':[10.0953,105.7225],'OSAN':[37.0903,127.0296],'YOKOTA':[35.7485,139.3484],'GUAM':[13.5836,144.9304]};

// ── TARGET CATEGORIES ───────────────────────────────────────────
const TGT_CATEGORIES = {'INFRASTRUCTURE':['ROAD','BRIDGE','RAILROAD','RAIL','HIGHWAY','FERRY','FORD','TUNNEL','PIPELINE','PETROLEUM','POL','STORAGE','SUPPLY','DEPOT','WAREHOUSE'],'MILITAIRE':['MILITARY','ARMY','BARRACKS','TROOPS','PERSONNEL','AAA','SAM','RADAR','AIRFIELD','AIRBASE','AIRSTRIP','NAVY','VESSEL','BOAT','SHIP','JUNK','SAMPAN'],'INDUSTRIE':['FACTORY','PLANT','POWER','ELECTRIC','STEEL','IRON','CEMENT','INDUSTRY','MANUFACTURING'],'VÉGÉTATION':['FOREST','JUNGLE','VEGETATION','DEFOLIAT','AREA','ZONE','GRID','COORDINATE'],'POPULATION':['VILLAGE','TOWN','CITY','HAMLET','BUILDING','STRUCTURE','INHABITED'],'AUTRE':[]};
function getTgtCat(tt){if(!tt) return 'AUTRE';const up=tt.toUpperCase();for(const[cat,kws]of Object.entries(TGT_CATEGORIES)){if(cat==='AUTRE') continue;if(kws.some(k=>up.includes(k))) return cat;}return 'AUTRE';}

// ── STATE ───────────────────────────────────────────────────────
let allData=[],filteredData=[];
let activeLayers={heat:false,points:true,flux:false};
let baseTileLayer=null,heatLayer=null,pointsLayer=null,fluxLayer=null;
let leafletLeft=null,leafletRight=null,animLayerLeft=null,animLayerRight=null;
let animLeftMode='points',animPlaying=false,animTimer=null;
let animYear=1965,animMonth=1,animWeek=1,animSpeed=1500,animGranularity='year';
let statsPanelOpen=true,updateTimer=null;
let lassoPoints=[],lassoPolygon=null;
let lassoActive=false,lassoBounds=null,lassoSvgEl=null;
const YEARS=d3.range(1965,1976);
let fieldCounts={};
let colorByField='',colorScale=null;

const ACCENT='#9e3408',ACCENT2='#c8780a',ACCENT3='#3d5e38';
const PALETTE=[ACCENT,ACCENT2,'#4a6741','#4a7aaa','#7a4a9e','#c85a7a','#4aaa8a','#aa6a3a','#6a8aaa','#aa8a4a'];
const PALETTES={MILSERVICE:d3.schemeTableau10,MFUNC_DESC:d3.schemePaired,'_wpnClass':d3.schemeDark2,'_acApp':d3.schemeSet2,TGTCOUNTRY:d3.schemeAccent,'_tgtCat':d3.schemeSet3};
const BASEMAPS={positron:{url:'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',attr:'© CARTO'},dark:{url:'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',attr:'© CARTO'},ortho:{url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',attr:'© Esri'}};

// ── TOOLTIP ─────────────────────────────────────────────────────
const tooltip=document.getElementById('tooltip');
function showTooltip(html,e){tooltip.innerHTML=html;tooltip.style.display='block';moveTooltip(e);}
function moveTooltip(e){tooltip.style.left=(e.clientX+14)+'px';tooltip.style.top=(e.clientY-10)+'px';}
function hideTooltip(){tooltip.style.display='none';}

// ── LOADER ──────────────────────────────────────────────────────
function setLoader(p,m){document.getElementById('loader-bar').style.width=p+'%';document.getElementById('loader-msg').textContent=m;}
function hideLoader(){const l=document.getElementById('loader');l.style.transition='opacity 0.5s';l.style.opacity='0';setTimeout(()=>l.style.display='none',600);}

// ── FORMAT ──────────────────────────────────────────────────────
function fmtNum(n,dec=0){if(n>=1e6) return(n/1e6).toFixed(dec===0?1:dec)+'M';if(n>=1e3) return(n/1e3).toFixed(dec===0?0:dec)+'K';return(+n).toFixed(dec);}
function fmtDate(dt){if(!dt||dt.length<8) return dt||'—';return`${dt.substring(0,4)}-${dt.substring(4,6)}-${dt.substring(6,8)}`;}

// ── LOAD ────────────────────────────────────────────────────────
async function loadAllData(){
  setLoader(10,'Loading data.json...');
  const resp=await fetch(DATA_URL);
  if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
  setLoader(42,'Parsing JSON...');
  const raw=await resp.json();
  setLoader(72,'Processing...');
  const MFUNC_6 = new Set(['STRIKE','CLOSE AIR SUPPORT','AIR INTERDICTION',
    'DIRECT AIR SUPPORT','LANDING ZONE PREP','FLAK SUPPRESSION']);
  allData=raw.filter(d=>MFUNC_6.has(d.mf||'')).map(d=>({
    ...d,_lat:d.la,_lon:d.lo,_year:d.yr,_month:d.mo,
    _weapons:d.nw||0,_weight:d.wr||0,_isBombing:(d.nw||0)>0,
    _tgtCat:getTgtCat(d.tt),
    _wpnClass:(WEAPON_CLASS_MAP&&WEAPON_CLASS_MAP[d.wt])||'INCONNU',
    _acApp:(AIRCRAFT_GLOSS&&AIRCRAFT_GLOSS[d.ar]&&AIRCRAFT_GLOSS[d.ar].app)||'INCONNU',
    _takeoffCoords:AIRBASES[(d.tl||'').toUpperCase().trim()]||null,
    MILSERVICE:d.ms,MFUNC_DESC:d.mf,AIRCRAFT_ROOT:d.ar,AIRCRAFT_ORIGINAL:d.ao,
    TGTTYPE:d.tt,TGTCOUNTRY:d.tc,WEAPONTYPE:d.wt,WEAPONTYPEWEIGHT:d.ww,TAKEOFFLOCATION:d.tl
  }));
  setLoader(90,'Building index...');buildFieldCounts();
}

function buildFieldCounts(){
  fieldCounts={};
  ['MILSERVICE','MFUNC_DESC','AIRCRAFT_ROOT','TGTCOUNTRY','TGTTYPE','WEAPONTYPE','_tgtCat','_wpnClass','_acApp'].forEach(f=>{
    fieldCounts[f]={};allData.forEach(d=>{const v=d[f]||'INCONNU';fieldCounts[f][v]=(fieldCounts[f][v]||0)+1;});
  });
}

// ── PAGE NAVIGATION ─────────────────────────────────────────────
let currentPage='info';
function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  const page=document.getElementById('page-'+id);
  if(page) page.classList.add('active');
  const tabs=document.querySelectorAll('.nav-tab');
  const tabMap={'info':0,'dataviz':1,'anim':2,'gloss-ac':3,'gloss-wpn':4};
  if(tabMap[id]!==undefined) tabs[tabMap[id]].classList.add('active');
  currentPage=id;
  if(id==='dataviz'){setTimeout(()=>{if(map) map.invalidateSize();},100);}
  if(id==='anim'){setTimeout(()=>{if(leafletLeft) leafletLeft.invalidateSize();if(leafletRight) leafletRight.invalidateSize();},100);}
  if(id==='gloss-ac') renderAcTable();
  if(id==='gloss-wpn') renderWpnTable();
}

// ── FILTER PANEL COLLAPSIBLE ─────────────────────────────────────
function toggleFs(id){const el=document.getElementById(id);el.classList.toggle('open');}

// ── SECTION TOGGLE (switch) ──────────────────────────────────────
function sectionToggleSwitch(name,checked){
  document.querySelectorAll(`input[name="${name}"]`).forEach(i=>i.checked=checked);
  scheduleUpdate();
}

// ── DEBOUNCED UPDATE ─────────────────────────────────────────────
function scheduleUpdate(){
  const dot=document.getElementById('upd-dot');if(dot) dot.classList.add('on');
  clearTimeout(updateTimer);
  updateTimer=setTimeout(()=>{applyFilters();if(dot) dot.classList.remove('on');},500);
}


// Aircraft application categories — from THOR Aircraft Glossary
const AC_APP_CATEGORIES = [
  'ATTACK','ATTACK, OBSERV','BOMBER','CARGO, HELICOPTER','CARGO, PROP',
  'CARRIER, EARLY_WARNING','CARRIER, FIGHTER','CLOSE_SUPPORT, HELICOPTER',
  'CLOSE_SUPPORT, PROP','EARLY_WARNING','FIGHTER','FIGHTER, BOMBER',
  'FIGHTER, PROP','HELICOPTER','INTEL','OBSERV','OBSERV, HELICOPTER',
  'RECON','REFUEL','RESCUE','RESCUE, HELICOPTER','STRATEGIC, BOMBER',
  'TACTICAL, BOMBER','TRAIN','TRANSPORT','TRANSPORT, HELICOPTER',
  'TRANSPORT, PROP','UTILITY','UTILITY, HELICOPTER','UTILITY, PROP'
];

// ── POPULATE FILTERS ────────────────────────────────────────────
function populateFilters(){
  const sorted=f=>Object.entries(fieldCounts[f]||{}).sort((a,b)=>b[1]-a[1]).map(([k])=>k);
  // MFUNC: 10 specified types in ascending order, plus any other values in data
  // MFUNC: only the 6 allowed types, sorted ascending by count
  const MFUNC_ALLOWED = new Set(['STRIKE','CLOSE AIR SUPPORT','AIR INTERDICTION',
    'DIRECT AIR SUPPORT','LANDING ZONE PREP','FLAK SUPPRESSION']);
  const mfCounts = fieldCounts['MFUNC_DESC']||{};
  const mfValues = Object.keys(mfCounts)
    .filter(v => MFUNC_ALLOWED.has(v))
    .sort((a,b) => (mfCounts[a]||0) - (mfCounts[b]||0));
  buildCheckList('mfunc-list', mfValues, 'mfunc', 'MFUNC_DESC');
  buildCheckList('milservice-list',sorted('MILSERVICE'),           'milservice','MILSERVICE');
  buildCheckList('tgtcountry-list',sorted('TGTCOUNTRY'),           'tgtcountry','TGTCOUNTRY');
  // Aircraft by application
  // Aircraft: glossary categories in order, only those present in data
  const acOrdered = AC_APP_CATEGORIES.filter(cat => (fieldCounts['_acApp']||{})[cat]);
  // Add any extra values in data not in the glossary list (keeps set complete)
  const acExtra = Object.keys(fieldCounts['_acApp']||{}).filter(v => !AC_APP_CATEGORIES.includes(v));
  buildCheckList('acapp-list', [...acOrdered, ...acExtra], 'acapp', '_acApp');
  populateAcType('');
  // Target cat
  buildCheckList('tgtcat-list',   Object.keys(TGT_CATEGORIES),     'tgtcat',    '_tgtCat');
  populateTgtType('');
  // Weapon classes from glossary
  buildCheckList('wpncat-list',   ['BOMB','GUN','MISSILE','ROCKET','SUPPORT'],'wpncat','_wpnClass');
  populateWpnType('');

  // Replace number inputs with DD/MM/YYYY text inputs
  ['year-from','year-to'].forEach(id => {
    const el = document.getElementById(id);
    if(el && el.type === 'number') {
      const ni = document.createElement('input');
      ni.type = 'text'; ni.className = el.className;
      ni.id = id; ni.placeholder = 'DD/MM/YYYY'; ni.maxLength = 10;
      el.parentNode.replaceChild(ni, el);
    }
  });
  document.getElementById('year-from').value = '01/01/1965';
  document.getElementById('year-to').value   = '31/12/1975';
  ['year-from','year-to'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('input', function() {
      const digits = this.value.replace(/\D/g,'');
      let fmt = '';
      for(let i=0; i<digits.length && i<8; i++) { if(i===2||i===4) fmt+='/'; fmt+=digits[i]; }
      this.value = fmt;
      if(fmt.length === 10) scheduleUpdate();
    });
    el.addEventListener('change', scheduleUpdate);
  });

  updateFilterBadges();
}

function buildCheckList(cid,values,name,field){
  const c=document.getElementById(cid);if(!c) return;c.innerHTML='';
  values.forEach(v=>{
    const cnt=(fieldCounts[field]||{})[v]||0;
    const item=document.createElement('label');item.className='check-item';
    item.innerHTML=`<div class="check-item-left"><input type="checkbox" name="${name}" value="${v}" checked/><span>${v}</span></div><span class="check-count">${fmtNum(cnt)}</span>`;
    item.querySelector('input').addEventListener('change',scheduleUpdate);
    c.appendChild(item);
  });
}

function populateAcType(filterApp){
  const sel=document.getElementById('actype-select');sel.innerHTML='<option value="">— Tous —</option>';
  Object.entries(fieldCounts['AIRCRAFT_ROOT']||{}).sort((a,b)=>b[1]-a[1]).forEach(([v,cnt])=>{
    if(!v||v==='INCONNU') return;
    if(filterApp){const app=(AIRCRAFT_GLOSS[v]&&AIRCRAFT_GLOSS[v].app)||'INCONNU';if(app!==filterApp) return;}
    const o=document.createElement('option');o.value=v;o.textContent=`${v}  (${fmtNum(cnt)})`;sel.appendChild(o);
  });
}

function populateTgtType(filterCat){
  const sel=document.getElementById('tgttype-select');sel.innerHTML='<option value="">— Tous —</option>';
  Object.entries(fieldCounts['TGTTYPE']||{}).sort((a,b)=>b[1]-a[1]).forEach(([v,cnt])=>{
    if(!v||v==='INCONNU') return;
    if(filterCat&&getTgtCat(v)!==filterCat) return;
    const o=document.createElement('option');o.value=v;o.textContent=`${v}  (${fmtNum(cnt)})`;sel.appendChild(o);
  });
}

function populateWpnType(filterClass){
  const sel=document.getElementById('weapon-select');sel.innerHTML='<option value="">— Tous —</option>';
  Object.entries(fieldCounts['WEAPONTYPE']||{}).sort((a,b)=>b[1]-a[1]).forEach(([v,cnt])=>{
    if(!v||v==='INCONNU') return;
    if(filterClass&&(WEAPON_CLASS_MAP[v]||'INCONNU')!==filterClass) return;
    const o=document.createElement('option');o.value=v;o.textContent=`${v}  (${fmtNum(cnt)})`;sel.appendChild(o);
  });
}

document.addEventListener('change',function(e){
  if(e.target.name==='acapp'){
    const checked=[...document.querySelectorAll('input[name="acapp"]:checked')].map(i=>i.value);
    populateAcType(checked.length===1?checked[0]:'');
  }
  if(e.target.name==='tgtcat'){
    const checked=[...document.querySelectorAll('input[name="tgtcat"]:checked')].map(i=>i.value);
    populateTgtType(checked.length===1?checked[0]:'');
  }
  if(e.target.name==='wpncat'){
    const checked=[...document.querySelectorAll('input[name="wpncat"]:checked')].map(i=>i.value);
    populateWpnType(checked.length===1?checked[0]:'');
  }
});

// ── FILTER BADGES ───────────────────────────────────────────────
function updateFilterBadges(){
  const f=getFilters();
  const el=id=>document.getElementById(id);
  if(el('year-fc')) el('year-fc').textContent=`${f.yearFrom}–${f.yearTo}`;
  if(el('mfunc-fc')) el('mfunc-fc').textContent=f.mfunc.length+' sel.';
  if(el('milservice-fc')) el('milservice-fc').textContent=f.milservice.length+' sel.';
  if(el('tgtcountry-fc')) el('tgtcountry-fc').textContent=f.tgtcountry.length+' sel.';
  if(el('aircraft-fc')) el('aircraft-fc').textContent=f.acapp.length+' sel.';
  if(el('tgtcat-fc')) el('tgtcat-fc').textContent=f.tgtcat.length+' sel.';
  if(el('wpncat-fc')) el('wpncat-fc').textContent=f.wpncat.length+' sel.';
}

// ── GET FILTERS ─────────────────────────────────────────────────
function parseDateYear(str, def) {
  if(!str||str.length<10) return def;
  const p=str.split('/'); if(p.length!==3) return def;
  const y=+p[2]; return(y>=1960&&y<=1980)?y:def;
}
function getFilters(){
  const checked=n=>[...document.querySelectorAll(`input[name="${n}"]:checked`)].map(i=>i.value);
  const yf=parseDateYear(document.getElementById('year-from').value,1965);
  const yt=parseDateYear(document.getElementById('year-to').value,1975);
  return{yearFrom:Math.min(yf,yt),yearTo:Math.max(yf,yt),mfunc:checked('mfunc'),milservice:checked('milservice'),tgtcountry:checked('tgtcountry'),acapp:checked('acapp'),tgtcat:checked('tgtcat'),tgttype:document.getElementById('tgttype-select').value,wpncat:checked('wpncat'),weapon:document.getElementById('weapon-select').value,actype:document.getElementById('actype-select').value};
}

// ── APPLY FILTERS ───────────────────────────────────────────────
function applyFilters(){
  const f=getFilters();
  const sets={mf:new Set(f.mfunc),ms:new Set(f.milservice),tc:new Set(f.tgtcountry),aa:new Set(f.acapp),tcat:new Set(f.tgtcat),wcat:new Set(f.wpncat)};
  filteredData=allData.filter(d=>{
    if(d._year<f.yearFrom||d._year>f.yearTo) return false;
    if(sets.mf.size===0||!sets.mf.has(d.MFUNC_DESC||'INCONNU')) return false;
    if(sets.ms.size===0||!sets.ms.has(d.MILSERVICE||'INCONNU')) return false;
    if(sets.tc.size===0||!sets.tc.has(d.TGTCOUNTRY||'INCONNU')) return false;
    if(sets.aa.size>0&&!sets.aa.has(d._acApp)) return false;
    if(f.actype&&d.AIRCRAFT_ROOT!==f.actype) return false;
    if(sets.tcat.size>0&&!sets.tcat.has(d._tgtCat)) return false;
    if(f.tgttype&&d.TGTTYPE!==f.tgttype) return false;
    if(sets.wcat.size>0&&!sets.wcat.has(d._wpnClass)) return false;
    if(f.weapon&&d.WEAPONTYPE!==f.weapon) return false;
    // Polygon spatial filter
    if(lassoBounds&&lassoBounds.length>3){if(!pointInPolygon([d._lat,d._lon],lassoBounds)) return false;}
    return true;
  });
  colorByField=document.getElementById('color-by-select').value;
  buildColorScale();
  updateFilterBadges();
  document.getElementById('total-count').textContent=fmtNum(filteredData.length);
  updateMap();
  updateLegend();
  updateStatsPanelKPIs();
  if(statsPanelOpen) updateStatsPanelCharts();
}

function resetFilters(){
  document.getElementById('year-from').value='01/01/1965';document.getElementById('year-to').value='31/12/1975';
  document.querySelectorAll('#filter-panel input[type=checkbox]').forEach(i=>{i.checked=true;});
  document.querySelectorAll('#filter-panel .sw input').forEach(i=>i.checked=true);
  document.getElementById('tgttype-select').value='';document.getElementById('weapon-select').value='';
  document.getElementById('actype-select').value='';document.getElementById('color-by-select').value='';
  populateAcType('');populateTgtType('');populateWpnType('');
  if(lassoBounds) clearPolygonSelect();
  else applyFilters();
}

// ── COLOR ────────────────────────────────────────────────────────
function buildColorScale(){
  if(!colorByField){colorScale=null;return;}
  const vals=[...new Set(filteredData.map(d=>d[colorByField]||'INCONNU'))].sort();
  colorScale=d3.scaleOrdinal().domain(vals).range(PALETTES[colorByField]||d3.schemeTableau10);
}
function getPointColor(d){if(!colorByField||!colorScale) return ACCENT;return colorScale(d[colorByField]||'INCONNU');}

function updateLegend(){
  // ── Strike Runs gradient legend ──
  const fluxLeg=document.getElementById('flux-legend');
  if(fluxLeg) fluxLeg.style.display=activeLayers.flux?'block':'none';

  // ── Color-by legend — only when colorByField set AND points active ──
  const leg=document.getElementById('map-legend');
  const items=document.getElementById('legend-items');
  if(!leg) return;
  if(!colorByField||!colorScale||!activeLayers.points){
    leg.classList.add('hidden');
    return;
  }
  leg.classList.remove('hidden');
  // Title = selected option label
  const cbSel=document.getElementById('color-by-select');
  const cbLabel=cbSel&&cbSel.selectedIndex>=0?cbSel.options[cbSel.selectedIndex].text:'LEGEND';
  document.getElementById('legend-title').textContent=cbLabel.replace(/^—\s*/,'').replace(/\s*—$/,'').trim();
  items.innerHTML='';
  const counts=fieldCounts[colorByField]||{};
  const domain=colorScale.domain();
  // Descending: most present first, max 10
  const sorted=domain.slice().sort((a,b)=>(counts[b]||0)-(counts[a]||0)).slice(0,10);
  sorted.forEach(v=>{
    const row=document.createElement('div');row.className='legend-item';
    row.innerHTML=`<div class="legend-dot" style="background:${colorScale(v)}"></div><span class="legend-lbl">${v.substring(0,20)}</span>`;
    items.appendChild(row);
  });
  if(domain.length>10){
    const m=document.createElement('div');m.className='legend-lbl';
    m.style.cssText='padding-left:22px;font-size:10px;margin-top:2px;';
    m.textContent=`+${domain.length-10} more`;items.appendChild(m);
  }
}

// ── MAP ──────────────────────────────────────────────────────────
let map;
function initMap(){
  map=L.map('map',{center:[16.5,106],zoom:6,zoomControl:true,preferCanvas:true});
  baseTileLayer=L.tileLayer(BASEMAPS.positron.url,{attribution:BASEMAPS.positron.attr,subdomains:'abcd',maxZoom:19}).addTo(map);
}

function setBasemap(name){
  document.querySelectorAll('.bm-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`.bm-btn[onclick="setBasemap('${name}')"]`).classList.add('active');
  if(baseTileLayer) map.removeLayer(baseTileLayer);
  const bm=BASEMAPS[name];
  baseTileLayer=L.tileLayer(bm.url,{attribution:bm.attr,subdomains:'abcd',maxZoom:19}).addTo(map);
  baseTileLayer.bringToBack();
}

function toggleLayer(name){
  activeLayers[name]=!activeLayers[name];
  document.getElementById('mode-'+name).classList.toggle('active',activeLayers[name]);
  document.getElementById('lc-'+name).classList.toggle('on',activeLayers[name]);
  // Show/hide polygon selection tool only when POINTS layer active
  const selTool=document.getElementById('polygon-select-tool');
  if(selTool) selTool.style.display=activeLayers.points?'block':'none';
  // Cancel active selection if points layer turned off
  if(!activeLayers.points && lassoActive) cancelPolygonSelect();
  updateMap();
}

function updateMap(){
  if(heatLayer){map.removeLayer(heatLayer);heatLayer=null;}
  if(pointsLayer){map.removeLayer(pointsLayer);pointsLayer=null;}
  if(fluxLayer){map.removeLayer(fluxLayer);fluxLayer=null;}
  const f=getFilters();
  const active=Object.entries(activeLayers).filter(([,v])=>v).map(([k])=>k==='flux'?'STRIKE RUNS':k.toUpperCase()).join(' + ');
  document.getElementById('map-label').textContent=`${active||'—'} — ${f.yearFrom}–${f.yearTo} — ${fmtNum(filteredData.length)}`;  
  if(activeLayers.heat)   renderHeatmap();
  if(activeLayers.points) renderPoints();
  if(activeLayers.flux)   renderFlux();
}

const FIXED_RADIUS=3; // fixed point size — never changes

function renderHeatmap(){
  const s=sampleData(filteredData,80000);
  heatLayer=L.heatLayer(s.map(d=>[d._lat,d._lon,Math.min(d._weapons/10+0.3,1)]),{radius:5,blur:4,maxZoom:10,gradient:{0.2:'#2a4a8a',0.4:'#c8780a',0.7:'#9e3408',1.0:'#fff'}}).addTo(map);
  if(pointsLayer) pointsLayer.bringToFront();
  if(fluxLayer) fluxLayer.bringToFront();
}

function renderPoints(){
  const s=sampleData(filteredData,40000);
  const markers=[];
  s.forEach(d=>{
    const col=getPointColor(d);
    // Fixed radius — no zoom scaling
    const dot=L.circleMarker([d._lat,d._lon],{radius:FIXED_RADIUS,color:col,fillColor:col,fillOpacity:0.72,weight:0.5,opacity:0.9,interactive:false});
    const popHtml=buildPopup(d);
    const hit=L.circleMarker([d._lat,d._lon],{radius:FIXED_RADIUS+5,color:'transparent',fillColor:'transparent',fillOpacity:0,weight:0});
    hit.bindPopup(popHtml);hit.on('mouseover',e=>showTooltip(popHtml,e.originalEvent));hit.on('mouseout',hideTooltip);hit.on('click',function(){this.openPopup();hideTooltip();});
    markers.push(dot,hit);
  });
  pointsLayer=L.layerGroup(markers).addTo(map);
  if(fluxLayer) fluxLayer.bringToFront();
}

function renderFlux(){
  const withBase=filteredData.filter(d=>d._takeoffCoords);
  const s=sampleData(withBase,5000);if(!s.length) return;
  const rc={};
  s.forEach(d=>{const k=`${d._takeoffCoords[0].toFixed(1)},${d._takeoffCoords[1].toFixed(1)}|${d._lat.toFixed(1)},${d._lon.toFixed(1)}`;if(!rc[k]) rc[k]={d,n:0};rc[k].n++;});
  const maxN=Math.max(1,...Object.values(rc).map(r=>r.n));
  const lines=[];const bases=new Map();
  Object.values(rc).forEach(({d,n})=>{
    const freq=n/maxN;
    const line=L.polyline([d._takeoffCoords,[d._lat,d._lon]],{color:d3.interpolateYlOrRd(0.2+freq*0.8),weight:0.4+freq*3.5,opacity:0.12+freq*0.6,smoothFactor:2,interactive:false});
    lines.push(line);
    const bk=d._takeoffCoords.join(',');if(!bases.has(bk)) bases.set(bk,{coords:d._takeoffCoords,name:d.tl||''});
  });
  fluxLayer=L.layerGroup(lines).addTo(map);
  bases.forEach(({coords,name})=>{L.circleMarker(coords,{radius:5,color:'#fff',fillColor:ACCENT3,fillOpacity:0.9,weight:1.5}).bindTooltip(`✈ ${name}`).addTo(fluxLayer);});
}

function buildPopup(d){
  if(d._isBombing){return`<span style="color:#6b7280">DATE</span> <span style="color:#c8780a">${fmtDate(d.dt)}</span><br/><span style="color:#6b7280">MISSION</span> <span style="color:#c8780a">${d.MFUNC_DESC||'—'}</span><br/><span style="color:#6b7280">TARGET</span> <span style="color:#c8780a">${d.TGTTYPE||'—'}</span><br/><span style="color:#6b7280">WEAPON</span> <span style="color:#c8780a">${d.WEAPONTYPE||'—'}</span><br/><span style="color:#6b7280">AIRCRAFT</span> <span style="color:#c8780a">${d.AIRCRAFT_ORIGINAL||'—'}</span>`;}
  return`<span style="color:#6b7280">DATE</span> <span style="color:#c8780a">${fmtDate(d.dt)}</span><br/><span style="color:#6b7280">MISSION</span> <span style="color:#c8780a">${d.MFUNC_DESC||'—'}</span><br/><span style="color:#6b7280">TARGET</span> <span style="color:#c8780a">${d.TGTTYPE||'—'}</span><br/><span style="color:#6b7280">AIRCRAFT</span> <span style="color:#c8780a">${d.AIRCRAFT_ORIGINAL||'—'}</span>`;
}


// ── POLYGON SELECTION (QGIS-style) ─────────────────────────────
let _polyMoveBound=null, _polyUpBound=null;

function initPolygonSelect(){
  // Size canvas to map container
  function resizeCanvas(){
    const wrap=document.getElementById('map-wrap');
    const canvas=document.getElementById('polygon-canvas');
    if(!canvas||!wrap) return;
    canvas.width=wrap.clientWidth;
    canvas.height=wrap.clientHeight;
  }
  resizeCanvas();
  window.addEventListener('resize',resizeCanvas);
  // Also resize after map tiles load
  setTimeout(resizeCanvas,600);
}

function togglePolygonSelect(){
  lassoActive=!lassoActive;
  const btn=document.getElementById('poly-select-btn');
  const canvas=document.getElementById('polygon-canvas');
  const cb=document.getElementById('poly-clear-btn');
  if(lassoActive){
    // Reset any previous selection
    lassoBounds=null;
    lassoPoints=[];
    if(cb) cb.style.display='none';
    // Resize canvas to current map size
    const wrap=document.getElementById('map-wrap');
    canvas.width=wrap.clientWidth;
    canvas.height=wrap.clientHeight;
    // CRITICAL: enable pointer events on canvas so it captures mouse
    canvas.style.pointerEvents='all';
    canvas.style.cursor='crosshair';
    // Disable map interactions
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    if(btn) btn.classList.add('active');
    // Attach mouse events
    _polyMoveBound=onPolyMove.bind(null,canvas);
    _polyUpBound=onPolyUp.bind(null,canvas);
    canvas.addEventListener('mousedown',onPolyDown);
    canvas.addEventListener('contextmenu',e=>{e.preventDefault();cancelPolygonSelect();});
  } else {
    cancelPolygonSelect();
  }
}

function onPolyDown(e){
  if(!lassoActive) return;
  if(e.button===2){e.preventDefault();cancelPolygonSelect();return;}
  const canvas=document.getElementById('polygon-canvas');
  const ctx=canvas.getContext('2d');
  const r=canvas.getBoundingClientRect();
  lassoPoints=[[e.clientX-r.left,e.clientY-r.top]];
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Draw first vertex
  ctx.beginPath();ctx.arc(lassoPoints[0][0],lassoPoints[0][1],4,0,Math.PI*2);
  ctx.fillStyle='#c8780a';ctx.fill();
  canvas.addEventListener('mousemove',_polyMoveBound);
  canvas.addEventListener('mouseup',_polyUpBound);
}

function onPolyMove(canvas,e){
  if(!lassoActive||lassoPoints.length===0) return;
  const ctx=canvas.getContext('2d');
  const r=canvas.getBoundingClientRect();
  const px=e.clientX-r.left, py=e.clientY-r.top;
  lassoPoints.push([px,py]);
  // Redraw polygon
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.beginPath();
  ctx.moveTo(lassoPoints[0][0],lassoPoints[0][1]);
  for(let i=1;i<lassoPoints.length;i++) ctx.lineTo(lassoPoints[i][0],lassoPoints[i][1]);
  ctx.closePath();
  ctx.fillStyle='rgba(200,120,10,0.12)';ctx.fill();
  ctx.strokeStyle='#c8780a';ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.stroke();
  ctx.setLineDash([]);
  // Start vertex
  ctx.beginPath();ctx.arc(lassoPoints[0][0],lassoPoints[0][1],5,0,Math.PI*2);
  ctx.fillStyle='#c8780a';ctx.fill();
  // Dashed closing line
  ctx.beginPath();ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(200,120,10,0.5)';
  ctx.moveTo(px,py);ctx.lineTo(lassoPoints[0][0],lassoPoints[0][1]);ctx.stroke();
  ctx.setLineDash([]);
}

function onPolyUp(canvas,e){
  canvas.removeEventListener('mousemove',_polyMoveBound);
  canvas.removeEventListener('mouseup',_polyUpBound);
  if(lassoPoints.length<6){cancelPolygonSelect();return;}
  // Draw final closed polygon
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.beginPath();
  ctx.moveTo(lassoPoints[0][0],lassoPoints[0][1]);
  for(let i=1;i<lassoPoints.length;i++) ctx.lineTo(lassoPoints[i][0],lassoPoints[i][1]);
  ctx.closePath();
  ctx.fillStyle='rgba(200,120,10,0.15)';ctx.fill();
  ctx.strokeStyle='#c8780a';ctx.lineWidth=2;ctx.setLineDash([]);ctx.stroke();
  // Convert to geo coords
  lassoBounds=lassoPoints.map(([x,y])=>{
    const ll=map.containerPointToLatLng(L.point(x,y));
    return[ll.lat,ll.lng];
  });
  lassoActive=false;
  const btn=document.getElementById('poly-select-btn');
  if(btn){btn.classList.remove('active');btn.textContent='✓ SELECT';}
  // Keep canvas visible (shows the polygon) but disable pointer events
  canvas.style.pointerEvents='none';
  canvas.style.cursor='default';
  map.dragging.enable();map.scrollWheelZoom.enable();map.doubleClickZoom.enable();
  const cb=document.getElementById('poly-clear-btn');
  if(cb) cb.style.display='flex';
  applyFilters();
}

function cancelPolygonSelect(){
  const canvas=document.getElementById('polygon-canvas');
  if(_polyMoveBound) canvas.removeEventListener('mousemove',_polyMoveBound);
  if(_polyUpBound)   canvas.removeEventListener('mouseup',_polyUpBound);
  canvas.removeEventListener('mousedown',onPolyDown);
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  canvas.style.pointerEvents='none';
  canvas.style.cursor='default';
  lassoActive=false;lassoPoints=[];lassoBounds=null;
  map.dragging.enable();map.scrollWheelZoom.enable();map.doubleClickZoom.enable();
  const btn=document.getElementById('poly-select-btn');
  if(btn){btn.classList.remove('active');btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="1,5 5,1 12,4 10,11 3,12" stroke-linejoin="round"/></svg> SELECT`;}
  const cb=document.getElementById('poly-clear-btn');
  if(cb) cb.style.display='none';
  applyFilters();
}

function clearPolygonSelect(){cancelPolygonSelect();}

document.addEventListener('keydown',e=>{if(e.key==='Escape'&&lassoActive) cancelPolygonSelect();});

function pointInPolygon([lat,lng],poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const[yi,xi]=poly[i],[yj,xj]=poly[j];
    if((xi>lng)!==(xj>lng)&&lat<(yj-yi)*(lng-xi)/(xj-xi)+yi) inside=!inside;
  }
  return inside;
}

function sampleData(data,maxN){if(data.length<=maxN) return data;const step=Math.ceil(data.length/maxN);return data.filter((_,i)=>i%step===0);}

// ── KPIs ─────────────────────────────────────────────────────────
function updateKPIs(){
  document.getElementById('kpi-missions').textContent=fmtNum(allData.length);
  document.getElementById('kpi-bombs').textContent=fmtNum(d3.sum(allData,d=>d._weight)/1000)+'T';
  document.getElementById('kpi-weapons').textContent=fmtNum(d3.sum(allData,d=>d._weapons));
  document.getElementById('kpi-countries').textContent=new Set(allData.map(d=>d.TGTCOUNTRY).filter(Boolean)).size;
  document.getElementById('kpi-aircraft').textContent=new Set(allData.map(d=>d.AIRCRAFT_ROOT).filter(Boolean)).size;
  // Info page stats
  ['is-missions','is-bombs','is-weapons','is-countries','is-aircraft'].forEach((id,i)=>{
    const vals=[fmtNum(allData.length),fmtNum(d3.sum(allData,d=>d._weight)/1000)+'T',fmtNum(d3.sum(allData,d=>d._weapons)),new Set(allData.map(d=>d.TGTCOUNTRY).filter(Boolean)).size,new Set(allData.map(d=>d.AIRCRAFT_ROOT).filter(Boolean)).size];
    const el=document.getElementById(id);if(el) el.textContent=vals[i];
  });
  document.getElementById('hero-missions').textContent=fmtNum(allData.length);
  // Try to display an archive plane image from glossary
  try{
    const planes=Object.values(AIRCRAFT_GLOSS).filter(a=>a.url&&a.url.startsWith('http'));
    if(planes.length){
      const img=document.getElementById('hero-ac-img');
      const ph=document.getElementById('hero-placeholder-txt');
      if(img&&ph){
        // Use a plane image from navalaviationmuseum if possible, else show placeholder text
        ph.textContent=`${planes[0].name} — ${planes[0].app}`;
        img.style.display='none';
      }
    }
  }catch(e){}
}

// ── STATS PANEL ──────────────────────────────────────────────────
function toggleStatsPanel(){
  statsPanelOpen=!statsPanelOpen;
  document.getElementById('stats-panel').classList.toggle('collapsed',!statsPanelOpen);
  document.getElementById('stats-toggle-btn').textContent=statsPanelOpen?'STATS ›':'STATS';
  if(statsPanelOpen){setTimeout(()=>{updateStatsPanelKPIs();updateStatsPanelCharts();if(map) map.invalidateSize();},260);}
  else{setTimeout(()=>{if(map) map.invalidateSize();},260);}
}

function toggleSpSec(id){
  const sec=document.getElementById(id);sec.classList.toggle('open');
  if(sec.classList.contains('open')&&statsPanelOpen) drawSpChart(id);
}

function isActivelyFiltered(){
  // Returns true if filteredData is a real subset of allData
  if(filteredData.length===allData.length) return false;
  if(lassoBounds&&lassoBounds.length>3) return true;
  const f=getFilters();
  if(f.yearFrom>1965||f.yearTo<1975) return true;
  // Check if any checkbox is unchecked
  const anyUnchecked=!!document.querySelector('#filter-panel input[type=checkbox]:not(:checked)');
  if(anyUnchecked) return true;
  if(f.tgttype||f.weapon||f.actype) return true;
  return false;
}

function updateStatsPanelBanner(){
  const banner=document.getElementById('sp-active-banner');
  if(!banner) return;
  const filtered=isActivelyFiltered();
  banner.textContent=filtered?'// ACTIVE SELECTION':'// ALL DATA';
  banner.style.background=filtered?'var(--accent)':'#2a3040';
}

function updateStatsPanelKPIs(){
  // Show allData stats when no filter active, filteredData stats when filtered
  const data=isActivelyFiltered()?filteredData:allData;
  document.getElementById('sp-missions').textContent=fmtNum(data.length,1);
  document.getElementById('sp-bombs').textContent=fmtNum(d3.sum(data,d=>d._weight)/1000,1)+'T';
  document.getElementById('sp-weapons-kpi').textContent=fmtNum(d3.sum(data,d=>d._weapons),1);
  document.getElementById('sp-countries').textContent=new Set(data.map(d=>d.TGTCOUNTRY).filter(Boolean)).size;
  document.getElementById('sp-aircraft-kpi').textContent=new Set(data.map(d=>d.AIRCRAFT_ROOT).filter(Boolean)).size;
  document.getElementById('sp-bombing').textContent=fmtNum(data.filter(d=>d._isBombing).length,1);
  updateStatsPanelBanner();
}

function updateStatsPanelCharts(){
  ['sps-year','sps-mfunc','sps-milservice','sps-tgtcountry','sps-acapp','sps-tgtcat','sps-weapon'].forEach(id=>{
    if(document.getElementById(id).classList.contains('open')) drawSpChart(id);
  });
}

function drawSpChart(secId){
  const W=document.getElementById('stats-panel').clientWidth-26;if(W<60) return;
  // Use allData for charts when no active filter
  const chartData=isActivelyFiltered()?filteredData:allData;
  switch(secId){
    case 'sps-year':      drawSpBar('sp-year',YEARS.map(y=>({k:String(y),v:(d3.rollup(chartData,v=>v.length,d=>d._year)).get(y)||0})),120,ACCENT);break;
    case 'sps-mfunc':     drawSpPie('sp-mfunc',    'MFUNC_DESC', 160,chartData);break;
    case 'sps-milservice':drawSpPie('sp-milservice','MILSERVICE', 160,chartData);break;
    case 'sps-tgtcountry':drawSpPie('sp-tgtcountry','TGTCOUNTRY',160,chartData);break;
    case 'sps-acapp':     drawSpPie('sp-acapp',    '_acApp',     160,chartData);break;
    case 'sps-tgtcat':    drawSpPie('sp-tgtcat',   '_tgtCat',    160,chartData);break;
    case 'sps-weapon':    drawSpPie('sp-weapon',   '_wpnClass',  160,chartData);break;
  }
}

// Colors synced with active map legend
function getChartColors(field, keys){
  if(colorByField===field&&colorScale) return keys.map(k=>colorScale(k)||PALETTE[0]);
  const pal=PALETTES[field]||d3.schemeTableau10;
  const sc=d3.scaleOrdinal().domain(keys).range(pal);
  return keys.map(k=>sc(k));
}

function drawSpBar(svgId,data,H,color){
  const svg=d3.select('#'+svgId);svg.selectAll('*').remove();
  const W=svg.node().parentElement.clientWidth-4;
  const m={top:4,right:4,bottom:20,left:32};const iW=W-m.left-m.right,iH=H-m.top-m.bottom;
  svg.attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);
  const g=svg.append('g').attr('transform',`translate(${m.left},${m.top})`);
  const x=d3.scaleBand().domain(data.map(d=>d.k)).range([0,iW]).padding(0.18);
  const y=d3.scaleLinear().domain([0,d3.max(data,d=>d.v)||1]).range([iH,0]).nice();
  g.selectAll('.bar').data(data).join('rect').attr('class','bar').attr('x',d=>x(d.k)).attr('y',d=>y(d.v)).attr('width',x.bandwidth()).attr('height',d=>iH-y(d.v)).attr('fill',color||ACCENT).attr('opacity',0.85)
    .on('mouseover',(ev,d)=>showTooltip(`${d.k}<br/><b>${fmtNum(d.v,1)}</b>`,ev)).on('mousemove',moveTooltip).on('mouseout',hideTooltip);
  g.append('g').attr('class','axis').attr('transform',`translate(0,${iH})`).call(d3.axisBottom(x).tickFormat(d=>String(d).slice(-2)).tickSize(0)).selectAll('text').attr('font-size','8px');
  g.append('g').attr('class','axis').call(d3.axisLeft(y).ticks(3).tickFormat(d=>fmtNum(d,1))).selectAll('text').attr('font-size','8px');
}

function drawSpBarField(svgId,field,H,maxItems=7){
  const svg=d3.select('#'+svgId);svg.selectAll('*').remove();
  const W=svg.node().parentElement.clientWidth-4;
  const m={top:4,right:4,bottom:4,l:8};const iW=W-m.l-m.right,iH=H-m.top-m.bottom;
  svg.attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);
  const g=svg.append('g').attr('transform',`translate(${m.l},${m.top})`);
  const byF=d3.rollup(filteredData,v=>v.length,d=>d[field]||'INCONNU');
  const data=Array.from(byF,([k,v])=>({k,v})).sort((a,b)=>b.v-a.v).slice(0,maxItems);
  if(!data.length) return;
  const x=d3.scaleLinear().domain([0,d3.max(data,d=>d.v)]).range([0,iW*0.55]);
  const y=d3.scaleBand().domain(data.map(d=>d.k)).range([0,iH]).padding(0.2);
  g.selectAll('.bar').data(data).join('rect').attr('class','bar').attr('x',0).attr('y',d=>y(d.k)).attr('width',d=>x(d.v)).attr('height',y.bandwidth()).attr('fill',(d,i)=>PALETTE[i%PALETTE.length]).attr('opacity',0.85)
    .on('mouseover',(ev,d)=>showTooltip(`${d.k}<br/><b>${fmtNum(d.v,1)}</b>`,ev)).on('mousemove',moveTooltip).on('mouseout',hideTooltip);
  g.selectAll('.lbl').data(data).join('text').attr('x',d=>x(d.v)+3).attr('y',d=>y(d.k)+y.bandwidth()/2+3).text(d=>fmtNum(d.v,1)).attr('fill','#8a7e6e').attr('font-family',"'Share Tech Mono',monospace").attr('font-size','8px');
  g.selectAll('.ylbl').data(data).join('text').attr('x',-3).attr('y',d=>y(d.k)+y.bandwidth()/2+3).text(d=>d.k.substring(0,11)).attr('text-anchor','end').attr('fill','#5e5244').attr('font-family',"'Share Tech Mono',monospace").attr('font-size','8px');
}

function drawSpPie(svgId,field,H,srcData){
  const src=srcData||filteredData;
  const svg=d3.select('#'+svgId);svg.selectAll('*').remove();
  const W=svg.node().parentElement.clientWidth-4;
  svg.attr('height',H).attr('viewBox',`0 0 ${W} ${H}`);
  const byF=d3.rollup(src,v=>v.length,d=>d[field]||'INCONNU');
  const data=Array.from(byF,([k,v])=>({k,v})).filter(d=>d.k&&d.k!=='INCONNU').sort((a,b)=>b.v-a.v).slice(0,7);
  if(!data.length) return;
  const total=d3.sum(data,d=>d.v);
  const pie=d3.pie().value(d=>d.v).sort(null);
  const r=Math.min(W*0.28,H*0.42);
  const arc=d3.arc().innerRadius(r*0.48).outerRadius(r);
  const arcH=d3.arc().innerRadius(r*0.48).outerRadius(r*1.07);
  const keys=data.map(d=>d.k);
  const colors=getChartColors(field,keys);
  const g=svg.append('g').attr('transform',`translate(${W*0.33},${H/2})`);
  g.selectAll('path').data(pie(data)).join('path').attr('d',arc).attr('fill',(d,i)=>colors[i]).attr('stroke','#fff').attr('stroke-width',1.5).style('cursor','pointer')
    .on('mouseover',function(ev,d){d3.select(this).attr('d',arcH);showTooltip(`${d.data.k}<br/><b>${fmtNum(d.data.v,1)}</b> (${((d.data.v/total)*100).toFixed(1)}%)`,ev);})
    .on('mousemove',moveTooltip).on('mouseout',function(){d3.select(this).attr('d',arc);hideTooltip();});
  const legend=svg.append('g').attr('transform',`translate(${W*0.64},${H*0.04})`);
  data.forEach((d,i)=>{const row=legend.append('g').attr('transform',`translate(0,${i*22})`);row.append('rect').attr('width',9).attr('height',9).attr('fill',colors[i]);row.append('text').attr('x',13).attr('y',8).text(d.k.substring(0,14)).attr('fill','#5e5244').attr('font-family',"'Share Tech Mono',monospace").attr('font-size','8px');});
}

// ── DUAL ANIM MAPS ───────────────────────────────────────────────
function initAnimMaps(){
  const url=BASEMAPS.dark.url;
  leafletLeft=L.map('anim-map-left',{center:[16.5,106],zoom:5,zoomControl:false,preferCanvas:true,attributionControl:false});
  L.tileLayer(url,{subdomains:'abcd',maxZoom:18}).addTo(leafletLeft);
  leafletRight=L.map('anim-map-right',{center:[16.5,106],zoom:5,zoomControl:false,preferCanvas:true,attributionControl:false});
  L.tileLayer(url,{subdomains:'abcd',maxZoom:18}).addTo(leafletRight);
  let syncing=false;
  function sync(src,dst){src.on('moveend',()=>{if(syncing) return;syncing=true;dst.setView(src.getCenter(),src.getZoom(),{animate:false,noMoveStart:true});syncing=false;});}
  sync(leafletLeft,leafletRight);sync(leafletRight,leafletLeft);
}

function getAnimSliceData(){
  if(animGranularity==='year') return allData.filter(d=>d._year===animYear);
  if(animGranularity==='month') return allData.filter(d=>d._year===animYear&&d._month===animMonth);
  return allData.filter(d=>{if(d._year!==animYear||d._month!==animMonth) return false;const day=d.dt&&d.dt.length>=8?+d.dt.substring(6,8):15;return Math.ceil(day/7)===animWeek;});
}

function updateAnimDisplay(){
  let key=String(animYear);
  if(animGranularity==='month') key+=`-${String(animMonth).padStart(2,'0')}`;
  if(animGranularity==='week') key+=`-${String(animMonth).padStart(2,'0')}-W${animWeek}`;
  document.getElementById('anim-year-display').textContent=key;
  const total=animGranularity==='year'?11:animGranularity==='month'?132:528;
  const cur=animGranularity==='year'?animYear-1965:animGranularity==='month'?(animYear-1965)*12+(animMonth-1):(animYear-1965)*48+(animMonth-1)*4+(animWeek-1);
  document.getElementById('anim-progress-bar').style.width=(cur/total*100)+'%';
  const yd=getAnimSliceData();const s=sampleData(yd,12000);
  if(animLayerLeft){leafletLeft.removeLayer(animLayerLeft);animLayerLeft=null;}
  if(animLeftMode==='heat'){animLayerLeft=L.heatLayer(s.map(d=>[d._lat,d._lon,Math.min(d._weapons/8+0.3,1)]),{radius:10,blur:15,gradient:{0.2:'#1a3a5c',0.5:'#c8780a',0.8:'#9e3408',1.0:'#fff'}}).addTo(leafletLeft);}
  else{animLayerLeft=L.layerGroup(s.map(d=>L.circleMarker([d._lat,d._lon],{radius:2,color:ACCENT2,fillColor:ACCENT2,fillOpacity:0.72,weight:0.5,interactive:false}))).addTo(leafletLeft);}
  if(animLayerRight){leafletRight.removeLayer(animLayerRight);animLayerRight=null;}
  const withBase=s.filter(d=>d._takeoffCoords);const fs=sampleData(withBase,1500);
  const rc={};fs.forEach(d=>{const k=`${d._takeoffCoords[0].toFixed(1)},${d._takeoffCoords[1].toFixed(1)}|${d._lat.toFixed(1)},${d._lon.toFixed(1)}`;if(!rc[k]) rc[k]={d,n:0};rc[k].n++;});
  const maxN=Math.max(1,...Object.values(rc).map(r=>r.n));
  animLayerRight=L.layerGroup(Object.values(rc).map(({d,n})=>{const f=n/maxN;return L.polyline([d._takeoffCoords,[d._lat,d._lon]],{color:d3.interpolateYlOrRd(0.2+f*0.8),weight:0.3+f*3,opacity:0.1+f*0.65,smoothFactor:2,interactive:false});})).addTo(leafletRight);
}

function switchLeftMap(){animLeftMode=animLeftMode==='points'?'heat':'points';document.getElementById('anim-label-left').textContent=animLeftMode.toUpperCase();document.getElementById('anim-left-switch').textContent=animLeftMode==='points'?'→ HEATMAP':'→ POINTS';updateAnimDisplay();}
function advanceAnim(){if(animGranularity==='year'){animYear++;if(animYear>1975) return false;}else if(animGranularity==='month'){animMonth++;if(animMonth>12){animMonth=1;animYear++;if(animYear>1975) return false;}}else{animWeek++;if(animWeek>4){animWeek=1;animMonth++;if(animMonth>12){animMonth=1;animYear++;if(animYear>1975) return false;}}}return true;}
function togglePlay(){animPlaying=!animPlaying;document.getElementById('btn-play').textContent=animPlaying?'⏸':'▶';if(animPlaying) playNext();}
function playNext(){if(!animPlaying) return;updateAnimDisplay();if(!advanceAnim()){animPlaying=false;document.getElementById('btn-play').textContent='▶';return;}animTimer=setTimeout(playNext,animSpeed);}
function resetAnim(){animPlaying=false;clearTimeout(animTimer);document.getElementById('btn-play').textContent='▶';animYear=1965;animMonth=1;animWeek=1;updateAnimDisplay();}
function setSpeed(ms,btn){animSpeed=ms;document.querySelectorAll('.speed-btn').forEach(b=>b.classList.remove('active'));if(btn) btn.classList.add('active');}
function setGranularity(g){animGranularity=g;animYear=1965;animMonth=1;animWeek=1;document.querySelectorAll('.gran-btn').forEach(b=>b.classList.remove('active'));document.getElementById('gran-'+g).classList.add('active');updateAnimDisplay();}

// ── GLOSSARY TABLES ──────────────────────────────────────────────
function renderAcTable(){
  const search=(document.getElementById('ac-search').value||'').toLowerCase();
  const appFilter=document.getElementById('ac-app-filter').value;
  const tbody=document.getElementById('ac-tbody');tbody.innerHTML='';
  let rows=AC_TAB_DATA.filter(r=>{
    if(appFilter&&r.app!==appFilter) return false;
    if(search&&!r.name.toLowerCase().includes(search)&&!r.root.toLowerCase().includes(search)&&!(r.sn||'').toLowerCase().includes(search)) return false;
    return true;
  });
  rows.sort((a,b)=>+b.cnt - +a.cnt);
  document.getElementById('ac-count').textContent=`${rows.length} aircraft`;
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><span class="gbadge">${r.root}</span></td><td>${r.name}</td><td style="color:var(--text-dim);font-size:12px">${r.type}</td><td><span class="gbadge">${r.app}</span></td><td style="font-family:'Share Tech Mono',monospace;font-size:12px">${(+r.cnt).toLocaleString('en-US')}</td><td>${r.url?`<a href="${r.url}" target="_blank">↗ INFO</a>`:''}</td>`;
    tbody.appendChild(tr);
  });
}

function renderWpnTable(){
  const search=(document.getElementById('wpn-search').value||'').toLowerCase();
  const classFilter=document.getElementById('wpn-class-filter').value;
  const tbody=document.getElementById('wpn-tbody');tbody.innerHTML='';
  let rows=WPN_TAB_DATA.filter(r=>{
    if(classFilter&&r.wc!==classFilter) return false;
    if(search&&!r.wt.toLowerCase().includes(search)&&!r.cn.toLowerCase().includes(search)) return false;
    return true;
  });
  rows.sort((a,b)=>+b.cnt - +a.cnt);
  document.getElementById('wpn-count').textContent=`${rows.length} weapon types`;
  rows.forEach(r=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><span class="gbadge">${r.wt}</span></td><td>${r.cn}</td><td><span class="gbadge">${r.wc}</span></td><td style="color:var(--text-dim);font-size:12px">${r.desc}</td><td style="font-family:'Share Tech Mono',monospace;font-size:12px">${(+r.cnt).toLocaleString('en-US')}</td>`;
    tbody.appendChild(tr);
  });
}

// Populate aircraft app filter
function populateAcAppFilter(){
  const sel=document.getElementById('ac-app-filter');
  const apps=[...new Set(AC_TAB_DATA.map(r=>r.app))].filter(Boolean).sort();
  apps.forEach(a=>{const o=document.createElement('option');o.value=a;o.textContent=a;sel.appendChild(o);});
}

// ── RESIZE ───────────────────────────────────────────────────────
window.addEventListener('resize',()=>{clearTimeout(window._rt);window._rt=setTimeout(()=>{if(map) map.invalidateSize();if(leafletLeft) leafletLeft.invalidateSize();if(leafletRight) leafletRight.invalidateSize();if(statsPanelOpen) updateStatsPanelCharts();},250);});

// ── INIT ─────────────────────────────────────────────────────────
(async function init(){
  try{
    await loadAllData();
    setLoader(96,'Rendering...');
    populateFilters();
    populateAcAppFilter();
    updateKPIs();
    initMap();
    initPolygonSelect();
    initAnimMaps();
    filteredData=[...allData];
    document.getElementById('total-count').textContent=fmtNum(filteredData.length);
    buildColorScale();
    updateMap();
    updateLegend(); // ensure legends start in correct state
    updateStatsPanelKPIs();
    updateAnimDisplay();
    // Open stats panel by default
    statsPanelOpen=true;
    document.getElementById('stats-panel').classList.remove('collapsed');
    document.getElementById('stats-toggle-btn').textContent='STATS ›';
    setTimeout(hideLoader,400);
  }catch(err){
    console.error(err);
    document.getElementById('loader-msg').textContent=`Error: ${err.message}`;
    document.getElementById('loader-bar').style.background='#9e3408';
  }
})();
