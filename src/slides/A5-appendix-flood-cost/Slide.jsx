import SlideFrame from '../../components/SlideFrame.jsx'
import { vacant } from '../../lib/data.js'
import s from './style.module.css'

// สไลด์ A5 (ภาคผนวก): แหล่งที่มาของราคาอ้างอิงและข้อมูล หน้า 3 แก้น้ำท่วม + หน้า 5 แก้น้ำเสีย + หน้า 12 สวนหย่อม (ที่ว่าง)
// แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md) · รายละเอียดตัวเลขอยู่ใน ข้อมูลรวม_ตรวจแล้ว.md หัวข้อ "หน้าแก้น้ำท่วม"

const GROUPS = [
  {
    title: 'แก้น้ำท่วม (หน้า 3): ราคาต่อหน่วย', col: 1,
    items: [
      { what: 'ราคาลอกท่อ (≈ 81 บาท/ม.)', src: 'ราคากลางประมูลลอกท่อของสำนักการระบายน้ำ กทม. ปี 2561', ref: 'MGR Online, 29 ม.ค. 2561' },
      { what: 'ค่าแรงทีมเก็บขยะ (400 บาท/วัน)', src: 'ค่าจ้างขั้นต่ำ กรุงเทพฯ มีผล 1 ก.ค. 2568', ref: 'มติคณะกรรมการค่าจ้าง 17 มิ.ย. 2568' },
      { what: 'สำรวจออกแบบ · ท่อใหม่ · ท่อลอดถนน · กล้องตรวจท่อ', src: 'ประมาณการของกลุ่ม', ref: 'ไม่พบราคากลางในแหล่งข้อมูลเปิด', est: true },
    ],
  },
  {
    title: 'แก้น้ำท่วม: ความยาวท่อและงานล้างท่อ', col: 1,
    items: [
      { what: 'ความยาวท่อระบายน้ำในซอยและความถี่ล้างท่อ (225 ซอย)', src: 'สำนักงานเขตดินแดง หน้า “ถนน ตรอก และซอย”', ref: 'webportal.bangkok.go.th/dindaeng/page/sub/624' },
      { what: 'งบจ้างล้างท่อของเขต ปีงบ 2568 (186 ซอย)', src: 'ระบบติดตามโครงการ กรุงเทพมหานคร', ref: 'policy.bangkok.go.th (ต้องล็อกอิน ยังไม่ได้เปิดตรวจต้นฉบับ)', est: true },
    ],
  },
  {
    title: 'แก้น้ำเสียในคลอง (หน้า 5)', col: 1,
    items: [
      { what: 'อุปกรณ์บำบัดในคลองทุกรายการ', src: 'ตะแกรง ถังดักไขมัน คอกตะกอน เครื่องเติมอากาศ แพไบโอฟิล์ม EM: ประมาณการของกลุ่ม', ref: 'ไม่พบราคากลางในแหล่งข้อมูลเปิด', est: true },
    ],
  },
  {
    title: 'แก้น้ำท่วม: น้ำท่วมและฝน', col: 2,
    items: [
      { what: 'จุดท่วม จำนวนครั้ง และฝนรายวัน ปี 2568', src: 'Bangkok Index 2025 – Rocket Media Lab (น้ำท่วมขังบนถนนสายหลัก)', ref: 'rocketmedialab.co' },
      { what: 'ขีดจำกัดระบบระบายน้ำ 60 มม.', src: 'ตัวเลขที่ กทม. ใช้อธิบายความสามารถของระบบระบายน้ำ', ref: 'ยังไม่ได้บันทึกแหล่งต้นฉบับใน ข้อมูลรวม', est: true },
    ],
  },
  {
    title: 'สวนหย่อมบนที่ว่าง (หน้า 12)', col: 2,
    items: [
      { what: 'สวนสาธารณะ 2,000 บาท/ตร.ม. (60% ของพื้นที่)', src: 'สวนวัดหัวลำโพงรุกขนิเวศน์: งบโครงการ ÷ พื้นที่สวน', ref: 'THE STANDARD (งบ) · Time Out Bangkok (พื้นที่)', est: true, links: [vacant.links.cost_wat_hua_lamphong_budget, vacant.links.cost_wat_hua_lamphong_area] },
      { what: 'สวน 15 นาที ≈ 1,000 บาท/ตร.ม. (40% ของพื้นที่)', src: 'ค่าเฉลี่ยสวน 15 นาทีของ กทม.', ref: 'สยามรัฐ', est: true, links: [vacant.links.cost_15min_avg] },
      { what: 'ค่าบำรุงรักษา 10% ของค่าก่อสร้าง/ปี', src: 'ค่าของกลุ่ม', ref: 'ไม่มีแหล่งอ้างอิง', est: true },
      { what: 'ที่ว่าง 64 แปลง 125,056 ตร.ม.', src: 'ทะเบียนพื้นที่สีเขียว เขตดินแดง (บันทึกปี 2553–2563)', ref: 'greenparks.bangkok.go.th', links: [vacant.links.green_registry] },
      { what: 'พื้นที่สีเขียว สวนที่เข้าถึงได้ ค่ากลาง 50 เขต', src: 'Bangkok Index 2025 – Rocket Media Lab (สวนสาธารณะ)', ref: 'rocketmedialab.co', links: [vacant.links.park_index] },
    ],
  },
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
                    <small>
                      {it.links ? it.links.map((u, i) => (
                        <a key={u} href={u} target="_blank" rel="noreferrer">{i ? ' · ' : ''}{it.ref.split(' · ')[i] ?? it.ref}</a>
                      )) : it.ref}
                    </small>
                  </div>
                ))}
              </section>
            ))}
          </div>
        ))}
      </div>
    </SlideFrame>
  )
}
