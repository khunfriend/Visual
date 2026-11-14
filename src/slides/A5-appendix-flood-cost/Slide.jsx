import SlideFrame from '../../components/SlideFrame.jsx'
import { vacant } from '../../lib/data.js'
import s from './style.module.css'

// สไลด์ A5 (ภาคผนวก): แหล่งที่มาของราคาอ้างอิงและข้อมูล หน้า 3 แก้น้ำท่วม + หน้า 5 แก้น้ำเสีย + หน้า 12 สวนหย่อม (ที่ว่าง)
// แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md) · รายละเอียดตัวเลขอยู่ใน ข้อมูลรวม_ตรวจแล้ว.md หัวข้อ "หน้าแก้น้ำท่วม"

const GROUPS = [
  {
    title: 'แก้น้ำท่วม (หน้า 3): ราคาต่อหน่วย', col: 1,
    items: [
      { what: 'ราคาลอกท่อ (≈ 81 บาท/ม.)', src: 'ราคากลาง สนน. ปี 2561 (MGR Online)' },
      { what: 'ค่าแรงทีมเก็บขยะ (400 บาท/วัน)', src: 'ค่าจ้างขั้นต่ำ กทม. ปี 2568' },
      { what: 'สำรวจออกแบบ · ท่อใหม่ · ท่อลอดถนน · กล้องตรวจท่อ', src: 'ประมาณการของกลุ่ม', est: true },
    ],
  },
  {
    title: 'แก้น้ำท่วม: ความยาวท่อและงานล้างท่อ', col: 1,
    items: [
      { what: 'ความยาวท่อในซอยและความถี่ล้างท่อ (225 ซอย)', src: 'สำนักงานเขตดินแดง' },
      { what: 'งบจ้างล้างท่อของเขต ปี 2568 (186 ซอย)', src: 'ระบบติดตามโครงการ กทม. (ยังไม่ได้เปิดตรวจ)', est: true },
    ],
  },
  {
    title: 'แก้น้ำเสียในคลอง (หน้า 5)', col: 1,
    items: [
      { what: 'อุปกรณ์บำบัดในคลองทุกรายการ', src: 'ประมาณการของกลุ่ม', est: true },
    ],
  },
  {
    title: 'แก้น้ำท่วม: น้ำท่วมและฝน', col: 2,
    items: [
      { what: 'จุดท่วม จำนวนครั้ง และฝนรายวัน ปี 2568', src: 'Bangkok Index 2025' },
      { what: 'ขีดจำกัดระบบระบายน้ำ 60 มม.', src: 'ตัวเลขของ กทม. (ยังไม่ได้ตรวจต้นฉบับ)', est: true },
    ],
  },
  {
    title: 'สวนหย่อมบนที่ว่าง (หน้า 12)', col: 2,
    items: [
      { what: 'สวนสาธารณะ 2,000 บาท/ตร.ม. (60% ของพื้นที่)', src: 'สวนวัดหัวลำโพง: งบ ÷ พื้นที่', est: true },
      { what: 'สวน 15 นาที ≈ 1,000 บาท/ตร.ม. (40% ของพื้นที่)', src: 'ค่าเฉลี่ยสวน 15 นาทีของ กทม.', est: true },
      { what: 'ค่าบำรุงรักษา 10% ของค่าก่อสร้าง/ปี', src: 'ค่าของกลุ่ม', est: true },
      { what: 'ที่ว่าง 64 แปลง 125,056 ตร.ม.', src: 'ทะเบียนพื้นที่สีเขียว เขตดินแดง' },
      { what: 'พื้นที่สีเขียว สวนที่เข้าถึงได้ ค่ากลาง 50 เขต', src: 'Bangkok Index 2025' },
    ],
  },
]

// ลิงก์ที่มาทั้งหมด รวมไว้ที่เดียว
const LINKS = [
  ['Bangkok Index 2025', 'https://rocketmedialab.co/database-bangkok-index-2025/'],
  ['Bangkok Index: สวนสาธารณะ', vacant.links.park_index],
  ['ทะเบียนพื้นที่สีเขียว เขตดินแดง', vacant.links.green_registry],
  ['สำนักงานเขตดินแดง: ถนน ตรอก ซอย', 'https://webportal.bangkok.go.th/dindaeng/page/sub/624'],
  ['ระบบติดตามโครงการ กทม. (ต้องล็อกอิน)', 'https://policy.bangkok.go.th'],
  ['THE STANDARD: สวนวัดหัวลำโพง (งบ)', vacant.links.cost_wat_hua_lamphong_budget],
  ['Time Out: สวนวัดหัวลำโพง (พื้นที่)', vacant.links.cost_wat_hua_lamphong_area],
  ['สยามรัฐ: สวน 15 นาที', vacant.links.cost_15min_avg],
]

export default function AppendixFloodCost() {
  return (
    <SlideFrame
      kicker="ภาคผนวก · แหล่งที่มา"
      title="แหล่งที่มาของราคาอ้างอิง: น้ำท่วม น้ำเสีย และสวนหย่อม"
      source="รายละเอียดตัวเลขและวิธีคำนวณทั้งหมดอยู่ใน ข้อมูลรวม_ตรวจแล้ว.md · สำเนาตารางท่อของเขต: data/raw/drain_soi_dindaeng.csv · ข้อมูลที่ว่าง: data/raw/parks_vacant/"
    >
      <div className={s.cols}>
        {[1, 2].map((col) => (
          <div key={col} className={s.list}>
            {GROUPS.filter((g) => g.col === col).map((g) => (
              <section key={g.title} className={s.group}>
                <h2 className={s.groupTitle}>{g.title}</h2>
                {g.items.map((it) => (
                  <div key={it.what} className={s.item}>
                    <b>
                      {it.what}
                      {it.est && <em className={s.est}>ประมาณการ / ยังไม่ได้ตรวจ</em>}
                    </b>
                    <span>{it.src}</span>
                  </div>
                ))}
              </section>
            ))}
            {col === 1 && (
              <section className={s.links}>
                <h2 className={s.groupTitle}>ลิงก์ที่มา</h2>
                <ul>
                  {LINKS.map(([label, url]) => (
                    <li key={url}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ))}
      </div>
    </SlideFrame>
  )
}
