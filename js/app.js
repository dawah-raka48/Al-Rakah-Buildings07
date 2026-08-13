const DB={buildings:"sr_buildings",transactions:"sr_transactions"};
const SESSION_KEY="srakah_session_token";
function get(k){try{return JSON.parse(localStorage.getItem(k)||"[]")}catch{return[]}}
function save(k,v){localStorage.setItem(k,JSON.stringify(v))}
function id(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function money(n){return new Intl.NumberFormat("ar-SA",{maximumFractionDigits:2}).format(Number(n)||0)}
function monthKey(d){return String(d||"").slice(0,7)}
function toggleNav(){document.getElementById("nav")?.classList.toggle("open")}
function fillBuildings(sel,all=false){const e=document.querySelector(sel);if(!e)return;const b=get(DB.buildings);e.innerHTML=(all?'<option value="">كل العمارات</option>':'<option value="">اختر العمارة</option>')+b.map(x=>`<option value="${x.id}">${x.name}</option>`).join("")}
function cats(t){return t==="income"?["إيجار","محل","موقف","إيراد آخر"]:["كهرباء","مياه","صيانة","نظافة","حراسة","مصروف آخر"]}
function buildingName(i){return get(DB.buildings).find(b=>b.id===i)?.name||"-"}

async function api(action,data={}){
  const r=await fetch(CONFIG.API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,data,token:sessionStorage.getItem(SESSION_KEY)||""})});
  const j=await r.json(); if(!j.success){if(j.code==="AUTH_REQUIRED"){sessionStorage.removeItem(SESSION_KEY);location.href="login.html";}throw new Error(j.message||"خطأ في الخادم")} return j;
}
function apiDate(v){if(!v)return "";if(typeof v==="string"&&/^\d{4}-\d{2}-\d{2}/.test(v))return v.slice(0,10);const d=new Date(v);return isNaN(d)?String(v).slice(0,10):d.toISOString().slice(0,10)}
async function syncFromGoogle(){
  const r=await fetch(CONFIG.API_URL+"?action=all&token="+encodeURIComponent(sessionStorage.getItem(SESSION_KEY)||""),{cache:"no-store"}),d=await r.json();
  if(!d.success){if(d.code==="AUTH_REQUIRED"){sessionStorage.removeItem(SESSION_KEY);location.href="login.html";}throw new Error(d.message||"تعذر قراءة Google Sheets");}
  const bs=(d.buildings||[]).map(x=>({id:String(x.ID||""),name:String(x["اسم العمارة"]||""),address:String(x["العنوان"]||""),meters:[]}));
  (d.meters||[]).forEach(x=>{const b=bs.find(b=>b.id===String(x["Building ID"]||""));if(b)b.meters.push({id:String(x.ID||""),buildingId:b.id,name:String(x["اسم العداد"]||""),number:String(x["رقم العداد"]||""),account:String(x["رقم الحساب"]||""),type:String(x["نوع العداد"]||"")})});
  const ts=(d.transactions||[]).map(x=>({id:String(x.ID||""),buildingId:String(x["Building ID"]||""),date:apiDate(x["التاريخ"]),type:String(x["نوع العملية"]||""),category:String(x["التصنيف"]||""),amount:Number(x["المبلغ"]||0),note:String(x["البيان"]||""),meterId:String(x["Meter ID"]||""),meterName:String(x["اسم العداد"]||""),meterNumber:String(x["رقم العداد"]||""),meterAccount:String(x["رقم الحساب"]||"")}));
  save(DB.buildings,bs);save(DB.transactions,ts);return {buildings:bs,transactions:ts};
}
async function loadData(){try{return await syncFromGoogle()}catch(e){console.warn(e);return {buildings:get(DB.buildings),transactions:get(DB.transactions),offline:true}}}
