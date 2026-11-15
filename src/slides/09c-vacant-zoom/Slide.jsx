import { Fragment, useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, Stat, fmt } from '../../components/charts/kit.jsx'
import { vacant } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import { hoverTap, tapAway } from '../../components/charts/hoverTap.js'
import s from './style.module.css'

// สไลด์ 12 (ที่ว่างทำสวน แบบภาพรวม + ขยาย · ทางเลือกของหน้า 11): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวมาจาก src/data/vacant.json (build_data.py ส่วน 7b) และต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md
// ฐาน % = พื้นที่สวนที่ต้องเพิ่ม 35,909 ตร.ม. (คิดจากพื้นที่สวนจริง จึงต่างจาก 35,440 ของหน้า 9 เล็กน้อย)

const { total, plan, gapM2, half } = vacant

/** กราฟ: ภาพรวมทั้งเขต (แท่งบน สเกลจริง 100%) แล้วขยายเฉพาะส่วนที่ว่าง 1.5% ลงมาเทียบกับสวนที่ต้องเพิ่ม
 * แท่งบน: ย่อส่วนสีเทา (อาคาร ถนน) ให้สวน 0.4% ยังมองเห็น · ส่วนสีที่เหลือยาวตามสัดส่วนกันเอง · ป้าย % เป็นค่าจริง
 * แท่งล่าง 3 แท่งใช้สเกลเดียวกัน (ตร.ม.) แท่งยาวสุด = ที่ว่างทั้งหมด = กว้างเต็มกราฟ */
const land = vacant.land
const pctArea = (m2) => (m2 / land.districtAreaM2) * 100
const pctLabel = (m2) => `${fmt.dec(pctArea(m2), 1)}%`
const takenM2 = land.usedM2 + land.greenOtherM2 + land.parkM2
const ownerM2 = vacant.groups.filter((g) => g.owner !== 'เอกชน').reduce((a, g) => a + g.areaM2, 0) // ที่รัฐ + ศาสนสถาน (20,648)
// งบ: ปัดทีละก้อนก่อนบวก ให้ตรงกับตารางหน้า 12 (100.04 + 10.00 = 110.04)
const mb2 = (baht) => Math.round(baht / 1e4) / 100
const BUILD = mb2(half.buildBaht)
const MAINT = mb2(half.maintenanceBaht)
const TOTAL = BUILD + MAINT
const m2fmt = (v) => fmt.dec(v, 2)

const W = 1000
const OV = [
  { key: 'used', label: 'อาคาร ถนน ที่อยู่อาศัย', m2: land.usedM2 },
  { key: 'green', label: 'พื้นที่สีเขียวอื่น', m2: land.greenOtherM2 },
  { key: 'park', label: 'สวนสาธารณะที่เข้าถึงได้', m2: land.parkM2 },
  { key: 'vacant', label: `ที่ว่าง ${fmt.int(total.plots)} แปลง`, m2: land.vacantM2 },
]
const ROWS = [
  { key: 'vacant', label: `ที่ว่างที่สำรวจพบทั้งหมด ${fmt.int(total.plots)} แปลง`, m2: total.areaM2, fill: color.landUse.vacant },
  { key: 'half', label: `เสนอทำสวน ${fmt.int(half.share * 100)}%`, m2: half.areaM2, fill: color.good, strong: true },
  { key: 'gap', label: 'สวนที่ต้องเพิ่มให้ถึงค่ากลาง 50 เขต', m2: gapM2, dashed: true },
]

function LandZoom() {
  const [hover, setHover] = useState(null) // แท่งล่าง
  const [ovHover, setOvHover] = useState(null) // แท่งภาพรวม
  const BAR_Y = 34
  const BAR_H = 44
  // แท่งเทาถูกย่อ (มีรอยตัด) ให้ส่วนสีที่เหลือกว้าง OPEN_W หน่วย · สีเขียว สวน ที่ว่าง ยังยาวตามสัดส่วนกันเอง
  const OPEN_W = 230
  const openM2 = land.greenOtherM2 + land.parkM2 + land.vacantM2
  let acc = 0
  const segs = OV.map((x) => {
    const w = x.key === 'used' ? W - OPEN_W : (x.m2 / openM2) * OPEN_W
    const seg = { ...x, x: acc, w }
    acc += w
    return seg
  })
  const CUT = (W - OPEN_W) * 0.72 // ตำแหน่งรอยตัดบนแท่งเทา
  const vac = segs.find((x) => x.key === 'vacant')
  const ovSeg = segs.find((x) => x.key === ovHover)
  const ZT = 150 // ขอบล่างของกรอบขยาย
  const RH = 80
  const R0 = ZT + 16
  const xs = (m2) => (m2 / total.areaM2) * W
  const H = R0 + RH * ROWS.length
  const gapX = xs(gapM2)
  const rowOf = (k) => ROWS.findIndex((r) => r.key === k)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={s.zoom} role="img"
      aria-label={`ที่ว่าง ${pctLabel(land.vacantM2)} ของพื้นที่เขต ${fmt.int(total.areaM2)} ตร.ม. เสนอทำสวน ${fmt.int(half.areaM2)} ตร.ม. สวนที่ต้องเพิ่ม ${fmt.int(gapM2)} ตร.ม.`}
      onMouseLeave={() => (setHover(null), setOvHover(null))} {...tapAway((v) => (setHover(v), setOvHover(v)))}>
      {/* แท่งบน: ทั้งเขต 100% สเกลจริง */}
      <text x={0} y={BAR_Y - 12} className={s.zHead}>ทั้งเขต {fmt.dec(land.districtAreaM2 / 1e6)} ตร.กม. · ใช้ไปแล้ว {pctLabel(takenM2)}</text>
      {/* ชี้ที่ส่วนใดส่วนหนึ่ง: ส่วนนั้นขยาย (วาดทับส่วนอื่น) ส่วนอื่นจาง และขึ้นกล่องข้อมูลใต้แท่ง */}
      {[...segs.filter((x) => x.key !== ovHover), ...segs.filter((x) => x.key === ovHover)].map((x) => (
        <rect key={x.key} x={x.x} y={BAR_Y} width={x.w} height={BAR_H} fill={color.landUse[x.key]}
          className={`${s.zSeg} ${ovHover === x.key ? s.zSegOn : ovHover ? s.zDim : ''}`}
          {...hoverTap(x.key, ovHover === x.key, (v) => (setOvHover(v), setHover(null)))} />
      ))}
      {[0, 9].map((d) => (
        <polyline key={d} className={s.zCut} points={[0, 1, 2, 3, 4, 5].map((k) => `${CUT + d + (k % 2 ? 6 : 0)},${BAR_Y - 2 + (k * (BAR_H + 4)) / 5}`).join(' ')} />
      ))}
      <text x={16} y={BAR_Y + BAR_H / 2} dy="0.35em" className={s.zIn}>อาคาร ถนน ที่อยู่อาศัย {pctLabel(land.usedM2)}</text>
      {/* กรอบขยาย: จากส่วนที่ว่างบนแท่งบน ลงมาเต็มความกว้าง */}
      <polygon points={`${vac.x},${BAR_Y + BAR_H} ${W},${BAR_Y + BAR_H} ${W},${ZT} 0,${ZT}`} className={s.zFan} />
      <line x1={vac.x} y1={BAR_Y + BAR_H} x2={0} y2={ZT} className={s.zFanEdge} />
      <line x1={W} y1={BAR_Y + BAR_H} x2={W} y2={ZT} className={s.zFanEdge} />
      <text x={W - 10} y={ZT - 12} textAnchor="end" className={s.zSmall}>ขยายส่วนที่ว่าง · แท่งด้านล่างใช้สเกลเดียวกัน (ตร.ม.)</text>
      {/* แท่งล่าง: เทียบที่ว่าง ข้อเสนอ และสวนที่ต้องเพิ่ม */}
      {ROWS.map((r, i) => {
        const y = R0 + i * RH
        const w = xs(r.m2)
        return (
          <g key={r.key} className={hover && hover !== r.key ? s.zDim : ''} {...hoverTap(r.key, hover === r.key, (v) => (setHover(v), setOvHover(null)))}>
            <text x={0} y={y + 22} className={r.strong ? s.zRowStrong : s.zRow}>{r.label}</text>
            <text x={W} y={y + 22} textAnchor="end" className={`${r.strong ? s.zValStrong : s.zVal} num`}>{fmt.int(r.m2)} ตร.ม.</text>
            <rect x={0} y={y + 34} width={W} height={30} rx={4} className={s.zTrack} />
            {r.dashed
              ? <rect x={1} y={y + 35} width={w - 2} height={28} rx={4} className={s.zGap} />
              : <rect x={0} y={y + 34} width={w} height={30} rx={4} fill={r.fill} />}
            <title>{`${r.label}: ${fmt.int(r.m2)} ตร.ม.`}</title>
          </g>
        )
      })}
      {/* เส้นประ: ตำแหน่งสวนที่ต้องเพิ่ม เทียบกับข้อเสนอ */}
      <line x1={gapX} x2={gapX} y1={R0 + rowOf('half') * RH + 28} y2={R0 + rowOf('gap') * RH + 70} className={s.zGuide} />
      <text x={xs(half.areaM2) + 12} y={R0 + rowOf('half') * RH + 55} className={s.zNote}>
        = {fmt.dec(half.areaM2 / gapM2, 2)} เท่าของที่ต้องเพิ่ม
      </text>
      {ovSeg && (() => {
        const TW = 370
        const TH = 76
        const tx = Math.min(Math.max(ovSeg.x + ovSeg.w / 2 - TW / 2, 0), W - TW)
        const ty = BAR_Y + BAR_H + 10
        return (
          <g className={s.zTip} transform={`translate(${tx} ${ty})`} pointerEvents="none">
            <rect width={TW} height={TH} rx={8} />
            <circle cx={22} cy={24} r={8} fill={color.landUse[ovSeg.key]} />
            <text x={38} y={31} className={s.zTipName}>{ovSeg.label}</text>
            <text x={16} y={62} className={s.zTipVal}>
              <tspan className="num">{fmt.int(ovSeg.m2)}</tspan> ตร.ม. · <tspan className={s.zTipPct}>{pctLabel(ovSeg.m2)}</tspan> ของพื้นที่เขต
            </text>
          </g>
        )
      })()}
    </svg>
  )
}

export default function VacantZoom() {
  const [showFormula, setShowFormula] = useState(false)
  return (
    <SlideFrame
      kicker="12 · สวนหย่อม (ที่ว่าง)"
      title={`ใช้ที่ว่างครึ่งหนึ่ง สวนที่เข้าถึงได้เพิ่มจาก ${fmt.dec(land.parkM2 / vacant.population)} เป็น ${fmt.dec(half.perCapitaAfter)} ตร.ม./คน`}
      subtitle={`ดินแดงมีที่ว่างที่สำรวจพบ ${fmt.int(total.plots)} แปลง ${fmt.int(total.areaM2)} ตร.ม. มากกว่าสวนที่ต้องเพิ่ม ${fmt.dec(land.vacantM2 / gapM2, 1)} เท่า`}
      source={
        <>
          ที่มา: Bangkok Index 2025 · <a href={vacant.links.green_registry} target="_blank" rel="noreferrer">ทะเบียนพื้นที่สีเขียว เขตดินแดง – กทม.</a>{' '}
          (ที่ว่างบันทึกปี {vacant.years[0]}–{vacant.years[1]})
        </>
      }
    >
      <div className={s.grid}>
        <ChartCard
          title={`ที่ว่างมีแค่ ${pctLabel(land.vacantM2)} ของเขต แต่ใช้ครึ่งเดียวก็เกินสวนที่ต้องเพิ่ม`}
          note="แท่งบนย่อส่วนสีเทาให้เห็นส่วนเล็ก"
        >
          <LandZoom />
        </ChartCard>
        <aside className={s.side}>
          <p className={s.proposal}>ข้อเสนอ: ดึงที่ว่างมาทำสวน {fmt.int(half.share * 100)}%</p>
          <Stat label="เพิ่มพื้นที่สวน" value={fmt.int(half.areaM2)} unit="ตร.ม."
            sub={`ที่รัฐและศาสนสถาน ${fmt.int(ownerM2)} · ที่เอกชน ${fmt.int(half.privateM2Needed)} ตร.ม. (แลกยกเว้นภาษีที่ดิน)`} />
          <Stat label="สวนที่เข้าถึงได้ต่อคน" value={`${fmt.dec(land.parkM2 / vacant.population)} → ${fmt.dec(half.perCapitaAfter)}`} unit="ตร.ม." sub={`เกินค่ากลาง 50 เขต ${fmt.dec(vacant.medianPerCapita)}`} />
          <div>
            <Stat label="งบประมาณ (ไม่รวมค่าที่ดิน)" value={m2fmt(TOTAL)} unit="ล้านบาท"
              sub={`ก่อสร้าง ${m2fmt(BUILD)} ล้าน (ครั้งเดียว) + บำรุงรักษา ${m2fmt(MAINT)} ล้าน/ปี`} />
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
                <span className={s.fTotal}>รวม</span><span className={s.fTotal} /><b className={`${s.fTotal} num`}>= {m2fmt(TOTAL)} ล้าน</b>
              </div>
            )}
          </div>
        </aside>
      </div>
    </SlideFrame>
  )
}
