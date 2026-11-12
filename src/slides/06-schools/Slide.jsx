import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import SlideFrame from '../../components/SlideFrame.jsx'
import MapBase from '../../components/charts/MapBase.jsx'
import Expandable from '../../components/charts/Expandable.jsx'
import { ChartCard, Stat, SvgLabel, TipBox, axisCommon, fmt, gridProps } from '../../components/charts/kit.jsx'
import { education as ed, index, map } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 06: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const LABEL = (sc) =>
  sc.addSchools && sc.addTeachers ? 'โรงเรียน +1 และครู +88' : sc.addSchools ? 'โรงเรียน +1' : sc.addTeachers ? 'ครู +88' : 'ตอนนี้'
const rows = ed.scenarios.map((sc) => ({ ...sc, label: LABEL(sc), chosen: sc.addSchools && sc.addTeachers }))
const now = rows[0]
const both = rows.find((r) => r.chosen)
const medEdu = index.medians.topics.education
const schools = map.schools.items
const salary = ed.teacherSalary

export default function Schools() {
  return (
    <SlideFrame
      kicker="06 · เพิ่มโรงเรียนและครู"
      title={`มีโรงเรียนต้องมีครู: เพิ่มโรงเรียน 1 แห่งและครู ${ed.teachersNeeded} คน คะแนนการศึกษาขึ้นเป็น ${fmt.dec(both.score)}`}
      subtitle={`อันดับการศึกษาขยับจาก ${now.rank} เป็นราว ${both.rank} · เพิ่มโรงเรียนอย่างเดียวอันดับไม่ขยับ เพราะตัวชี้วัดที่ฉุดคือนักเรียนต่อครู`}
      source={`คำนวณจากสูตร Bangkok Index 2025 (การศึกษา = เฉลี่ยคะแนนโรงเรียนต่อเด็ก 1,000 คน กับนักเรียนต่อครู) โดยสมมติให้เขตอื่นคงที่ · ตำแหน่งโรงเรียนจาก OpenStreetMap รวมทุกสังกัด · เงินเดือนครูผู้ช่วย ${fmt.int(salary.monthly)} บาท/เดือน ยังไม่ยืนยันอัตรา กทม.`}
    >
      <div className={s.grid}>
        <ChartCard title="คะแนนการศึกษาของดินแดง 4 กรณี" note={`เส้นประ = มัธยฐาน 50 เขต ${fmt.dec(medEdu)}`}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 56, right: 16, bottom: 8, left: 0 }} barCategoryGap="30%">
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisCommon} interval={0} />
              <YAxis {...axisCommon} domain={[0, 15]} ticks={[0, 5, 10, 15]} width={40} />
              <ReferenceLine y={medEdu} stroke={color.reference} strokeDasharray="6 5" strokeWidth={2} />
              <Tooltip cursor={{ fill: color.grid }}
                content={<TipBox render={(r) => ({ title: r.label, rows: [['คะแนนการศึกษา', fmt.dec(r.score)], ['อันดับ', `${r.rank} จาก 50`]] })} />} />
              <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={96} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.label} fill={r.chosen ? color.dindaeng : color.other} />
                ))}
                <LabelList
                  dataKey="score"
                  content={({ x, y, width, value, index: i }) => (
                    <g>
                      <SvgLabel x={x + width / 2} y={y - 32} weight={700} size={28}>{fmt.dec(value)}</SvgLabel>
                      <SvgLabel x={x + width / 2} y={y - 8} weight={500} fill={color.textMuted}>อันดับ {rows[i].rank}</SvgLabel>
                    </g>
                  )}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="โรงเรียนในเขตตอนนี้" note={`${schools.length} แห่งใน OSM (รวมเอกชน) · ดัชนีนับ ${ed.districts.find((d) => d.name === 'ดินแดง').schools} แห่ง`} className={s.mapCard}>
          <div className={s.mapWrap}>
            <Expandable
              title="โรงเรียนในเขตดินแดง (OpenStreetMap)"
              note="รวมทุกสังกัดรวมเอกชน · ยังไม่ได้แยกว่าแห่งไหนเป็นสังกัด กทม. / สพฐ."
              aside={
                <ol className={s.asideList}>
                  {schools.map((sc, i) => (
                    <li key={sc.osm}>
                      {i + 1}. {sc.name}
                    </li>
                  ))}
                </ol>
              }
            >
              {({ expanded }) => (
                <MapBase labelSize={expanded ? 18 : 24} overlay={(
                    <g>
                      {schools.map((sc, i) => (
                        <g key={sc.osm}>
                          <title>{sc.name}</title>
                          <rect x={sc.x - 11} y={sc.y - 11} width={22} height={22} rx={4} fill={color.text} stroke={color.surface} strokeWidth={3} />
                          {expanded && (
                            <text x={sc.x + 16} y={sc.y} dy="0.35em" fontSize={17} fontWeight={600} fill={color.text}
                              stroke={color.surface} strokeWidth={4} paintOrder="stroke" style={{ fontFamily: 'var(--font)' }}>
                              {i + 1}
                            </text>
                          )}
                        </g>
                      ))}
                    </g>
                  )} />
              )}
            </Expandable>
            <p className={s.pending}>รอข้อมูลประชากรเด็ก (WorldPop) เพื่อทำ heatmap หาตำแหน่งที่เหมาะกับโรงเรียนใหม่</p>
          </div>
        </ChartCard>

        <div className={s.side}>
          <h2 className={s.blockTitle}>ต้องใช้งบเท่าไร</h2>
          <Stat label={`เงินเดือนครู ${ed.teachersNeeded} คน`} value={fmt.mb(salary.annualTotal88, 1)} unit="ล้านบาท/ปี"
            sub={`${ed.teachersNeeded} × ${fmt.int(salary.monthly)} บาท × 12 เดือน (ยังไม่รวมสวัสดิการ)`} />
          <Stat label="สร้างโรงเรียน 1 แห่ง" value="[รอข้อมูล]" sub="ค่าก่อสร้างและที่ดิน" />
          <p className={s.note}>
            ครู {fmt.int(ed.districts.find((d) => d.name === 'ดินแดง').teachers)} → {fmt.int(ed.districts.find((d) => d.name === 'ดินแดง').teachers + ed.teachersNeeded)} คน
            ทำให้นักเรียนต่อครูลดจาก {fmt.dec(ed.districts.find((d) => d.name === 'ดินแดง').studentsPerTeacher, 1)} เหลือ {fmt.dec(ed.medianStudentsPerTeacher, 1)} เท่าค่ากลางของกรุงเทพฯ
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}
