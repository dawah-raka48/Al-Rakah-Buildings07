
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
    return `<article class="building-item property-card">
      <div class="property-top"><div><span class="property-badge">${(b.meters||[]).length} عداد</span><h3>${b.name}</h3><p>⌖ ${b.address||"بدون عنوان"}</p></div><span class="property-icon">▦</span></div>
      <div class="property-values">
        <div class="property-value income"><b>${money(bi)}</b><span>الإيرادات</span></div>
        <div class="property-value expense"><b>${money(be)}</b><span>المصروفات</span></div>
        <div class="property-value net"><b>${money(bi-be)}</b><span>الصافي</span></div>
      </div>
      <div class="building-actions"><a class="mini-btn primary-mini" href="reports.html?building=${b.id}">عرض التفاصيل ←</a></div>
    </article>`;
  }).join("");

  buildingCards.innerHTML=cards||"<p class='muted'>لا توجد عمارات بعد. أضف أول عمارة للبدء.</p>";
}

dashboardMonth.onchange=renderDashboard;
