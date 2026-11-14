import { Fragment, useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, Stat, fmt } from '../../components/charts/kit.jsx'
import { vacant } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 11 (ที่ว่างทำสวน): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวมาจาก src/data/vacant.json (build_data.py ส่วน 7b) และต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md
// ฐาน % = พื้นที่สวนที่ต้องเพิ่ม 35,909 ตร.ม. (คิดจากพื้นที่สวนจริง จึงต่างจาก 35,440 ของหน้า 9 เล็กน้อย)

const { total, plan, gapM2, half } = vacant

/** กราฟ 1: สัดส่วนการใช้พื้นที่ทั้งเขต (แท่งเดียว) · ใช้แล้ว = อาคาร/ถนน + พื้นที่สีเขียว + สวน · ไม่ใช้ = ที่ว่าง (สีดำ) */
const land = vacant.land
const LAND = [
  { key: 'used', label: 'อาคาร ถนน ที่อยู่อาศัย', m2: land.usedM2 },
  { key: 'green', label: 'พื้นที่สีเขียวอื่น', m2: land.greenOtherM2 },
  { key: 'park', label: 'สวนสาธารณะที่เข้าถึงได้', m2: land.parkM2 },
  { key: 'vacant', label: `ที่ว่าง ${fmt.int(total.plots)} แปลง`, m2: land.vacantM2 },
]
const pctArea = (m2) => (m2 / land.districtAreaM2) * 100
const pctLabel = (m2) => `${fmt.dec(pctArea(m2), 1)}%`
const takenM2 = land.usedM2 + land.greenOtherM2 + land.parkM2
// แท่งเทา (อาคาร ถนน) ถูกตัดด้วยรอยหยัก: วาดยาวเท่า 1.4 เท่าของส่วนที่เหลือรวมกัน ให้ส่วนเล็กกว้างพอเห็น · ตัวเลขบนป้ายยังเป็นค่าจริง
const openM2 = land.greenOtherM2 + land.parkM2 + land.vacantM2
const drawM2 = (x) => (x.key === 'used' ? openM2 * 1.4 : x.m2)

function LandUse() {
  const [hover, setHover] = useState(null)
  return (
    <div className={s.landChart}>
      <div className={s.groupLabels}>
        <span>ใช้แล้ว <b className="num">{pctLabel(takenM2)}</b></span>
        <span className={s.unusedLabel}>ยังไม่ใช้ <b className="num">{pctLabel(land.vacantM2)}</b> ▾</span>
      </div>
      <div className={s.landBar} onMouseLeave={() => setHover(null)}>
        {LAND.map((x) => (
          <div key={x.key} className={`${s.seg} ${hover === x.key ? s.segOn : ''}`}
            style={{ flex: drawM2(x), background: color.landUse[x.key] }}
            onMouseEnter={() => setHover(x.key)}
            title={`${x.label}: ${fmt.int(x.m2)} ตร.ม. (${pctLabel(x.m2)} ของพื้นที่เขต)`}>
            {x.key === 'used' && (
              <>
                <span className={s.inLabel}>อาคาร ถนน ที่อยู่อาศัย <b className="num">{pctLabel(x.m2)}</b></span>
                <svg className={s.breakMark} viewBox="0 0 24 64" preserveAspectRatio="none" aria-hidden="true">
                  <polyline points="6,0 14,10 6,21 14,32 6,43 14,54 6,64" />
                  <polyline points="12,0 20,10 12,21 20,32 12,43 20,54 12,64" />
                </svg>
              </>
            )}
          </div>
        ))}
      </div>
      <div className={s.scale}>
        <span>≈ แท่งสีเทาถูกตัด</span>
      </div>
      <ul className={s.landLegend}>
        {LAND.map((x) => (
          <li key={x.key} className={hover === x.key ? s.legendOn : ''}
            onMouseEnter={() => setHover(x.key)} onMouseLeave={() => setHover(null)}>
            <i style={{ background: color.landUse[x.key] }} />
            <span>{x.label}</span>
            <b className="num">{pctLabel(x.m2)}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function VacantLand() {
  const [showFormula, setShowFormula] = useState(false)
  return (
    <SlideFrame
      kicker="12 · สวนหย่อม (ที่ว่าง)"
      title={`ที่ว่างมีพอ: ใช้ครึ่งเดียว สวนต่อคนขึ้นเป็น ${fmt.dec(half.perCapitaAfter)} ตร.ม.`}
      source={
        <>
          ที่มา: Bangkok Index 2025 · <a href={vacant.links.green_registry} target="_blank" rel="noreferrer">ทะเบียนพื้นที่สีเขียว เขตดินแดง – กทม.</a>{' '}
          (ที่ว่างบันทึกปี {vacant.years[0]}–{vacant.years[1]})
        </>
      }
    >
      <div className={s.grid}>
        <ChartCard
          title={`ดินแดงใช้พื้นที่ไปแล้ว ${pctLabel(takenM2)} สวนสาธารณะมีแค่ ${pctLabel(land.parkM2)}`}
          note={`ที่ว่างยังมากกว่าสวนที่ต้องเพิ่ม ${fmt.dec(land.vacantM2 / gapM2, 1)} เท่า`}
        >
          <LandUse />
        </ChartCard>
        <aside className={s.side}>
          <p className={s.proposal}>ข้อเสนอ: ดึงที่ว่างมาทำสวน {fmt.int(half.share * 100)}%</p>
          <Stat label="เพิ่มพื้นที่สวน" value={fmt.int(half.areaM2)} unit="ตร.ม." sub={`ครึ่งหนึ่งของที่ว่าง ${fmt.int(total.areaM2)} ตร.ม.`} />
          <Stat label="สวนที่เข้าถึงได้ต่อคน" value={`${fmt.dec(vacant.land.parkM2 / vacant.population)} → ${fmt.dec(half.perCapitaAfter)}`} unit="ตร.ม." sub={`เกินค่ากลาง 50 เขต ${fmt.dec(vacant.medianPerCapita)}`} />
          <div>
            <Stat label="ใช้เงิน" value={fmt.mb(half.totalBaht, 2)} unit="ล้านบาท" sub="ไม่รวมค่าที่ดิน" />
            <button type="button" className={s.formulaBtn} aria-expanded={showFormula} onClick={() => setShowFormula(!showFormula)}>
              {showFormula ? 'ซ่อนสูตรคำนวณ ▴' : 'ดูสูตรคำนวณ ▾'}
            </button>
            {showFormula && (
              <div className={s.formula}>
                <span>พื้นที่</span><span className="num">{fmt.int(total.areaM2)} × {fmt.int(half.share * 100)}%</span><b className="num">= {fmt.int(half.areaM2)} ตร.ม.</b>
                {half.mix.map((m) => (
                  <Fragment key={m.kind}>
                    <span>{m.kind} {fmt.int(m.share * 100)}%</span>
                    <span className="num">{fmt.int(m.areaM2)} × {fmt.int(m.costPerM2)} บาท</span>
                    <b className="num">= {fmt.mb(m.buildBaht, 2)} ล้าน</b>
                  </Fragment>
                ))}
                <span>ก่อสร้างรวม</span><span /><b className="num">= {fmt.mb(half.buildBaht, 2)} ล้าน</b>
                <span>บำรุงรักษา</span><span className="num">{fmt.mb(half.buildBaht, 2)} × {fmt.int(plan.maintenanceRate * 100)}%</span><b className="num">= {fmt.mb(half.maintenanceBaht, 2)} ล้าน</b>
                <span className={s.fTotal}>รวม</span><span className={s.fTotal} /><b className={`${s.fTotal} num`}>= {fmt.mb(half.totalBaht, 2)} ล้าน</b>
              </div>
            )}
          </div>
        </aside>
      </div>
    </SlideFrame>
  )
}
