import { useEffect, useState } from 'react'
import { stage } from '../theme/theme.js'
import s from './Deck.module.css'

// พื้นที่สไลด์คงที่ 1920×1080 แล้วย่อขยายให้พอดีหน้าต่าง (PRD N1)
export default function Stage({ children }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const fit = () =>
      setScale(Math.min(window.innerWidth / stage.width, window.innerHeight / stage.height))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  return (
    <div className={s.viewport}>
      <div
        className={s.stage}
        style={{ width: stage.width, height: stage.height, transform: `scale(${scale})` }}
      >
        {children}
        {/* จุดวางหน้าต่างขยายกราฟ (Expandable) ให้อยู่ในพื้นที่สไลด์และย่อขยายตามสไลด์ */}
        <div id="stage-overlay" />
      </div>
    </div>
  )
}
