import SlideFrame from '../../components/SlideFrame.jsx'
import s from './style.module.css'

// สไลด์ A5 (ภาคผนวก): แหล่งที่มาของข้อมูลในหน้า 3 แก้น้ำท่วม (เฉพาะแหล่งอ้างอิง)
// แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md) · รายละเอียดตัวเลขอยู่ใน ข้อมูลรวม_ตรวจแล้ว.md หัวข้อ "หน้าแก้น้ำท่วม"

const GROUPS = [
  {
    title: 'ราคาต่อหน่วย',
    items: [
      { what: 'ราคาลอกท่อ (≈ 81 บาท/ม.)', src: 'ราคากลางประมูลลอกท่อของสำนักการระบายน้ำ กทม. ปี 2561', ref: 'MGR Online, 29 ม.ค. 2561' },
      { what: 'ค่าแรงทีมเก็บขยะ (400 บาท/วัน)', src: 'ค่าจ้างขั้นต่ำ กรุงเทพฯ มีผล 1 ก.ค. 2568', ref: 'มติคณะกรรมการค่าจ้าง 17 มิ.ย. 2568' },
      { what: 'สำรวจออกแบบ · ท่อใหม่ · ท่อลอดถนน · กล้องตรวจท่อ', src: 'ประมาณการของกลุ่ม', ref: 'ไม่พบราคากลางในแหล่งข้อมูลเปิด', est: true },
    ],
  },
  {
    title: 'ความยาวท่อและงานล้างท่อ',
    items: [
      { what: 'ความยาวท่อระบายน้ำในซอยและความถี่ล้างท่อ (225 ซอย)', src: 'สำนักงานเขตดินแดง หน้า “ถนน ตรอก และซอย”', ref: 'webportal.bangkok.go.th/dindaeng/page/sub/624' },
      { what: 'งบจ้างล้างท่อของเขต ปีงบ 2568 (186 ซอย)', src: 'ระบบติดตามโครงการ กรุงเทพมหานคร', ref: 'policy.bangkok.go.th (ต้องล็อกอิน ยังไม่ได้เปิดตรวจต้นฉบับ)', est: true },
    ],
  },
  {
    title: 'น้ำท่วมและฝน',
    items: [
      { what: 'จุดท่วม จำนวนครั้ง และฝนรายวัน ปี 2568', src: 'Bangkok Index 2025 – Rocket Media Lab (น้ำท่วมขังบนถนนสายหลัก)', ref: 'rocketmedialab.co' },
      { what: 'ขีดจำกัดระบบระบายน้ำ 60 มม.', src: 'ตัวเลขที่ กทม. ใช้อธิบายความสามารถของระบบระบายน้ำ', ref: 'ยังไม่ได้บันทึกแหล่งต้นฉบับใน ข้อมูลรวม', est: true },
    ],
  },
]

export default function AppendixFloodCost() {
  return (
    <SlideFrame
      kicker="ภาคผนวก · แหล่งที่มา"
      title="แหล่งที่มาของข้อมูลในหน้าแก้น้ำท่วม"
      source="รายละเอียดตัวเลขและวิธีคำนวณทั้งหมดอยู่ใน ข้อมูลรวม_ตรวจแล้ว.md · สำเนาตารางท่อของเขต: data/raw/drain_soi_dindaeng.csv"
    >
      <div className={s.list}>
        {GROUPS.map((g) => (
          <section key={g.title} className={s.group}>
            <h2 className={s.groupTitle}>{g.title}</h2>
            {g.items.map((it) => (
              <div key={it.what} className={s.item}>
                <b>{it.what}</b>
                <span>
                  {it.src}
                  {it.est && <em className={s.est}>ประมาณการ / ยังไม่ได้ตรวจ</em>}
                </span>
                <small>{it.ref}</small>
              </div>
            ))}
          </section>
        ))}
      </div>
    </SlideFrame>
  )
}
