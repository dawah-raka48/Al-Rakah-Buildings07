
let dashboardData={buildings:[],transactions:[]};

(async function(){
  const d=await loadData();
  dashboardData=d;
  dashboardMonth.value=new Date().toISOString().slice(0,7);
  renderDashboard();
})();

function renderDashboard(){
  const bs=dashboardData.buildings||[];
  const ts=dashboardData.transactions||[];
  const mk=dashboardMonth.value;

  const mt=ts.filter(x=>monthKey(x.date)===mk);
  const inc=mt.filter(x=>x.type==="income").reduce((a,x)=>a+Number(x.amount||0),0);
  const exp=mt.filter(x=>x.type==="expense").reduce((a,x)=>a+Number(x.amount||0),0);

  buildingCount.textContent=bs.length;
  monthIncome.textContent=money(inc);
  monthExpense.textContent=money(exp);
  monthNet.textContent=money(inc-exp);

  const label = mk ? `ملخص شهر ${mk}` : "ملخص الفترة";
  const cards = bs.map(b=>{
    const bt=mt.filter(x=>x.buildingId===b.id);
    const bi=bt.filter(x=>x.type==="income").reduce((a,x)=>a+Number(x.amount||0),0);
    const be=bt.filter(x=>x.type==="expense").reduce((a,x)=>a+Number(x.amount||0),0);
    return `<article class="building-item">
      <div class="building-top"><div><h3>${b.name}</h3><p>${b.address||"بدون عنوان"}</p></div><span class="eyebrow">${(b.meters||[]).length} عداد</span></div>
      <div class="building-meta"><span>إيرادات ${label}</span><b>${money(bi)} ريال</b></div>
      <div class="building-meta"><span>مصروفات ${label}</span><b>${money(be)} ريال</b></div>
      <div class="building-meta"><span>الصافي</span><b>${money(bi-be)} ريال</b></div>
      <div class="building-actions"><a class="mini-btn" href="entry.html?building=${b.id}">إدخال</a><a class="mini-btn" href="reports.html?building=${b.id}">التقرير</a></div>
    </article>`;
  }).join("");

  buildingCards.innerHTML=cards||"<p class='muted'>لا توجد عمارات بعد. أضف أول عمارة للبدء.</p>";
}

dashboardMonth.onchange=renderDashboard;
