import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { Stat, fmt } from '../../components/charts/kit.jsx'
import { scenarios, wastewater } from '../../lib/data.js'
import s from './style.module.css'

// สไลด์ 03b (หน้า 5 บนจอ): แก้น้ำเสียด้วยการบำบัดในคลอง ไม่ต้องส่งเข้าโรงบำบัด
// แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md) · ตัวเลขต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md หัวข้อ "หน้าแก้น้ำเสีย"
// ค่าใช้จ่ายทั้งหมด = ประมาณการของกลุ่ม (ไม่พบราคากลางในแหล่งเปิด) · จำนวนอิงจุดตรวจที่ BOD เกินเกณฑ์

const over = wastewater.stations.filter((x) => x.bod > wastewater.standard)
const doZero = wastewater.stations.filter((x) => x.doZeroAll)
const canals = [...new Set(over.map((x) => x.canal))]
const SPOTS = over.length // 6 จุดตรวจที่เกินเกณฑ์ = จุดติดตั้ง
const dd = wastewater.districts.find((d) => d.name === 'ดินแดง')
const longterm = scenarios.cases.find((c) => c.key === 'longterm')
const nowCase = scenarios.cases.find((c) => c.key === 'now')
const bodOnly = scenarios.single.bodOnly // น้ำเสียเรื่องเดียว BOD → 15

const line = (label, qty, unit, price, kind = 'ครั้งเดียว') => ({ label, qty, unit, price, kind, sum: qty * price })
const GROUPS = [
  {
    title: 'บำบัดขั้นต้น: ดักสิ่งสกปรกก่อนลงคลอง',
    cause: 'ขยะ เศษอาหาร และไขมันจากบ้านเรือน ร้านอาหาร และตลาด ไหลลงคลองโดยตรง ทำให้ BOD สูงและตะกอนสะสม',
    steps: [
      'ติดตะแกรงดักขยะที่ปากท่อระบายลงคลอง',
      'แจกและติดถังดักไขมันให้ร้านอาหารและแผงตลาดริมคลอง',
      'ทำคอกดักตะกอนในคลอง ให้ตะกอนหนักจมก่อนไหลต่อ',
    ],
    cost: [
      line('ตะแกรงดักขยะปากท่อ (5 จุดต่อจุดตรวจ)', SPOTS * 5, 'จุด', 25000),
      line('ถังดักไขมันร้านอาหาร/แผงตลาดริมคลอง', 300, 'ใบ', 3000),
      line('คอกดักตะกอนในคลอง', SPOTS, 'จุด', 150000),
    ],
  },
  {
    title: 'บำบัดชีวภาพในคลอง: ให้จุลินทรีย์ย่อยสลาย',
    cause: `ออกซิเจนในน้ำเป็น 0 ทุกเดือนใน ${doZero.length} จุด จุลินทรีย์ที่ใช้ออกซิเจนย่อยสลายของเสียไม่ได้ คลองจึงเน่าและเหม็น`,
    steps: [
      'ติดเครื่องเติมอากาศในคลอง (กังหันตีน้ำ / หัวจ่ายอากาศ)',
      'เติมหัวเชื้อจุลินทรีย์ (EM) เป็นประจำ',
      'วางแพไบโอฟิล์มลอยน้ำให้จุลินทรีย์เกาะ แทนระบบตะกอนเร่งในโรงบำบัด',
    ],
    cost: [
      line('เครื่องเติมอากาศในคลอง (2 เครื่องต่อจุด)', SPOTS * 2, 'เครื่อง', 250000),
      line('แพไบโอฟิล์มลอยน้ำ (100 ตร.ม. ต่อจุด)', SPOTS * 100, 'ตร.ม.', 1500),
      line('หัวเชื้อจุลินทรีย์ EM (เดือนละครั้งต่อจุด)', SPOTS * 12, 'ครั้ง', 5000, 'ต่อปี'),
      line('ค่าไฟเครื่องเติมอากาศ (1.5 kW × 24 ชม. × 365 วัน × 4.5 บาท)', SPOTS * 2, 'เครื่อง', Math.round(1.5 * 24 * 365 * 4.5), 'ต่อปี'),
    ],
  },
].map((g) => ({
  ...g,
  once: g.cost.filter((c) => c.kind === 'ครั้งเดียว').reduce((a, c) => a + c.sum, 0),
  yearly: g.cost.filter((c) => c.kind === 'ต่อปี').reduce((a, c) => a + c.sum, 0),
}))

const mb = (b) => (b / 1e6).toFixed(2)
const th = (n) => n.toLocaleString('th-TH')

export default function WastewaterFix() {
  const [open, setOpen] = useState(null) // แถวที่เปิดดูสูตรคำนวณ
  return (
    <SlideFrame
      kicker="05 · แก้น้ำเสีย"
      title={`บำบัดน้ำเสียในคลองเอง 2 ขั้น เป้าระยะยาว BOD ${fmt.dec(dd.bod)} เหลือ ${wastewater.standard}`}
      subtitle={`ผลต่อคะแนนรวม (ระยะยาว) +${fmt.dec(bodOnly.score - nowCase.score)} คะแนน · ถ้าทำเรื่องนี้เรื่องเดียว อันดับรวม ${nowCase.rank} → ${bodOnly.rank}`}
      source={`ราคาทั้งหมดเป็นประมาณการของกลุ่ม (ไม่พบราคากลางในแหล่งเปิด) · ติดตั้งที่ ${SPOTS} จุดตรวจที่ BOD เกินเกณฑ์ ใน${canals.join(' ')} · คุณภาพน้ำ: สำนักการระบายน้ำ กทม. (data.bangkok.go.th) ม.ค.–เม.ย. 2566`}
    >
      <div className={s.page}>
        <div className={s.table} role="table">
          <div className={`${s.row} ${s.head}`} role="row">
            <span>แนวทาง</span>
            <span>สาเหตุ</span>
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
              <p className={s.cause}>{g.cause}</p>
              <ul className={s.steps}>
                {g.steps.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <div className={s.cost}>
                <b className={`${s.money} num`}>
                  {mb(g.once)} <small>ล้านบาท (ครั้งเดียว)</small>
                  {g.yearly > 0 && <span className={s.per}>+ {mb(g.yearly)} <small>ล้านบาท/ปี</small></span>}
                </b>
                <button type="button" className={s.formulaBtn} aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}>
                  {open === i ? 'ซ่อนสูตรคำนวณ ▴' : 'ดูสูตรคำนวณ ▾'}
                </button>
              </div>
              {open === i && (
                <div className={s.formula}>
                  {g.cost.map((c) => (
                    <div key={c.label} className={s.fLine}>
                      <span>{c.label}</span>
                      <span className="num">{th(c.qty)} {c.unit} × {th(c.price)} บาท</span>
                      <b className="num">= {mb(c.sum)} ล้าน{c.kind === 'ต่อปี' ? '/ปี' : ''}</b>
                    </div>
                  ))}
                  <div className={`${s.fLine} ${s.fTotal}`}>
                    <span>รวม</span>
                    <span />
                    <b className="num">= {mb(g.once)} ล้าน{g.yearly > 0 ? ` + ${mb(g.yearly)} ล้าน/ปี` : ''}</b>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={s.facts}>
          <Stat label="จุดตรวจในดินแดงที่ BOD เกินเกณฑ์" value={`${over.length} จาก ${wastewater.stations.length}`} unit="จุด" sub={`เกณฑ์ ${wastewater.standard} มก./ล. · ปี 2566`} />
          <Stat label="ออกซิเจนในน้ำ (DO) = 0 ทุกเดือน" value={doZero.length} unit="จุด" sub="จุลินทรีย์ย่อยสลายไม่ได้ จึงต้องเติมอากาศ" />
          <Stat label={`ถ้า BOD ลดถึง ${wastewater.standard}`} value={`อันดับ ${longterm.rank}`} unit="" sub={`คะแนนรวม ${fmt.dec(longterm.score)} (ระยะยาว รวมทุกเรื่อง)`} />
        </div>
      </div>
    </SlideFrame>
  )
}
