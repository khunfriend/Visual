import SlideFrame from '../../components/SlideFrame.jsx'
import { flood, scenarios } from '../../lib/data.js'
import s from './style.module.css'

// สไลด์ 02b (หน้า 3 บนจอ): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md
// ค่าใช้จ่าย = ประมาณการของกลุ่ม (จำนวน × ราคาต่อหน่วย) ไม่ใช่ราคากลาง · ลอกท่อและสำรวจออกแบบอยู่ในช่วงราคาของร่างงบ xlsx ชีต 9

const hs = flood.dindaeng.hotspots
const nSpots = hs.length // 11 จุดท่วมปี 2568
// จุดที่ท่อเล็ก ระบายไม่ทัน (ยังไม่อยู่ในบัญชีจุดเสี่ยงน้ำท่วม กทม.)
const PIPE_SPOTS = ['ประชาสุข ซอยอินทามระ 34', 'ประชาสุข ซอยอินทามระ 45–53', 'ประชาสงเคราะห์ ซอยเปรมสมบัติ แยก 33']
// จุดที่ต้องเร่งระบายลงคลอง
const OUTLET_SPOTS = ['รัชดาภิเษก แยกเทียมร่วมมิตร', 'ถนนดินแดง หน้าโรงเรียนพิบูลประชาสรรค์']
const cnt = (names) => names.reduce((a, n) => a + (hs.find((h) => h.spot === n)?.count || 0), 0)

const line = (label, qty, unit, price) => ({ label, qty, unit, price, sum: qty * price })
const GROUPS = [
  {
    title: 'ปรับปรุงระบบท่อระบายน้ำ',
    kind: 'ครั้งเดียว',
    where: `${PIPE_SPOTS.length + OUTLET_SPOTS.length} จุดที่ท่วมซ้ำ (รวม ${cnt([...PIPE_SPOTS, ...OUTLET_SPOTS])} ครั้งในปี 68)`,
    steps: [
      'ขยายขนาดท่อในจุดที่น้ำมากเกินความสามารถของท่อ',
      'เพิ่มท่อในจุดที่น้ำสะสมเป็นประจำ',
      'ปรับแนวท่อให้ระบายลงคลอง/ระบบหลักได้เร็วขึ้น',
    ],
    cost: [
      line('สำรวจและออกแบบ', PIPE_SPOTS.length, 'จุด', 800000),
      line('ขยาย/เพิ่มท่อ Ø 1.00 ม.', PIPE_SPOTS.length * 300, 'ม.', 20000),
      line('ท่อลอดถนนลงคลอง', OUTLET_SPOTS.length, 'จุด', 1500000),
    ],
  },
  {
    title: 'เพิ่มประสิทธิภาพการบำรุงรักษา',
    kind: 'ต่อปี',
    where: `ทุกจุดที่ท่วมปี 68 (${nSpots} จุด)`,
    steps: [
      'ลอกท่อและกำจัดตะกอนอย่างสม่ำเสมอ',
      'เก็บขยะที่อุดตันช่องรับน้ำ',
      'ตรวจระบบระบายน้ำก่อนเข้าฤดูฝน',
    ],
    cost: [
      // ราคากลางลอกท่อ: สนน. ประมูลปี 2561 ราคากลาง 24,891,000 บาท ยาว 307,230 ม. ≈ 81 บาท/ม. · สมมติท่อจุดละ 500 ม.
      line('ลอกท่อเพิ่ม 3 รอบ (จุดละ 500 ม.)', nSpots * 500 * 3, 'ม.', 81),
      // ค่าแรงขั้นต่ำ กทม. 400 บาท/วัน (มีผล 1 ก.ค. 2568)
      line('ทีมเก็บขยะช่องรับน้ำ (4 คน × 150 วันฝน)', 600, 'คน-วัน', 400),
      // ไม่พบราคากลางงานกล้องตรวจท่อในไทย → ค่าประมาณ
      line('กล้องตรวจท่อก่อนฤดูฝน*', nSpots, 'จุด', 30000),
    ],
  },
].map((g) => ({ ...g, sum: g.cost.reduce((a, c) => a + c.sum, 0) }))

const mb = (b) => (b / 1e6).toFixed(2)
const th = (n) => n.toLocaleString('th-TH')
const nowCase = scenarios.cases.find((c) => c.key === 'now')
const targetCase = scenarios.cases.find((c) => c.key === 'target')

export default function FloodFix() {
  return (
    <SlideFrame
      kicker="03 · แก้น้ำท่วม"
      title="แก้น้ำท่วมด้วย 2 แนวทาง: ปรับปรุงท่อ และบำรุงรักษาให้สม่ำเสมอ"
      source="ราคาอ้างอิง: ราคากลางลอกท่อ สนน. ปี 2561 ≈ 81 บาท/ม. · ค่าแรงขั้นต่ำ กทม. 400 บาท/วัน (1 ก.ค. 2568) · งานท่อและ * ยังไม่มีราคากลาง เป็นประมาณการของกลุ่ม · ครั้งที่ท่วม: Bangkok Index 2025 (2568)"
    >
      <div className={s.page}>
        <div className={s.table} role="table">
          <div className={`${s.row} ${s.head}`} role="row">
            <span>แนวทาง</span>
            <span>สิ่งที่ทำ</span>
            <span>ใช้เงิน</span>
          </div>
          {GROUPS.map((g, i) => (
            <div key={g.title} className={s.row} role="row">
              <div className={s.problem}>
                <b>
                  {i + 1}. {g.title}
                </b>
              </div>
              <ul className={s.steps}>
                {g.steps.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className={s.cost}>
                <b className={`${s.money} num`}>
                  {mb(g.sum)} <small>ล้านบาท{g.kind === 'ต่อปี' ? '/ปี' : ' (ครั้งเดียว)'}</small>
                </b>
                {g.cost.map((c) => (
                  <span key={c.label}>
                    {c.label} {th(c.qty)} {c.unit} × {th(c.price)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={s.footer}>
          <div className={s.goal}>
            <span>งบที่ขอ (ประมาณการ)</span>
            <b className="num">{mb(GROUPS[0].sum)} ล้าน + {mb(GROUPS[1].sum)} ล้าน/ปี</b>
          </div>
          <div className={s.goal}>
            <span>เป้าปีแรก ท่วม</span>
            <b className="num">{nowCase.floods} → {targetCase.floods} ครั้ง</b>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}
