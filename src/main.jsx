import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/ibm-plex-sans-thai/400.css'
import '@fontsource/ibm-plex-sans-thai/500.css'
import '@fontsource/ibm-plex-sans-thai/700.css'
import './theme/global.css'
import Deck from './deck/Deck.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Deck />
  </StrictMode>,
)
