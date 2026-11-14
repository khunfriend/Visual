import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import MapBase from '../../components/charts/MapBase.jsx'
import Expandable from '../../components/charts/Expandable.jsx'
import { ChartCard, Stat, TipBox, fmt } from '../../components/charts/kit.jsx'
import { education as ed, map } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 06: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const LABEL = (sc) =>
  sc.addSchools && sc.addTeachers ? `โรงเรียน +1 และครู +${sc.addTeachers}` : sc.addSchools ? 'โรงเรียน +1' : sc.addTeachers ? `ครู +${sc.addTeachers}` : 'ตอนนี้'
const rows = ed.scenarios.map((sc) => ({ ...sc, label: LABEL(sc), chosen: sc.addSchools && sc.addTeachers }))
const now = rows[0]
const both = rows.find((r) => r.chosen)
const allSchools = map.schools.items.map((sc, i) => ({ ...sc, no: i + 1 })) // เลขคงที่ไม่ว่าจะกรองแบบไหน
// สังกัด: กทม. / สพฐ. / เอกชน / อื่น ๆ (ยืนยันจากเว็บสำนักงานเขตดินแดง ดู build_map.py)
const AFFILS = ['กทม.', 'สพฐ.', 'เอกชน', 'อื่น ๆ']
const FILTERS = [['all', 'ทั้งหมด', () => true], ...AFFILS.map((a) => [a, a, (sc) => sc.affil === a])]
// แยกสังกัดด้วยรูปทรง ไม่ต้องเพิ่มสี: กทม. = สี่เหลี่ยมทึบ · สพฐ. = วงกลมทึบ · เอกชน = สี่เหลี่ยมโปร่ง · อื่น ๆ = วงกลมโปร่ง
const ROUND = { 'สพฐ.': true, 'อื่น ๆ': true }
const HOLLOW = { 'เอกชน': true, 'อื่น ๆ': true }
function Pin({ x, y, affil, size = 11 }) {
  const r = ROUND[affil] ? size : 4
  const inner = size - 5
  return (
    <>
      <rect x={x - size} y={y - size} width={size * 2} height={size * 2} rx={r} fill={color.text} stroke={color.surface} strokeWidth={3} />
      {HOLLOW[affil] && <rect x={x - inner} y={y - inner} width={inner * 2} height={inner * 2} rx={ROUND[affil] ? inner : 2} fill={color.surface} />}
    </>
  )
}
const salary = ed.teacherSalary
const dd = ed.districts.find((d) => d.name === 'ดินแดง')

/** กล่อง hover ที่ลอยตามเมาส์บนแผนที่ (คิดตำแหน่งในหน่วยของเวที 1920×1080 ที่ถูกย่อ) */
function FollowTip({ children, tip }) {
  const [pos, setPos] = useState(null)
  const onMove = (e) => {
    const box = e.currentTarget.getBoundingClientRect()
    const k = box.width / e.currentTarget.offsetWidth || 1
    setPos({ x: (e.clientX - box.left) / k, y: (e.clientY - box.top) / k })
  }
  return (
    <div className={s.followWrap} onMouseMove={onMove} onMouseLeave={() => setPos(null)}>
      {children}
      {tip && pos && (
        <div className={s.followTip} style={{ left: pos.x, top: pos.y }}>
          {tip}
        </div>
      )}
    </div>
  )
}

export default function Schools() {
  const [filter, setFilter] = useState('all')
  const [hover, setHover] = useState(null) // โรงเรียนที่เมาส์ชี้อยู่
  const schools = allSchools.filter(FILTERS.find(([k]) => k === filter)[2])
  const count = (a) => allSchools.filter((sc) => sc.affil === a).length
  const filterBar = (
    <div className={s.toggle} role="tablist" aria-label="กรองโรงเรียน">
      {FILTERS.map(([k, label, fn]) => (
        <button key={k} role="tab" aria-selected={filter === k} className={filter === k ? s.on : ''}
          onClick={(e) => (e.stopPropagation(), setFilter(k))}>
          {label} ({allSchools.filter(fn).length})
        </button>
      ))}
    </div>
  )
  return (
    <SlideFrame
      kicker="07 · เพิ่มโรงเรียนและครู"
      title={`มีโรงเรียนต้องมีครู: เพิ่มโรงเรียน 1 แห่งและครู ${ed.teachersNeeded} คน คะแนนการศึกษาขึ้นเป็น ${fmt.dec(both.score)}`}
      subtitle={`อันดับการศึกษาขยับจาก ${now.rank} เป็นราว ${both.rank} · เพิ่มโรงเรียนอย่างเดียวอันดับไม่ขยับ เพราะตัวชี้วัดที่ฉุดคือนักเรียนต่อครู`}
      source={`คำนวณจากสูตร Bangkok Index 2025 (การศึกษา = เฉลี่ยคะแนนโรงเรียนต่อเด็ก 1,000 คน กับนักเรียนต่อครู) โดยสมมติให้เขตอื่นคงที่ · ตำแหน่งโรงเรียนและแผนที่ฐาน © OpenStreetMap contributors · สังกัดโรงเรียน: สำนักงานเขตดินแดง · เงินเดือนครูผู้ช่วย ${fmt.int(salary.monthly)} บาท/เดือน ยังไม่ยืนยันอัตรา กทม.`}
    >
      <div className={s.grid}>
        <ChartCard title="โรงเรียนในเขตตอนนี้" note={`${AFFILS.map((a) => `${a} ${count(a)}`).join(' · ')} · ดัชนีนับ กทม. + สพฐ. ${ed.districts.find((d) => d.name === 'ดินแดง').schools} แห่ง`} className={s.mapCard}>
          <div className={s.mapWrap}>
            <div className={s.mapArea}>
              <Expandable
                title="โรงเรียนในเขตดินแดง"
                note="■ กทม. · ● สพฐ. · □ เอกชน · ○ อื่น ๆ (โรงเรียนกีฬา กทม. ไม่นับในดัชนี) · ดัชนีนับ สพฐ. 5 แห่ง แต่ OpenStreetMap มี 3 แห่ง"
                toolbar={filterBar}
                aside={
                  <ol className={s.asideList}>
                    {schools.map((sc) => (
                      <li key={sc.osm}>
                        {sc.no}. {sc.name} · {sc.affil}
                      </li>
                    ))}
                  </ol>
                }
              >
                {({ expanded }) => (
                  <FollowTip tip={hover && (
                    <TipBox active payload={[{ payload: hover }]}
                      render={(r) => ({ title: `${r.no}. ${r.name}`, rows: [['สังกัด', r.affil]] })} />
                  )}>
                  <MapBase labelSize={expanded ? 18 : 24} overlay={(
                      <g>
                        {schools.map((sc) => (
                          <g key={sc.osm} onMouseEnter={() => setHover(sc)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
                            <Pin x={sc.x} y={sc.y} affil={sc.affil} />
                            {expanded && (
                              <text x={sc.x + 16} y={sc.y} dy="0.35em" fontSize={17} fontWeight={600} fill={color.text}
                                stroke={color.surface} strokeWidth={4} paintOrder="stroke" style={{ fontFamily: 'var(--font)' }}>
                                {sc.no}
                              </text>
                            )}
                          </g>
                        ))}
                      </g>
                    )} />
                  </FollowTip>
                )}
              </Expandable>
            </div>
            <div className={s.controls}>
              <div className={s.filterRow}>
                {filterBar}
                <span className={s.pinKey}>
                  {AFFILS.map((a) => (
                    <span key={a} className={s.pinItem}>
                      <svg width="18" height="18" viewBox="-12 -12 24 24" aria-hidden="true"><Pin x={0} y={0} affil={a} size={9} /></svg>
                      {a}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </ChartCard>

        <div className={s.side}>
          <h2 className={s.blockTitle}>ต้องใช้งบเท่าไร</h2>
          <Stat label={`เงินเดือนครู ${ed.teachersNeeded} คน`} value={fmt.mb(salary.annualTotal, 1)} unit="ล้านบาท/ปี"
            sub={`${ed.teachersNeeded} × ${fmt.int(salary.monthly)} บาท × 12 เดือน (ยังไม่รวมสวัสดิการ)`} />
          <Stat label="สร้างโรงเรียน 1 แห่ง" value="[รอข้อมูล]" sub="ค่าก่อสร้างและที่ดิน" />
          <p className={s.note}>
            ครู {fmt.int(dd.teachers)} → {fmt.int(dd.teachers + ed.teachersNeeded)} คน นักเรียนต่อครูลดจาก {fmt.dec(dd.studentsPerTeacher, 1)} เหลือ{' '}
            {fmt.dec(ed.studentsPerTeacherAfter, 1)}
          </p>
        </div>
      </div>
    </SlideFrame>
  )
}
