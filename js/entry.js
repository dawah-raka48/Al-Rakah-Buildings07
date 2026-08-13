const typeEl=type,buildingEl=building,categoryEl=category;date.value=new Date().toISOString().slice(0,10);
async function init(){await loadData();fillBuildings("#building");const q=new URLSearchParams(location.search);if(q.get("building"))buildingEl.value=q.get("building");refresh();renderRecent()}
function refresh(){categoryEl.innerHTML=cats(typeEl.value).map(x=>`<option>${x}</option>`).join("");refreshMeters()}
function refreshMeters(){
  const b=get(DB.buildings).find(x=>x.id===buildingEl.value),show=typeEl.value==="expense"&&["كهرباء","مياه"].includes(categoryEl.value);
  meterArea.classList.toggle("hidden",!show);amountWrap.classList.toggle("hidden",show);
  if(show){
    const meterType=categoryEl.value;
    const filtered=(b?.meters||[]).filter(m=>m.type===meterType);
    meters.innerHTML=filtered.map(m=>`<div class="meter-row"><label>${m.name}<small class="operation-sub">${m.type} • رقم الحساب: ${m.account||"-"}</small></label><label>رقم العداد<input value="${m.number||""}" disabled></label><label>المبلغ<input class="meterAmount" data-meter-id="${m.id}" type="number" min="0" step=".01" placeholder="0.00"></label></div>`).join("")||`<p class='muted'>لا توجد عدادات ${meterType} لهذه العمارة. أضف عدادًا من صفحة العمارات.</p>`;
  }
}
typeEl.onchange=refresh;buildingEl.onchange=refreshMeters;categoryEl.onchange=refreshMeters;
entryForm.onsubmit=async e=>{e.preventDefault();const meterType=typeEl.value==="expense"&&["كهرباء","مياه"].includes(categoryEl.value),b=get(DB.buildings).find(x=>x.id===buildingEl.value);if(!b)return alert("اختر العمارة أولاً.");try{if(meterType){
      let saved=0;
      const meterTypeName=categoryEl.value;
      const filtered=(b.meters||[]).filter(m=>m.type===meterTypeName);
      for(const el of document.querySelectorAll(".meterAmount")){
        const a=Number(el.value); if(a>0){
          const m=filtered.find(x=>x.id===el.dataset.meterId); if(!m)continue;
          await api("addTransaction",{buildingId:b.id,date:date.value,type:"expense",category:categoryEl.value,amount:a,note:note.value,meterId:m.id,meterName:m.name,meterNumber:m.number,meterAccount:m.account});
          saved++;
        }
      }
      if(!saved)return alert("أدخل مبلغ عداد واحد على الأقل.")
    }else{const a=Number(amount.value);if(!(a>0))return alert("أدخل المبلغ.");await api("addTransaction",{buildingId:b.id,date:date.value,type:typeEl.value,category:categoryEl.value,amount:a,note:note.value})}await syncFromGoogle();entryForm.reset();date.value=new Date().toISOString().slice(0,10);refresh();renderRecent();alert("تم حفظ العملية في Google Sheets")}catch(err){alert("تعذر حفظ العملية: "+err.message)}};
async function renderRecent(){await loadData();const arr=get(DB.transactions).slice(-10).reverse();recent.innerHTML=arr.map(x=>`<div class="operation"><span class="tag ${x.type}">${x.type==="income"?"إيراد":"مصروف"}</span><div><div class="operation-title">${x.category}${x.meterName?" • "+x.meterName:""}</div><div class="operation-sub">${buildingName(x.buildingId)} • ${x.date}</div></div><div class="operation-amount">${money(x.amount)} ريال</div><div class="operation-actions"><button class="mini-btn" onclick="editTransaction('${x.id}')">تعديل</button><button class="mini-btn danger" onclick="deleteTransaction('${x.id}')">حذف</button></div></div>`).join("")||"<p class='muted'>لا توجد عمليات حتى الآن.</p>"}
async function deleteTransaction(tid){if(!confirm("حذف هذه العملية نهائيًا؟"))return;try{await api("deleteTransaction",{id:tid});await syncFromGoogle();renderRecent()}catch(e){alert("تعذر الحذف: "+e.message)}}
async function editTransaction(tid){await loadData();const x=get(DB.transactions).find(t=>t.id===tid);if(!x)return;const bs=get(DB.buildings);editContent.innerHTML=`<div class="form-grid"><label>التاريخ<input id="eDate" type="date" value="${x.date}"></label><label>المبلغ<input id="eAmount" type="number" step=".01" value="${x.amount}"></label><label>العمارة<select id="eBuilding">${bs.map(b=>`<option value="${b.id}" ${b.id===x.buildingId?"selected":""}>${b.name}</option>`).join("")}</select></label><label>البيان<input id="eNote" value="${x.note||""}"></label><div class="form-actions"><button class="primary-btn" onclick="saveEdit('${x.id}')">حفظ التعديل</button></div></div>`;modal.classList.remove("hidden")}
async function saveEdit(tid){const x=get(DB.transactions).find(t=>t.id===tid);try{await api("updateTransaction",{id:tid,buildingId:eBuilding.value,date:eDate.value,type:x.type,category:x.category,amount:Number(eAmount.value),note:eNote.value,meterId:x.meterId,meterName:x.meterName,meterNumber:x.meterNumber,meterAccount:x.meterAccount});closeModal();await syncFromGoogle();renderRecent();alert("تم تعديل العملية")}catch(e){alert("تعذر التعديل: "+e.message)}}
function closeModal(){modal.classList.add("hidden")}init();
