import SlideFrame from '../../components/SlideFrame.jsx'
import { ChartCard, fmt } from '../../components/charts/kit.jsx'
import { budget } from '../../lib/data.js'
import { color } from '../../theme/theme.js'
import s from './style.module.css'

// สไลด์ A2 (ภาคผนวก): แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md)
// ⚠️ ตัวเลขปี 2569 มาจากเอกสารของกลุ่ม (แผนการนำเสนอ ภาคผนวก) ยังไม่ได้ตรวจกับข้อบัญญัติ 2569 (ไฟล์ 69063)
//    ใช้ตอบคำถามเท่านั้น ไม่ใช้ในการนำเสนอหลัก

const B68 = budget.districts['ดินแดง'].total / 1e6
const Y69 = {
  total: 480.3, // ล้านบาท
  soiPipeProject: 102, // ล้านบาท โครงการปรับปรุงซอยพร้อมวางท่อใหม่
  pipeKm: 4.7,
  bilingual: 11.8,
  cleaning68: 5.82,
  cleaning69: 1.16,
}
const growth = (Y69.total / B68 - 1) * 100
const perM = (Y69.soiPipeProject * 1e6) / (Y69.pipeKm * 1000)

function Pair({ label, a, b, unit, note }) {
  const max = Math.max(a, b)
  return (
    <div className={s.pair}>
      <p className={s.pairLabel}>{label}</p>
      {[
        ['2568', a, color.other],
        ['2569', b, color.dindaeng],
      ].map(([y, v, c]) => (
        <div key={y} className={s.pairRow}>
          <span className={s.year}>{y}</span>
          <span className={s.track}>
            <span className={s.bar} style={{ width: `${(v / max) * 100}%`, background: c }} />
          </span>
          <span className={`${s.val} num`}>
            {fmt.dec(v, v < 10 ? 2 : 1)} <small>{unit}</small>
          </span>
        </div>
      ))}
      {note && <p className={s.pairNote}>{note}</p>}
    </div>
  )
}

export default function Appendix2569() {
  return (
    <SlideFrame
      kicker="ภาคผนวก · ข้อมูลปี 2569"
      title={`ปี 2569 งบเขตเพิ่มเป็น ${fmt.dec(Y69.total, 1)} ล้าน แต่ท่อใหม่อยู่ในซอย ไม่ใช่จุดท่วมบนถนนสายหลัก`}
      subtitle={`งบเขตเพิ่ม ${fmt.dec(growth, 1)}% · งบล้างท่อลดจาก ${fmt.dec(Y69.cleaning68)} เหลือ ${fmt.dec(Y69.cleaning69)} ล้าน · ข้อเสนอให้สำนักการระบายน้ำแก้ถนนสายหลักจึงยังเป็นช่องว่าง`}
      source="ที่มา: ข้อบัญญัติงบประมาณ กทม. 2569 ตามที่สรุปไว้ในเอกสารแผนการนำเสนอของกลุ่ม (ยังไม่ได้ตรวจกับไฟล์ต้นทาง 69063) · ปี 2569 อยู่นอกกรอบเวลาที่นำเสนอ ใช้ตอบคำถามเท่านั้น"
    >
      <div className={s.grid}>
        <ChartCard title="งบที่เปลี่ยนไป (ล้านบาท)">
          <div className={s.pairs}>
            <Pair label="งบรวมสำนักงานเขต" a={B68} b={Y69.total} unit="ล้าน" />
            <Pair label="งบจ้างล้างท่อ" a={Y69.cleaning68} b={Y69.cleaning69} unit="ล้าน" note="ลดลงราว 80% ทั้งที่จุดท่วมซ้ำซากต้องล้างท่อถี่ขึ้น" />
          </div>
        </ChartCard>

        <ChartCard title="งบที่เพิ่มขึ้นไปอยู่ที่ไหน">
          <ul className={s.items}>
            <li>
              <b className="num">{fmt.int(Y69.soiPipeProject)} ล้าน</b>
              <span>โครงการปรับปรุงซอยพร้อมวางท่อระบายน้ำใหม่ ราว {fmt.dec(Y69.pipeKm, 1)} กม. (ตกราว {fmt.int(Math.round(perM / 100) * 100)} บาท/เมตร)</span>
            </li>
            <li>
              <b className="num">{fmt.dec(Y69.bilingual, 1)} ล้าน</b>
              <span>โครงการโรงเรียนสองภาษา</span>
            </li>
            <li className={s.gapItem}>
              <b>ช่องว่าง</b>
              <span>ท่อใหม่ทั้งหมดอยู่ในซอย ส่วนจุดท่วมซ้ำซากที่เรานำเสนออยู่บนถนนสายหลัก (รัชดาภิเษก ประชาสงเคราะห์ ประชาสุข) ซึ่งเป็นความรับผิดชอบของสำนักการระบายน้ำ</span>
            </li>
          </ul>
        </ChartCard>
      </div>
    </SlideFrame>
  )
}
