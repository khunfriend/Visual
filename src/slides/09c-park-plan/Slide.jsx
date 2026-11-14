import SlideFrame from '../../components/SlideFrame.jsx'
import { fmt } from '../../components/charts/kit.jsx'
import { vacant } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import { firstArea, firstBudget, firstSites, withMaint } from '../09b-vacant-land/firstPhase.js'
import s from './style.module.css'

const { gapM2, groups, plan, total } = vacant
const shareOfGap = firstArea / gapM2 * 100
const targetShare = gapM2 / total.areaM2 * 100
const comparison = [
  { label: `พื้นที่จาก ${firstSites.length} แห่งที่เสนอ`, area: firstArea, fill: s.proposed },
  { label: 'พื้นที่ที่ต้องเพิ่มให้ถึงค่ากลาง', area: gapM2, fill: s.target },
]

export default function ParkPlan() {
  return (
    <SlideFrame
      kicker="12 · แผนพัฒนาสวนหย่อม"
      title={`เสนอทำสวน ${firstSites.length} แห่ง เพิ่มพื้นที่ ${fmt.int(firstArea)} ตร.ม.`}
      subtitle={`คิดเป็น ${fmt.int(shareOfGap)}% ของพื้นที่สวนที่ต้องเพิ่มเพื่อให้ถึงค่ากลาง 50 เขต`}
      source={
        <>
          ที่มา <a href={vacant.links.green_registry} target="_blank" rel="noreferrer">ทะเบียนพื้นที่สีเขียว เขตดินแดง – กทม.</a>
          {' '}· ข้อมูลที่ว่างปี {vacant.years[0]}–{vacant.years[1]} · ตรวจสอบสถานะพื้นที่ก่อนดำเนินการ · รายละเอียดแปลงในภาคผนวก A3
        </>
      }
    >
      <div className={s.grid}>
        <section className={s.vacantArea}>
          <div className={s.areaHeading}>
            <h2>พื้นที่ว่างทั้งหมด</h2>
            <p><strong className="num">{fmt.int(total.areaM2)} ตร.ม.</strong> · {fmt.int(total.plots)} แปลง</p>
          </div>
          <div className={s.ownerChart} style={{ '--target-position': `${targetShare}%` }}>
            <span className={s.targetLabel}>พื้นที่สวนที่ต้องเพิ่ม {fmt.int(gapM2)} ตร.ม.</span>
            <div className={s.ownerBar}>
              {groups.map(({ owner, areaM2, plots }) => (
                <button
                  key={owner}
                  type="button"
                  className={s.ownerSegment}
                  style={{ flexGrow: areaM2, background: color.vacantOwner[owner] }}
                  aria-label={`${owner} ${fmt.int(areaM2)} ตร.ม. ${fmt.int(plots)} แปลง`}
                >
                  <span className={s.ownerTooltip} aria-hidden="true">
                    {owner} <strong className="num">{fmt.int(areaM2)} ตร.ม.</strong> · {fmt.int(plots)} แปลง
                  </span>
                </button>
              ))}
            </div>
          </div>
          <ul className={s.ownerLabels}>
            {groups.map(({ owner }) => (
              <li key={owner}>
                <i aria-hidden="true" style={{ background: color.vacantOwner[owner] }} />
                {owner}
              </li>
            ))}
          </ul>
        </section>
        <section className={s.comparison}>
          <h2>แผนนี้เพิ่มพื้นที่สวนได้เท่าไร</h2>
          <ul className={s.bars}>
            {comparison.map(({ label, area, fill }) => (
              <li key={label}>
                <div className={s.barLabel}>
                  <span>{label}</span>
                  <strong className="num">{fmt.int(area)} ตร.ม.</strong>
                </div>
                <div className={s.track} aria-hidden="true">
                  <div className={fill} style={{ width: `${area / gapM2 * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className={s.remaining}>หลังทำครบ ยังต้องเพิ่มอีก <strong className="num">{fmt.int(gapM2 - firstArea)} ตร.ม.</strong> เพื่อให้ถึงค่ากลาง</p>
        </section>

        <table className={s.sites}>
          <caption>แปลงที่เสนอพัฒนา</caption>
          <thead>
            <tr>
              <th scope="col">แปลง</th>
              <th scope="col">พื้นที่ (ตร.ม.)</th>
              <th scope="col">งบ (ล้านบาท)</th>
            </tr>
          </thead>
          <tbody>
            {firstSites.map((site) => (
              <tr key={site.no}>
                <th scope="row">{site.name}</th>
                <td className="num">{fmt.int(site.areaM2)}</td>
                <td className="num">{fmt.mb(withMaint(site.buildBaht), 2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">รวม {firstSites.length} แห่ง</th>
              <td className="num">{fmt.int(firstArea)}</td>
              <td className="num">{fmt.mb(firstBudget, 2)}</td>
            </tr>
          </tfoot>
        </table>
        <p className={s.costNote}>
          ค่าก่อสร้าง {fmt.int(plan.costPerM2)} บาท/ตร.ม. พร้อมค่าบำรุงรักษาปีแรก {fmt.int(plan.maintenanceRate * 100)}% · ไม่รวมค่าที่ดิน
        </p>
      </div>
    </SlideFrame>
  )
}
