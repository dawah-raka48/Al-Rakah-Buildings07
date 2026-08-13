let reportData=[];

(async function(){
  await loadData();
  fillBuildings("#building",true);

  const q=new URLSearchParams(location.search);
  if(q.get("building")) building.value=q.get("building");

  const today=new Date();
  const first=new Date(today.getFullYear(),today.getMonth(),1);
  dateFrom.value=toISODate(first);
  dateTo.value=toISODate(today);

  populateCategoryFilter("all");
  renderReport();
})();

function toISODate(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function displayDate(v){
  const s=String(v||"").slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s||"-";
  const [y,m,d]=s.split("-");
  return `${d}/${m}/${y}`;
}

function getCategories(){
  const type=operationType.value;
  const incomeCats=["إيجار","محل","موقف","إيراد آخر"];
  const expenseCats=["كهرباء","مياه","صيانة","نظافة","حراسة","مصروف آخر"];
  return type==="income"
    ? incomeCats
    : type==="expense"
      ? expenseCats
      : [...new Set([...incomeCats,...expenseCats])];
}

function populateCategoryFilter(selectedValue){
  const cats=getCategories();
  const wanted=selectedValue ?? categoryFilter.value;
  const keep=cats.includes(wanted) ? wanted : "all";

  categoryFilter.innerHTML=
    '<option value="all">كل البنود</option>'+
    cats.map(c=>`<option value="${c}">${c}</option>`).join("");

  categoryFilter.value=keep;
}

function getRange(){
  let from=dateFrom.value;
  let to=dateTo.value;
  if(from && to && from>to){
    const tmp=from; from=to; to=tmp;
  }
  return {from,to};
}

function getFilteredTransactions(){
  const {from,to}=getRange();
  const bid=building.value;
  const type=operationType.value;
  const category=categoryFilter.value;

  return get(DB.transactions)
    .filter(x=>{
      const d=String(x.date||"").slice(0,10);
      return (!from || d>=from) &&
             (!to || d<=to) &&
             (!bid || String(x.buildingId)===String(bid)) &&
             (type==="all" || x.type===type) &&
             (category==="all" || x.category===category);
    })
    .sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
}

function renderReport(){
  const ts=getFilteredTransactions();
  const inc=ts.filter(x=>x.type==="income");
  const exp=ts.filter(x=>x.type==="expense");
  const sum=a=>a.reduce((s,x)=>s+Number(x.amount||0),0);

  const income=sum(inc);
  const expense=sum(exp);
  const net=income-expense;

  rIncome.textContent=money(income);
  rExpense.textContent=money(expense);
  rNet.textContent=money(net);
  rCount.textContent=money(ts.length);

  const {from,to}=getRange();
  const buildingLabel=building.value ? buildingName(building.value) : "جميع العمارات";
  const typeLabel=operationType.value==="all" ? "كل العمليات" :
    operationType.value==="income" ? "الإيرادات" : "المصروفات";
  const categoryLabel=categoryFilter.value==="all" ? "كل البنود" : categoryFilter.value;

  const rangeLabel=from&&to ? `من ${displayDate(from)} إلى ${displayDate(to)}` :
    from ? `من ${displayDate(from)}` :
    to ? `حتى ${displayDate(to)}` : "كل الفترات";

  let title="التقرير المالي";
  if(categoryFilter.value!=="all"){
    title=`تقرير ${categoryFilter.value}`;
  }else if(operationType.value==="income"){
    title="تقرير الإيرادات";
  }else if(operationType.value==="expense"){
    title="تقرير المصروفات";
  }

  reportTitle.textContent=title;
  reportScope.textContent=`${rangeLabel} • ${buildingLabel} • ${typeLabel} • ${categoryLabel}`;
  printDate.textContent=`تاريخ إصدار التقرير: ${displayDate(toISODate(new Date()))}`;

  renderBuildingSummary(ts);
  renderTransactions(ts);
}

function renderBuildingSummary(ts){
  const groups={};

  ts.forEach(x=>{
    const id=String(x.buildingId||"");
    if(!groups[id]){
      groups[id]={name:buildingName(id),income:0,expense:0};
    }
    if(x.type==="income") groups[id].income+=Number(x.amount||0);
    if(x.type==="expense") groups[id].expense+=Number(x.amount||0);
  });

  const rows=Object.values(groups).sort((a,b)=>a.name.localeCompare(b.name,"ar"));

  buildingSummaryRows.innerHTML=rows.length
    ? rows.map(x=>`
      <tr>
        <td><strong>${x.name}</strong></td>
        <td class="amount income-amount">${money(x.income)} ريال</td>
        <td class="amount expense-amount">${money(x.expense)} ريال</td>
        <td class="amount">${money(x.income-x.expense)} ريال</td>
      </tr>
    `).join("")+
    `<tr class="total-row">
      <td>الإجمالي</td>
      <td>${money(rows.reduce((s,x)=>s+x.income,0))} ريال</td>
      <td>${money(rows.reduce((s,x)=>s+x.expense,0))} ريال</td>
      <td>${money(rows.reduce((s,x)=>s+x.income-x.expense,0))} ريال</td>
    </tr>`
    : `<tr><td colspan="4" class="report-empty">لا توجد بيانات حسب الفلاتر المحددة</td></tr>`;
}

function renderTransactions(ts){
  transactionRows.innerHTML=ts.length
    ? ts.map((x,i)=>{
        const income=x.type==="income";
        const meter=x.meterName
          ? `${x.meterName}${x.meterAccount ? " / "+x.meterAccount : ""}`
          : "-";
        return `
          <tr>
            <td>${i+1}</td>
            <td>${displayDate(x.date)}</td>
            <td>${buildingName(x.buildingId)}</td>
            <td><span class="type-pill ${income?"income":"expense"}">${income?"إيراد":"مصروف"}</span></td>
            <td>${x.category||"-"}</td>
            <td>${meter}</td>
            <td>${x.note||"-"}</td>
            <td class="amount ${income?"income-amount":"expense-amount"}">${money(x.amount)} ريال</td>
          </tr>`;
      }).join("")
    : `<tr><td colspan="8" class="report-empty">لا توجد عمليات حسب الفلاتر المحددة</td></tr>`;
}

function changeOperationType(){
  const current=categoryFilter.value;
  populateCategoryFilter(current);
  renderReport();
}

function changeCategory(){
  renderReport();
}

function resetReportFilters(){
  const today=new Date();
  const first=new Date(today.getFullYear(),today.getMonth(),1);
  dateFrom.value=toISODate(first);
  dateTo.value=toISODate(today);
  building.value="";
  operationType.value="all";
  populateCategoryFilter("all");
  renderReport();
}

async function printReport(){
  await loadData();
  renderReport();
  window.print();
}

dateFrom.onchange=renderReport;
dateTo.onchange=renderReport;
building.onchange=renderReport;
operationType.onchange=changeOperationType;
categoryFilter.onchange=changeCategory;
