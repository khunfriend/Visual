// ลำดับสไลด์: สลับลำดับหรือเพิ่ม/ลบสไลด์ที่ไฟล์นี้ที่เดียว
// สไลด์หลักได้เลขหน้า 1, 2, 3 … ตามลำดับ ภาคผนวก (appendix: true) ได้ A1, A2 … และต้องอยู่ท้ายสุด
import WhyDindaeng from './slides/01-why-dindaeng/Slide.jsx'
import Flood from './slides/02-flood/Slide.jsx'
import FloodFix from './slides/02b-flood-fix/Slide.jsx'
import Wastewater from './slides/03-wastewater/Slide.jsx'
import WastewaterFix from './slides/03b-wastewater-fix/Slide.jsx'
import EducationScore from './slides/05-education-score/Slide.jsx'
import Schools from './slides/06-schools/Slide.jsx'
import RiskPoints from './slides/07-risk-points/Slide.jsx'
import RiskFix from './slides/07b-risk-fix/Slide.jsx'
import PocketParks from './slides/08-pocket-parks/Slide.jsx'
import ParkGap from './slides/09-park-gap/Slide.jsx'
import VacantLand from './slides/09b-vacant-land/Slide.jsx'
import Summary from './slides/10-summary/Slide.jsx'
import Appendix2569 from './slides/A2-appendix-2569/Slide.jsx'
import AppendixFloodCost from './slides/A5-appendix-flood-cost/Slide.jsx'

const slides = [
  { id: '01-why-dindaeng', Component: WhyDindaeng },
  { id: '02-flood', Component: Flood },
  { id: '02b-flood-fix', Component: FloodFix },
  { id: '03-wastewater', Component: Wastewater },
  { id: '03b-wastewater-fix', Component: WastewaterFix },
  { id: '05-education-score', Component: EducationScore },
  { id: '06-schools', Component: Schools },
  { id: '07-risk-points', Component: RiskPoints },
  { id: '07b-risk-fix', Component: RiskFix },
  { id: '08-pocket-parks', Component: PocketParks },
  { id: '09-park-gap', Component: ParkGap },
  { id: '09b-vacant-land', Component: VacantLand },
  { id: '10-summary', Component: Summary },
  { id: 'A2-appendix-2569', Component: Appendix2569, appendix: true },
  { id: 'A5-appendix-flood-cost', Component: AppendixFloodCost, appendix: true },
]

export default slides
