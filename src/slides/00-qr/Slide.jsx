import SlideFrame from '../../components/SlideFrame.jsx'
import qr from './qr.png'
import s from './style.module.css'

// สไลด์ปก (ก่อนหน้า 1): QR Code เปิดเว็บ · ไม่นับเลขหน้า (cover: true ใน slides.js)
export default function Cover() {
  return (
    <SlideFrame kicker="ข้อเสนองบประมาณเขตดินแดง" title="สแกนเพื่อเปิดงานนำเสนอ">
      <div className={s.wrap}>
        <img src={qr} alt="QR Code เปิดงานนำเสนอ" className={s.qr} />
      </div>
    </SlideFrame>
  )
}
