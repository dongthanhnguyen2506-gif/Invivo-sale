import { useState, useEffect } from "react";

// ─── Constants ───────────────────────────────────────────────────
const BLUE = "#1a56db";
const RED  = "#c0392b";

export const CUSTOMER_TIERS = [
  { id:"K", label:"K — KOL",       sub:"Khách hàng triệu mẫu", color:"#7c3aed", bg:"#f5f3ff" },
  { id:"A", label:"A — Diamond",   sub:"Kim cương",            color:"#0369a1", bg:"#e0f2fe" },
  { id:"B", label:"B — Platinum",  sub:"Bạch kim",             color:"#1a56db", bg:"#eaf0ff" },
  { id:"C", label:"C — Gold",      sub:"Vàng",                 color:"#b45309", bg:"#fff8e6" },
  { id:"D", label:"D — Silver",    sub:"Bạc",                  color:"#6b7280", bg:"#f4f4f5" },
];

export const WALLET_RANGES = [
  "< 10,000,000",
  "10,000,000 – 20,000,000",
  "20,000,000 – 40,000,000",
  "40,000,000 – 80,000,000",
  "80,000,000 – 150,000,000",
  "150,000,000 – 300,000,000",
  "> 300,000,000",
];

const UNIT_TYPES   = ["Bệnh viện","Phòng khám","Cơ sở dịch vụ cận lâm sàng","Cá nhân"];
const OWNERSHIP    = ["Tư nhân","Công lập"];
const PATIENT_VOL  = ["< 250","250 – 700","> 700"];
const TEST_RATE    = ["< 30%","30% – 70%","> 70%"];
const INTERNAL_LAB = ["Có","Không","Một phần"];
const SEND_FREQ    = ["Hàng ngày","Hàng tuần","Hàng tháng","Hàng quý"];
const TEST_GROUPS  = [
  "Thường quy (Sinh hóa, Miễn dịch cơ bản, Huyết học...)",
  "Nâng cao (SHPT, Miễn dịch nâng cao, Vi sinh...)",
  "Chuyên sâu (Giải phẫu bệnh, SHPT-Di truyền...)",
];
const DIFFICULTIES = ["Thời gian trả kết quả","Dịch vụ lấy/gom mẫu","Hỗ trợ tư vấn kết quả","Chính sách thương mại","Chất lượng"];
const KQXN_PDF     = ["SMS bệnh nhân","SMS CS/BS","Mail bệnh nhân","Mail CS/BS"];
const PAYMENT_TYPES = ["Thanh toán trực tiếp","Thanh toán theo tháng"];
const CK_TYPES      = ["Chiết khấu trực tiếp","Chiết khấu theo tháng"];
const EXPLOIT_3M    = ["< 20%","20 – 40%","40 – 60%","> 60%"];
const GROWTH_3M     = ["0 – 10%","10 – 25%","25 – 50%","> 50%"];

// ─── Shared styles ────────────────────────────────────────────────
const FI = {
  width:"100%", background:"#f8fafc", border:"1.5px solid #e5e7eb",
  borderRadius:8, padding:"9px 12px", color:"#111827", fontSize:14,
  fontFamily:"inherit", outline:"none", appearance:"none", WebkitAppearance:"none",
};
const LBL = {
  display:"block", fontSize:10, fontWeight:700, color:"#6b7280",
  letterSpacing:".08em", textTransform:"uppercase", marginBottom:5,
};
const SEC = {
  fontSize:11, fontWeight:700, color:"#374151", letterSpacing:".05em",
  textTransform:"uppercase", marginBottom:12, marginTop:4,
  paddingBottom:6, borderBottom:"1.5px solid #f1f5f9",
};

// ─── Sub-components ───────────────────────────────────────────────
function Field({ label, required, children, span2 }) {
  return (
    <div style={{ marginBottom:13, gridColumn:span2?"span 2":undefined }}>
      {label && <label style={LBL}>{label}{required&&<span style={{color:RED}}> *</span>}</label>}
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, onFocus, onBlur }) {
  return (
    <input style={FI} value={value||""} onChange={onChange} placeholder={placeholder||""}
      onFocus={e=>{e.target.style.borderColor=BLUE;onFocus&&onFocus(e);}}
      onBlur={e=>{e.target.style.borderColor="#e5e7eb";onBlur&&onBlur(e);}}/>
  );
}

function TextArea({ value, onChange, rows=2 }) {
  return (
    <textarea style={{...FI,resize:"vertical"}} rows={rows} value={value||""}
      onChange={onChange}
      onFocus={e=>e.target.style.borderColor=BLUE}
      onBlur={e=>e.target.style.borderColor="#e5e7eb"}/>
  );
}

function CheckGroup({ options, selected=[], onChange, multi=true }) {
  const toggle = (opt) => {
    if (multi) {
      const next = selected.includes(opt)
        ? selected.filter(x=>x!==opt)
        : [...selected, opt];
      onChange(next);
    } else {
      onChange(selected===opt ? "" : opt);
    }
  };
  return (
    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
      {options.map(opt => {
        const active = multi ? selected.includes(opt) : selected===opt;
        return (
          <button key={opt} type="button" onClick={()=>toggle(opt)}
            style={{padding:"5px 12px",borderRadius:16,border:"1.5px solid",fontSize:12,
              fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all .12s",
              background:active?BLUE_L:"#fff", borderColor:active?BLUE:"#e5e7eb",
              color:active?BLUE:"#6b7280"}}>
            {active?"✓ ":""}{opt}
          </button>
        );
      })}
    </div>
  );
}
const BLUE_L = "#eaf0ff";

function TierPicker({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {CUSTOMER_TIERS.map(t=>{
        const active = value===t.id;
        return (
          <button key={t.id} type="button" onClick={()=>onChange(active?"":t.id)}
            style={{padding:"8px 14px",borderRadius:10,border:`2px solid ${active?t.color:"#e5e7eb"}`,
              background:active?t.bg:"#fff",cursor:"pointer",fontFamily:"inherit",transition:"all .15s",
              textAlign:"left",minWidth:90}}>
            <div style={{fontSize:13,fontWeight:800,color:active?t.color:"#374151"}}>{t.label}</div>
            <div style={{fontSize:10,color:active?t.color:"#9ca3af",marginTop:1}}>{t.sub}</div>
          </button>
        );
      })}
    </div>
  );
}

function SectionHeader({ icon, title, color="#374151" }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,margin:"18px 0 14px",
      paddingBottom:8,borderBottom:`2px solid ${color}22`}}>
      <span style={{fontSize:18}}>{icon}</span>
      <span style={{fontWeight:800,fontSize:14,color,letterSpacing:"-.01em"}}>{title}</span>
    </div>
  );
}

function CompletionBar({ kyc }) {
  // Score completeness
  const checks = [
    kyc?.unitType, kyc?.contactName, kyc?.phone,
    kyc?.specialty, kyc?.patientVolume, kyc?.testRate,
    kyc?.kqxnFormat?.length, kyc?.wallet, kyc?.tier,
  ];
  const filled = checks.filter(Boolean).length;
  const pct = Math.round((filled / checks.length) * 100);
  const color = pct===100?"#0d7a4e":pct>=60?BLUE:"#b45309";
  return (
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
        <span style={{color:"#6b7280",fontWeight:600}}>Mức độ hoàn thiện KYC</span>
        <span style={{fontWeight:800,color}}>{pct}%</span>
      </div>
      <div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:6,width:`${pct}%`,borderRadius:3,background:color,transition:"width .5s ease"}}/>
      </div>
    </div>
  );
}

// ─── Main KYC Component ──────────────────────────────────────────
export default function KYCPanel({
  kh,           // customer object
  onSave,       // fn(updatedKH)
  onClose,      // fn()
  canEditTier,  // bool: SM/Board can edit section IV
  currentUser,
}) {
  const [tab, setTab] = useState("info");
  const [kyc, setKyc] = useState({});
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (kh) {
      setKyc(kh.kyc || {});
      setDirty(false);
    }
  }, [kh?.id]);

  const set = (field, val) => {
    setKyc(prev => ({ ...prev, [field]: val }));
    setDirty(true);
  };

  const handleSave = () => {
    onSave({ ...kh, kyc: { ...kyc, updatedAt: new Date().toISOString(), updatedBy: currentUser } });
    setDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!kh) return null;

  const TABS = [
    { id:"info",  icon:"🏥", label:"Thông tin KH" },
    { id:"collab",icon:"🤝", label:"Hợp tác" },
    { id:"needs", icon:"📋", label:"Nhu cầu" },
    ...(canEditTier ? [{ id:"eval", icon:"⭐", label:"Đánh giá" }] : []),
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",fontFamily:"'Be Vietnam Pro',sans-serif"}}>
      {/* Header */}
      <div style={{padding:"16px 20px",borderBottom:"1.5px solid #f1f5f9",background:"#fff",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#111827"}}>{kh.name}</div>
            <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>
              {kh.phone} {kh.specialty&&`· ${kh.specialty}`} {kh.district&&`· ${kh.district}`}
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {kyc.tier && (
              <span style={{
                padding:"4px 12px",borderRadius:16,fontSize:12,fontWeight:800,
                background:CUSTOMER_TIERS.find(t=>t.id===kyc.tier)?.bg||"#f4f4f5",
                color:CUSTOMER_TIERS.find(t=>t.id===kyc.tier)?.color||"#6b7280",
                border:`1.5px solid ${CUSTOMER_TIERS.find(t=>t.id===kyc.tier)?.color||"#9ca3af"}`,
              }}>
                {kyc.tier}
              </span>
            )}
            <button onClick={onClose}
              style={{background:"#f8fafc",border:"1.5px solid #e5e7eb",borderRadius:8,
                color:"#6b7280",fontSize:13,padding:"6px 10px",cursor:"pointer",fontFamily:"inherit"}}>
              ✕
            </button>
          </div>
        </div>
        <CompletionBar kyc={kyc}/>
        {/* Tab bar */}
        <div style={{display:"flex",gap:4,overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{padding:"7px 14px",borderRadius:8,border:"1.5px solid",fontSize:12,fontWeight:700,
                cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",transition:"all .12s",
                background:tab===t.id?BLUE:"#fff",
                borderColor:tab===t.id?BLUE:"#e5e7eb",
                color:tab===t.id?"#fff":"#6b7280"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>

        {/* ── TAB: THÔNG TIN KH ── */}
        {tab==="info" && (
          <>
            <SectionHeader icon="🏥" title="A. Thông tin cơ sở khám chữa bệnh" color={BLUE}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="Tên cơ sở / Bác sĩ" required span2>
                <TextInput value={kyc.orgName||kh.name} onChange={e=>set("orgName",e.target.value)}/>
              </Field>
              <Field label="Số điện thoại" required>
                <TextInput value={kyc.phone||kh.phone} onChange={e=>set("phone",e.target.value)}/>
              </Field>
              <Field label="Email">
                <TextInput value={kyc.email} onChange={e=>set("email",e.target.value)} placeholder="example@email.com"/>
              </Field>
              <Field label="Địa chỉ" required span2>
                <TextInput value={kyc.address||kh.address} onChange={e=>set("address",e.target.value)}/>
              </Field>
              <Field label="Loại hình đơn vị">
                <select style={FI} value={kyc.unitType||""} onChange={e=>set("unitType",e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {UNIT_TYPES.map(u=><option key={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Hình thức sở hữu">
                <select style={FI} value={kyc.ownership||""} onChange={e=>set("ownership",e.target.value)}>
                  <option value="">-- Chọn --</option>
                  {OWNERSHIP.map(u=><option key={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Chuyên khoa chính" span2>
                <TextInput value={kyc.specialty||kh.specialty} onChange={e=>set("specialty",e.target.value)} placeholder="Mô tả chuyên khoa, mô hình hoạt động..."/>
              </Field>
              <Field label="Tên người đại diện">
                <TextInput value={kyc.repName} onChange={e=>set("repName",e.target.value)}/>
              </Field>
              <Field label="Mã số thuế">
                <TextInput value={kyc.taxCode} onChange={e=>set("taxCode",e.target.value)}/>
              </Field>
              <Field label="Số giấy phép hoạt động" span2>
                <TextInput value={kyc.licenseNo} onChange={e=>set("licenseNo",e.target.value)}/>
              </Field>
            </div>

            <SectionHeader icon="⭐" title="Ngày quan trọng" color="#b45309"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="Ngày thành lập / Kỷ niệm">
                <input type="date" style={FI} value={kyc.anniversaryDate||""}
                  onChange={e=>set("anniversaryDate",e.target.value)}/>
              </Field>
              <Field label="Mô tả ngày kỷ niệm">
                <TextInput value={kyc.anniversaryNote} onChange={e=>set("anniversaryNote",e.target.value)} placeholder="VD: Ngày thành lập PK"/>
              </Field>
              <Field label="Sinh nhật BS / Người quan trọng">
                <input type="date" style={FI} value={kyc.birthdayDate||""}
                  onChange={e=>set("birthdayDate",e.target.value)}/>
              </Field>
              <Field label="Tên người">
                <TextInput value={kyc.birthdayName} onChange={e=>set("birthdayName",e.target.value)} placeholder="BS. Nguyễn Thị Lan"/>
              </Field>
            </div>

            <SectionHeader icon="👤" title="Đầu mối liên hệ" color="#6b7280"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="Đầu mối chuyên môn — Họ tên">
                <TextInput value={kyc.contactTech} onChange={e=>set("contactTech",e.target.value)}/>
              </Field>
              <Field label="SĐT chuyên môn">
                <TextInput value={kyc.contactTechPhone} onChange={e=>set("contactTechPhone",e.target.value)}/>
              </Field>
              <Field label="Đầu mối thương mại — Họ tên">
                <TextInput value={kyc.contactBiz} onChange={e=>set("contactBiz",e.target.value)}/>
              </Field>
              <Field label="SĐT thương mại">
                <TextInput value={kyc.contactBizPhone} onChange={e=>set("contactBizPhone",e.target.value)}/>
              </Field>
            </div>
          </>
        )}

        {/* ── TAB: HỢP TÁC ── */}
        {tab==="collab" && (
          <>
            <SectionHeader icon="📄" title="A. Kết quả xét nghiệm" color={BLUE}/>
            <Field label="Hiển thị tên CS trên KQXN">
              <CheckGroup options={["Có","Không"]} selected={kyc.showOrgOnResult||""} multi={false}
                onChange={v=>set("showOrgOnResult",v)}/>
            </Field>
            <Field label="Hình thức nhận KQXN (PDF)">
              <CheckGroup options={KQXN_PDF} selected={kyc.kqxnFormat||[]}
                onChange={v=>set("kqxnFormat",v)}/>
            </Field>
            <Field label="Email trả KQXN của CS/BS">
              <TextInput value={kyc.kqxnEmail} onChange={e=>set("kqxnEmail",e.target.value)} placeholder="email@phongkham.vn"/>
            </Field>
            <Field label="Hình thức nhận KQXN bản cứng">
              <CheckGroup options={["Địa chỉ bệnh nhân","Địa chỉ CS/BS"]} selected={kyc.kqxnHard||""} multi={false}
                onChange={v=>set("kqxnHard",v)}/>
            </Field>

            <SectionHeader icon="💰" title="B. Chính sách thương mại" color="#0d7a4e"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Field label="Mức chiết khấu" span2>
                <TextInput value={kyc.discount} onChange={e=>set("discount",e.target.value)} placeholder="VD: 20%, hoặc mô tả cụ thể"/>
              </Field>
              <Field label="Hình thức thanh toán">
                <CheckGroup options={PAYMENT_TYPES} selected={kyc.paymentType||""} multi={false}
                  onChange={v=>set("paymentType",v)}/>
              </Field>
              <Field label="Hình thức chiết khấu">
                <CheckGroup options={CK_TYPES} selected={kyc.ckType||""} multi={false}
                  onChange={v=>set("ckType",v)}/>
              </Field>
              <Field label="Ghi chú thương mại" span2>
                <TextArea value={kyc.commercialNote} onChange={e=>set("commercialNote",e.target.value)} rows={2}/>
              </Field>
            </div>
          </>
        )}

        {/* ── TAB: NHU CẦU ── */}
        {tab==="needs" && (
          <>
            <SectionHeader icon="📊" title="1. Tổng quan quy mô" color={BLUE}/>
            <Field label="Tổng số bệnh nhân / tháng">
              <CheckGroup options={PATIENT_VOL} selected={kyc.patientVolume||""} multi={false}
                onChange={v=>set("patientVolume",v)}/>
            </Field>
            <Field label="Tỷ lệ BN cần xét nghiệm">
              <CheckGroup options={TEST_RATE} selected={kyc.testRate||""} multi={false}
                onChange={v=>set("testRate",v)}/>
            </Field>
            <Field label="Đơn vị có XN nội bộ không?">
              <CheckGroup options={INTERNAL_LAB} selected={kyc.internalLab||""} multi={false}
                onChange={v=>set("internalLab",v)}/>
            </Field>

            <SectionHeader icon="🔬" title="2. Hiện trạng hợp tác" color="#7c3aed"/>
            <Field label="Đang hợp tác với PXN nào?">
              <TextInput value={kyc.currentPartner} onChange={e=>set("currentPartner",e.target.value)} placeholder="Tên đơn vị xét nghiệm hiện tại"/>
            </Field>
            <Field label="Tần suất gửi mẫu">
              <CheckGroup options={SEND_FREQ} selected={kyc.sendFreq||""} multi={false}
                onChange={v=>set("sendFreq",v)}/>
            </Field>
            <Field label="Nhóm xét nghiệm gửi nhiều nhất">
              <CheckGroup options={TEST_GROUPS} selected={kyc.testGroups||[]}
                onChange={v=>set("testGroups",v)}/>
            </Field>
            <Field label="Khó khăn với đối tác hiện tại">
              <CheckGroup options={DIFFICULTIES} selected={kyc.difficulties||[]}
                onChange={v=>set("difficulties",v)}/>
            </Field>
            <Field label="Ghi chú hiện trạng">
              <TextArea value={kyc.currentNote} onChange={e=>set("currentNote",e.target.value)}/>
            </Field>

            <SectionHeader icon="🚀" title="3. Nhu cầu hợp tác khác" color="#0369a1"/>
            {[
              { key:"needNewTest",  label:"Có nhu cầu triển khai xét nghiệm mới? (NIPT, gene lặn, SHPT...)" },
              { key:"needFastResult", label:"Yêu cầu đặc biệt về thời gian trả kết quả?" },
              { key:"needSample",   label:"Yêu cầu đặc biệt về lấy mẫu / gom mẫu?" },
              { key:"needTraining", label:"Mong muốn đào tạo / cập nhật kiến thức định kỳ?" },
              { key:"needMarketing",label:"Mong muốn hợp tác marketing chung?" },
            ].map(({key,label})=>(
              <div key={key} style={{marginBottom:14,padding:"10px 14px",background:"#f8fafc",borderRadius:10,border:"1px solid #f1f5f9"}}>
                <div style={{fontSize:13,color:"#374151",marginBottom:8,fontWeight:500}}>{label}</div>
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  {["Có","Không"].map(opt=>(
                    <button key={opt} type="button" onClick={()=>set(key, kyc[key]===opt?"":opt)}
                      style={{padding:"5px 16px",borderRadius:16,border:"1.5px solid",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",
                        background:kyc[key]===opt?(opt==="Có"?"#e8faf3":"#fef2f2"):"#fff",
                        borderColor:kyc[key]===opt?(opt==="Có"?"#0d7a4e":RED):"#e5e7eb",
                        color:kyc[key]===opt?(opt==="Có"?"#0d7a4e":RED):"#6b7280"}}>
                      {opt}
                    </button>
                  ))}
                </div>
                {kyc[key]==="Có" && (
                  <TextArea value={kyc[key+"Note"]} onChange={e=>set(key+"Note",e.target.value)} rows={1}/>
                )}
              </div>
            ))}
          </>
        )}

        {/* ── TAB: ĐÁNH GIÁ (SM/Board only) ── */}
        {tab==="eval" && canEditTier && (
          <>
            <SectionHeader icon="⭐" title="IV. Đánh giá & Phân loại KH" color="#b45309"/>
            <Field label="Đánh giá sơ bộ của NVKD">
              <TextArea value={kyc.nvkdEval} onChange={e=>set("nvkdEval",e.target.value)} rows={2}/>
            </Field>
            <Field label="Đánh giá rà soát của GĐKD">
              <TextArea value={kyc.smEval} onChange={e=>set("smEval",e.target.value)} rows={2}/>
            </Field>

            <Field label="Ước tính Wallet size / tháng">
              <CheckGroup options={WALLET_RANGES} selected={kyc.wallet||""} multi={false}
                onChange={v=>set("wallet",v)}/>
            </Field>
            <Field label="Khả năng khai thác 3 tháng đầu">
              <CheckGroup options={EXPLOIT_3M} selected={kyc.exploit3m||""} multi={false}
                onChange={v=>set("exploit3m",v)}/>
            </Field>
            <Field label="Khả năng tăng trưởng 3 tháng tiếp">
              <CheckGroup options={GROWTH_3M} selected={kyc.growth3m||""} multi={false}
                onChange={v=>set("growth3m",v)}/>
            </Field>

            <Field label="Đề xuất phân loại khách hàng">
              <TierPicker value={kyc.tier} onChange={v=>set("tier",v)}/>
            </Field>

            {kyc.updatedAt && (
              <div style={{marginTop:12,fontSize:11,color:"#9ca3af",fontStyle:"italic"}}>
                Cập nhật lần cuối: {new Date(kyc.updatedAt).toLocaleString("vi-VN")} bởi {kyc.updatedBy}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer save bar */}
      <div style={{padding:"12px 20px",borderTop:"1.5px solid #f1f5f9",background:"#fff",flexShrink:0,
        display:"flex",gap:10,alignItems:"center"}}>
        {saved && <span style={{fontSize:12,color:"#0d7a4e",fontWeight:700}}>✓ Đã lưu</span>}
        {dirty && !saved && <span style={{fontSize:12,color:"#b45309",fontWeight:600}}>● Chưa lưu</span>}
        <div style={{flex:1}}/>
        <button onClick={onClose}
          style={{padding:"9px 18px",background:"#f8fafc",border:"1.5px solid #e5e7eb",borderRadius:8,
            color:"#6b7280",fontFamily:"inherit",fontWeight:600,fontSize:13,cursor:"pointer"}}>
          Đóng
        </button>
        <button onClick={handleSave}
          style={{padding:"9px 22px",background:dirty?BLUE:"#9ca3af",border:"none",borderRadius:8,
            color:"#fff",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:dirty?"pointer":"not-allowed",
            boxShadow:dirty?"0 4px 12px rgba(26,86,219,.3)":"none",transition:"all .2s"}}>
          Lưu KYC
        </button>
      </div>
    </div>
  );
}

// ─── KYC Drawer wrapper ─────────────────────────────────────────
export function KYCDrawer({ kh, onSave, onClose, canEditTier, currentUser }) {
  if (!kh) return null;
  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose}
        style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:200,
          animation:"fadeIn .15s ease"}}/>
      {/* Drawer */}
      <div style={{
        position:"fixed",top:0,right:0,bottom:0,width:"min(520px,100vw)",
        background:"#fff",zIndex:201,display:"flex",flexDirection:"column",
        boxShadow:"-8px 0 40px rgba(0,0,0,.15)",
        animation:"slideIn .2s ease",
      }}>
        <KYCPanel kh={kh} onSave={onSave} onClose={onClose}
          canEditTier={canEditTier} currentUser={currentUser}/>
      </div>
      <style>{`
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
      `}</style>
    </>
  );
}

