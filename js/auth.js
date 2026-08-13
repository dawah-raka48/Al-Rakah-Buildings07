const SESSION_KEY="srakah_session_token";
function isLogged(){return !!sessionStorage.getItem(SESSION_KEY)}
function togglePassword(){const x=document.getElementById("password");x.type=x.type==="password"?"text":"password"}
if(location.pathname.endsWith("login.html")&&isLogged())location.href="index.html";
if(!location.pathname.endsWith("login.html")&&!isLogged())location.href="login.html";

document.getElementById("loginForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  loginError.textContent="";
  const p=password.value.trim();
  if(!p){loginError.textContent="أدخل الرقم السري.";return}
  try{
    const r=await fetch(CONFIG.API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"login",data:{password:p}})});
    const j=await r.json();
    if(!j.success){loginError.textContent=j.message||"الرقم السري غير صحيح.";return}
    sessionStorage.setItem(SESSION_KEY,j.token);
    location.href="index.html";
  }catch(err){loginError.textContent="تعذر الاتصال بالنظام. تأكد من نشر Apps Script."}
});
