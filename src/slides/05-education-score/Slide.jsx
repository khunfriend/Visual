import {
  Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, DD, PT, SvgLabel, TipBox, axisCommon, districtColor, fmt, gridProps } from '../../components/charts/kit.jsx'
import { education as ed, index } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 05: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const rows = [...ed.districts].sort((a, b) => b.score - a.score) // เรียงคะแนนการศึกษามากไปน้อย
const dd = rows.find((d) => d.name === DD)
const pt = rows.find((d) => d.name === PT)
const scoreRank = (d) => rows.findIndex((x) => x.name === d.name) + 1
const medScore = index.medians.topics.education

// เทียบดินแดงกับปทุมวัน แต่ละแถวใช้สเกลของตัวเอง
const compare = [
  { label: 'เด็กอายุ 0–18 ปี', dd: dd.children, pt: pt.children, unit: 'คน' },
  { label: 'ครู', dd: dd.teachers, pt: pt.teachers, unit: 'คน' },
  { label: 'โรงเรียน', dd: dd.schools, pt: pt.schools, unit: 'แห่ง' },
]
const bk = ed.schoolsBreakdown

export default function EducationScore() {
  return (
    <SlideFrame
      kicker="05 · การศึกษา (คะแนน)"
      title="เด็กมากกว่าปทุมวัน 3 เท่า แต่มีครูเท่ากัน"
      subtitle={`นักเรียนต่อครู ${fmt.dec(dd.studentsPerTeacher, 1)} คน สูงเป็นอันดับ ${dd.rankStudentsPerTeacher} ของกรุงเทพฯ`}
      source={`ที่มา: Bangkok Index 2025 – Rocket Media Lab (การศึกษา ปีการศึกษา 2568) · โรงเรียนดินแดง ${dd.schools} แห่ง = สังกัด กทม. ${bk[DD].bma} + สพฐ. ${bk[DD].obec} · ปทุมวัน ${pt.schools} แห่ง = ${bk[PT].bma} + ${bk[PT].obec}`}
    >
      <div className={s.grid}>
        <ChartCard
          title="คะแนนการศึกษา Bangkok Index 2025 (50 เขต)"
          note="เรียงจากมากไปน้อย · คะแนน 1–50 เฉลี่ยจากโรงเรียนต่อเด็ก 1,000 คน และนักเรียนต่อครู"
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'ปทุมวัน', color: color.pathumwan },
            { label: 'เขตอื่น', color: color.other },
            { label: `มัธยฐาน ${fmt.dec(medScore)}`, color: color.reference, kind: 'dash' },
          ]}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 40, right: 8, bottom: 8, left: 0 }} barCategoryGap={2}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={false} axisLine={{ stroke: color.border }} tickLine={false} />
              <YAxis {...axisCommon} domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} width={44} />
              <ReferenceLine y={medScore} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <Tooltip
                cursor={{ fill: color.grid }}
                content={
                  <TipBox
                    render={(r) => ({
                      title: `${r.name} · อันดับ ${scoreRank(r)}`,
                      rows: [['คะแนนการศึกษา', fmt.dec(r.score)], ['โรงเรียนต่อเด็ก 1,000 คน', fmt.dec(r.schoolsPer1000)], ['นักเรียนต่อครู', fmt.dec(r.studentsPerTeacher, 1)]],
                    })}
                  />
                }
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false}>
                {rows.map((d) => (
                  <Cell key={d.name} fill={districtColor(d.name)} />
                ))}
                <LabelList
                  dataKey="name"
                  content={({ x, y, width, value }) =>
                    value === DD ? (
                      <SvgLabel x={x + width / 2} y={y - 12} anchor="end">ดินแดง {fmt.dec(dd.score)} (#{scoreRank(dd)})</SvgLabel>
                    ) : value === PT ? (
                      <SvgLabel x={x + width / 2} y={y - 12} anchor="middle" weight={500} fill={color.textMuted}>ปทุมวัน {fmt.dec(pt.score)} (#{scoreRank(pt)})</SvgLabel>
                    ) : null
                  }
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="ดินแดง เทียบ ปทุมวัน"
          note="แต่ละแถวใช้สเกลของตัวเอง"
          legend={[
            { label: 'ดินแดง', color: color.dindaeng },
            { label: 'ปทุมวัน', color: color.pathumwan },
          ]}
        >
          <div className={s.compare}>
            {compare.map((c) => {
              const max = Math.max(c.dd, c.pt)
              const ratio = c.dd / c.pt
              return (
                <div key={c.label} className={s.row}>
                  <p className={s.rowLabel}>
                    {c.label}
                    <span className={s.ratio}>{ratio >= 1.5 ? `ดินแดง ×${fmt.dec(ratio, 1)}` : ratio < 0.95 ? 'ดินแดงน้อยกว่า' : 'ใกล้เคียงกัน'}</span>
                  </p>
                  {[
                    ['dd', c.dd, color.dindaeng],
                    ['pt', c.pt, color.pathumwan],
                  ].map(([k, v, col]) => (
                    <div key={k} className={s.barLine}>
                      <div className={s.track}>
                        <div className={s.bar} style={{ width: `${(v / max) * 100}%`, background: col }} />
                      </div>
                      <span className={`${s.val} num`}>
                        {fmt.int(v)} <small>{c.unit}</small>
                      </span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </ChartCard>
      </div>
    </SlideFrame>
  )
}
