import { useState, useEffect } from 'react'
import api from '../../api/axios'
import AdminLayout from '../../components/admin/AdminLayout'

const TIPOS = [
  { value: 'FUERZA',    label: 'Fuerza' },
  { value: 'CARDIO',    label: 'Cardio' },
  { value: 'MOVILIDAD', label: 'Movilidad' },
]

const DIFICULTADES = [
  { value: 'PRINCIPIANTE', label: 'Principiante', short: 'Princ.' },
  { value: 'INTERMEDIO',   label: 'Intermedio',   short: 'Inter.' },
  { value: 'AVANZADO',     label: 'Avanzado',     short: 'Avanz.' },
]

const formularioVacio = {
  title:            '',
  description:      '',
  imageUrl:         '',
  type:             'FUERZA',
  muscleGroupsText: '',
  difficulty:       'PRINCIPIANTE',
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]}`
}

export default function GestorEjercicios() {

  // ── State ──────────────────────────────────────────────────────────────────
  const [ejercicios, setEjercicios]               = useState([])
  const [cargando, setCargando]                   = useState(true)
  const [mostrarModal, setMostrarModal]           = useState(false)
  const [formulario, setFormulario]               = useState(formularioVacio)
  const [editandoId, setEditandoId]               = useState(null)
  const [guardando, setGuardando]                 = useState(false)
  const [error, setError]                         = useState('')
  const [busqueda, setBusqueda]                   = useState('')
  const [confirmarEliminar, setConfirmarEliminar] = useState(null)
  const [textoConfirmacion, setTextoConfirmacion] = useState('')
  const [filtroTipo, setFiltroTipo]               = useState('')
  const [filtroDificultad, setFiltroDificultad]   = useState('')
  const [seleccionados, setSeleccionados]         = useState([])
  const [paginaActual, setPaginaActual]           = useState(1)
  const [filasPorPagina, setFilasPorPagina]       = useState(25)

  useEffect(() => { cargarEjercicios() }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const cargarEjercicios = async () => {
    try {
      const { data } = await api.get('/exercises')
      setEjercicios(data)
    } catch (err) {
      console.error('Error cargando ejercicios:', err)
    } finally {
      setCargando(false)
    }
  }

  const abrirCrear = () => {
    setFormulario(formularioVacio)
    setEditandoId(null)
    setError('')
    setMostrarModal(true)
  }

  const abrirEditar = (ej) => {
    setFormulario({
      title:            ej.title,
      description:      ej.description || '',
      imageUrl:         ej.imageUrl || '',
      type:             ej.type || 'FUERZA',
      muscleGroupsText: ej.muscleGroups?.join(', ') || '',
      difficulty:       ej.difficulty || 'PRINCIPIANTE',
    })
    setEditandoId(ej.id)
    setError('')
    setMostrarModal(true)
  }

  const manejarCambio = (e) =>
    setFormulario(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const construirPayload = () => ({
    title:        formulario.title.trim(),
    imageUrl:     formulario.imageUrl.trim() || null,
    type:         formulario.type,
    description:  formulario.description.trim() || null,
    muscleGroups: formulario.muscleGroupsText.split(',').map(g => g.trim()).filter(Boolean),
    difficulty:   formulario.difficulty || null,
  })

  const guardarEjercicio = async () => {
    if (!formulario.title.trim()) { setError('El nombre es obligatorio'); return }
    setGuardando(true)
    setError('')
    try {
      const payload = construirPayload()
      if (editandoId) {
        await api.put(`/exercises/${editandoId}`, payload)
      } else {
        await api.post('/exercises', payload)
      }
      await cargarEjercicios()
      setMostrarModal(false)
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.mensaje || 'Error al guardar')
    } finally {
      setGuardando(false)
    }
  }

  const cerrarModalEliminar = () => {
    setConfirmarEliminar(null)
    setTextoConfirmacion('')
  }

  const eliminarEjercicio = async (id) => {
    try {
      await api.delete(`/exercises/${id}`)
      setEjercicios(prev => prev.filter(e => e.id !== id))
      cerrarModalEliminar()
    } catch (err) {
      console.error('Error eliminando ejercicio:', err)
    }
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const ejerciciosFiltrados = ejercicios.filter(e => {
    const q = busqueda.toLowerCase()
    const matchBusqueda = !q ||
      e.title?.toLowerCase().includes(q) ||
      e.muscleGroups?.some(g => g.toLowerCase().includes(q))
    const matchTipo       = !filtroTipo       || e.type       === filtroTipo
    const matchDificultad = !filtroDificultad || e.difficulty === filtroDificultad
    return matchBusqueda && matchTipo && matchDificultad
  })

  const totalPaginas     = Math.max(1, Math.ceil(ejerciciosFiltrados.length / filasPorPagina))
  const inicio           = (paginaActual - 1) * filasPorPagina
  const ejerciciosPagina = ejerciciosFiltrados.slice(inicio, inicio + filasPorPagina)

  const limpiarFiltros = () => {
    setBusqueda(''); setFiltroTipo(''); setFiltroDificultad(''); setPaginaActual(1)
  }

  const toggleSeleccion = (id) =>
    setSeleccionados(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])

  const toggleTodos = () =>
    setSeleccionados(
      seleccionados.length === ejerciciosPagina.length && ejerciciosPagina.length > 0
        ? []
        : ejerciciosPagina.map(e => e.id)
    )

  const getPaginas = () => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    if (paginaActual <= 4)  return [1, 2, 3, 4, 5, '...', totalPaginas]
    if (paginaActual >= totalPaginas - 3)
      return [1, '...', totalPaginas-4, totalPaginas-3, totalPaginas-2, totalPaginas-1, totalPaginas]
    return [1, '...', paginaActual-1, paginaActual, paginaActual+1, '...', totalPaginas]
  }

  // ── Style maps ─────────────────────────────────────────────────────────────
  const tipoDot   = { FUERZA:'bg-[#E63946]', CARDIO:'bg-orange-400', MOVILIDAD:'bg-teal-400' }
  const tipoBadge = {
    FUERZA:    'border border-[#E63946]/40 text-[#E63946]',
    CARDIO:    'border border-orange-400/40 text-orange-400',
    MOVILIDAD: 'border border-teal-400/40 text-teal-400',
  }
  const difBadge = {
    PRINCIPIANTE: 'border border-teal-400/40 text-teal-400',
    INTERMEDIO:   'border border-yellow-400/40 text-yellow-400',
    AVANZADO:     'border border-[#E63946]/40 text-[#E63946]',
  }

  const filtroBtn = (active) =>
    `px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
      active
        ? 'bg-[#E63946] text-white'
        : 'bg-[#1A1A1A] text-white/50 hover:text-white border border-white/10'
    }`

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <AdminLayout
      paginaActiva="ejercicios"
      breadcrumb={['Admin', 'Catálogo', 'Ejercicios']}
      cuentas={{ ejercicios: ejercicios.length }}
    >

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E63946] mb-1">Catálogo</p>
          <h1 className="font-['Oswald'] text-5xl font-bold uppercase leading-none mb-2">Ejercicios</h1>
          <p className="text-white/40 text-sm">
            {ejercicios.length} ejercicios en catálogo
          </p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <button className="bg-[#1A1A1A] border border-white/10 text-white/70 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">
            Importar CSV
          </button>
          <button
            onClick={abrirCrear}
            className="flex items-center gap-2 text-white px-5 py-2.5 rounded-lg font-['Oswald'] font-bold uppercase tracking-wider text-sm hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#E63946,#C1121F)' }}
          >
            <span className="text-xl leading-none font-light" aria-hidden="true">+</span>
            <span>Nuevo ejercicio</span>
          </button>
        </div>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <IconSearch cls="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar nombre o músculo..."
            value={busqueda}
            onChange={e => { setBusqueda(e.target.value); setPaginaActual(1) }}
            className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-[#E63946]/50 transition-colors placeholder-white/30"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mr-1">Tipo</span>
          <button onClick={() => { setFiltroTipo('');     setPaginaActual(1) }} className={filtroBtn(!filtroTipo)}>Todos</button>
          {TIPOS.map(t => (
            <button key={t.value} onClick={() => { setFiltroTipo(t.value); setPaginaActual(1) }} className={filtroBtn(filtroTipo === t.value)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 mr-1">Dificultad</span>
          <button onClick={() => { setFiltroDificultad('');     setPaginaActual(1) }} className={filtroBtn(!filtroDificultad)}>Todas</button>
          {DIFICULTADES.map(d => (
            <button key={d.value} onClick={() => { setFiltroDificultad(d.value); setPaginaActual(1) }} className={filtroBtn(filtroDificultad === d.value)}>
              {d.short}
            </button>
          ))}
        </div>

        <button onClick={limpiarFiltros} className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#1A1A1A] border border-white/10 text-white/60 hover:text-white transition-colors">
          Limpiar
        </button>
      </div>

      {/* Bulk actions banner */}
      {seleccionados.length > 0 && (
        <div className="flex items-center gap-4 bg-[#E63946]/[0.08] border border-[#E63946]/20 rounded-xl px-5 py-3 mb-4">
          <span className="w-6 h-6 bg-[#E63946] rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
            {seleccionados.length}
          </span>
          <span className="text-sm text-white/60">
            {seleccionados.length} seleccionado{seleccionados.length === 1 ? '' : 's'} · aplica acciones masivas
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1A1A] border border-white/15 text-white/70 hover:text-white transition-colors">
              Cambiar tipo
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1A1A1A] border border-white/15 text-white/70 hover:text-white transition-colors">
              Exportar
            </button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#E63946]/15 border border-[#E63946]/30 text-[#E63946] hover:bg-[#E63946]/25 transition-colors">
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="bg-[#111] rounded-2xl border border-white/[0.06] overflow-hidden">
        {cargando ? (
          <div className="text-center py-20 text-white/30">Cargando ejercicios...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={seleccionados.length === ejerciciosPagina.length && ejerciciosPagina.length > 0}
                        onChange={toggleTodos}
                        className="w-4 h-4 rounded accent-[#E63946] cursor-pointer"
                      />
                    </th>
                    {['IMG','TÍTULO','MÚSCULOS','TIPO','DIFICULTAD','ACCIONES'].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white/30 ${i === 5 ? 'text-right' : 'text-left'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ejerciciosPagina.map(ej => (
                    <tr
                      key={ej.id}
                      className={`border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors ${seleccionados.includes(ej.id) ? 'bg-[#E63946]/[0.04]' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={seleccionados.includes(ej.id)}
                          onChange={() => toggleSeleccion(ej.id)}
                          className="w-4 h-4 rounded accent-[#E63946] cursor-pointer"
                        />
                      </td>

                      {/* IMG */}
                      <td className="px-4 py-4">
                        <div className="w-12 h-12 bg-[#1A1A1A] rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {ej.imageUrl
                            ? <img src={ej.imageUrl} alt={ej.title} className="w-full h-full object-cover" />
                            : <span className="text-white/20 text-xs font-mono font-bold">{'—'}</span>
                          }
                        </div>
                      </td>

                      {/* Título */}
                      <td className="px-4 py-4 min-w-[180px]">
                        <p className="font-['Oswald'] font-semibold uppercase text-sm tracking-wide leading-tight">
                          {ej.title}
                        </p>
                        <p className="text-white/30 text-xs mt-0.5">
                          actualizado · {formatDate(ej.updatedAt)}
                        </p>
                      </td>

                      {/* Músculos */}
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {ej.muscleGroups?.slice(0, 3).map(m => (
                            <span key={m} className="text-[11px] border border-white/15 text-white/55 px-2.5 py-0.5 rounded-full">
                              {m}
                            </span>
                          ))}
                          {(ej.muscleGroups?.length ?? 0) === 0 && (
                            <span className="text-white/20 text-xs">—</span>
                          )}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-4">
                        {ej.type && (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${tipoBadge[ej.type] ?? 'border border-white/20 text-white/50'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tipoDot[ej.type] ?? 'bg-white/30'}`} />
                            {TIPOS.find(t => t.value === ej.type)?.label ?? ej.type}
                          </span>
                        )}
                      </td>

                      {/* Dificultad */}
                      <td className="px-4 py-4">
                        {ej.difficulty && (
                          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${difBadge[ej.difficulty] ?? 'border border-white/20 text-white/50'}`}>
                            {DIFICULTADES.find(d => d.value === ej.difficulty)?.label ?? ej.difficulty}
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirEditar(ej)}
                            title="Editar"
                            className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            <IconEdit />
                          </button>
                          <button
                            onClick={() => setConfirmarEliminar(ej)}
                            title="Eliminar"
                            className="p-2 rounded-lg text-white/30 hover:text-[#E63946] hover:bg-[#E63946]/10 transition-colors"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {ejerciciosPagina.length === 0 && (
              <div className="text-center py-20 text-white/30">
                <p className="text-3xl mb-3">🔍</p>
                <p>No se encontraron ejercicios</p>
              </div>
            )}

            {/* Pagination footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
              <p className="text-xs text-white/40">
                Mostrando{' '}
                <strong className="text-white font-semibold">
                  {ejerciciosFiltrados.length === 0 ? 0 : inicio + 1}–{Math.min(inicio + filasPorPagina, ejerciciosFiltrados.length)}
                </strong>
                {' '}de{' '}
                <strong className="text-white font-semibold">{ejerciciosFiltrados.length}</strong>
              </p>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 mr-1">Filas</span>
                  {[10, 25, 50].map(n => (
                    <button
                      key={n}
                      onClick={() => { setFilasPorPagina(n); setPaginaActual(1) }}
                      className={`w-8 h-7 rounded text-xs font-semibold transition-colors ${filasPorPagina === n ? 'bg-white/10 text-white' : 'text-white/35 hover:text-white'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="w-7 h-7 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  {getPaginas().map((p, i) => {
                    const cls = (() => {
                      if (p === paginaActual) return 'bg-[#E63946] text-white'
                      if (p === '...') return 'text-white/30 cursor-default'
                      return 'text-white/40 hover:text-white hover:bg-white/5'
                    })()
                    return (
                      <button
                        key={typeof p === 'number' ? p : `dots-${i}`}
                        onClick={() => typeof p === 'number' && setPaginaActual(p)}
                        disabled={p === '...'}
                        className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${cls}`}
                      >
                        {p}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaActual === totalPaginas}
                    className="w-7 h-7 rounded flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── MODAL CREAR / EDITAR ──────────────────────────────────────────────── */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 w-full max-w-lg border border-white/10 max-h-[90vh] overflow-y-auto">
            <h3 className="font-['Oswald'] text-2xl font-bold uppercase mb-6">
              {editandoId ? 'Editar ejercicio' : 'Nuevo ejercicio'}
            </h3>
            <div className="flex flex-col gap-5">
              <Campo label="Nombre *">
                <input name="title" value={formulario.title} onChange={manejarCambio}
                  placeholder="Nombre del ejercicio" className={inputCls} />
              </Campo>
              <Campo label="Descripción">
                <textarea name="description" value={formulario.description} onChange={manejarCambio}
                  placeholder="Descripción del ejercicio..." rows={3} className={`${inputCls} resize-none`} />
              </Campo>
              <Campo label="URL de imagen">
                <input name="imageUrl" value={formulario.imageUrl} onChange={manejarCambio}
                  placeholder="https://..." className={inputCls} />
                {formulario.imageUrl && (
                  <img src={formulario.imageUrl} alt="Vista previa"
                    className="mt-2 w-full h-32 object-cover rounded-lg border border-white/10"
                    onError={e => { e.currentTarget.style.display = 'none' }} />
                )}
              </Campo>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Tipo">
                  <select name="type" value={formulario.type} onChange={manejarCambio} className={inputCls}>
                    {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Campo>
                <Campo label="Dificultad">
                  <select name="difficulty" value={formulario.difficulty} onChange={manejarCambio} className={inputCls}>
                    {DIFICULTADES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </Campo>
              </div>
              <Campo label="Grupos musculares (separados por coma)">
                <input name="muscleGroupsText" value={formulario.muscleGroupsText} onChange={manejarCambio}
                  placeholder="Pecho, Tríceps, Hombros" className={inputCls} />
              </Campo>
              {error && (
                <div className="bg-[#E63946]/15 border border-[#E63946]/40 rounded-lg px-4 py-3 text-[#E63946] text-sm">{error}</div>
              )}
              <div className="flex gap-3 mt-2">
                <button onClick={() => setMostrarModal(false)}
                  className="flex-1 border border-white/20 text-white/60 py-3 rounded-lg text-sm hover:text-white transition-colors">
                  Cancelar
                </button>
                <button onClick={guardarEjercicio} disabled={guardando}
                  className="flex-1 bg-[#E63946] text-white py-3 rounded-lg font-bold text-sm hover:bg-[#C1121F] transition-colors disabled:opacity-70">
                  {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear ejercicio'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMAR ELIMINAR ──────────────────────────────────────────── */}
      {confirmarEliminar && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div
            className="bg-[#161616] rounded-2xl w-full max-w-lg border border-[#E63946]/25 overflow-hidden"
            style={{ boxShadow: '0 0 40px rgba(230,57,70,0.12), 0 25px 60px rgba(0,0,0,0.6)' }}
          >
            <div className="p-8">
              <div
                className="w-14 h-14 rounded-2xl bg-[#E63946]/15 border border-[#E63946]/30 flex items-center justify-center mb-6"
                style={{ boxShadow: '0 0 20px rgba(230,57,70,0.2)' }}
              >
                <svg className="w-6 h-6 text-[#E63946]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </div>
              <h3 className="font-['Oswald'] text-3xl font-bold uppercase mb-3 tracking-wide">
                ¿Eliminar ejercicio?
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-5">
                Se eliminará{' '}
                <span className="text-white font-bold">{confirmarEliminar.title}</span>
                {' '}del catálogo. Esta acción no se puede deshacer.
              </p>
              <ul className="flex flex-col gap-2.5 mb-7">
                {[
                  'Se conservan las sesiones de entrenamiento ya registradas',
                  'Las rutinas que lo usan quedarán sin ese ejercicio',
                  'No se puede recuperar desde papelera',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/45">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E63946] mt-1.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div>
                <p className="text-[11px] font-bold tracking-[0.18em] text-white/30 uppercase mb-3">
                  Escribe{' '}
                  <span className="text-[#E63946]">ELIMINAR</span>
                  {' '}para confirmar
                </p>
                <input
                  type="text"
                  value={textoConfirmacion}
                  onChange={e => setTextoConfirmacion(e.target.value.toUpperCase())}
                  placeholder="ELIMINAR"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-[#0D0D0D] border border-white/12 rounded-xl px-5 py-4 text-white font-mono text-sm tracking-[0.25em] outline-none focus:border-[#E63946]/40 transition-colors placeholder-white/15"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 px-8 py-5 border-t border-white/[0.06] bg-[#111]">
              <button
                onClick={cerrarModalEliminar}
                className="flex-1 bg-[#1E1E1E] border border-white/10 text-white/65 py-3.5 rounded-xl text-sm font-semibold hover:text-white hover:border-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarEjercicio(confirmarEliminar.id)}
                disabled={textoConfirmacion !== 'ELIMINAR'}
                className="flex-1 py-3.5 rounded-xl font-['Oswald'] font-bold uppercase tracking-wider text-sm transition-all disabled:cursor-not-allowed"
                style={{
                  background: textoConfirmacion === 'ELIMINAR' ? 'linear-gradient(135deg,#C1121F,#9B0D17)' : '#3a1518',
                  color: textoConfirmacion === 'ELIMINAR' ? '#fff' : 'rgba(255,255,255,0.3)',
                }}
              >
                Eliminar ejercicio
              </button>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function IconSearch({ cls = 'w-4 h-4' }) {
  return (
    <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}

function IconEdit() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  )
}

const inputCls = 'bg-[#222] border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#E63946] transition-colors w-full'
