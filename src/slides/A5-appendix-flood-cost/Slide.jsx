import SlideFrame from '../../components/SlideFrame.jsx'
import { vacant } from '../../lib/data.js'
import s from './style.module.css'

// สไลด์ A5 (ภาคผนวก): แหล่งที่มาของราคาอ้างอิงและข้อมูล หน้า 3 แก้น้ำท่วม + หน้า 5 แก้น้ำเสีย + หน้า 12 สวนหย่อม (ที่ว่าง)
// แก้เฉพาะไฟล์ในโฟลเดอร์นี้ (ดู CLAUDE.md) · รายละเอียดตัวเลขอยู่ใน ข้อมูลรวม_ตรวจแล้ว.md หัวข้อ "หน้าแก้น้ำท่วม"

const GROUPS = [
  {
    title: 'แก้น้ำท่วม (หน้า 3)', col: 1,
    items: [
      { what: 'ลอกท่อ 81 บาท/ม.', src: 'ราคากลาง สนน. ปี 2561 (MGR Online)' },
      { what: 'ทีมเก็บขยะ 400 บาท/วัน', src: 'ค่าจ้างขั้นต่ำ กทม. ปี 2568' },
      { what: 'ท่อ Ø 1.00 ม. 20,000 บาท/ม.', src: 'เทียบโครงการเขตทุ่งครุ ท่อ 0.60 ม. ≈ 8,000 บาท/ม. × หน้าตัดใหญ่กว่า 2.8 เท่า', est: true },
      { what: 'สำรวจออกแบบ · ท่อลอดถนน · กล้องตรวจท่อ', src: 'ประมาณการของกลุ่ม ยังไม่พบแหล่งอ้างอิง', est: true },
    ],
  },
  {
    title: 'แก้น้ำเสียในคลอง (หน้า 5)', col: 1,
    items: [
      { what: 'ถังดักไขมัน 4,950 บาท/ใบ', src: 'ราคาขาย HomePro ขนาด 50 ลิตร' },
      { what: 'ค่าไฟ 4.22 บาท/หน่วย', src: 'ค่าไฟเฉลี่ย 3.94 บาท + VAT 7% (Thai PBS)' },
      { what: 'แพไบโอฟิล์ม 1,500 บาท/ตร.ม.', src: 'อยู่ในช่วงต้นทุนจากงานวิจัย CSIRO (22–3,800 ดอลลาร์ออสเตรเลีย/ตร.ม.)', est: true },
      { what: 'ตะแกรงดักขยะ · คอกดักตะกอน · เครื่องเติมอากาศ · EM', src: 'ประมาณการของกลุ่ม ยังไม่พบแหล่งอ้างอิง', est: true },
    ],
  },
  {
    title: 'สวนหย่อมบนที่ว่าง (หน้า 12)', col: 2,
    items: [
      { what: 'สวนสาธารณะ 2,000 บาท/ตร.ม.', src: 'สวนวัดหัวลำโพง: งบ ÷ พื้นที่' },
      { what: 'สวน 15 นาที ≈ 1,000 บาท/ตร.ม.', src: 'ค่าเฉลี่ยสวน 15 นาทีของ กทม.' },
      { what: 'ค่าบำรุงรักษา 10% ของค่าก่อสร้าง/ปี', src: 'ค่าของกลุ่ม ยังไม่พบแหล่งอ้างอิง', est: true },
      { what: 'ที่ว่าง 64 แปลง 125,056 ตร.ม.', src: 'ทะเบียนพื้นที่สีเขียว เขตดินแดง' },
    ],
  },
]

const LINKS = [
  ['กทม.: โครงการท่อเขตทุ่งครุ', 'https://monitor.bangkok.go.th/mobile/myproject.php?pid=50490000-3544'],
  ['HomePro: ถังดักไขมัน 50 ลิตร', 'https://www.homepro.co.th/p/242255'],
  ['Thai PBS: ค่าไฟ 3.94 บาท', 'https://www.thaipbs.or.th/news/content/354915'],
  ['CSIRO: ต้นทุนแพบำบัดลอยน้ำ', 'https://www.csiro.au/en/news/All/News/2025/October/Floating-wetlands-offer-cost-effective-nature-based-water-treatment'],
  ['THE STANDARD: สวนวัดหัวลำโพง (งบ)', vacant.links.cost_wat_hua_lamphong_budget],
  ['Time Out: สวนวัดหัวลำโพง (พื้นที่)', vacant.links.cost_wat_hua_lamphong_area],
  ['สยามรัฐ: สวน 15 นาที', vacant.links.cost_15min_avg],
  ['ทะเบียนพื้นที่สีเขียว เขตดินแดง', vacant.links.green_registry],
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
            {col === 2 && (
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
