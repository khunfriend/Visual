import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, SvgLabel, TipBox, axisCommon, fmt, gridProps } from '../../components/charts/kit.jsx'
import { education as ed, scenarios, vacant, wastewater } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 10: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

// ---- งบที่ขอ: ดึงยอดจากหน้าแก้แต่ละเรื่อง (ล้านบาท) · ตรงกับ ข้อมูลรวม_ตรวจแล้ว.md ----
// น้ำท่วม = หน้า 3 (ล้างท่อ+ท่อใหม่ / ทีมเก็บขยะ) · น้ำเสีย = หน้า 5 (ขั้นต้น 2.55 + ชีวภาพ 3.90 · EM+ค่าไฟ/ปี)
// จุดเสี่ยง = หน้า 9 (รวมอาสาจราจรปีแรก) · สวน = หน้า 12 ข้อเสนอดึงที่ว่าง 50% (ค่าบำรุง 10%/ปี แยกไว้ช่องต่อปี) · ส่วนใหญ่เป็นประมาณการของกลุ่ม
const ASK = [
  { topic: 'น้ำท่วม', detail: 'ล้างท่อ วางท่อใหม่ · ทีมเก็บขยะหน้าท่อ', once: 36.94, yearly: 1.61 },
  { topic: 'น้ำเสีย', detail: 'บำบัดในคลอง 2 ขั้น ที่ 6 จุด', once: 7.04, yearly: 1.03 },
  { topic: 'การศึกษา', detail: `เงินเดือนครูเพิ่ม ${ed.teachersNeeded} คน`, once: 0, yearly: Math.round(ed.teacherSalary.annualTotal / 1e4) / 100 },
  { topic: 'จุดเสี่ยง', detail: 'CCTV · ไฟ LED · อาสาจราจร · ปรับที่รกร้าง', once: 3.77, yearly: 0 },
  { topic: 'สวน', detail: `ดึงที่ว่าง 50% ทำสวน ${fmt.int(vacant.half.areaM2)} ตร.ม.`, once: Math.round(vacant.half.buildBaht / 1e4) / 100, yearly: Math.round(vacant.half.maintenanceBaht / 1e4) / 100 },
]
const ONCE = ASK.reduce((a, r) => a + (r.once ?? 0), 0)
const YEARLY = ASK.reduce((a, r) => a + r.yearly, 0)
const PENDING = '[รอข้อมูล]'
const m2 = (v) => fmt.dec(v, 2)

// ---- waterfall: ตอนนี้ → จุดเสี่ยง → น้ำท่วม → การศึกษา → สวน → ปีแรก ----
// แถวที่มี value = ยอดรวม (ตอนนี้ / ปีแรก / ระยะยาว) · แถวที่มี delta = ส่วนเพิ่มของแต่ละเรื่อง (build_data.py ส่วน 8)
// หน้านี้แสดงถึงยอดปีแรกเท่านั้น (น้ำเสียระยะยาวอยู่ในบรรทัดรองและหน้า 5)
const wf = scenarios.waterfall.slice(0, scenarios.waterfall.findIndex((w) => w.key === 'target') + 1)
let run = 0
const wfRows = wf.map((w) => {
  if (w.value != null) {
    run = w.value
    return { label: w.label, base: 0, val: w.value, total: true, rank: w.rank, key: w.key }
  }
  const row = { label: w.label.split(' ')[0], full: w.label, base: run, val: w.delta, from: w.topicFrom, to: w.topicTo, longTerm: w.longTerm }
  run += w.delta
  return row
})
const Y0 = 16 // แกนเริ่มที่ 16 เพื่อให้เห็นส่วนเพิ่ม (เขียนกำกับไว้ใต้กราฟ)
const Y1 = 21

const target = scenarios.cases.find((c) => c.key === 'target')
const now = scenarios.cases[0]
const dd = ed.districts.find((d) => d.name === 'ดินแดง')
const KPI = [
  { name: 'จุดเสี่ยง', now: `${now.crime} จุด`, goal: `${target.crime} จุด` },
  { name: 'น้ำท่วมขังบนถนนสายหลัก', now: `${now.floods} ครั้ง`, goal: `${target.floods} ครั้ง` },
  { name: 'นักเรียนต่อครู', now: fmt.dec(dd.studentsPerTeacher, 1), goal: fmt.dec(ed.studentsPerTeacherAfter, 1) },
  { name: 'สวนที่เข้าถึงได้ต่อคน', now: `${fmt.dec(vacant.accessibleM2 / vacant.population)} ตร.ม.`, goal: `${fmt.dec(vacant.half.perCapitaAfter)} ตร.ม.` },
  { name: 'BOD คลอง (ระยะยาว)', now: `${fmt.dec(now.bod)} มก./ล.`, goal: `${wastewater.standard} มก./ล.` },
]

export default function Summary() {
  return (
    <SlideFrame
      kicker="13 · สรุปผล"
      title={`ขอเพิ่ม ${m2(ONCE)} ล้านบาท + ${m2(YEARLY)} ล้านบาท/ปี อันดับขึ้นจาก ${now.rank} เป็น ${target.rank}`}
      subtitle={`ปีแรก กรณีตามเป้า · ระยะยาวถ้า BOD ลดถึงเกณฑ์ ขึ้นถึงอันดับ ${scenarios.cases.find((c) => c.key === 'longterm').rank}`}
      source={`คำนวณจากคะแนนจริงของ Bangkok Index 2025 ทั้ง 16 หัวข้อ × 50 เขต โดยสมมติให้เขตอื่นคงที่ · คะแนนรวม = ค่าเฉลี่ย 16 หัวข้อ · แกนกราฟซ้ายเริ่มที่ ${Y0}`}
    >
      <div className={s.grid}>
        <ChartCard title="คะแนนรวมเพิ่มจากแต่ละเรื่อง" note="ปีแรก กรณีตามเป้า">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wfRows} margin={{ top: 56, right: 8, bottom: 8, left: 0 }} barCategoryGap="22%">
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisCommon} interval={0} />
              <YAxis {...axisCommon} domain={[Y0, Y1]} ticks={[16, 17, 18, 19, 20, 21]} allowDataOverflow width={40} />
              <Tooltip cursor={{ fill: color.grid }}
                content={<TipBox render={(r) => r.total
                  ? { title: r.label, rows: [['คะแนนรวม', fmt.dec(r.val)], ['อันดับ', `${r.rank} จาก 50`]] }
                  : { title: r.full, rows: [['คะแนนหัวข้อ', `${fmt.dec(r.from)} → ${fmt.dec(r.to)}`], ['คะแนนรวมเพิ่ม', `+${fmt.dec(r.val)}`]] }} />} />
              <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="val" stackId="w" radius={[4, 4, 0, 0]} maxBarSize={96} isAnimationActive={false}>
                {wfRows.map((r) => (
                  <Cell key={r.label} fill={r.total ? (r.key === 'now' ? color.other : color.good) : color.good}
                    fillOpacity={r.total ? (r.key === 'longterm' ? 0.75 : 1) : r.longTerm ? 0.3 : 0.5} />
                ))}
                <LabelList
                  dataKey="val"
                  content={({ x, y, width, value, index: i }) => {
                    const r = wfRows[i]
                    return (
                      <g>
                        <SvgLabel x={x + width / 2} y={y - (r.total ? 32 : 12)} weight={700} size={r.total ? 28 : 22}>
                          {r.total ? fmt.dec(value) : `+${fmt.dec(value)}`}
                        </SvgLabel>
                        {r.total && <SvgLabel x={x + width / 2} y={y - 8} weight={500} fill={color.textMuted}>อันดับ {r.rank}</SvgLabel>}
                      </g>
                    )
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className={s.side}>
          <section>
            <h2 className={s.blockTitle}>งบที่ขอเพิ่ม (ล้านบาท)</h2>
            <table className={s.ask}>
              <thead>
                <tr><th>เรื่อง</th><th>ครั้งเดียว</th><th>ต่อปี</th></tr>
              </thead>
              <tbody>
                {ASK.map((r) => (
                  <tr key={r.topic}>
                    <td title={r.detail}><b>{r.topic}</b></td>
                    <td className="num">{r.once == null ? <span className={s.pending}>{PENDING}</span> : r.once ? m2(r.once) : '–'}</td>
                    <td className="num">{r.yearly ? m2(r.yearly) : '–'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><b>รวม</b></td>
                  <td className="num">{m2(ONCE)}</td>
                  <td className="num">{m2(YEARLY)}</td>
                </tr>
              </tfoot>
            </table>
          </section>
          <section>
            <h2 className={s.blockTitle}>วัดผลอย่างไร</h2>
            <table className={s.kpi}>
              <thead>
                <tr><th>ตัวชี้วัด</th><th>ตอนนี้</th><th>เป้า</th></tr>
              </thead>
              <tbody>
                {KPI.map((k) => (
                  <tr key={k.name}><td>{k.name}</td><td className="num">{k.now}</td><td className="num"><b>{k.goal}</b></td></tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </SlideFrame>
  )
}
