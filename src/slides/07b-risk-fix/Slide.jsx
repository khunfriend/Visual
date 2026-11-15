import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { fmt } from '../../components/charts/kit.jsx'
import { map, risk, scenarios } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 07b (หน้า 7 บนจอ): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md · หมายเลขจุดตรงกับแผนที่หน้า 6 (จุดเสี่ยง)
// ค่าใช้จ่ายเป็น "ประมาณการเบื้องต้น" ตามที่ผู้ใช้ขอ (12 พ.ย.) ไม่ใช่ราคากลาง · ราคาต่อหน่วยบันทึกใน ข้อมูลรวม (สถานะ ❓)

// ราคาต่อหน่วย (บาท) · CCTV อิงงบติดตั้งกล้องใหม่ของสำนักการจราจรฯ ปีงบ 2569 (63.4 ล้าน ÷ 922 ตัว ≈ 68,800 จากข่าว) ที่เหลือเป็นค่าประมาณ
const UNIT = {
  cctv: { label: 'CCTV', unit: 'ตัว', price: 70000 },
  led: { label: 'โคมไฟ LED พร้อมเสา', unit: 'ชุด', price: 16000 },
  trim: { label: 'ตัดแต่งสวน', unit: 'จุด', price: 50000 },
  guard: { label: 'อาสาจราจร', unit: 'คน-วัน', price: 400 },
  cross: { label: 'ทางข้าม+ป้าย', unit: 'จุด', price: 30000 },
  vacant: { label: 'เก็บขยะ รั้ว ปรับเป็นสวนหย่อม', unit: 'แห่ง', price: 300000 },
}
const line = (key, qty) => ({ ...UNIT[key], qty, sum: UNIT[key].price * qty })

const points = map.risk.points.map((p, i) => ({ ...p, no: i + 1 }))
const total = points.length // 17
const target = scenarios.cases.find((c) => c.key === 'target').crime // 9 (ฉากทัศน์ "ปีแรก ตามเป้า" ในหน้าสรุป)
const { lo, hi } = risk.scoreFormula
const score = (n) => 1 + (49 * (hi - n)) / (hi - lo) // สูตรคะแนนด้านจุดเสี่ยงของ Bangkok Index

// วิธีแก้ต่อประเภท (ข้อเสนอของกลุ่ม) · ชื่อประเภทตรงกับข้อมูล กทม.
const PLAN = {
  'จุดล่อแหลมต่อการเกิดอาชญากรรม': {
    short: 'ล่อแหลมต่ออาชญากรรม',
    problem: 'สวน หน้าโรงเรียน หน้าห้างและสถานี MRT มีมุมอับ มองจากถนนไม่เห็น',
    fix: 'ติด CCTV · เพิ่มไฟ · ตัดพุ่มไม้ · จุดตรวจตำรวจ/เทศกิจ',
    cost: [line('cctv', 20), line('led', 30), line('trim', 4)], // 2 กล้อง + 3 โคมต่อจุด · ตัดแต่งเฉพาะ 4 จุดที่เป็นสวน
  },
  'ประชากรหนาแน่น/พลุกพล่าน': {
    short: 'คนหนาแน่น/พลุกพล่าน',
    problem: 'หน้าโรงเรียนช่วงรับส่งและหน้าห้าง คนแน่น เสี่ยงล้วงกระเป๋า',
    fix: 'เทศกิจ/อาสาจราจรช่วงเช้าเย็น · ทางข้ามชัดเจน · ป้ายเตือน',
    cost: [line('guard', 2 * 5 * 200), line('cross', 5)], // 2 คน × 5 จุด × 200 วันเรียน
  },
  'จุดรกร้าง/พื้นที่ลักลอบทิ้งขยะ': {
    short: 'ที่รกร้าง/ทิ้งขยะ',
    problem: 'ที่รกร้าง ขยะถูกทิ้ง เป็นที่หลบซ่อน',
    fix: 'เก็บขยะ ล้อมรั้ว · ขอเจ้าของที่ทำสวนหย่อมชั่วคราว',
    cost: [line('vacant', 1)],
  },
  'จุดมืด จุดเปลี่ยว': {
    short: 'จุดมืด/เปลี่ยว',
    problem: 'ใต้ทางด่วนมืดและเปลี่ยว',
    fix: 'ไฟ LED + CCTV · ขอพื้นที่จาก กทพ. ทำลานกีฬา',
    cost: [line('led', 10), line('cctv', 4)],
  },
}

const typeRows = Object.keys(PLAN).map((type) => ({
  type,
  ...PLAN[type],
  pts: points.filter((p) => p.type === type).map((p) => p.no),
  sum: PLAN[type].cost.reduce((a, c) => a + c.sum, 0),
}))
const grand = typeRows.reduce((a, r) => a + r.sum, 0)
const mb = (b) => (b / 1e6).toFixed(2)

export default function RiskFix() {
  const [open, setOpen] = useState({})
  return (
    <SlideFrame
      kicker="09 · แก้จุดเสี่ยง"
      title="จุดเสี่ยง 4 ประเภท แก้อย่างไร ใช้เงินเท่าไร"
      source="ที่มา: ข้อมูลจุดเสี่ยง กทม. ปี 2567–2568 · ค่าใช้จ่ายเป็นประมาณการของกลุ่ม"
    >
      <div className={s.page}>
        <div className={s.table} role="table">
          <div className={`${s.row} ${s.head}`} role="row">
            <span>ประเภท</span>
            <span>ปัญหา</span>
            <span>วิธีแก้</span>
            <span>ใช้เงิน</span>
          </div>
          {typeRows.map((r) => (
            <div key={r.type} className={s.row} role="row">
              <div className={s.typeCell}>
                <b>
                  <i className={s.dot} style={{ background: color.riskType[r.type] }} />
                  {r.short}
                </b>
                <span className={s.count}>{r.pts.length} จุด</span>
              </div>
              <p className={s.text}>{r.problem}</p>
              <p className={s.text}>{r.fix}</p>
              <div className={s.costCell}>
                <b className={`${s.money} num`}>{mb(r.sum)} <small>ล้านบาท</small></b>
                <button
                  type="button" className={s.detailBtn} aria-expanded={!!open[r.type]}
                  onClick={() => setOpen((o) => ({ ...o, [r.type]: !o[r.type] }))}
                >
                  {open[r.type] ? 'ซ่อนรายละเอียด ▴' : 'ดูรายละเอียด ▾'}
                </button>
                {open[r.type] && r.cost.map((c) => (
                  <span key={c.label} className={s.detail}>
                    {c.label} {c.qty.toLocaleString('th-TH')} {c.unit} × {c.price.toLocaleString('th-TH')}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={s.footer}>
          <div className={s.goal}>
            <span>เป้าปีแรก</span>
            <b className="num">{total} → {target} จุด</b>
            <span className={s.muted}>คะแนนด้านจุดเสี่ยง {score(total).toFixed(2)} → {score(target).toFixed(2)}</span>
          </div>
          <div className={s.goal}>
            <span>งบรวม (ประมาณการ)</span>
            <b className="num">{mb(grand)} ล้านบาท</b>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}
