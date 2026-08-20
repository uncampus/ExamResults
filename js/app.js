
(() => {
  "use strict";

  const CFG = window.PORTAL_CONFIG;
  const DATA = window.RESULTS_DATA;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  let selectedBatch = null;
  let staffLoggedIn = sessionStorage.getItem("staffLoggedIn") === "true";

  const gradeScale = [
    {min:85, max:100, grade:"A+", description:"Distinction Pass"},
    {min:75, max:84, grade:"A", description:"Merit Pass"},
    {min:65, max:74, grade:"B+", description:"Very Good Pass"},
    {min:55, max:64, grade:"B", description:"Good Pass"},
    {min:45, max:54, grade:"C+", description:"General Pass"},
    {min:40, max:44, grade:"C", description:"Weak Pass"},
    {min:0, max:39, grade:"F", description:"Fail"}
  ];

  function gradeFor(value){
    const n = Number(value);
    if (!Number.isFinite(n)) return {grade:"—",description:"Not available"};
    return gradeScale.find(g => n >= g.min && n <= g.max) || gradeScale.at(-1);
  }
  function esc(value){
    return String(value ?? "").replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function fixed2(value){
    const n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : "—";
  }
  function allBatches(){ return Object.entries(DATA).map(([id,b]) => ({id,...b})); }
  function getBatch(id){ return DATA[id]; }
  function studentCount(batch){ return batch?.students?.length || 0; }

  function showView(id){
    $$(".view").forEach(v => v.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
    refreshReveal();
  }
  function refreshReveal(){
    $$(".active .reveal").forEach((el,i) => {
      el.style.animationDelay = `${Math.min(i*0.08,.4)}s`;
      el.classList.remove("reveal");
      void el.offsetWidth;
      el.classList.add("reveal");
    });
  }
  function message(el,text,type="error"){
    el.textContent=text;
    el.className=`form-message ${type}`;
  }

  function renderBatches(){
    const grid = $("#batchGrid");
    const batches = allBatches();
    if(!batches.length){
      grid.innerHTML='<div class="empty-state">No batches are currently available. Please contact the institute.</div>';
      return;
    }
    grid.innerHTML=batches.map((b,i)=>`
      <article class="batch-card reveal" style="animation-delay:${i*0.06}s" data-batch="${esc(b.id)}">
        <div class="batch-code">${esc(b.batch || b.id)}</div>
        <div class="batch-name">${esc(b.course || "Academic Programme")}</div>
        <div class="batch-meta"><span>${esc(b.modules?.length || 0)} Modules</span><strong>${studentCount(b)} Students →</strong></div>
      </article>`).join("");
    $$(".batch-card",grid).forEach(card=>card.addEventListener("click",()=>{
      selectedBatch=card.dataset.batch;
      $("#studentBatchTitle").textContent = `${getBatch(selectedBatch).batch || selectedBatch} — Result Search`;
      $("#studentNic").value="";
      $("#studentSearchMessage").textContent="";
      $("#resultContainer").innerHTML="";
      showView("#studentSearchView");
    }));
  }

  function renderStudentResult(student,batch){
    const scale=gradeFor(student.average);
    const moduleRows=(batch.modules||[]).map((m,i)=>{
      const mark=student.marks?.[i] ?? "—";
      const isAB=String(mark).toUpperCase()==="AB";
      const n=Number(mark);
      const cls=isAB?"mark-ab":(Number.isFinite(n)&&n<40?"mark-fail":"mark-pass");
      return `<tr><td>${esc(m.code)}</td><td>${esc(m.name)}</td><td class="${cls}">${esc(mark)}</td><td>${isAB?"Absent":(Number.isFinite(n)?esc(gradeFor(n).grade):"—")}</td></tr>`;
    }).join("");
    const final = student.final ?? "—";
    const finalGrade = gradeFor(final);
    const finalClass = Number.isFinite(Number(final)) && Number(final)<40 ? "mark-fail" : "mark-pass";
    const finalRow = `<tr class="final-exam-row"><td><strong>FINAL EXAM</strong></td><td><strong>Final Examination</strong></td><td class="${finalClass}"><strong>${esc(final)}</strong></td><td><strong>${esc(finalGrade.grade)}</strong></td></tr>`;

    $("#resultContainer").innerHTML=`
      <article class="result-card">
        <div class="result-header">
          <div><div class="student-name">${esc(student.fullName || student.name)}</div>
          <div class="student-meta">Registration No: ${esc(student.registrationNumber || "Not available")} · NIC: ${esc(student.nic || "Not available")} · ${esc(batch.course||"Course")} · ${esc(batch.batch||selectedBatch)}</div></div>
          <div class="result-badge">Official Result</div>
        </div>
        <div class="result-body">
          <div class="result-summary">
            <div class="summary-box"><span>Average</span><strong>${fixed2(student.average)}</strong></div>
            <div class="summary-box"><span>Average Grade</span><strong><span class="grade-pill">${esc(scale.grade)}</span></strong></div>
            <div class="summary-box"><span>Attendance</span><strong>${fixed2(student.attendance)}%</strong></div>
          </div>
          <div class="table-scroll">
            <table class="module-table"><thead><tr><th>Module</th><th>Module Name</th><th>Mark</th><th>Grade</th></tr></thead><tbody>${moduleRows}${finalRow}</tbody></table>
          </div>
          <div class="grading">
            <h3>Grading Scale</h3>
            <div class="grade-grid">${gradeScale.map(g=>`<div class="grade-item"><b>${g.min}–${g.max === 100 ? 100 : g.max}%</b><span>${g.grade} · ${g.description}</span></div>`).join("")}</div>
          </div>
        </div>
      </article>`;
  }

  function searchStudent(e){
    e.preventDefault();
    const input=$("#studentNic"), nic=input.value.trim();
    const msg=$("#studentSearchMessage");
    if(!nic){message(msg,"Please enter your NIC number."); input.focus(); return;}
    const batch=getBatch(selectedBatch);
    const student=(batch?.students||[]).find(s=>String(s.nic).trim().toLowerCase()===nic.toLowerCase());
    if(!student){
      $("#resultContainer").innerHTML=`<div class="empty-state"><strong>Result not found.</strong><br>We could not find a result for this NIC in the selected batch.<br>Please verify the NIC and batch, or contact <a href="mailto:${CFG.contactEmail}">${CFG.contactEmail}</a>.</div>`;
      message(msg,"No matching student record found.");
      return;
    }
    msg.textContent="";
    renderStudentResult(student,batch);
    $("#resultContainer").scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderStaff(){
    const select=$("#staffBatchSelect");
    const batches=allBatches();
    select.innerHTML=batches.map(b=>`<option value="${esc(b.id)}">${esc(b.batch||b.id)} — ${esc(b.course||"")}</option>`).join("");
    if(!select.value && batches[0]) select.value=batches[0].id;
    renderStaffTable();
  }
  function renderStaffTable(){
    const id=$("#staffBatchSelect").value;
    if(!id)return;
    const batch=getBatch(id);
    const students=batch.students||[];
    const q=$("#staffTableSearch").value.trim().toLowerCase();
    const filtered=students.filter(s=>`${s.name} ${s.fullName} ${s.nic} ${s.registrationNumber}`.toLowerCase().includes(q));
    const nums=students.map(s=>Number(s.average)).filter(Number.isFinite);
    const avg=nums.length ? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2) : "—";
    const pass=students.filter(s=>Number(s.average)>=40).length;
    $("#staffStats").innerHTML=`
      <div class="stat-card"><span>Total Students</span><strong>${students.length}</strong></div>
      <div class="stat-card"><span>Pass Rate</span><strong>${students.length?Math.round(pass/students.length*100):0}%</strong></div>
      <div class="stat-card"><span>Batch Average</span><strong>${avg}</strong></div>
      <div class="stat-card"><span>Modules</span><strong>${batch.modules?.length||0}</strong></div>`;
    $("#staffTableTitle").textContent=batch.batch || id;
    $("#staffTableMeta").textContent=`${filtered.length} of ${students.length} students`;
    const head=$("#staffResultsTable thead"), body=$("#staffResultsTable tbody");
    const moduleHeads=(batch.modules||[]).map(m=>`<th>${esc(m.code)}</th>`).join("");
    head.innerHTML=`<tr><th>#</th><th>Name</th><th>NIC</th><th>Registration No.</th>${moduleHeads}<th>Final</th><th>Average</th><th>Attendance</th></tr>`;
    body.innerHTML=filtered.map((s,idx)=>{
      const marks=(s.marks||[]).map(m=>`<td class="${String(m).toUpperCase()==="AB"?"mark-ab":(Number.isFinite(Number(m))&&Number(m)<40?"mark-fail":"")}">${esc(m)}</td>`).join("");
      return `<tr><td>${idx+1}</td><td>${esc(s.fullName||s.name)}</td><td>${esc(s.nic||"—")}</td><td>${esc(s.registrationNumber||"—")}</td>${marks}<td>${esc(s.final??"—")}</td><td><b>${fixed2(s.average)}</b></td><td>${fixed2(s.attendance)}%</td></tr>`;
    }).join("") || `<tr><td colspan="${(batch.modules?.length||0)+7}">No students found.</td></tr>`;
  }

  function staffLogin(e){
    e.preventDefault();
    const user=$("#staffUsername").value.trim(), pass=$("#staffPassword").value;
    if(user===CFG.staff.username && pass===CFG.staff.password){
      staffLoggedIn=true;sessionStorage.setItem("staffLoggedIn","true");$("#logoutBtn").classList.remove("hidden");
      renderStaff();showView("#staffDashboardView");return;
    }
    message($("#staffLoginMessage"),"Invalid staff credentials. Please try again.");
  }
  function logout(){
    staffLoggedIn=false;sessionStorage.removeItem("staffLoggedIn");$("#logoutBtn").classList.add("hidden");showView("#homeView");
  }

  function openPrintDialog(){
    const modal=$("#printModal");
    const today=new Date();
    const iso=today.toISOString().slice(0,10);
    $("#printLecturerName").value="";
    $("#printDate").value=iso;
    modal.classList.remove("hidden");
    setTimeout(()=>$("#printLecturerName").focus(),50);
  }

  function closePrintDialog(){
    $("#printModal").classList.add("hidden");
  }

  function startPrint(){
    const lecturer=$("#printLecturerName").value.trim();
    const date=$("#printDate").value;
    if(!lecturer){ alert("Please enter the lecturer name."); $("#printLecturerName").focus(); return; }
    if(!date){ alert("Please select the date."); $("#printDate").focus(); return; }
    $("#printLecturerPrint").textContent=lecturer;
    $("#printDatePrint").textContent=new Date(date+"T00:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});
    const batch=getBatch($("#staffBatchSelect").value);
    $("#printBatchName").textContent=batch?.batch || "";
    $("#printCourseName").textContent=batch?.course || "";
    closePrintDialog();
    setTimeout(()=>window.print(),150);
  }

  function init(){
    $("#year").textContent=new Date().getFullYear();
    renderBatches();
    $("#staffLoginForm").addEventListener("submit",staffLogin);
    $("#studentSearchForm").addEventListener("submit",searchStudent);
    $("#staffBatchSelect").addEventListener("change",renderStaffTable);
    $("#staffTableSearch").addEventListener("input",renderStaffTable);
    $("#printBatchBtn").addEventListener("click",openPrintDialog);
    $("#cancelPrintBtn").addEventListener("click",closePrintDialog);
    $("#cancelPrintBtnAlt").addEventListener("click",closePrintDialog);
    $("#confirmPrintBtn").addEventListener("click",startPrint);
    $("#printModal").addEventListener("click",e=>{ if(e.target.id==="printModal") closePrintDialog(); });
    $("#logoutBtn").addEventListener("click",logout);
    $("#themeToggle").addEventListener("click",()=>{
      document.body.classList.toggle("dark");
      localStorage.setItem("resultsTheme",document.body.classList.contains("dark")?"dark":"light");
      $("#themeToggle").textContent=document.body.classList.contains("dark")?"☀":"☾";
    });
    if(localStorage.getItem("resultsTheme")==="dark"){document.body.classList.add("dark");$("#themeToggle").textContent="☀";}
    $$("[data-action]").forEach(btn=>btn.addEventListener("click",()=>{
      const action=btn.dataset.action;
      if(action==="home")showView("#homeView");
      if(action==="studentPortal"){renderBatches();showView("#batchView");}
      if(action==="staffLogin")showView("#staffLoginView");
    }));
    if(staffLoggedIn){$("#logoutBtn").classList.remove("hidden");}
    setTimeout(()=>{
      $("#preloader").classList.add("done");$("#app").classList.remove("is-hidden");
      refreshReveal();
    },CFG.animation.preloaderMinimumMs);
  }
  document.addEventListener("DOMContentLoaded",init);
})();
