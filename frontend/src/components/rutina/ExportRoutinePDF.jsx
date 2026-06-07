import { useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ── PDF design tokens ─────────────────────────────────────────────
const BG      = '#121212'
const CARD    = '#1E1E1E'
const RED     = '#FF414D'
const WHITE   = '#FFFFFF'
const GRAY    = 'rgba(255,255,255,0.45)'
const BORDER  = 'rgba(255,255,255,0.06)'
const W       = 794   // A4 at 96 dpi

// ── Helpers ───────────────────────────────────────────────────────
async function toBase64(url) {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror   = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function StatBox({ valor, label }) {
  return (
    <div style={{ backgroundColor: CARD, borderRadius: 16, padding: '28px 20px', textAlign: 'center', border: `1px solid ${BORDER}`, flex: 1 }}>
      <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: 52, fontWeight: 700, color: RED, lineHeight: 1 }}>
        {valor}
      </div>
      <div style={{ color: GRAY, fontSize: 11, marginTop: 10, letterSpacing: '1.5px', fontFamily: 'Inter, Arial, sans-serif' }}>
        {label}
      </div>
    </div>
  )
}

function ParamCol({ valor, label }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: 26, fontWeight: 700, color: WHITE, lineHeight: 1 }}>
        {valor}
      </div>
      <div style={{ color: GRAY, fontSize: 9, letterSpacing: '1px', marginTop: 4, fontFamily: 'Inter, Arial, sans-serif', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  )
}

function Divider({ char = '×' }) {
  return (
    <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 18, lineHeight: 1 }}>{char}</div>
  )
}

// ── PDF template (rendered off-screen, captured by html2canvas) ───
function PdfTemplate({ innerRef, rutina, ejercicios, totalSeries, totalReps, imgCache }) {
  const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div
      ref={innerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: -9999,
        width: W,
        backgroundColor: BG,
        color: WHITE,
        fontFamily: 'Oswald, Inter, Arial, sans-serif',
        padding: '52px 56px 48px',
        boxSizing: 'border-box',
        lineHeight: 1,
      }}
    >

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44, paddingBottom: 28, borderBottom: `1px solid ${BORDER}` }}>
        <div>
          <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: 26, fontWeight: 700, fontStyle: 'italic', color: RED, letterSpacing: 5, marginBottom: 28 }}>
            STRIVE
          </div>
          <h1 style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: 60, fontWeight: 700, textTransform: 'uppercase', margin: 0, letterSpacing: 2, lineHeight: 1 }}>
            {rutina?.name}
          </h1>
          {rutina?.goal && (
            <p style={{ color: GRAY, fontSize: 15, marginTop: 12, lineHeight: 1.6, maxWidth: 480, fontFamily: 'Inter, Arial, sans-serif', margin: '12px 0 0' }}>
              {rutina.goal}
            </p>
          )}
        </div>
        <div style={{ color: GRAY, fontSize: 12, letterSpacing: 1, fontFamily: 'Inter, Arial, sans-serif', paddingTop: 4, whiteSpace: 'nowrap' }}>
          {fecha}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 44 }}>
        <StatBox valor={ejercicios.length} label="EJERCICIOS" />
        <StatBox valor={totalSeries}        label="SERIES TOTALES" />
        <StatBox valor={totalReps}          label="REPS TOTALES" />
      </div>

      {/* ── Section label ── */}
      <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: GRAY, marginBottom: 20 }}>
        LISTADO DE EJERCICIOS
      </div>

      {/* ── Exercise cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ejercicios.map((re, idx) => {
          const imgSrc  = imgCache[re.exercise?.imageUrl] ?? null
          const isCardio = re.exercise?.type === 'CARDIO'

          return (
            <div
              key={re.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                backgroundColor: CARD,
                borderRadius: 12,
                padding: '18px 22px',
                borderLeft: `4px solid ${RED}`,
              }}
            >
              {/* Number */}
              <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: 20, fontWeight: 700, color: `${RED}55`, width: 34, flexShrink: 0 }}>
                {String(idx + 1).padStart(2, '0')}
              </span>

              {/* Thumbnail */}
              <div
                style={{
                  width: 60, height: 60,
                  backgroundColor: '#2C2C2C',
                  borderRadius: 8,
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                {imgSrc
                  ? <img src={imgSrc} alt={re.exercise?.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : '💪'
                }
              </div>

              {/* Name + muscles */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: 16, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                  {re.exercise?.title}
                </div>
                <div style={{ color: GRAY, fontSize: 12, fontFamily: 'Inter, Arial, sans-serif', lineHeight: 1.4 }}>
                  {(re.exercise?.muscleGroups ?? []).join(' · ')}
                </div>
              </div>

              {/* Params */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                <ParamCol valor={re.sets} label="SERIES" />
                <Divider char="×" />
                <ParamCol valor={re.reps} label={isCardio ? 'INTERV.' : 'REPS'} />
                {re.loadValue != null && (
                  <>
                    <Divider char="·" />
                    <ParamCol valor={re.loadValue} label={re.loadUnit} />
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          marginTop: 44,
          paddingTop: 22,
          borderTop: `1px solid ${BORDER}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontFamily: 'Oswald, Arial, sans-serif', fontSize: 18, fontWeight: 700, fontStyle: 'italic', color: RED, letterSpacing: 4 }}>
          STRIVE
        </span>
        <span style={{ color: GRAY, fontSize: 11, fontFamily: 'Inter, Arial, sans-serif', letterSpacing: 0.5 }}>
          {ejercicios.length} ejercicio{ejercicios.length !== 1 ? 's' : ''} · {totalSeries} series · {totalReps} reps
        </span>
      </div>
    </div>
  )
}

// ── Main exported component ───────────────────────────────────────
export default function ExportRoutinePDF({ rutina, className }) {
  const pdfRef   = useRef(null)
  const [generando, setGenerando] = useState(false)
  const [imgCache, setImgCache]   = useState({})

  const ejercicios  = (rutina?.routineExercises ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  const totalSeries = ejercicios.reduce((s, re) => s + (re.sets ?? 0), 0)
  const totalReps   = ejercicios.reduce((s, re) => s + (re.sets ?? 0) * (re.reps ?? 0), 0)

  const exportar = async () => {
    if (generando) return
    setGenerando(true)

    try {
      // 1. Pre-fetch exercise images as base64 (avoids CORS taint in canvas)
      const urls = [...new Set(
        ejercicios.map(re => re.exercise?.imageUrl).filter(Boolean)
      )]
      const pairs   = await Promise.all(urls.map(async u => [u, await toBase64(u)]))
      const fetched = Object.fromEntries(pairs)

      // 2. Apply images synchronously so the PDF template re-renders before capture
      flushSync(() => setImgCache(fetched))

      // 3. Ensure web fonts (Oswald, Inter) are fully loaded
      await document.fonts.ready

      // 4. Capture the hidden PDF template
      const canvas = await html2canvas(pdfRef.current, {
        backgroundColor: BG,
        scale: 2,          // 2x for crisp text at print resolution
        useCORS: false,    // images are base64; no cross-origin needed
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
      })

      // 5. Split canvas into A4 pages and build PDF
      const pdf    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW  = 210   // mm
      const pageH  = 297   // mm
      const a4px   = Math.round(canvas.width * (pageH / pageW))

      let y    = 0
      let page = 0

      while (y < canvas.height) {
        const sliceH = Math.min(a4px, canvas.height - y)

        const slice = document.createElement('canvas')
        slice.width  = canvas.width
        slice.height = a4px

        const ctx = slice.getContext('2d')
        ctx.fillStyle = BG
        ctx.fillRect(0, 0, slice.width, slice.height)
        ctx.drawImage(canvas, 0, y, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

        if (page > 0) pdf.addPage()
        pdf.addImage(slice.toDataURL('image/jpeg', 0.93), 'JPEG', 0, 0, pageW, pageH)

        y += a4px
        page++
      }

      const safe = (rutina?.name ?? 'Rutina').replace(/[^a-zA-Z0-9\-_]/g, '-')
      pdf.save(`STRIVE-${safe}.pdf`)
    } catch (err) {
      console.error('[ExportRoutinePDF]', err)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <>
      {/* ── Trigger button ── */}
      <button
        onClick={exportar}
        disabled={generando}
        className={className ?? "flex-1 border border-white/20 text-white/60 py-4 rounded-xl font-['Oswald'] font-bold text-base uppercase tracking-wider hover:text-white hover:border-white/40 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"}
      >
        {generando ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
            Generando PDF...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar PDF
          </>
        )}
      </button>

      {/* ── Hidden PDF template (portal to body, off-screen) ── */}
      {createPortal(
        <PdfTemplate
          innerRef={pdfRef}
          rutina={rutina}
          ejercicios={ejercicios}
          totalSeries={totalSeries}
          totalReps={totalReps}
          imgCache={imgCache}
        />,
        document.body
      )}
    </>
  )
}