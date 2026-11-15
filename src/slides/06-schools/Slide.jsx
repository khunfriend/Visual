import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, Stat, fmt } from '../../components/charts/kit.jsx'
import { education as ed } from '../../lib/data.js'
import s from './style.module.css'

// สไลด์ 06: แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md

const LABEL = (sc) =>
  sc.addSchools && sc.addTeachers ? `โรงเรียน +1 และครู +${sc.addTeachers}` : sc.addSchools ? 'โรงเรียน +1' : sc.addTeachers ? `ครู +${sc.addTeachers}` : 'ตอนนี้'
const rows = ed.scenarios.map((sc) => ({ ...sc, label: LABEL(sc), chosen: !sc.addSchools && sc.addTeachers })) // 14 พ.ย.: ใช้กรณีเพิ่มครูอย่างเดียว (ตัดโรงเรียนออก)
const both = rows.find((r) => r.chosen) // ครู +88 (ถึงค่ากลาง)
const salary = ed.teacherSalary
const dd = ed.districts.find((d) => d.name === 'ดินแดง')
const pt = ed.districts.find((d) => d.name === 'ปทุมวัน')
const now = rows.find((r) => !r.addSchools && !r.addTeachers)

// ภาพนับคน: ครู 1 คนดูแลนักเรียนกี่คน (1 ตัว = นักเรียน 1 คน ปัดเป็นจำนวนเต็ม · ตัวเลขข้างแถวคือค่าจริง)
function Person({ x, y, h, className }) {
  const r = h * 0.2
  return (
    <g className={className} transform={`translate(${x} ${y})`}>
      <circle cx={h * 0.3} cy={r} r={r} />
      <path d={`M0 ${h} L0 ${h * 0.68} Q0 ${h * 0.44} ${h * 0.3} ${h * 0.44} Q${h * 0.6} ${h * 0.44} ${h * 0.6} ${h * 0.68} L${h * 0.6} ${h} Z`} />
    </g>
  )
}

function TeacherPictogram({ added, setAdded }) {
  const ddNow = dd.studentsPerTeacher
  const ddAfter = ed.studentsPerTeacherAfter
  const lines = [
    { key: 'dd', label: 'ดินแดง', sub: added ? `ครู ${fmt.int(dd.teachers + ed.teachersNeeded)} คน` : `ครู ${fmt.int(dd.teachers)} คน`, value: added ? ddAfter : ddNow, max: ddNow, cls: s.pxDd },
    { key: 'pt', label: 'ปทุมวัน', sub: 'เขตอันดับ 1', value: pt.studentsPerTeacher, max: pt.studentsPerTeacher, cls: s.pxPt },
    { key: 'med', label: 'ค่ากลาง 50 เขต', sub: '', value: ed.medianStudentsPerTeacher, max: ed.medianStudentsPerTeacher, cls: s.pxMed },
  ]
  const H = 34
  const STEP = 25
  const X0 = 64
  return (
    <div className={s.picto}>
      <div className={s.pxRows}>
        {lines.map((l) => (
          <div key={l.key} className={`${s.pxRow} ${l.cls}`}>
            <div className={s.pxHead}>
              <b>{l.label}</b>
              {l.sub && <small>{l.sub}</small>}
              <span className={`${s.pxValue} num`}>{fmt.dec(l.value, 1)}<small> คน</small></span>
            </div>
            <svg viewBox={`0 0 ${X0 + STEP * 24} ${H + 4}`} className={s.pxSvg} role="img"
              aria-label={`${l.label}: ครู 1 คนต่อนักเรียน ${fmt.dec(l.value, 1)} คน`}>
              <Person x={6} y={0} h={H + 4} className={s.pxTeacher} />
              <line x1={X0 - 16} x2={X0 - 16} y1={6} y2={H} className={s.pxDivider} />
              {Array.from({ length: Math.round(l.max) }, (_, i) => (
                <Person key={i} x={X0 + i * STEP} y={8} h={H - 8}
                  className={`${s.pxKid} ${i >= Math.round(l.value) ? s.pxGone : ''}`} />
              ))}
            </svg>
          </div>
        ))}
      </div>
      <div className={s.pxFoot}>
        <button type="button" className={`${s.pxBtn} ${added ? s.pxBtnOn : ''}`} onClick={() => setAdded((v) => !v)}>
          {added ? '↺ ย้อนกลับ' : `+ เพิ่มครู ${ed.teachersNeeded} คน`}
        </button>
        <p className={s.pxResult}>
          {added ? (
            <>นักเรียนต่อครู <b className="num">{fmt.dec(ddNow, 1)} → {fmt.dec(ddAfter, 1)}</b> เท่าค่ากลาง 50 เขต · คะแนนการศึกษา <b className="num">{fmt.dec(now.score)} → {fmt.dec(both.score)}</b> อันดับ {now.rank} → {both.rank}</>
          ) : (
            <>ครู 1 คนในดินแดงดูแลนักเรียนมากกว่าปทุมวันราว {fmt.int(ddNow - pt.studentsPerTeacher)} คน · กดปุ่มเพื่อดูผลของการเพิ่มครู</>
          )}
        </p>
      </div>
    </div>
  )
}

// เพิ่มประสิทธิภาพการสอน: แก้ปัญหาจริงโดยไม่ต้องสร้างโรงเรียน (ไม่นับในดัชนี · ยังไม่ประเมินงบ)
const EXTRA = [
  { title: 'ผู้ช่วยครูและธุรการโรงเรียน', why: 'ให้ครูที่มีอยู่ได้สอนเต็มเวลา หาคนง่ายกว่าครู' },
  { title: 'ศูนย์พัฒนาเด็กเล็กในชุมชน', why: 'ใช้อาคารในชุมชน รับเด็กเล็กใกล้บ้าน' },
]

export default function Schools() {
  // เปิดหน้ามาเป็นสถานะก่อนเพิ่มครู · กดปุ่มแล้วหัวเรื่องและกล่องขวาจึงเปลี่ยนเป็นผลหลังเพิ่มครู
  const [added, setAdded] = useState(false)
  return (
    <SlideFrame
      kicker="07 · เพิ่มครูและประสิทธิภาพการสอน"
      title={added
        ? `เพิ่มครู ${ed.teachersNeeded} คนและเพิ่มประสิทธิภาพการสอน คะแนนการศึกษาขึ้นเป็น ${fmt.dec(both.score)}`
        : `ครู 1 คนในดินแดงดูแลนักเรียน ${fmt.dec(dd.studentsPerTeacher, 1)} คน มากเป็นอันดับ ${dd.rankStudentsPerTeacher} ของกรุงเทพฯ`}
      source={`คำนวณจากสูตร Bangkok Index 2025 (การศึกษา = เฉลี่ยคะแนนโรงเรียนต่อเด็ก 1,000 คน กับนักเรียนต่อครู) โดยสมมติให้เขตอื่นคงที่ · เงินเดือนครูผู้ช่วย ${fmt.int(salary.monthly)} บาท/เดือน ยังไม่ยืนยันอัตรา กทม.`}
    >
      <div className={s.grid}>
        <ChartCard title="ครู 1 คนดูแลนักเรียนกี่คน" note={`1 ตัว = นักเรียน 1 คน · ดัชนีนับครูของโรงเรียน กทม. + สพฐ. ${dd.schools} แห่ง`} className={s.mapCard}>
          <TeacherPictogram added={added} setAdded={setAdded} />
        </ChartCard>

        <div className={s.side}>
          <h2 className={s.blockTitle}>ต้องใช้งบเท่าไร</h2>
          <Stat label={`เงินเดือนครู ${ed.teachersNeeded} คน`} value={fmt.mb(salary.annualTotal, 1)} unit="ล้านบาท/ปี"
            sub={`${ed.teachersNeeded} × ${fmt.int(salary.monthly)} บาท × 12 เดือน (ยังไม่รวมสวัสดิการ)`} />
          <p className={s.note}>
            {added ? (
              <>ครู {fmt.int(dd.teachers)} → {fmt.int(dd.teachers + ed.teachersNeeded)} คน นักเรียนต่อครูลดจาก {fmt.dec(dd.studentsPerTeacher, 1)} เหลือ{' '}
                {fmt.dec(ed.studentsPerTeacherAfter, 1)}</>
            ) : (
              <>ตอนนี้ครู {fmt.int(dd.teachers)} คน นักเรียนต่อครู {fmt.dec(dd.studentsPerTeacher, 1)}</>
            )}
          </p>
          {/* เพิ่มประสิทธิภาพการสอน: ไม่ทำให้คะแนนดัชนีขยับ แต่แก้ปัญหาได้ทันที · ยังไม่ได้ประเมินงบ (ดู ข้อมูลรวม_ตรวจแล้ว.md) */}
          <div className={s.extra}>
            <h3 className={s.extraTitle}>เพิ่มประสิทธิภาพการสอน <small>ไม่นับในคะแนนดัชนี · ยังไม่ได้ประเมินงบ</small></h3>
            <ul className={s.extraList}>
              {EXTRA.map((x) => (
                <li key={x.title}>
                  <b>{x.title}</b>
                  <span>{x.why}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}
