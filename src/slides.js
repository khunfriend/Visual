// ลำดับสไลด์: สลับลำดับหรือเพิ่ม/ลบสไลด์ที่ไฟล์นี้ที่เดียว
// สไลด์หลักได้เลขหน้า 1, 2, 3 … ตามลำดับ ภาคผนวก (appendix: true) ได้ A1, A2 … และต้องอยู่ท้ายสุด
import WhyDindaeng from './slides/01-why-dindaeng/Slide.jsx'
import Flood from './slides/02-flood/Slide.jsx'
import FloodFix from './slides/02b-flood-fix/Slide.jsx'
import Wastewater from './slides/03-wastewater/Slide.jsx'
import EducationScore from './slides/05-education-score/Slide.jsx'
import Schools from './slides/06-schools/Slide.jsx'
import RiskPoints from './slides/07-risk-points/Slide.jsx'
import RiskFix from './slides/07b-risk-fix/Slide.jsx'
import PocketParks from './slides/08-pocket-parks/Slide.jsx'
import ParkGap from './slides/09-park-gap/Slide.jsx'
import Summary from './slides/10-summary/Slide.jsx'
import AppendixParks from './slides/A1-appendix-parks/Slide.jsx'
import Appendix2569 from './slides/A2-appendix-2569/Slide.jsx'
import AppendixLimits from './slides/A3-appendix-limits/Slide.jsx'

const slides = [
  { id: '01-why-dindaeng', Component: WhyDindaeng },
  { id: '02-flood', Component: Flood },
  { id: '02b-flood-fix', Component: FloodFix },
  { id: '03-wastewater', Component: Wastewater },
  { id: '05-education-score', Component: EducationScore },
  { id: '06-schools', Component: Schools },
  { id: '07-risk-points', Component: RiskPoints },
  { id: '07b-risk-fix', Component: RiskFix },
  { id: '08-pocket-parks', Component: PocketParks },
  { id: '09-park-gap', Component: ParkGap },
  { id: '10-summary', Component: Summary },
  { id: 'A1-appendix-parks', Component: AppendixParks, appendix: true },
  { id: 'A2-appendix-2569', Component: Appendix2569, appendix: true },
  { id: 'A3-appendix-limits', Component: AppendixLimits, appendix: true },
]

export default slides
