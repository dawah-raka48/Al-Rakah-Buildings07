const DB={buildings:"sr_buildings",transactions:"sr_transactions"};
let deferredInstallPrompt=null;
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

let __busyCount=0;
function startBusy(){__busyCount++;document.body?.classList.add("is-busy")}
function stopBusy(){__busyCount=Math.max(0,__busyCount-1);if(__busyCount===0)document.body?.classList.remove("is-busy")}

async function api(action,data={}){
  startBusy();
  try{
    const r=await fetch(CONFIG.API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,data,token:sessionStorage.getItem(SESSION_KEY)||""})});
    const j=await r.json(); if(!j.success){if(j.code==="AUTH_REQUIRED"){sessionStorage.removeItem(SESSION_KEY);location.href="login.html";}throw new Error(j.message||"خطأ في الخادم")} return j;
  }finally{stopBusy()}
}
function apiDate(v){if(!v)return "";if(typeof v==="string"&&/^\d{4}-\d{2}-\d{2}/.test(v))return v.slice(0,10);const d=new Date(v);return isNaN(d)?String(v).slice(0,10):d.toISOString().slice(0,10)}
async function syncFromGoogle(){
  startBusy();
  try{
    const r=await fetch(CONFIG.API_URL+"?action=all&token="+encodeURIComponent(sessionStorage.getItem(SESSION_KEY)||""),{cache:"no-store"}),d=await r.json();
    if(!d.success){if(d.code==="AUTH_REQUIRED"){sessionStorage.removeItem(SESSION_KEY);location.href="login.html";}throw new Error(d.message||"تعذر قراءة Google Sheets");}
    const bs=(d.buildings||[]).map(x=>({id:String(x.ID||""),name:String(x["اسم العمارة"]||""),address:String(x["العنوان"]||""),meters:[]}));
    (d.meters||[]).forEach(x=>{const b=bs.find(b=>b.id===String(x["Building ID"]||""));if(b)b.meters.push({id:String(x.ID||""),buildingId:b.id,name:String(x["اسم العداد"]||""),number:String(x["رقم العداد"]||""),account:String(x["رقم الحساب"]||""),type:String(x["نوع العداد"]||"")})});
    const ts=(d.transactions||[]).map(x=>({id:String(x.ID||""),buildingId:String(x["Building ID"]||""),date:apiDate(x["التاريخ"]),type:String(x["نوع العملية"]||""),category:String(x["التصنيف"]||""),amount:Number(x["المبلغ"]||0),note:String(x["البيان"]||""),meterId:String(x["Meter ID"]||""),meterName:String(x["اسم العداد"]||""),meterNumber:String(x["رقم العداد"]||""),meterAccount:String(x["رقم الحساب"]||"")}));
    save(DB.buildings,bs);save(DB.transactions,ts);return {buildings:bs,transactions:ts};
  }finally{stopBusy()}
}
async function loadData(){try{return await syncFromGoogle()}catch(e){console.warn(e);return {buildings:get(DB.buildings),transactions:get(DB.transactions),offline:true}}}

/* واجهة التنبيهات والوقت */
function showNotice(message,type="success"){
  let box=document.getElementById("appNotice");
  if(!box){box=document.createElement("div");box.id="appNotice";box.className="app-notice";document.body.appendChild(box);}
  box.className="app-notice "+type;
  box.textContent=message;
  requestAnimationFrame(()=>box.classList.add("show"));
  clearTimeout(window.__noticeTimer);
  window.__noticeTimer=setTimeout(()=>box.classList.remove("show"),3200);
}
window.alert=function(message){showNotice(String(message),/تعذر|خطأ|غير صحيح|أدخل|لا توجد/.test(String(message))?"error":"success");};
function confirmAction(message,confirmText="نعم، متابعة"){
  return new Promise(resolve=>{
    let box=document.getElementById("appConfirm");
    if(!box){
      box=document.createElement("div");box.id="appConfirm";box.className="app-confirm";
      box.innerHTML='<div class="app-confirm-box"><div class="app-confirm-icon">!</div><h3 id="confirmTitle">تأكيد</h3><p id="confirmMessage"></p><div class="app-confirm-actions"><button id="confirmCancel" class="ghost-btn">إلغاء</button><button id="confirmOk" class="primary-btn"></button></div></div>';
      document.body.appendChild(box);
    }
    box.querySelector("#confirmMessage").textContent=message;
    box.querySelector("#confirmOk").textContent=confirmText;
    box.classList.add("show");
    const done=v=>{box.classList.remove("show");resolve(v)};
    box.querySelector("#confirmCancel").onclick=()=>done(false);
    box.querySelector("#confirmOk").onclick=()=>done(true);
  });
}
function setupSystemBar(){
  if(location.pathname.endsWith("login.html")||document.getElementById("systemBar"))return;
  const header=document.querySelector("header");
  if(header&&!document.getElementById("liveDate")){
    const bar=document.createElement("div");bar.id="systemBar";bar.className="system-bar no-print";
    bar.innerHTML='<span id="liveDate">--/--/----</span><span class="bar-sep">•</span><strong id="liveTime">--:--:--</strong>';
    header.insertAdjacentElement("afterend",bar);
  }
  const nav=document.getElementById("nav");
  if(nav&&!nav.querySelector(".logout-link")){
    const b=document.createElement("button");b.type="button";b.className="logout-link";b.textContent="تسجيل الخروج";b.onclick=()=>window.logout?.();
    nav.appendChild(b);
  }
  const tick=()=>{
    const now=new Date();
    const d=now.toLocaleDateString("ar-SA-u-nu-latn",{year:"numeric",month:"2-digit",day:"2-digit"});
    const t=now.toLocaleTimeString("ar-SA-u-nu-latn",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
    const de=document.getElementById("liveDate"),te=document.getElementById("liveTime");
    if(de)de.textContent=d;
    if(te)te.textContent=t;
  };
  tick();setInterval(tick,1000);
}

function isStandaloneApp(){
  return window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone===true;
}
function isIOS(){
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
function isMobileAndroid(){
  return /android/i.test(navigator.userAgent);
}
function setupInstallPrompt(){
  if(location.pathname.endsWith("login.html")||isStandaloneApp())return;
  window.addEventListener("beforeinstallprompt",e=>{
    e.preventDefault();
    deferredInstallPrompt=e;
    renderInstallPrompt("install");
  });
  window.addEventListener("appinstalled",()=>{
    deferredInstallPrompt=null;
    document.getElementById("installPrompt")?.remove();
    showNotice("تم تثبيت تطبيق عقارات الراكة بنجاح","success");
  });
  if(isIOS())setTimeout(()=>renderInstallPrompt("ios"),1800);
}
function renderInstallPrompt(mode){
  if(document.getElementById("installPrompt"))return;
  const box=document.createElement("div");
  box.id="installPrompt";box.className="install-prompt";
  const ios=mode==="ios";
  box.innerHTML=ios
    ? '<div class="install-prompt-icon">📱</div><div class="install-prompt-body"><strong>ثبّت عقارات الراكة على الآيفون</strong><span>اضغط مشاركة ⬆️ ثم «إضافة إلى الشاشة الرئيسية»</span></div><button class="install-prompt-close" aria-label="إغلاق">×</button>'
    : '<div class="install-prompt-icon">📲</div><div class="install-prompt-body"><strong>ثبّت تطبيق عقارات الراكة</strong><span>ثبّت المنصة على جهازك للوصول إليها مثل أي تطبيق.</span></div><button class="install-prompt-action">تثبيت</button><button class="install-prompt-close" aria-label="إغلاق">×</button>';
  document.body.appendChild(box);
  box.querySelector(".install-prompt-close").onclick=()=>box.remove();
  box.querySelector(".install-prompt-action")?.addEventListener("click",async()=>{
    if(!deferredInstallPrompt){showNotice("استخدم قائمة المتصفح واختر «تثبيت التطبيق»","info");return}
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt=null;
    box.remove();
  });
}

function registerApp(){
  if("serviceWorker" in navigator) navigator.serviceWorker.register("./service-worker.js").catch(()=>{});
}
document.addEventListener("DOMContentLoaded",()=>{setupSystemBar();registerApp();setupInstallPrompt()});
