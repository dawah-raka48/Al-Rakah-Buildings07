
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

function getFilteredTransactions(){
  let from=dateFrom.value;
  let to=dateTo.value;

  // حماية بسيطة إذا اختار المستخدم التاريخين بالعكس
  if(from && to && from>to){
    const tmp=from; from=to; to=tmp;
  }

  const bid=building.value;
  const type=operationType.value;
  const category=categoryFilter.value;

  return get(DB.transactions).filter(x=>{
    const d=String(x.date||"").slice(0,10);
    return (!from || d>=from) &&
           (!to || d<=to) &&
           (!bid || x.buildingId===bid) &&
           (type==="all" || x.type===type) &&
           (category==="all" || x.category===category);
  });
}

function renderReport(){
  const ts=getFilteredTransactions();
  const inc=ts.filter(x=>x.type==="income");
  const exp=ts.filter(x=>x.type==="expense");
  const sum=a=>a.reduce((s,x)=>s+Number(x.amount||0),0);

  reportBuilding.textContent=
    building.value ? buildingName(building.value) : "جميع العمارات";

  let from=dateFrom.value;
  let to=dateTo.value;
  if(from && to && from>to){
    const tmp=from; from=to; to=tmp;
  }

  reportMonth.textContent=
    from && to ? `من ${from} إلى ${to}` :
    from ? `من ${from}` :
    to ? `حتى ${to}` :
    "كل الفترات";

  const typeLabel=
    operationType.value==="all"
      ? "كل العمليات"
      : operationType.value==="income"
        ? "الإيرادات"
        : "المصروفات";

  const categoryLabel=
    categoryFilter.value==="all"
      ? "كل البنود"
      : categoryFilter.value;

  reportFilter.textContent=
    `${typeLabel} • ${categoryLabel}`;

  rIncome.textContent=money(sum(inc));
  rExpense.textContent=money(sum(exp));
  rNet.textContent=money(sum(inc)-sum(exp));

  incomeRows.innerHTML=
    inc.map(x=>`
      <tr>
        <td>${x.date}</td>
        <td>${buildingName(x.buildingId)}</td>
        <td>${x.category}</td>
        <td>${x.note||""}</td>
        <td>${money(x.amount)}</td>
      </tr>
    `).join("")
    ||
    "<tr><td colspan='5'>لا توجد إيرادات حسب الفلتر المحدد</td></tr>";

  expenseRows.innerHTML=
    exp.map(x=>`
      <tr>
        <td>${x.date}</td>
        <td>${buildingName(x.buildingId)}</td>
        <td>${x.category}</td>
        <td>${x.meterName ? x.meterName+" / "+(x.meterAccount||"-") : "-"}</td>
        <td>${money(x.amount)}</td>
      </tr>
    `).join("")
    ||
    "<tr><td colspan='5'>لا توجد مصروفات حسب الفلتر المحدد</td></tr>";
}

function refreshReport(){ renderReport(); }

function changeOperationType(){
  const currentCategory=categoryFilter.value;
  populateCategoryFilter(currentCategory);
  renderReport();
}

function changeCategory(){ renderReport(); }

async function printReport(){
  await loadData();
  renderReport();
  window.print();
}

dateFrom.onchange=refreshReport;
dateTo.onchange=refreshReport;
building.onchange=refreshReport;
operationType.onchange=changeOperationType;
categoryFilter.onchange=changeCategory;
