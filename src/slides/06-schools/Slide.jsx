import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import MapBase, { heatColor } from '../../components/charts/MapBase.jsx'
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
// ความหนาแน่นเด็ก 5–19 ปี (WorldPop) วาดเป็นช่อง ~100 ม. ใต้หมุดโรงเรียน (แผนที่ตัดขอบเขตให้เอง)
const kids = map.kids
// ระบายสีตามลำดับเปอร์เซ็นไทล์ (ไม่ใช่ค่าดิบ) เพราะเกือบทั้งเขตหนาแน่น ค่าดิบจะส้มทั้งแผ่น · ดูได้แค่ "ตรงไหนมากกว่าตรงไหน"
const sortedKids = kids.cells.map((c) => c[4]).sort((a, b) => a - b)
const pctl = (v) => {
  let lo = 0
  let hi = sortedKids.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (sortedKids[mid] < v) lo = mid + 1
    else hi = mid
  }
  return lo / sortedKids.length
}
const kidCells = kids.cells
  .map(([x, y, w, h, v]) => ({ x, y, w, h, n: pctl(v) }))
  .filter((c) => c.n >= 0.25) // ตัดช่องที่เด็กน้อยที่สุด 1 ใน 4 ออก ให้เห็นถนนและพื้นที่ว่าง
const kidLayer = (
  <g>
    {kidCells.map((c, i) => (
      <rect key={i} x={c.x} y={c.y} width={c.w + 0.5} height={c.h + 0.5} fill={heatColor(c.n)} fillOpacity={0.15 + 0.6 * c.n} />
    ))}
  </g>
)

const FILTERS = [
  ['all', 'ทั้งหมด', () => true],
  ['private', 'เอกชน', (sc) => sc.private],
  ['other', 'อื่น ๆ', (sc) => !sc.private],
]
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
  const [showKids, setShowKids] = useState(true) // ชั้นความหนาแน่นเด็ก
  const schools = allSchools.filter(FILTERS.find(([k]) => k === filter)[2])
  const nPrivate = allSchools.filter((sc) => sc.private).length
  const kidsToggle = (
    <button type="button" className={`${s.kidsBtn} ${showKids ? s.on : ''}`} aria-pressed={showKids}
      onClick={(e) => (e.stopPropagation(), setShowKids((v) => !v))}>
      ความหนาแน่นเด็ก {showKids ? 'เปิด' : 'ปิด'}
    </button>
  )
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
      kicker="06 · เพิ่มโรงเรียนและครู"
      title={`มีโรงเรียนต้องมีครู: เพิ่มโรงเรียน 1 แห่งและครู ${ed.teachersNeeded} คน คะแนนการศึกษาขึ้นเป็น ${fmt.dec(both.score)}`}
      subtitle={`อันดับการศึกษาขยับจาก ${now.rank} เป็นราว ${both.rank}`}
      source={`คำนวณจากสูตร Bangkok Index 2025 สมมติเขตอื่นคงที่ · เงินเดือนครูผู้ช่วย ${fmt.int(salary.monthly)} บาท (2568) · แผนที่ © OpenStreetMap contributors`}
    >
      <div className={s.grid}>
        <ChartCard title="โรงเรียนในเขตตอนนี้" note={`พบ ${allSchools.length} แห่ง (เอกชน ${nPrivate}) · ดัชนีนับเฉพาะสังกัด กทม. + สพฐ. ${ed.districts.find((d) => d.name === 'ดินแดง').schools} แห่ง`} className={s.mapCard}>
          <div className={s.mapWrap}>
            <div className={s.mapArea}>
              <Expandable
                title="โรงเรียนในเขตดินแดง"
                note="สี่เหลี่ยมโปร่ง = เอกชน (ยืนยันแล้ว 4 แห่ง) · ที่เหลือยังไม่ได้แยกว่าเป็นสังกัด กทม. / สพฐ."
                toolbar={<>{filterBar}{kidsToggle}</>}
                aside={
                  <ol className={s.asideList}>
                    {schools.map((sc) => (
                      <li key={sc.osm}>
                        {sc.no}. {sc.name}{sc.private ? ' · เอกชน' : ''}
                      </li>
                    ))}
                  </ol>
                }
              >
                {({ expanded }) => (
                  <FollowTip tip={hover && (
                    <TipBox active payload={[{ payload: hover }]}
                      render={(r) => ({ title: `${r.no}. ${r.name}`, rows: [['ประเภท', r.private ? 'เอกชน' : 'ยังไม่แยกสังกัด']] })} />
                  )}>
                  <MapBase labelSize={expanded ? 18 : 24} children={showKids ? kidLayer : null} overlay={(
                      <g>
                        {schools.map((sc) => (
                          <g key={sc.osm} onMouseEnter={() => setHover(sc)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
                            {/* เอกชน = สี่เหลี่ยมโปร่ง · อื่น ๆ = สี่เหลี่ยมทึบ (แยกด้วยรูปทรง ไม่ต้องเพิ่มสี) */}
                            <rect x={sc.x - 11} y={sc.y - 11} width={22} height={22} rx={4} fill={color.text} stroke={color.surface} strokeWidth={3} />
                            {sc.private && <rect x={sc.x - 6} y={sc.y - 6} width={12} height={12} rx={2} fill={color.surface} />}
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
                {kidsToggle}
                <span className={s.pinKey}><i className={s.pinSolid} /> อื่น ๆ <i className={s.pinHollow} /> เอกชน</span>
              </div>
              {showKids && (
                <div className={s.heatKey}>
                  <span>เด็ก 5–19 ปี น้อยกว่า</span>
                  <i style={{ background: `linear-gradient(90deg, ${color.heat.join(',')})` }} />
                  <span>มากกว่า</span>
                  <small>ประมาณจาก WorldPop 2020</small>
                </div>
              )}
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
