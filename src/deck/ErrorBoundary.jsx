import { Component } from 'react'
import s from './Deck.module.css'

// สไลด์ที่พังจะแสดงข้อความเฉพาะหน้านั้น หน้าอื่นยังใช้ได้ (PRD N6)
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error(`สไลด์ ${this.props.label} เกิดข้อผิดพลาด`, error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className={s.error}>
          <p className={s.errorTitle}>สไลด์ {this.props.label} แสดงผลไม่ได้</p>
          <pre className={s.errorMsg}>{String(this.state.error?.message || this.state.error)}</pre>
          <p className={s.errorHint}>กด → เพื่อไปหน้าถัดไป · ดูรายละเอียดใน Console</p>
        </div>
      )
    }
    return this.props.children
  }
}
