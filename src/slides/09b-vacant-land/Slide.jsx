import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, Stat, fmt } from '../../components/charts/kit.jsx'
import { vacant } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import { firstArea, firstBudget, firstSites, withMaint } from './firstPhase.js'
import s from './style.module.css'

// สไลด์ 11 (ที่ว่างทำสวน): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวมาจาก src/data/vacant.json (build_data.py ส่วน 7b) และต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md
// ฐาน % = พื้นที่สวนที่ต้องเพิ่ม 35,909 ตร.ม. (คิดจากพื้นที่สวนจริง จึงต่างจาก 35,440 ของหน้า 9 เล็กน้อย)

const { groups, total, plan, gapM2 } = vacant
const pct0 = (v) => `${Math.round(v)}%`

/** ตาราง: จะทำแค่ 3 แห่ง · พื้นที่ · งบ (ค่าก่อสร้าง + บำรุงรักษา) */
function FirstSites() {
  return (
    <table className={s.firstTable}>
      <caption>
        จะทำแค่ {firstSites.length} แห่ง
        <small>งบ = ค่าก่อสร้าง {fmt.int(plan.costPerM2)} บาท/ตร.ม. + ค่าบำรุงรักษา {fmt.int(plan.maintenanceRate * 100)}% · ไม่รวมค่าที่ดิน</small>
      </caption>
      <thead>
        <tr>
          <th>แปลง</th>
          <th>พื้นที่ ตร.ม. (% ของที่ต้องเพิ่ม)</th>
          <th>งบประมาณ (ล้านบาท)</th>
        </tr>
      </thead>
      <tbody>
        {firstSites.map((x) => (
          <tr key={x.no}>
            <td>
              <span className={s.no} style={{ background: color.vacantGroup[x.group] }}>{x.no}</span>
              {x.name}
            </td>
            <td className="num">
              {fmt.int(x.areaM2)} <span className={s.pct}>({fmt.dec(x.pctOfGap, 1)}%)</span>
            </td>
            <td className="num">{fmt.mb(withMaint(x.buildBaht), 2)}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <td>รวม {firstSites.length} แห่ง</td>
          <td className="num">
            {fmt.int(firstArea)} <span className={s.pct}>({fmt.dec((firstArea / gapM2) * 100, 1)}%)</span>
          </td>
          <td className="num">{fmt.mb(firstBudget, 2)}</td>
        </tr>
      </tfoot>
    </table>
  )
}

/** กราฟ 1: ที่ว่างทั้งหมดแยกตามเจ้าของ เทียบกับพื้นที่ที่ต้องเพิ่ม */
function OwnerBar() {
  const gapPos = (gapM2 / total.areaM2) * 100
  const [hover, setHover] = useState(null)
  const h = hover == null ? null : groups[hover]
  // ตำแหน่งกึ่งกลางของแต่ละสี (% ของความกว้างแท่ง) สำหรับวางกล่องข้อความ
  const mids = groups.map((g, i) => (groups.slice(0, i).reduce((a, x) => a + x.areaM2, 0) + g.areaM2 / 2) / total.areaM2 * 100)
  return (
    <div className={s.ownerChart}>
      <div className={s.barArea}>
        <span className={s.gapLabel} style={{ left: `${gapPos}%` }}>
          พื้นที่ที่ต้องเพิ่ม {fmt.int(gapM2)} ตร.ม.
        </span>
        <div className={s.bar} onMouseLeave={() => setHover(null)}>
          {groups.map((g, i) => (
            <div
              key={g.owner}
              className={`${s.seg} ${hover === i ? s.segOn : ''}`}
              style={{ flex: g.areaM2, background: color.vacantOwner[g.owner] }}
              onMouseEnter={() => setHover(i)}
              onClick={() => setHover(hover === i ? null : i)}
            />
          ))}
        </div>
        {h && (
          <div className={s.tip} style={{ left: `${Math.min(Math.max(mids[hover], 12), 88)}%` }}>
            <b>
              {h.owner} <span className="num">{fmt.dec(h.pctOfGap, 1)}%</span>
            </b>
            <span>ของพื้นที่ที่ต้องเพิ่ม {fmt.int(gapM2)} ตร.ม.</span>
            <span>
              {fmt.int(h.plots)} แปลง · {fmt.int(h.areaM2)} ตร.ม.
            </span>
          </div>
        )}
        <span className={s.gapLine} style={{ left: `${gapPos}%` }} />
      </div>
      <div className={s.ownerLegend}>
        {groups.map((g) => (
          <div key={g.owner} className={s.ownerItem}>
            <b>
              <i style={{ background: color.vacantOwner[g.owner] }} />
              {g.owner}
            </b>
          </div>
        ))}
      </div>
      <FirstSites />
    </div>
  )
}

export default function VacantLand() {
  const pubPlots = plan.sites.filter((x) => x.no).length
  return (
    <SlideFrame
      kicker="11 · สวนหย่อม (ที่ว่าง)"
      title={`ที่ว่างมีพอ: ที่รัฐและศาสนสถาน ${pubPlots} แปลงได้ ${pct0(plan.publicPctOfGap)} ของสวนที่ต้องเพิ่ม`}
      subtitle={`ที่ว่าง ${fmt.int(total.plots)} แปลง ${fmt.int(total.areaM2)} ตร.ม. = ${pct0(total.pctOfGap)} ของพื้นที่ที่ต้องเพิ่ม ${fmt.int(gapM2)} ตร.ม. · แผนรายแปลงอยู่ในภาคผนวก A3`}
      source={
        <>
          ที่มา: <a href={vacant.links.green_registry} target="_blank" rel="noreferrer">ทะเบียนพื้นที่สีเขียว เขตดินแดง – กทม.</a>{' '}
          (ที่ว่างบันทึกปี {vacant.years[0]}–{vacant.years[1]} บางแปลงอาจถูกใช้ไปแล้ว) · % = เทียบกับพื้นที่สวนที่ต้องเพิ่มให้ถึงค่ากลาง 50 เขต{' '}
          {fmt.dec(vacant.medianPerCapita, 3)} ตร.ม./คน · มาตรการภาษี:{' '}
          <a href={vacant.links.land_tax_exemption} target="_blank" rel="noreferrer">มติชน</a>
        </>
      }
    >
      <div className={s.grid}>
        <ChartCard
          title={`ถ้าใช้ที่ว่างทั้งหมด จะได้ ${pct0(total.pctOfGap)} ของที่ต้องเพิ่ม`}
          note={`หรือสวน ${fmt.dec(vacant.perCapitaIfAll)} ตร.ม./คน (${fmt.dec(vacant.perCapitaIfAll / vacant.medianPerCapita, 1)} เท่าของค่ากลาง ${fmt.dec(vacant.medianPerCapita)}) · ที่ว่าง ${fmt.int(total.plots)} แปลง แยกตามเจ้าของ · % = เทียบกับพื้นที่ที่ต้องเพิ่ม ${fmt.int(gapM2)} ตร.ม.`}
        >
          <OwnerBar />
        </ChartCard>
        <aside className={s.side}>
          <Stat label={`ที่รัฐ + ศาสนสถาน ${pubPlots} แปลง`} value={fmt.int(plan.publicAreaM2)} unit="ตร.ม." sub={`คิดเป็น ${pct0(plan.publicPctOfGap)} ของพื้นที่ที่ต้องเพิ่ม ${fmt.int(gapM2)} ตร.ม.`} />
          <Stat label="ที่เหลือใช้ที่เอกชน" value={fmt.int(plan.sites.at(-1).areaM2)} unit="ตร.ม." sub={`จากที่ว่างเอกชน ${fmt.int(groups[2].areaM2)} ตร.ม.`} />
          <Stat label="งบสร้างสวนให้ถึงค่ากลาง" value={fmt.mb(plan.totalBaht, 2)} unit="ล้านบาท" sub="รวมค่าบำรุงรักษาปีแรก · ไม่รวมค่าที่ดิน · รายแปลงดูภาคผนวก A3" />
        </aside>
      </div>
    </SlideFrame>
  )
}
