import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, SvgLabel, TipBox, axisCommon, fmt, gridProps } from '../../components/charts/kit.jsx'
import { education as ed, scenarios, wastewater } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 10: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

// ---- งบที่ขอ: รอผู้ใช้ส่งยอดจริง (ยอดใน xlsx ชีต 9 ห้ามใช้) ----
// เมื่อได้ยอดแล้ว ให้ใส่ total (ล้านบาท) และ amount ของแต่ละเรื่อง
const ASK = {
  total: null,
  items: [
    { topic: 'น้ำท่วม', detail: 'ล้างท่อจุดท่วมซ้ำซาก · สำรวจท่อ · ถังดักไขมันตลาด 4 แห่ง', amount: null },
    { topic: 'น้ำเสีย', detail: 'สำรวจและออกแบบระบบรวบรวมน้ำเสีย', amount: null },
    { topic: 'การศึกษา', detail: `ครู ${ed.teachersNeeded} คน + โรงเรียน 1 แห่ง`, amount: null },
    // ประมาณการจากหน้า 7 (แก้จุดเสี่ยง) · ไม่ใช่ราคากลาง ดู ข้อมูลรวม
    { topic: 'จุดเสี่ยง', detail: 'CCTV · ไฟ LED · อาสาจราจร · ปรับที่รกร้าง (ประมาณการ)', amount: 3.53 },
  ],
}
const PENDING = '[รอยอด]'

// ---- waterfall: ตอนนี้ → +จุดเสี่ยง → +น้ำท่วม → +การศึกษา → หลังแก้ ----
const wf = scenarios.waterfall
const start = wf[0].value
let run = start
const wfRows = [
  { label: 'ตอนนี้', base: 0, val: start, total: true, rank: scenarios.cases[0].rank },
  ...wf.slice(1, -1).map((w) => {
    const row = { label: w.label.split(' ')[0], full: w.label, base: run, val: w.delta, from: w.topicFrom, to: w.topicTo }
    run += w.delta
    return row
  }),
  { label: 'หลังแก้', base: 0, val: wf.at(-1).value, total: true, rank: scenarios.cases.find((c) => c.key === 'target').rank },
]
const Y0 = 16 // แกนเริ่มที่ 16 เพื่อให้เห็นส่วนเพิ่ม (เขียนกำกับไว้ใต้กราฟ)

const target = scenarios.cases.find((c) => c.key === 'target')
const now = scenarios.cases[0]
const dd = ed.districts.find((d) => d.name === 'ดินแดง')
const KPI = [
  { name: 'จุดเสี่ยง', now: `${now.crime} จุด`, goal: `${target.crime} จุด` },
  { name: 'น้ำท่วมขังบนถนนสายหลัก', now: `${now.floods} ครั้ง`, goal: `${target.floods} ครั้ง` },
  { name: 'นักเรียนต่อครู', now: fmt.dec(dd.studentsPerTeacher, 1), goal: fmt.dec(ed.studentsPerTeacherAfter, 1) },
  { name: 'BOD คลอง (ระยะยาว)', now: `${fmt.dec(now.bod)} มก./ล.`, goal: `${wastewater.standard} มก./ล.` },
]

export default function Summary() {
  return (
    <SlideFrame
      kicker="10 · สรุปผล"
      title={`ขอเพิ่ม ${ASK.total ? fmt.dec(ASK.total, 1) : PENDING} ล้านบาท คะแนนรวมขึ้นจาก ${fmt.dec(now.score)} เป็น ${fmt.dec(target.score)} อันดับ ${now.rank} เป็น ${target.rank}`}
      subtitle={`ปีแรก กรณีตามเป้า · วัดผลด้วย Bangkok Index ปีถัดไป · ระยะยาวถ้า BOD ลดถึงมาตรฐาน อันดับขึ้นถึง ${scenarios.cases.find((c) => c.key === 'longterm').rank}`}
      source={`คำนวณจากคะแนนจริงของ Bangkok Index 2025 ทั้ง 16 หัวข้อ × 50 เขต โดยสมมติให้เขตอื่นคงที่ · คะแนนรวม = ค่าเฉลี่ย 16 หัวข้อ · แกนกราฟซ้ายเริ่มที่ ${Y0}`}
    >
      <div className={s.grid}>
        <ChartCard title="คะแนนรวมเพิ่มจากแต่ละเรื่อง" note="ปีแรก กรณีตามเป้า">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wfRows} margin={{ top: 56, right: 8, bottom: 8, left: 0 }} barCategoryGap="22%">
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisCommon} interval={0} />
              <YAxis {...axisCommon} domain={[Y0, 21]} ticks={[16, 17, 18, 19, 20, 21]} allowDataOverflow width={40} />
              <Tooltip cursor={{ fill: color.grid }}
                content={<TipBox render={(r) => r.total
                  ? { title: r.label, rows: [['คะแนนรวม', fmt.dec(r.val)], ['อันดับ', `${r.rank} จาก 50`]] }
                  : { title: r.full, rows: [['คะแนนหัวข้อ', `${fmt.dec(r.from)} → ${fmt.dec(r.to)}`], ['คะแนนรวมเพิ่ม', `+${fmt.dec(r.val)}`]] }} />} />
              <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
              <Bar dataKey="val" stackId="w" radius={[4, 4, 0, 0]} maxBarSize={96} isAnimationActive={false}>
                {wfRows.map((r) => (
                  <Cell key={r.label} fill={r.total ? (r.label === 'ตอนนี้' ? color.other : color.dindaeng) : '#F4A27A'} />
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

        <ChartCard title="อันดับรวมตามฉากทัศน์" note="ถ้าทำได้ตามเป้า ดินแดงพ้นกลุ่มรั้งท้าย">
          <ol className={s.cases}>
            {scenarios.cases.map((c) => (
              <li key={c.key} className={c.key === 'target' ? s.caseOn : ''}>
                <span className={s.caseLabel}>{c.label}</span>
                <span className={s.caseTrack}>
                  <span className={s.caseBar} style={{ width: `${((51 - c.rank) / 50) * 100}%`, background: c.key === 'now' ? color.other : c.key === 'target' ? color.dindaeng : '#F4A27A' }} />
                </span>
                <span className={`${s.caseRank} num`}>#{c.rank}</span>
                <span className={`${s.caseScore} num`}>{fmt.dec(c.score)}</span>
              </li>
            ))}
          </ol>
          <p className={s.caseNote}>ความยาวแท่ง = ยิ่งยาวยิ่งอันดับดี (อันดับ 50 สั้นที่สุด)</p>
        </ChartCard>

        <div className={s.side}>
          <section>
            <h2 className={s.blockTitle}>งบที่ขอเพิ่ม</h2>
            <ul className={s.ask}>
              {ASK.items.map((it) => (
                <li key={it.topic}>
                  <span>
                    <b>{it.topic}</b>
                    <small>{it.detail}</small>
                  </span>
                  <span className={`${s.amount} num`}>{it.amount != null ? `${fmt.dec(it.amount, 2)} ล้าน` : PENDING}</span>
                </li>
              ))}
              <li className={s.askTotal}>
                <b>รวม</b>
                <span className={`${s.amount} num`}>{ASK.total != null ? `${fmt.dec(ASK.total, 1)} ล้านบาท` : PENDING}</span>
              </li>
            </ul>
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
