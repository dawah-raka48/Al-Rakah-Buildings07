passForm.onsubmit=async e=>{
 e.preventDefault();
 if(newPass.value.length<4||newPass.value!==confirmPass.value){passMsg.textContent="تأكد من الرقم السري الجديد والتأكيد.";passMsg.style.color="#b42318";return}
 try{
  const r=await fetch(CONFIG.API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"changePassword",token:sessionStorage.getItem("srakah_session_token")||"",data:{oldPassword:oldPass.value,newPassword:newPass.value}})});
  const j=await r.json();
  if(!j.success)throw new Error(j.message||"تعذر تغيير الرقم السري");
  passForm.reset();passMsg.textContent="تم تغيير الرقم السري لجميع الأجهزة بنجاح.";passMsg.style.color="#087f5b";
 }catch(err){passMsg.textContent=err.message;passMsg.style.color="#b42318"}
}
function logout(){sessionStorage.removeItem("srakah_session_token");location.href="login.html"}
