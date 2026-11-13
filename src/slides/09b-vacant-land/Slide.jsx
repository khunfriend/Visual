import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, Stat, fmt } from '../../components/charts/kit.jsx'
import { vacant } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ 11 (ที่ว่างทำสวน): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ตัวเลขทุกตัวมาจาก src/data/vacant.json (build_data.py ส่วน 7b) และต้องตรงกับ ข้อมูลรวม_ตรวจแล้ว.md
// ฐาน % = พื้นที่สวนที่ต้องเพิ่ม 35,909 ตร.ม. (คิดจากพื้นที่สวนจริง จึงต่างจาก 35,440 ของหน้า 9 เล็กน้อย)

const { groups, total, plan, gapM2 } = vacant
const pct0 = (v) => `${Math.round(v)}%`

/** กราฟ 1: ที่ว่างทั้งหมดแยกตามเจ้าของ เทียบกับพื้นที่ที่ต้องเพิ่ม */
function OwnerBar() {
  const gapPos = (gapM2 / total.areaM2) * 100
  return (
    <div className={s.ownerChart}>
      <div className={s.barArea}>
        <span className={s.gapLabel} style={{ left: `${gapPos}%` }}>
          พื้นที่ที่ต้องเพิ่ม {fmt.int(gapM2)} ตร.ม.
        </span>
        <div className={s.bar}>
          {groups.map((g) => (
            <div key={g.owner} style={{ flex: g.areaM2, background: color.vacantOwner[g.owner] }} title={`${g.owner} ${fmt.int(g.areaM2)} ตร.ม.`} />
          ))}
        </div>
        <span className={s.gapLine} style={{ left: `${gapPos}%` }} />
      </div>
      <div className={s.ownerLegend}>
        {groups.map((g) => (
          <div key={g.owner} className={s.ownerItem}>
            <b>
              <i style={{ background: color.vacantOwner[g.owner] }} />
              {g.owner} {pct0(g.pctOfGap)}
            </b>
            <small>{fmt.int(g.plots)} แปลง · {fmt.int(g.areaM2)} ตร.ม.</small>
          </div>
        ))}
        <div className={`${s.ownerItem} ${s.ownerTotal}`}>
          <b>รวมทั้งหมด {pct0(total.pctOfGap)}</b>
          <small>{fmt.int(total.plots)} แปลง · {fmt.int(total.areaM2)} ตร.ม.</small>
        </div>
      </div>
      <p className={s.ownerNote}>
        ที่เอกชนใช้ได้ผ่านการยกเว้นภาษีที่ดิน (ม.8 พ.ร.บ.ภาษีที่ดินฯ 2562) ใช้แค่ราว{' '}
        <b className="num">{fmt.int(plan.sites.at(-1).areaM2)}</b> ตร.ม. จาก {fmt.int(groups[2].areaM2)} ตร.ม. ก็พอ
      </p>
    </div>
  )
}

export default function VacantLand() {
  const pubPlots = plan.sites.filter((x) => x.no).length
  return (
    <SlideFrame
      kicker="11 · สวนหย่อม (ที่ว่าง)"
      title={`ที่ว่างมีพอ: ที่รัฐและศาสนสถาน ${pubPlots} แปลงได้ ${pct0(plan.publicPctOfGap)} ของสวนที่ต้องเพิ่ม`}
      subtitle={`ที่ว่าง ${fmt.int(total.plots)} แปลง ${fmt.int(total.areaM2)} ตร.ม. = ${pct0(total.pctOfGap)} ของพื้นที่ที่ต้องเพิ่ม ${fmt.int(gapM2)} ตร.ม. · แผนรายแปลงอยู่ในภาคผนวก A4`}
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
          <Stat label={`ที่รัฐ + ศาสนสถาน ${pubPlots} แปลง`} value={pct0(plan.publicPctOfGap)} sub={`${fmt.int(plan.publicAreaM2)} ตร.ม. ของที่ต้องเพิ่ม`} />
          <Stat label="ที่เหลือใช้ที่เอกชน" value={fmt.int(plan.sites.at(-1).areaM2)} unit="ตร.ม." sub={`จากที่ว่างเอกชน ${fmt.int(groups[2].areaM2)} ตร.ม.`} />
          <Stat label="งบสร้างสวนให้ถึงค่ากลาง" value={fmt.mb(plan.totalBaht, 2)} unit="ล้านบาท" sub="รวมค่าบำรุงรักษาปีแรก · ไม่รวมค่าที่ดิน · รายแปลงดูภาคผนวก A4" />
        </aside>
      </div>
    </SlideFrame>
  )
}
