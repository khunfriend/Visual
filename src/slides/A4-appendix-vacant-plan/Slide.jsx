import { useState } from 'react'
import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, fmt } from '../../components/charts/kit.jsx'
import { vacant } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// ภาคผนวก A4 (แผนสร้างสวนบนที่ว่าง ต่อจากสไลด์ 11): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวมาจาก src/data/vacant.json (build_data.py ส่วน 7b) และต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md
// ฐาน % = พื้นที่สวนที่ต้องเพิ่ม 35,909 ตร.ม. (คิดจากพื้นที่สวนจริง จึงต่างจาก 35,440 ของหน้า 9 เล็กน้อย)

const { groups, plan, gapM2 } = vacant
const pct0 = (v) => `${Math.round(v)}%`
const PRIVATE = 'ที่ว่างเอกชน (ส่วนที่ยังขาด)'
const legendGroups = [...new Set(plan.sites.map((x) => x.group))]

/** สีช่อง: ช่องเอกชนเป็นลายขีดเฉียง */
const fill = (group) =>
  group === PRIVATE
    ? `repeating-linear-gradient(135deg, ${color.vacantGroup[group]} 0 8px, ${color.surfaceAlt} 8px 14px)`
    : color.vacantGroup[group]

/** กราฟ 2: แถบแปลงที่จะสร้างสวน (รวม = 100% ของที่ต้องเพิ่ม) */
function SiteBar() {
  const [hover, setHover] = useState(null)
  const h = hover == null ? null : plan.sites[hover]
  let left = 0
  const starts = plan.sites.map((x) => {
    const at = left
    left += x.pctOfGap
    return at
  })
  return (
    <div className={s.siteChart}>
      <div className={s.siteBar} onMouseLeave={() => setHover(null)}>
        {plan.sites.map((x, i) => (
          <div
            key={x.name}
            className={`${s.seg} ${hover === i ? s.segOn : ''}`}
            style={{ flex: x.areaM2, background: fill(x.group) }}
            onMouseEnter={() => setHover(i)}
            onClick={() => setHover(hover === i ? null : i)}
          />
        ))}
        {h && (
          <div className={s.tip} style={{ left: `${Math.min(Math.max(starts[hover] + h.pctOfGap / 2, 14), 86)}%` }}>
            <b>{h.name}</b>
            <span>
              <b className="num">{fmt.dec(h.pctOfGap, 1)}%</b> ของพื้นที่ที่ต้องเพิ่ม · {fmt.int(h.areaM2)} ตร.ม.
            </span>
            <span>{h.owner}</span>
            <span>
              ก่อสร้าง {fmt.mb(h.buildBaht, 2)} + บำรุงรักษา {fmt.mb(h.buildBaht * plan.maintenanceRate, 2)} ={' '}
              {fmt.mb(h.buildBaht * (1 + plan.maintenanceRate), 2)} ล้านบาท
            </span>
          </div>
        )}
      </div>
      <div className={s.siteAxis}>
        <span>0%</span>
        <span>พื้นที่ที่ต้องเพิ่ม {fmt.int(gapM2)} ตร.ม.</span>
      </div>
      <div className={s.groupLegend}>
        {legendGroups.map((g) => (
          <span key={g}>
            <i style={{ background: fill(g) }} />
            {g}
          </span>
        ))}
      </div>
    </div>
  )
}

function SiteTable() {
  const build = plan.buildBaht
  return (
    <table className={s.table}>
      <thead>
        <tr>
          <th colSpan={2}>แปลง</th>
          <th>ค่าก่อสร้าง (ล้านบาท)</th>
        </tr>
      </thead>
      <tbody>
        {plan.sites.map((x) => (
          <tr key={x.name}>
            <td className={s.noCell}>
              <span className={s.no} style={{ background: color.vacantGroup[x.group], color: x.no ? color.surface : color.text }}>
                {x.no ?? '+'}
              </span>
            </td>
            <td>
              <b>{x.name}</b>
              <small>
                {x.owner} · {x.use} · {fmt.int(x.areaM2)} ตร.ม.
              </small>
            </td>
            <td className="num">{fmt.mb(x.buildBaht, 2)}</td>
          </tr>
        ))}
        <tr className={s.sumRow}>
          <td />
          <td>
            <b>ค่าบำรุงรักษา {fmt.int(plan.maintenanceRate * 100)}% ของค่าก่อสร้างทั้งหมด</b>
            <small>
              {fmt.mb(build, 2)} × {fmt.int(plan.maintenanceRate * 100)}% · ต่อปี
            </small>
          </td>
          <td className="num">{fmt.mb(plan.maintenanceBaht, 2)}</td>
        </tr>
        <tr className={s.totalRow}>
          <td />
          <td>
            <b>รวมทั้งหมด</b>
            <small>
              ค่าก่อสร้าง {fmt.mb(build, 2)} + ค่าบำรุงรักษา {fmt.mb(plan.maintenanceBaht, 2)}
            </small>
          </td>
          <td className="num">{fmt.mb(plan.totalBaht, 2)}</td>
        </tr>
      </tbody>
    </table>
  )
}

export default function AppendixVacantPlan() {
  const pubPlots = plan.sites.filter((x) => x.no).length
  return (
    <SlideFrame
      kicker="ภาคผนวก · แผนสร้างสวนบนที่ว่าง"
      title={`เริ่มจากที่รัฐและศาสนสถาน ${pubPlots} แปลง ได้ ${pct0(plan.publicPctOfGap)} ที่เหลือใช้ที่เอกชน`}
      subtitle={`% = เทียบกับพื้นที่ที่ต้องเพิ่ม ${fmt.int(gapM2)} ตร.ม. · ใช้ที่เอกชน ${fmt.int(plan.sites.at(-1).areaM2)} จาก ${fmt.int(groups[2].areaM2)} ตร.ม. · งบรวม ${fmt.mb(plan.totalBaht, 2)} ล้านบาท`}
      source={
        <>
          ที่มา: <a href={vacant.links.green_registry} target="_blank" rel="noreferrer">ทะเบียนพื้นที่สีเขียว เขตดินแดง – กทม.</a>{' '}
          (ที่ว่างบันทึกปี {vacant.years[0]}–{vacant.years[1]} บางแปลงอาจถูกใช้ไปแล้ว) · % = เทียบกับพื้นที่สวนที่ต้องเพิ่มให้ถึงค่ากลาง 50 เขต{' '}
          {fmt.dec(vacant.medianPerCapita, 3)} ตร.ม./คน · ค่าก่อสร้าง {fmt.int(plan.costPerM2)} บาท/ตร.ม. จาก
          สวนวัดหัวลำโพง (<a href={vacant.links.cost_wat_hua_lamphong_budget} target="_blank" rel="noreferrer">THE STANDARD</a>,{' '}
          <a href={vacant.links.cost_wat_hua_lamphong_area} target="_blank" rel="noreferrer">Time Out</a>) สวน 15 นาทีทั่วไปราว 1,000 บาท/ตร.ม. (
          <a href={vacant.links.cost_15min_avg} target="_blank" rel="noreferrer">สยามรัฐ</a>) ควรยืนยันด้วยใบเสนอราคา · มาตรการภาษี:{' '}
          <a href={vacant.links.land_tax_exemption} target="_blank" rel="noreferrer">มติชน</a>
        </>
      }
    >
      <div className={s.grid}>
        <ChartCard
          title="จะสร้างสวนตรงไหน"
          note="ช่องละ 1 แปลง ความกว้าง = % ของพื้นที่ที่ต้องเพิ่ม · ชี้ที่ช่องเพื่อดูรายละเอียด"
        >
          <SiteBar />
        </ChartCard>
        <ChartCard
          title={`งบสร้างสวนรายแปลง รวม ${fmt.mb(plan.totalBaht, 2)} ล้านบาท`}
          note={`ค่าก่อสร้าง ${fmt.int(plan.costPerM2)} บาท/ตร.ม. + ค่าบำรุงรักษา ${fmt.int(plan.maintenanceRate * 100)}% ของค่าก่อสร้าง · ไม่รวมค่าที่ดิน`}
        >
          <SiteTable />
        </ChartCard>
      </div>
    </SlideFrame>
  )
}
