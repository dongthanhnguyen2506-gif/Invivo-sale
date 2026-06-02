import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

const BLUE = "#1a56db";
const GREEN = "#0d7a4e";
const ORANGE = "#b45309";
const RED = "#dc2626";
const PURPLE = "#7c3aed";

const DAYS = ["Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"];
const DAY_KEYS = ["mon","tue","wed","thu","fri","sat"];

// Lấy thứ 2 đầu tuần từ ngày bất kỳ
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
}

function weekLabel(monday) {
  const d = new Date(monday);
  const end = new Date(d); end.setDate(d.getDate()+5);
  const fmt = dt => `${dt.getDate()}/${dt.getMonth()+1}`;
  return `Tuần ${fmt(d)} – ${fmt(end)}/${end.getFullYear()}`;
}

function weekKey(monday) {
  return new Date(monday).toISOString().split("T")[0];
}

function dayDate(monday, dayIdx) {
  const d = new Date(monday);
  d.setDate(d.getDate() + dayIdx);
  return d.toISOString().split("T")[0];
}

function formatDate(iso) {
  if (!iso) return "";
  const [y,m,day] = iso.split("-");
  return `${day}/${m}/${y}`;
}

const STATUS_CONFIG = {
  planned:   { label:"Dự kiến",   bg:"#eff6ff", color:BLUE,   border:"#bfdbfe" },
  done:      { label:"Đã thăm",   bg:"#f0fdf4", color:GREEN,  border:"#bbf7d0" },
  missed:    { label:"Không gặp", bg:"#fff7ed", color:ORANGE, border:"#fed7aa" },
  cancelled: { label:"Huỷ",       bg:"#fef2f2", color:RED,    border:"#fecaca" },
};

const APPROVAL_CONFIG = {
  draft:    { label:"Nháp",        bg:"#f9fafb", color:"#6b7280", border:"#e5e7eb" },
  pending:  { label:"Chờ duyệt",   bg:"#fffbeb", color:ORANGE,   border:"#fde68a" },
  approved: { label:"Đã duyệt",    bg:"#f0fdf4", color:GREEN,    border:"#bbf7d0" },
  rejected: { label:"Yêu cầu sửa", bg:"#fef2f2", color:RED,      border:"#fecaca" },
};

// localStorage helpers
const LS_KEY = "iv_plans";
function loadPlans() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch(_) { return {}; }
}
function savePlans(plans) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(plans)); } catch(_) {}
}

export default function Plan({
  currentUser, isBoard, isSaleManager, isNVKD,
  userBranch, SALE_BY_BRANCH, BRANCHES,
  customers = [], // CTV active list từ CRM
  onSelectPlanKH, // callback khi NVKD chọn KH từ Plan để tạo activity
}) {
  const [plans, setPlans] = useState(loadPlans);
  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
  const [activeDay, setActiveDay] = useState(null);
  const [showAddKH, setShowAddKH] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(null); // planKH cần match
  const [filterNVKD, setFilterNVKD] = useState("all");
  const [search, setSearch] = useState("");
  const [addMode, setAddMode] = useState("search"); // "search" | "manual"
  const [newKH, setNewKH] = useState({ name:"", phone:"", address:"", specialty:"", note:"", dayKey:"" });
  const fileRef = useRef();

  const wk = weekKey(currentWeek);

  // Lấy plan của tuần hiện tại
  const weekPlan = plans[wk] || {};

  // NVKD chỉ thấy plan của mình; SM/Board thấy tất cả khu vực
  const nvkdList = isSaleManager
    ? (SALE_BY_BRANCH[userBranch] || [])
    : isBoard
      ? Object.values(SALE_BY_BRANCH).flat()
      : [currentUser];

  const visibleNVKDs = filterNVKD === "all" ? nvkdList : [filterNVKD];

  // Lấy tất cả plan items của tuần, lọc theo NVKD hiển thị
  function getWeekItems(nvkd) {
    return weekPlan[nvkd] || { items: [], status: "draft" };
  }

  function updatePlan(nvkd, updater) {
    setPlans(prev => {
      const next = { ...prev };
      if (!next[wk]) next[wk] = {};
      const cur = next[wk][nvkd] || { items: [], status: "draft" };
      next[wk][nvkd] = updater(cur);
      savePlans(next);
      return next;
    });
  }

  // Thêm KH vào plan
  function addKHToPlan(nvkd, dayKey, khData) {
    updatePlan(nvkd, cur => ({
      ...cur,
      items: [...cur.items, {
        id: Date.now() + Math.random(),
        dayKey,
        ctvCode: khData.ctvCode || "",
        name: khData.name || "",
        phone: khData.phone || "",
        address: khData.address || "",
        specialty: khData.specialty || "",
        note: khData.note || "",
        status: "planned",
        isManual: !khData.ctvCode, // KH chưa có mã CTV
        matchedCtvCode: khData.ctvCode || null,
        activityId: null,
        createdAt: new Date().toISOString(),
      }]
    }));
  }

  // Cập nhật status của 1 item
  function updateItemStatus(nvkd, itemId, status) {
    updatePlan(nvkd, cur => ({
      ...cur,
      items: cur.items.map(it => it.id === itemId ? { ...it, status } : it)
    }));
  }

  // Xoá item khỏi plan
  function removeItem(nvkd, itemId) {
    updatePlan(nvkd, cur => ({
      ...cur,
      items: cur.items.filter(it => it.id !== itemId)
    }));
  }

  // SM duyệt/từ chối plan
  function approveRejectPlan(nvkd, status, comment="") {
    updatePlan(nvkd, cur => ({
      ...cur,
      status,
      approvalComment: comment,
      approvedBy: currentUser,
      approvedAt: new Date().toISOString(),
    }));
  }

  // NVKD gửi plan chờ duyệt
  function submitPlan(nvkd) {
    updatePlan(nvkd, cur => ({ ...cur, status: "pending" }));
  }

  // Match KH thủ công với mã CTV
  function matchCTV(nvkd, itemId, ctvCode) {
    updatePlan(nvkd, cur => ({
      ...cur,
      items: cur.items.map(it => it.id === itemId
        ? { ...it, matchedCtvCode: ctvCode, ctvCode, isManual: false }
        : it
      )
    }));
    setShowMatchModal(null);
  }

  // Upload Excel
  function handleExcelUpload(e, nvkd, dayKey) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        rows.forEach(row => {
          const name = row["Tên KH"] || row["Ten KH"] || row["name"] || "";
          const phone = String(row["SĐT"] || row["SDT"] || row["phone"] || "");
          const address = row["Địa chỉ"] || row["Dia chi"] || row["address"] || "";
          const specialty = row["Chuyên khoa"] || row["Chuyen khoa"] || row["specialty"] || "";
          const note = row["Ghi chú"] || row["Ghi chu"] || row["note"] || "";
          const day = row["Ngày"] || row["Ngay"] || row["day"] || dayKey;
          // Map ngày
          const mappedDay = DAY_KEYS.includes(day) ? day : dayKey;
          if (name) {
            // Try to match with existing CTV by phone
            const matched = customers.find(c => c.phone && phone && c.phone.replace(/\s/g,"") === phone.replace(/\s/g,""));
            addKHToPlan(nvkd, mappedDay, {
              name, phone, address, specialty, note,
              ctvCode: matched?.ctvCode || "",
            });
          }
        });
        alert(`✅ Đã thêm ${rows.length} KH vào plan từ Excel`);
      } catch(err) {
        alert("❌ Lỗi đọc file: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  const myPlan = getWeekItems(currentUser);
  const myItems = isNVKD ? myPlan.items || [] : [];

  // Stats
  function planStats(nvkd) {
    const items = getWeekItems(nvkd).items || [];
    return {
      total: items.length,
      done: items.filter(i => i.status === "done").length,
      planned: items.filter(i => i.status === "planned").length,
      missed: items.filter(i => i.status === "missed").length,
    };
  }

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"16px 12px 80px"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div>
          <div style={{fontWeight:800,fontSize:18,color:"#111"}}>📋 Kế hoạch tiếp cận</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{weekLabel(currentWeek)}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>setCurrentWeek(d=>{const n=new Date(d);n.setDate(n.getDate()-7);return n;})}
            style={{padding:"6px 12px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:13}}>
            ← Tuần trước
          </button>
          <button onClick={()=>setCurrentWeek(getMonday(new Date()))}
            style={{padding:"6px 12px",border:`1px solid ${BLUE}`,borderRadius:8,background:BLUE,color:"#fff",cursor:"pointer",fontSize:13,fontWeight:700}}>
            Tuần này
          </button>
          <button onClick={()=>setCurrentWeek(d=>{const n=new Date(d);n.setDate(n.getDate()+7);return n;})}
            style={{padding:"6px 12px",border:"1px solid #e5e7eb",borderRadius:8,background:"#fff",cursor:"pointer",fontSize:13}}>
            Tuần sau →
          </button>
        </div>
      </div>

      {/* SM/Board filter */}
      {(isSaleManager || isBoard) && (
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
          <select value={filterNVKD} onChange={e=>setFilterNVKD(e.target.value)}
            style={{padding:"6px 10px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:13,background:"#fff"}}>
            <option value="all">Tất cả NVKD</option>
            {nvkdList.map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      )}

      {/* ═══ VIEW: NVKD — plan của mình ═══ */}
      {isNVKD && (
        <NVKDPlanView
          currentUser={currentUser}
          currentWeek={currentWeek}
          plan={myPlan}
          customers={customers}
          onAddKH={(dayKey, kh) => addKHToPlan(currentUser, dayKey, kh)}
          onRemove={(id) => removeItem(currentUser, id)}
          onUpdateStatus={(id, st) => updateItemStatus(currentUser, id, st)}
          onSubmit={() => submitPlan(currentUser)}
          onMatch={(item) => setShowMatchModal({ nvkd: currentUser, item })}
          onSelectForActivity={onSelectPlanKH}
          onExcelUpload={(e, dk) => handleExcelUpload(e, currentUser, dk)}
          fileRef={fileRef}
        />
      )}

      {/* ═══ VIEW: SM/Board — xem plan tất cả NVKD ═══ */}
      {(isSaleManager || isBoard) && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {visibleNVKDs.map(nvkd => {
            const np = getWeekItems(nvkd);
            const st = planStats(nvkd);
            const approvalCfg = APPROVAL_CONFIG[np.status || "draft"];
            return (
              <div key={nvkd} style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:12,padding:16}}>
                {/* NVKD header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
                  <div>
                    <span style={{fontWeight:700,fontSize:15}}>{nvkd}</span>
                    <span style={{marginLeft:8,padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,
                      background:approvalCfg.bg,color:approvalCfg.color,border:`1px solid ${approvalCfg.border}`}}>
                      {approvalCfg.label}
                    </span>
                  </div>
                  <div style={{display:"flex",gap:8,fontSize:12,color:"#6b7280"}}>
                    <span>📌 {st.planned} dự kiến</span>
                    <span>✅ {st.done} đã thăm</span>
                    <span>❌ {st.missed} không gặp</span>
                  </div>
                </div>

                {/* Approval actions */}
                {np.status === "pending" && isSaleManager && (
                  <div style={{display:"flex",gap:8,marginBottom:12}}>
                    <button onClick={() => approveRejectPlan(nvkd, "approved")}
                      style={{padding:"6px 14px",background:GREEN,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>
                      ✅ Duyệt plan
                    </button>
                    <button onClick={() => {
                      const c = prompt("Ghi chú yêu cầu điều chỉnh:");
                      if (c !== null) approveRejectPlan(nvkd, "rejected", c);
                    }}
                      style={{padding:"6px 14px",background:RED,color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>
                      ↩ Yêu cầu sửa
                    </button>
                  </div>
                )}

                {np.approvalComment && (
                  <div style={{background:"#fef3c7",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#92400e",marginBottom:10}}>
                    💬 SM: {np.approvalComment}
                  </div>
                )}

                {/* Items grouped by day */}
                {DAY_KEYS.map((dk, di) => {
                  const dayItems = (np.items || []).filter(it => it.dayKey === dk);
                  if (dayItems.length === 0) return null;
                  return (
                    <div key={dk} style={{marginBottom:10}}>
                      <div style={{fontWeight:700,fontSize:12,color:"#6b7280",marginBottom:6,textTransform:"uppercase"}}>
                        {DAYS[di]} — {formatDate(dayDate(currentWeek, di))}
                      </div>
                      {dayItems.map(item => (
                        <SMPlanItem key={item.id} item={item} />
                      ))}
                    </div>
                  );
                })}

                {(!np.items || np.items.length === 0) && (
                  <div style={{textAlign:"center",color:"#9ca3af",fontSize:13,padding:"20px 0"}}>
                    Chưa có kế hoạch tuần này
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Match CTV modal */}
      {showMatchModal && (
        <MatchCTVModal
          item={showMatchModal.item}
          customers={customers}
          onMatch={(ctvCode) => matchCTV(showMatchModal.nvkd, showMatchModal.item.id, ctvCode)}
          onClose={() => setShowMatchModal(null)}
        />
      )}
    </div>
  );
}

// ─── NVKD Plan View ──────────────────────────────────────────────
function NVKDPlanView({
  currentUser, currentWeek, plan, customers,
  onAddKH, onRemove, onUpdateStatus, onSubmit, onMatch,
  onSelectForActivity, onExcelUpload, fileRef,
}) {
  const [activeDay, setActiveDay] = useState(null);
  const [showAdd, setShowAdd] = useState(null); // dayKey
  const [addMode, setAddMode] = useState("search");
  const [search, setSearch] = useState("");
  const [newKH, setNewKH] = useState({ name:"", phone:"", address:"", specialty:"", note:"" });
  const localRef = useRef();

  const items = plan.items || [];
  const status = plan.status || "draft";
  const approvalCfg = APPROVAL_CONFIG[status];

  const canEdit = status !== "approved";

  return (
    <div>
      {/* Status bar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        background:approvalCfg.bg,border:`1px solid ${approvalCfg.border}`,
        borderRadius:10,padding:"10px 14px",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:13,color:approvalCfg.color}}>
          {approvalCfg.label}
          {plan.approvalComment && <span style={{marginLeft:8,fontWeight:400}}>— {plan.approvalComment}</span>}
        </div>
        {(status === "draft" || status === "rejected") && items.length > 0 && (
          <button onClick={onSubmit}
            style={{padding:"6px 14px",background:BLUE,color:"#fff",border:"none",borderRadius:8,
              cursor:"pointer",fontWeight:700,fontSize:13}}>
            Gửi duyệt →
          </button>
        )}
      </div>

      {/* Upload Excel */}
      {canEdit && (
        <div style={{marginBottom:12}}>
          <input type="file" ref={localRef} accept=".xlsx,.xls" style={{display:"none"}}
            onChange={e => { onExcelUpload(e, "mon"); }} />
          <button onClick={() => localRef.current?.click()}
            style={{padding:"7px 14px",border:"1px dashed #d1d5db",borderRadius:8,background:"#f9fafb",
              cursor:"pointer",fontSize:13,color:"#6b7280",fontWeight:600}}>
            📂 Upload Excel (cột: Tên KH, SĐT, Chuyên khoa, Ngày, Ghi chú)
          </button>
        </div>
      )}

      {/* Days */}
      {DAY_KEYS.map((dk, di) => {
        const dayItems = items.filter(it => it.dayKey === dk);
        const dateStr = dayDate(currentWeek, di);
        const isToday = dateStr === new Date().toISOString().split("T")[0];
        return (
          <div key={dk} style={{marginBottom:12,background:"#fff",border:`1px solid ${isToday?"#93c5fd":"#e5e7eb"}`,
            borderRadius:12,overflow:"hidden"}}>
            {/* Day header */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"10px 14px",background:isToday?"#eff6ff":"#f9fafb",
              borderBottom:"1px solid #e5e7eb",cursor:"pointer"}}
              onClick={() => setActiveDay(activeDay === dk ? null : dk)}>
              <div style={{fontWeight:700,fontSize:14,color:isToday?BLUE:"#374151"}}>
                {isToday && "📍 "}{DAYS[di]} — {formatDate(dateStr)}
                {isToday && <span style={{marginLeft:6,fontSize:11,color:BLUE}}>Hôm nay</span>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:12,color:"#6b7280"}}>{dayItems.length} KH</span>
                {canEdit && (
                  <button onClick={e=>{e.stopPropagation();setShowAdd(dk);setAddMode("search");setSearch("");}}
                    style={{padding:"4px 10px",background:BLUE,color:"#fff",border:"none",borderRadius:6,
                      cursor:"pointer",fontSize:12,fontWeight:700}}>
                    + Thêm KH
                  </button>
                )}
              </div>
            </div>

            {/* Items */}
            {(activeDay === dk || dayItems.length > 0) && (
              <div style={{padding:"8px 12px"}}>
                {dayItems.length === 0 ? (
                  <div style={{textAlign:"center",color:"#d1d5db",fontSize:13,padding:"12px 0"}}>
                    Chưa có kế hoạch ngày này
                  </div>
                ) : dayItems.map(item => (
                  <NVKDPlanItem
                    key={item.id}
                    item={item}
                    canEdit={canEdit}
                    onUpdateStatus={st => onUpdateStatus(item.id, st)}
                    onRemove={() => onRemove(item.id)}
                    onMatch={() => onMatch(item)}
                    onSelectForActivity={() => onSelectForActivity && onSelectForActivity(item)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add KH modal */}
      {showAdd && (
        <AddKHModal
          dayKey={showAdd}
          dayLabel={DAYS[DAY_KEYS.indexOf(showAdd)]}
          customers={customers}
          onAdd={(kh) => { onAddKH(showAdd, kh); setShowAdd(null); }}
          onClose={() => setShowAdd(null)}
        />
      )}
    </div>
  );
}

// ─── NVKD Plan Item ───────────────────────────────────────────────
function NVKDPlanItem({ item, canEdit, onUpdateStatus, onRemove, onMatch, onSelectForActivity }) {
  const stCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",
      borderBottom:"1px solid #f3f4f6"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontWeight:700,fontSize:14}}>{item.name}</span>
          {item.isManual && !item.matchedCtvCode && (
            <span style={{fontSize:10,padding:"1px 6px",background:"#fef3c7",color:"#92400e",
              borderRadius:10,border:"1px solid #fde68a",cursor:"pointer"}}
              onClick={onMatch}>
              ⚠ Chưa có mã CTV — Ghép nối
            </span>
          )}
          {item.matchedCtvCode && (
            <span style={{fontSize:10,color:"#6b7280"}}>#{item.matchedCtvCode}</span>
          )}
          <span style={{padding:"1px 8px",borderRadius:20,fontSize:11,fontWeight:700,
            background:stCfg.bg,color:stCfg.color,border:`1px solid ${stCfg.border}`}}>
            {stCfg.label}
          </span>
        </div>
        {item.phone && <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{item.phone}</div>}
        {item.specialty && <div style={{fontSize:12,color:"#6b7280"}}>{item.specialty}</div>}
        {item.note && <div style={{fontSize:12,color:"#9ca3af",fontStyle:"italic"}}>{item.note}</div>}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
        {canEdit && item.status === "planned" && (
          <>
            <button onClick={() => onUpdateStatus("done")}
              style={{padding:"3px 8px",background:"#f0fdf4",color:GREEN,border:`1px solid #bbf7d0`,
                borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>✅ Đã thăm</button>
            <button onClick={() => onUpdateStatus("missed")}
              style={{padding:"3px 8px",background:"#fff7ed",color:ORANGE,border:`1px solid #fed7aa`,
                borderRadius:6,cursor:"pointer",fontSize:11}}>Không gặp</button>
          </>
        )}
        {item.status === "done" && onSelectForActivity && (
          <button onClick={onSelectForActivity}
            style={{padding:"3px 8px",background:"#eff6ff",color:BLUE,border:`1px solid #bfdbfe`,
              borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:700}}>
            📝 Tạo Activity
          </button>
        )}
        {canEdit && (
          <button onClick={onRemove}
            style={{padding:"3px 8px",background:"#fef2f2",color:RED,border:`1px solid #fecaca`,
              borderRadius:6,cursor:"pointer",fontSize:11}}>Xoá</button>
        )}
      </div>
    </div>
  );
}

// ─── SM Plan Item (read-only) ─────────────────────────────────────
function SMPlanItem({ item }) {
  const stCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",
      background:stCfg.bg,borderRadius:8,marginBottom:6,border:`1px solid ${stCfg.border}`}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:600,fontSize:13}}>{item.name}</div>
        {item.phone && <div style={{fontSize:11,color:"#6b7280"}}>{item.phone}</div>}
        {item.specialty && <div style={{fontSize:11,color:"#6b7280"}}>{item.specialty}</div>}
      </div>
      <span style={{fontSize:11,fontWeight:700,color:stCfg.color,flexShrink:0}}>{stCfg.label}</span>
      {item.isManual && !item.matchedCtvCode && (
        <span style={{fontSize:10,color:ORANGE,flexShrink:0}}>⚠ Chưa có mã</span>
      )}
    </div>
  );
}

// ─── Add KH Modal ─────────────────────────────────────────────────
function AddKHModal({ dayKey, dayLabel, customers, onAdd, onClose }) {
  const [mode, setMode] = useState("search"); // "search" | "manual"
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name:"", phone:"", address:"", specialty:"", note:"" });

  const filtered = search.length >= 2
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.ctvCode?.includes(search)
      ).slice(0, 10)
    : [];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:200,display:"flex",alignItems:"flex-end"}}>
      <div style={{background:"#fff",width:"100%",maxWidth:480,margin:"0 auto",borderRadius:"16px 16px 0 0",
        padding:20,maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:700,fontSize:16}}>Thêm KH — {dayLabel}</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#6b7280"}}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["search","🔍 Tìm từ danh sách"],["manual","✏️ Thêm thủ công"]].map(([m,l]) => (
            <button key={m} onClick={() => setMode(m)}
              style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,
                background:mode===m?BLUE:"#f3f4f6",color:mode===m?"#fff":"#374151"}}>
              {l}
            </button>
          ))}
        </div>

        {mode === "search" ? (
          <>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Tìm tên, SĐT, mã CTV..."
              style={{width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,fontSize:14,
                boxSizing:"border-box",marginBottom:10}}/>
            {filtered.length === 0 && search.length >= 2 && (
              <div style={{textAlign:"center",color:"#9ca3af",fontSize:13,padding:"20px 0"}}>
                Không tìm thấy — thử thêm thủ công
              </div>
            )}
            {filtered.map(c => (
              <div key={c.id} onClick={() => onAdd(c)}
                style={{padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,marginBottom:8,
                  cursor:"pointer",background:"#fff",transition:"background .15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
                onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
                <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
                <div style={{fontSize:12,color:"#6b7280"}}>{c.phone} · {c.specialty} · #{c.ctvCode}</div>
              </div>
            ))}
          </>
        ) : (
          <>
            {["name","phone","address","specialty","note"].map(field => (
              <div key={field} style={{marginBottom:10}}>
                <label style={{display:"block",fontSize:12,fontWeight:600,color:"#374151",marginBottom:4}}>
                  {field==="name"?"Tên KH/BS *":field==="phone"?"SĐT":field==="address"?"Địa chỉ":
                    field==="specialty"?"Chuyên khoa":"Ghi chú"}
                </label>
                <input value={form[field]} onChange={e=>setForm(p=>({...p,[field]:e.target.value}))}
                  style={{width:"100%",padding:"9px 12px",border:"1px solid #e5e7eb",borderRadius:8,
                    fontSize:14,boxSizing:"border-box"}}/>
              </div>
            ))}
            <button onClick={() => { if(form.name) onAdd({ ...form, ctvCode:"" }); }}
              disabled={!form.name}
              style={{width:"100%",padding:"12px",background:form.name?BLUE:"#e5e7eb",
                color:form.name?"#fff":"#9ca3af",border:"none",borderRadius:10,
                cursor:form.name?"pointer":"not-allowed",fontWeight:700,fontSize:15,marginTop:4}}>
              Thêm vào kế hoạch
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Match CTV Modal ──────────────────────────────────────────────
function MatchCTVModal({ item, customers, onMatch, onClose }) {
  const [search, setSearch] = useState(item.phone || item.name || "");

  const filtered = search.length >= 2
    ? customers.filter(c =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.ctvCode?.includes(search)
      ).slice(0, 8)
    : [];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:16,padding:20,width:"100%",maxWidth:420,maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:15}}>Ghép nối mã CTV</div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#6b7280"}}>✕</button>
        </div>
        <div style={{background:"#fef3c7",borderRadius:8,padding:"8px 12px",fontSize:13,color:"#92400e",marginBottom:14}}>
          <b>{item.name}</b> chưa có mã CTV. Tìm và ghép với KH tương ứng trong hệ thống để lịch sử activity được liên kết.
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Tìm tên, SĐT, mã CTV..."
          style={{width:"100%",padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,
            fontSize:14,boxSizing:"border-box",marginBottom:10}}/>
        {filtered.map(c => (
          <div key={c.id} onClick={() => onMatch(c.ctvCode)}
            style={{padding:"10px 12px",border:"1px solid #e5e7eb",borderRadius:8,marginBottom:8,
              cursor:"pointer",background:"#fff"}}
            onMouseEnter={e=>e.currentTarget.style.background="#f0f9ff"}
            onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
            <div style={{fontWeight:700,fontSize:14}}>{c.name}</div>
            <div style={{fontSize:12,color:"#6b7280"}}>{c.phone} · #{c.ctvCode} · {c.specialty}</div>
          </div>
        ))}
        {filtered.length === 0 && search.length >= 2 && (
          <div style={{textAlign:"center",color:"#9ca3af",fontSize:13,padding:16}}>
            Không tìm thấy trong danh sách — KH này chưa có mã CTV
          </div>
        )}
        <button onClick={onClose}
          style={{width:"100%",padding:"10px",background:"#f3f4f6",border:"none",borderRadius:8,
            cursor:"pointer",fontSize:13,color:"#374151",marginTop:8,fontWeight:600}}>
          Bỏ qua — ghép sau
        </button>
      </div>
    </div>
  );
}
