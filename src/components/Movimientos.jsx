import React, { useState, useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import _swal from 'sweetalert';
import { firedb } from '../firebaseConfig';
import { getCategoryMeta } from './categoryIcons';
import './styles.css';

/**
 * Función utilitaria para normalizar identificadores de usuario
 */
const parseUserId = (id) => {
  if (id === null || id === undefined) return '';
  const str = id.toString().trim();
  const num = parseInt(str, 10);
  return !isNaN(num) && num.toString() === str ? num : str;
};

/**
 * Catálogo oficial de categorías de ingresos y egresos de Finanzia
 */
const CATEGORIAS_INGRESOS_OFICIALES = [
  'Sueldo',
  'Bonificaciones',
  'Comisiones',
  'Freelance',
  'Negocio propio',
  'Alquileres',
  'Inversiones',
  'Intereses',
  'Reembolsos',
  'Préstamos recibidos',
  'Tarjeta de crédito',
  'Regalos',
  'Otros'
];

const CATEGORIAS_EGRESOS_OFICIALES = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Salud',
  'Educación',
  'Compras',
  'Entretenimiento',
  'Finanzas',
  'Mascotas',
  'Regalos',
  'Familia',
  'Suscripciones',
  'Inversiones',
  'Otros'
];

/**
 * Pantalla Independiente: Movimientos Financieros
 * Incluye búsqueda por texto, filtros por fecha, rango, mes, año, categoría,
 * cuenta y tipo (Ingreso/Egreso).
 */
export default function Movimientos() {
  const historial = useHistory();

  // Estados de datos
  const [cargando, setCargando] = useState(true);
  const [listaMovimientos, setListaMovimientos] = useState([]);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);

  // Estados de filtros
  const [busquedaTexto, setBusquedaTexto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('Todos'); // 'Todos' | 'Ingreso' | 'Egreso'
  const [filtroMes, setFiltroMes] = useState(''); // YYYY-MM
  const [filtroAnio, setFiltroAnio] = useState(''); // YYYY
  const [filtroFechaExacta, setFiltroFechaExacta] = useState(''); // YYYY-MM-DD
  const [filtroRangoInicio, setFiltroRangoInicio] = useState('');
  const [filtroRangoFin, setFiltroRangoFin] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroCuenta, setFiltroCuenta] = useState('Todas');

  // Cargar movimientos del usuario al montar el componente
  useEffect(() => {
    const idUsuario = localStorage.getItem('currentId');
    if (!idUsuario) {
      historial.push('/login');
      return;
    }
    cargarMovimientos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatearFecha = (fechaOriginal) => {
    if (!fechaOriginal) return '';
    const partes = fechaOriginal.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaOriginal;
  };

  // Carga optimizada de movimientos desde Firestore
  const cargarMovimientos = async () => {
    setCargando(true);
    try {
      const idUsuario = localStorage.getItem('currentId');
      
      // Limitamos a los últimos 60 registros para cuidar las lecturas de la capa gratuita
      const snapshot = await firedb
        .collection('caja-chica')
        .where('idUser', '==', parseUserId(idUsuario))
        .orderBy('fecha', 'desc')
        .limit(60)
        .get();

      const registros = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaOriginal: doc.data().fecha,
        fechaLegible: formatearFecha(doc.data().fecha)
      }));

      setListaMovimientos(registros);
    } catch (error) {
      console.error('Error al cargar movimientos en Firestore:', error);
    } finally {
      setCargando(false);
    }
  };

  // Eliminar un movimiento con confirmación
  const eliminarMovimiento = (id, descripcion) => {
    setMostrarModalDetalle(false);
    _swal({
      title: '¿Eliminar movimiento?',
      text: `Se eliminará permanentemente "${descripcion || 'este registro'}".`,
      icon: 'warning',
      buttons: ['Cancelar', 'Sí, eliminar'],
      dangerMode: true,
    }).then(async (confirmado) => {
      if (confirmado) {
        try {
          await firedb.collection('caja-chica').doc(id).delete();
          setListaMovimientos(prev => prev.filter(m => m.id !== id));
          _swal('¡Eliminado!', 'El movimiento fue retirado.', 'success');
        } catch (error) {
          console.error('Error al eliminar:', error);
          _swal('Error', 'No se pudo eliminar el movimiento.', 'error');
        }
      }
    });
  };

  // Obtener categorías únicas presentes en la lista para el dropdown
  const categoriasDisponibles = useMemo(() => {
    const cats = new Set();
    listaMovimientos.forEach(m => {
      if (m.categoria) cats.add(m.categoria);
    });
    return Array.from(cats);
  }, [listaMovimientos]);

  // Identificar si existen categorías registradas en los datos fuera de los catálogos oficiales
  const otrasCategoriasDisponibles = useMemo(() => {
    const oficiales = new Set([...CATEGORIAS_INGRESOS_OFICIALES, ...CATEGORIAS_EGRESOS_OFICIALES]);
    return categoriasDisponibles.filter(cat => !oficiales.has(cat));
  }, [categoriasDisponibles]);

  // Obtener cuentas únicas presentes en la lista para el dropdown
  const cuentasDisponibles = useMemo(() => {
    const accs = new Set();
    listaMovimientos.forEach(m => {
      if (m.cuentaDestino) accs.add(m.cuentaDestino);
      if (m.cuentaOrigen) accs.add(m.cuentaOrigen);
    });
    return Array.from(accs);
  }, [listaMovimientos]);

  // Filtrado reactivo en memoria (alta velocidad, cero lecturas de base de datos)
  const movimientosFiltrados = useMemo(() => {
    return listaMovimientos.filter(item => {
      // 1. Filtro por tipo (1 = Egreso, 2 = Ingreso)
      if (filtroTipo === 'Ingreso' && item.tipo !== 2) return false;
      if (filtroTipo === 'Egreso' && item.tipo !== 1) return false;

      // 2. Filtro por búsqueda de texto
      if (busquedaTexto.trim()) {
        const textoMin = busquedaTexto.toLowerCase();
        const descripcionMin = (item.descripcion || '').toLowerCase();
        const categoriaMin = (item.categoria || '').toLowerCase();
        const subcategoriaMin = (item.subcategoria || '').toLowerCase();
        const comercioMin = (item.comercio || '').toLowerCase();
        if (
          !descripcionMin.includes(textoMin) &&
          !categoriaMin.includes(textoMin) &&
          !subcategoriaMin.includes(textoMin) &&
          !comercioMin.includes(textoMin)
        ) {
          return false;
        }
      }

      // 3. Filtro por fecha exacta
      if (filtroFechaExacta && item.fechaOriginal !== filtroFechaExacta) {
        return false;
      }

      // 4. Filtro por rango de fechas
      if (filtroRangoInicio && item.fechaOriginal < filtroRangoInicio) {
        return false;
      }
      if (filtroRangoFin && item.fechaOriginal > filtroRangoFin) {
        return false;
      }

      // 5. Filtro por mes (YYYY-MM)
      if (filtroMes && (!item.fechaOriginal || !item.fechaOriginal.startsWith(filtroMes))) {
        return false;
      }

      // 6. Filtro por año (YYYY)
      if (filtroAnio && (!item.fechaOriginal || !item.fechaOriginal.startsWith(filtroAnio))) {
        return false;
      }

      // 7. Filtro por categoría
      if (filtroCategoria !== 'Todas' && item.categoria !== filtroCategoria) {
        return false;
      }

      // 8. Filtro por cuenta
      if (filtroCuenta !== 'Todas') {
        const cuentaActual = item.cuentaDestino || item.cuentaOrigen;
        if (cuentaActual !== filtroCuenta) return false;
      }

      return true;
    });
  }, [
    listaMovimientos,
    filtroTipo,
    busquedaTexto,
    filtroFechaExacta,
    filtroRangoInicio,
    filtroRangoFin,
    filtroMes,
    filtroAnio,
    filtroCategoria,
    filtroCuenta
  ]);

  // Totales acumulados del conjunto filtrado
  const resumenFiltrado = useMemo(() => {
    let ingresos = 0;
    let egresos = 0;
    movimientosFiltrados.forEach(item => {
      const cant = parseFloat(item.cantidad) || 0;
      if (item.tipo === 2) ingresos += cant;
      else egresos += cant;
    });
    return {
      ingresos,
      egresos,
      balance: ingresos - egresos,
      totalRegistros: movimientosFiltrados.length
    };
  }, [movimientosFiltrados]);

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setBusquedaTexto('');
    setFiltroTipo('Todos');
    setFiltroMes('');
    setFiltroAnio('');
    setFiltroFechaExacta('');
    setFiltroRangoInicio('');
    setFiltroRangoFin('');
    setFiltroCategoria('Todas');
    setFiltroCuenta('Todas');
  };

  const hayFiltrosActivos = Boolean(
    busquedaTexto ||
    filtroTipo !== 'Todos' ||
    filtroMes ||
    filtroAnio ||
    filtroFechaExacta ||
    filtroRangoInicio ||
    filtroRangoFin ||
    filtroCategoria !== 'Todas' ||
    filtroCuenta !== 'Todas'
  );

  return (
    <div className="container pantalla-movimientos-contenedor" style={{ paddingTop: '20px', paddingBottom: '90px' }}>
      
      {/* =============================================================== */}
      {/* ENCABEZADO SUPERIOR MINIMALISTA                                 */}
      {/* =============================================================== */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light rounded-circle shadow-sm"
            onClick={() => historial.push('/home')}
            style={{ width: '38px', height: '38px' }}
          >
            <i className="fas fa-arrow-left text-dark"></i>
          </button>
          <div>
            <h1 className="mb-0" style={{ fontSize: '1.35rem', fontWeight: 800, color: '#1E1F30' }}>
              Movimientos
            </h1>
            <span style={{ fontSize: '0.76rem', color: '#8E92A4', fontWeight: 600 }}>
              {movimientosFiltrados.length} de {listaMovimientos.length} transacciones
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-light shadow-sm d-flex align-items-center gap-1"
          style={{ borderRadius: '12px', padding: '6px 12px', fontSize: '0.8rem', fontWeight: 700 }}
          onClick={cargarMovimientos}
          title="Recargar movimientos"
        >
          <i className={`fas fa-sync-alt ${cargando ? 'fa-spin' : ''}`} style={{ color: '#4E44EB' }}></i>
          <span className="d-none d-sm-inline">Actualizar</span>
        </button>
      </div>

      {/* =============================================================== */}
      {/* BARRA DE BÚSQUEDA POR TEXTO                                     */}
      {/* =============================================================== */}
      <div className="contenedor-buscador-movimientos mb-3">
        <i className="fas fa-search icono-buscador"></i>
        <input
          type="text"
          className="input-buscador-movimientos"
          placeholder="Buscar por concepto, comercio o categoría..."
          value={busquedaTexto}
          onChange={(e) => setBusquedaTexto(e.target.value)}
        />
        {busquedaTexto && (
          <button
            type="button"
            className="btn-limpiar-busqueda"
            onClick={() => setBusquedaTexto('')}
          >
            <i className="fas fa-times-circle"></i>
          </button>
        )}
      </div>

      {/* =============================================================== */}
      {/* FILTROS RÁPIDOS DE TIPO (Todos | Ingresos | Egresos)            */}
      {/* =============================================================== */}
      <div className="d-flex align-items-center gap-2 mb-3 overflow-auto pb-1">
        <button
          type="button"
          className={`pildora-filtro-tipo ${filtroTipo === 'Todos' ? 'activa' : ''}`}
          onClick={() => setFiltroTipo('Todos')}
        >
          Todos ({listaMovimientos.length})
        </button>
        <button
          type="button"
          className={`pildora-filtro-tipo ingreso ${filtroTipo === 'Ingreso' ? 'activa' : ''}`}
          onClick={() => setFiltroTipo('Ingreso')}
        >
          <i className="fas fa-arrow-down mr-1"></i> Ingresos
        </button>
        <button
          type="button"
          className={`pildora-filtro-tipo gasto ${filtroTipo === 'Egreso' ? 'activa' : ''}`}
          onClick={() => setFiltroTipo('Egreso')}
        >
          <i className="fas fa-arrow-up mr-1"></i> Egresos
        </button>

        {hayFiltrosActivos && (
          <button
            type="button"
            className="btn btn-sm btn-link text-danger font-weight-bold ml-auto"
            style={{ fontSize: '0.78rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
            onClick={limpiarFiltros}
          >
            <i className="fas fa-trash-alt mr-1"></i> Limpiar filtros
          </button>
        )}
      </div>

      {/* =============================================================== */}
      {/* FILTROS AVANZADOS (Fecha, Rango, Categoría, Cuenta)             */}
      {/* =============================================================== */}
      <div className="tarjeta-filtros-avanzados mb-3">
        <div className="row g-2">
          
          {/* Filtro por Fecha Exacta */}
          <div className="col-6 col-md-3">
            <label className="etiqueta-filtro-mini">Fecha exacta</label>
            <input
              type="date"
              className="campo-filtro-mini"
              value={filtroFechaExacta}
              onChange={(e) => setFiltroFechaExacta(e.target.value)}
            />
          </div>

          {/* Filtro por Mes */}
          <div className="col-6 col-md-3">
            <label className="etiqueta-filtro-mini">Mes específico</label>
            <input
              type="month"
              className="campo-filtro-mini"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
            />
          </div>

          {/* Filtro por Categoría organizado por Ingresos y Egresos */}
          <div className="col-6 col-md-3">
            <label className="etiqueta-filtro-mini">Categoría</label>
            <select
              className="campo-filtro-mini"
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="Todas">Todas las categorías</option>
              <optgroup label="── Categorías de Ingresos ──">
                {CATEGORIAS_INGRESOS_OFICIALES.map((cat) => (
                  <option key={`ing-${cat}`} value={cat}>{cat}</option>
                ))}
              </optgroup>
              <optgroup label="── Categorías de Egresos ──">
                {CATEGORIAS_EGRESOS_OFICIALES.map((cat) => (
                  <option key={`egr-${cat}`} value={cat}>{cat}</option>
                ))}
              </optgroup>
              {otrasCategoriasDisponibles.length > 0 && (
                <optgroup label="── Otras Registradas ──">
                  {otrasCategoriasDisponibles.map((cat) => (
                    <option key={`otra-${cat}`} value={cat}>{cat}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Filtro por Cuenta */}
          <div className="col-6 col-md-3">
            <label className="etiqueta-filtro-mini">Cuenta</label>
            <select
              className="campo-filtro-mini"
              value={filtroCuenta}
              onChange={(e) => setFiltroCuenta(e.target.value)}
            >
              <option value="Todas">Todas las cuentas</option>
              {cuentasDisponibles.map(acc => (
                <option key={acc} value={acc}>{acc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rango de Fechas (Desde - Hasta) */}
        <div className="row g-2 mt-1 pt-2 border-top">
          <div className="col-6">
            <label className="etiqueta-filtro-mini">Desde fecha</label>
            <input
              type="date"
              className="campo-filtro-mini"
              value={filtroRangoInicio}
              onChange={(e) => setFiltroRangoInicio(e.target.value)}
            />
          </div>
          <div className="col-6">
            <label className="etiqueta-filtro-mini">Hasta fecha</label>
            <input
              type="date"
              className="campo-filtro-mini"
              value={filtroRangoFin}
              onChange={(e) => setFiltroRangoFin(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* =============================================================== */}
      {/* TARJETA RESUMEN DEL FILTRO ACTIVO                               */}
      {/* =============================================================== */}
      <div className="tarjeta-resumen-filtrado mb-3">
        <div className="col-item-resumen">
          <span className="etiqueta-resumen">Ingresos</span>
          <span className="monto-resumen ingreso">+Q {resumenFiltrado.ingresos.toFixed(2)}</span>
        </div>
        <div className="separador-resumen"></div>
        <div className="col-item-resumen">
          <span className="etiqueta-resumen">Egresos</span>
          <span className="monto-resumen gasto">-Q {resumenFiltrado.egresos.toFixed(2)}</span>
        </div>
        <div className="separador-resumen"></div>
        <div className="col-item-resumen">
          <span className="etiqueta-resumen">Balance Neto</span>
          <span className={`monto-resumen ${resumenFiltrado.balance >= 0 ? 'ingreso' : 'gasto'}`}>
            {resumenFiltrado.balance >= 0 ? '+' : ''}Q {resumenFiltrado.balance.toFixed(2)}
          </span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* LISTADO DE MOVIMIENTOS OPTIMIZADO                               */}
      {/* =============================================================== */}
      {cargando ? (
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-primary mb-2"></i>
          <p className="text-muted font-weight-bold" style={{ fontSize: '0.85rem' }}>
            Cargando tus movimientos...
          </p>
        </div>
      ) : movimientosFiltrados.length === 0 ? (
        <div className="text-center py-5 bg-white rounded-lg p-4 border">
          <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🔍</div>
          <h5 style={{ fontWeight: 700, color: '#1E1F30' }}>No se encontraron transacciones</h5>
          <p className="text-muted" style={{ fontSize: '0.82rem' }}>
            Prueba ajustando los filtros de búsqueda o fecha.
          </p>
          {hayFiltrosActivos && (
            <button
              type="button"
              className="btn btn-sm btn-outline-primary mt-2"
              onClick={limpiarFiltros}
              style={{ borderRadius: '12px', fontWeight: 700 }}
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="d-flex flex-column gap-2">
          {movimientosFiltrados.map((item) => {
            const meta = getCategoryMeta(item.descripcion, item.tipo);
            const esIngreso = item.tipo === 2;
            const cantidadNum = parseFloat(item.cantidad) || 0;

            return (
              <div
                key={item.id}
                className="fila-transaccion-moderna"
                onClick={() => {
                  setItemSeleccionado(item);
                  setMostrarModalDetalle(true);
                }}
              >
                {/* Icono de Categoría en Squircle */}
                <div
                  className="squircle-icon-wrapper"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <i className={meta.icon}></i>
                </div>

                {/* Concepto, Categoría y Fecha */}
                <div className="transaccion-info-col">
                  <span className="transaccion-titulo">
                    {item.descripcion || (esIngreso ? 'Ingreso' : 'Egreso')}
                  </span>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span className="transaccion-categoria-badge">
                      {item.categoria || (esIngreso ? 'Ingreso' : 'Gasto')}
                    </span>
                    <span className="transaccion-fecha-texto">
                      {item.fechaLegible || item.fecha} &bull; {item.hora || ''}
                    </span>
                  </div>
                </div>

                {/* Monto y Estado */}
                <div className="transaccion-monto-col">
                  <span className={`transaccion-monto ${esIngreso ? 'ingreso' : 'gasto'}`}>
                    {esIngreso ? '+' : '-'} Q {cantidadNum.toFixed(2)}
                  </span>
                  {(item.cuentaOrigen || item.cuentaDestino) && (
                    <span className="transaccion-cuenta-tag">
                      {item.cuentaOrigen || item.cuentaDestino}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =============================================================== */}
      {/* MODAL BOTTOM-SHEET: DETALLE COMPLETO DEL MOVIMIENTO             */}
      {/* =============================================================== */}
      <Modal
        show={mostrarModalDetalle}
        onHide={() => setMostrarModalDetalle(false)}
        centered
        dialogClassName="modal-bottom-sheet-dialog"
      >
        {itemSeleccionado && (() => {
          const meta = getCategoryMeta(itemSeleccionado.descripcion, itemSeleccionado.tipo);
          const esIngreso = itemSeleccionado.tipo === 2;
          const cantidadNum = parseFloat(itemSeleccionado.cantidad) || 0;

          return (
            <div className="p-4 bg-white rounded-top-custom">
              {/* Encabezado del Detalle */}
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="squircle-icon-wrapper"
                    style={{ background: meta.bg, color: meta.color, width: '48px', height: '48px', fontSize: '1.2rem' }}
                  >
                    <i className={meta.icon}></i>
                  </div>
                  <div>
                    <h5 className="mb-0 font-weight-bold" style={{ fontSize: '1.05rem', color: '#1E1F30' }}>
                      {itemSeleccionado.descripcion || (esIngreso ? 'Ingreso' : 'Egreso')}
                    </h5>
                    <span style={{ fontSize: '0.78rem', color: '#8E92A4' }}>
                      {itemSeleccionado.categoria || (esIngreso ? 'Ingreso' : 'Egreso')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-light rounded-circle"
                  onClick={() => setMostrarModalDetalle(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {/* Monto Grande Destacado */}
              <div className="text-center py-3 bg-light rounded-lg mb-3">
                <span style={{ fontSize: '0.78rem', color: '#8E92A4', textTransform: 'uppercase', fontWeight: 700 }}>
                  Monto registrado
                </span>
                <div
                  style={{
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: esIngreso ? '#10B981' : '#F46F5F'
                  }}
                >
                  {esIngreso ? '+' : '-'} Q {cantidadNum.toFixed(2)}
                </div>
              </div>

              {/* Atributos y Clasificación */}
              <div className="d-flex flex-column gap-2 mb-4">
                <div className="d-flex justify-content-between p-2 border-bottom">
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>Fecha y hora</span>
                  <span className="font-weight-bold" style={{ fontSize: '0.82rem' }}>
                    {itemSeleccionado.fechaLegible || itemSeleccionado.fecha} &bull; {itemSeleccionado.hora || 'No especificada'}
                  </span>
                </div>

                <div className="d-flex justify-content-between p-2 border-bottom">
                  <span className="text-muted" style={{ fontSize: '0.82rem' }}>Cuenta</span>
                  <span className="font-weight-bold" style={{ fontSize: '0.82rem' }}>
                    {itemSeleccionado.cuentaOrigen || itemSeleccionado.cuentaDestino || 'Efectivo'}
                  </span>
                </div>

                {itemSeleccionado.subcategoria && (
                  <div className="d-flex justify-content-between p-2 border-bottom">
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>Subcategoría</span>
                    <span className="font-weight-bold" style={{ fontSize: '0.82rem' }}>
                      {itemSeleccionado.subcategoria}
                    </span>
                  </div>
                )}

                {itemSeleccionado.comercio && (
                  <div className="d-flex justify-content-between p-2 border-bottom">
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>Comercio</span>
                    <span className="font-weight-bold" style={{ fontSize: '0.82rem' }}>
                      {itemSeleccionado.comercio}
                    </span>
                  </div>
                )}

                {itemSeleccionado.cuotas && itemSeleccionado.cuotas > 1 && (
                  <div className="d-flex justify-content-between p-2 border-bottom">
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>Financiamiento</span>
                    <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                      {itemSeleccionado.cuotas} cuotas
                    </span>
                  </div>
                )}
              </div>

              {/* Botón de Eliminación */}
              <button
                type="button"
                className="btn btn-outline-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                style={{ borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem' }}
                onClick={() => eliminarMovimiento(itemSeleccionado.id, itemSeleccionado.descripcion)}
              >
                <i className="fas fa-trash-alt"></i>
                Eliminar transacción
              </button>
            </div>
          );
        })()}
      </Modal>

    </div>
  );
}

