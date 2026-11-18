import React, { useState, useEffect, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import _swal from 'sweetalert';
import { firedb } from '../firebaseConfig';
import {
  formatearAFechaInput,
  formatearAFechaVisual,
  determinarCicloGasto,
  generarCiclosSugeridos,
  evaluarEstadoPago,
  COLORES_USUARIOS
} from '../utils/tarjetasCredito';
import VisorImagenModal from './VisorImagenModal';
import './styles.css';

/**
 * Normaliza identificadores de usuario (compatibilidad id string y number)
 */
const parseUserId = (id) => {
  if (id === null || id === undefined) return '';
  const str = id.toString().trim();
  const num = parseInt(str, 10);
  return !isNaN(num) && num.toString() === str ? num : str;
};

/**
 * Tarjeta de crédito predeterminada para visualización completa de interfaz
 */
const TARJETA_PREDETERMINADA = {
  id: 'tc-familiar-default',
  nombre: 'VISA Plata',
  habilitarTarjeta: true,
  esFamiliar: true,
  activa: true,
  fechaCorte: '2026-11-06',
  fechaPago: '2026-12-01',
  cuotasPredeterminadas: 1,
  usuariosInvolucrados: ['Usuario 1', 'Usuario 2', 'Usuario 3']
};

export default function TarjetaFamiliar() {
  const historial = useHistory();
  const ubicacion = useLocation();

  // Estados de datos
  const [cargando, setCargando] = useState(true);
  const [tarjetas, setTarjetas] = useState([]);
  const [tarjetaSeleccionadaId, setTarjetaSeleccionadaId] = useState('');
  const [movimientos, setMovimientos] = useState([]);

  // Filtros
  const [cicloSeleccionadoClave, setCicloSeleccionadoClave] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('todos');

  // Modales
  const [mostrarModalConfig, setMostrarModalConfig] = useState(false);
  const [modalImagenGrande, setModalImagenGrande] = useState(null);

  // Estados del formulario en modal con los 2 switches
  const [editHabilitarTarjeta, setEditHabilitarTarjeta] = useState(true); // Switch 1
  const [editEsFamiliar, setEditEsFamiliar] = useState(true); // Switch 2
  const [editNombreTarjeta, setEditNombreTarjeta] = useState('VISA Plata');
  const [editFechaCorte, setEditFechaCorte] = useState('2026-11-06');
  const [editFechaPago, setEditFechaPago] = useState('2026-12-01');
  const [editCuotas, setEditCuotas] = useState(1);
  const [editUsuarios, setEditUsuarios] = useState(['Usuario 1', 'Usuario 2', 'Usuario 3']);
  const [nuevoNombreUsuarioInput, setNuevoNombreUsuarioInput] = useState('');
  const [guardandoTarjeta, setGuardandoTarjeta] = useState(false);

  // 1. Cargar tarjetas y movimientos al montar
  useEffect(() => {
    const idUsuario = localStorage.getItem('currentId');
    if (!idUsuario) {
      historial.push('/login');
      return;
    }
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const idUsuario = localStorage.getItem('currentId');
      const uidNormalizado = parseUserId(idUsuario);

      // Cargar tarjetas de crédito registradas
      let listaTarjetas = [];
      try {
        const snapTarjetas = await firedb
          .collection('tarjetas-credito')
          .where('idUser', '==', uidNormalizado)
          .get();

        if (!snapTarjetas.empty) {
          listaTarjetas = snapTarjetas.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (errTarjetas) {
        console.warn('Aviso al consultar tarjetas-credito:', errTarjetas);
      }

      setTarjetas(listaTarjetas);

      // Cargar egresos desde caja-chica (sin requerir índice compuesto en Firestore)
      let listaMovimientos = [];
      try {
        const snapMov = await firedb
          .collection('caja-chica')
          .where('idUser', '==', uidNormalizado)
          .limit(200)
          .get();

        if (!snapMov.empty) {
          listaMovimientos = snapMov.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }
      } catch (errMov) {
        console.warn('Aviso al consultar caja-chica:', errMov);
      }

      // Fallback si idUser fue almacenado como string en vez de número o viceversa
      const idUsuarioStr = String(idUsuario).trim();
      if (listaMovimientos.length === 0 && idUsuarioStr !== String(uidNormalizado)) {
        try {
          const snapStr = await firedb
            .collection('caja-chica')
            .where('idUser', '==', idUsuarioStr)
            .limit(200)
            .get();
          if (!snapStr.empty) {
            listaMovimientos = snapStr.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          }
        } catch (errStr) {}
      }

      // Filtrar egresos en memoria para garantizar compatibilidad total
      listaMovimientos = listaMovimientos.filter(m => {
        if (m.tipo === 2 || m.tipo === '2' || m.tipo === 'ingreso' || m.tipo === 'Ingreso') return false;
        return true;
      });

      setMovimientos(listaMovimientos);

      // Seleccionar tarjeta activa o inicializar con la predeterminada
      if (listaTarjetas.length > 0) {
        const searchParams = new URLSearchParams(ubicacion.search);
        const paramTarjeta = searchParams.get('tarjeta');
        const tarjetaActiva = listaTarjetas.find(t => t.id === paramTarjeta) || listaTarjetas[0];
        setTarjetaSeleccionadaId(tarjetaActiva.id);

        // Establecer ciclo por defecto inteligente
        if (tarjetaActiva.fechaCorte && tarjetaActiva.fechaPago) {
          const cicloHoy = determinarCicloGasto(new Date(), tarjetaActiva);
          // Verificar si el ciclo actual de hoy tiene consumos registrados
          const tieneEnCicloHoy = listaMovimientos.some(m => {
            let clv = m.claveCiclo;
            if (!clv && m.fecha) clv = determinarCicloGasto(m.fecha, tarjetaActiva).claveCiclo;
            return clv === cicloHoy.claveCiclo;
          });

          if (tieneEnCicloHoy) {
            setCicloSeleccionadoClave(cicloHoy.claveCiclo);
          } else {
            // Si el ciclo de hoy no tiene consumos, verificar si algún ciclo tiene movimientos
            const movReciente = listaMovimientos.find(m => m.fecha && (m.usuarioGasto || m.tarjetaEsFamiliar));
            if (movReciente) {
              const clv = movReciente.claveCiclo || determinarCicloGasto(movReciente.fecha, tarjetaActiva).claveCiclo;
              setCicloSeleccionadoClave(clv);
            } else {
              setCicloSeleccionadoClave(cicloHoy.claveCiclo);
            }
          }
        }
      } else {
        setTarjetaSeleccionadaId(TARJETA_PREDETERMINADA.id);
        const ciclosSugeridos = generarCiclosSugeridos(TARJETA_PREDETERMINADA.fechaCorte, TARJETA_PREDETERMINADA.fechaPago);
        const cicloActivo = ciclosSugeridos.find(c => c.tipo === 'actual') || ciclosSugeridos[0];
        if (cicloActivo) {
          setCicloSeleccionadoClave(cicloActivo.clave);
        }
      }
    } catch (error) {
      console.error('Error cargando datos de Tarjeta:', error);
    } finally {
      setCargando(false);
    }
  };

  // Tarjeta de crédito seleccionada actualmente (con fallback a la predeterminada para ver la interfaz completa)
  const tarjetaActual = useMemo(() => {
    if (tarjetas.length > 0) {
      return tarjetas.find(t => t.id === tarjetaSeleccionadaId) || tarjetas[0];
    }
    return TARJETA_PREDETERMINADA;
  }, [tarjetas, tarjetaSeleccionadaId]);

  // Si es tarjeta familiar compartida (Switch 2 o si tiene usuarios configurados / registrados)
  const esTarjetaFamiliar = Boolean(
    tarjetaActual?.esFamiliar !== false ||
    (tarjetaActual?.usuariosInvolucrados && tarjetaActual.usuariosInvolucrados.length > 0) ||
    movimientos.some(m => m.usuarioGasto)
  );

  // Lista de ciclos disponibles calculados para la tarjeta seleccionada con conteo y total acumulado
  const opcionesCiclos = useMemo(() => {
    if (!tarjetaActual || !tarjetaActual.fechaCorte || !tarjetaActual.fechaPago) return [];
    const ciclosBase = generarCiclosSugeridos(tarjetaActual.fechaCorte, tarjetaActual.fechaPago);

    const mapaCiclos = new Map();
    ciclosBase.forEach(c => mapaCiclos.set(c.clave, { ...c, total: 0, cantidad: 0 }));

    movimientos.forEach(m => {
      // Coincidencia amplia con la tarjeta o asignación familiar
      const coincide =
        Boolean(m.usuarioGasto && String(m.usuarioGasto).trim().length > 0) ||
        m.tarjetaEsFamiliar === true ||
        m.tarjetaCreditoId === tarjetaActual.id ||
        m.tarjetaCreditoNombre === tarjetaActual.nombre ||
        m.cuentaOrigen === 'Tarjeta de crédito' ||
        m.metodoPago === 'Tarjeta crédito' ||
        (m.creditCardDetails && m.creditCardDetails.esFamiliar);

      if (!coincide) return;

      let clave = m.claveCiclo;
      let corte = m.fechaCorte;
      let pago = m.fechaPago;
      if (!clave && m.fecha) {
        const info = determinarCicloGasto(m.fecha, tarjetaActual);
        clave = info.claveCiclo;
        corte = info.fechaCorte;
        pago = info.fechaPago;
      }

      if (clave && corte && pago) {
        if (!mapaCiclos.has(clave)) {
          mapaCiclos.set(clave, {
            clave: clave,
            fechaCorte: corte,
            fechaPago: pago,
            corteVisual: formatearAFechaVisual(corte),
            pagoVisual: formatearAFechaVisual(pago),
            etiqueta: `Corte ${formatearAFechaVisual(corte)} ➔ Pago ${formatearAFechaVisual(pago)}`,
            tipo: 'registrado',
            total: 0,
            cantidad: 0
          });
        }
        const obj = mapaCiclos.get(clave);
        obj.total += (parseFloat(m.cantidad) || 0);
        obj.cantidad += 1;
      }
    });

    return Array.from(mapaCiclos.values()).sort((a, b) => a.fechaCorte.localeCompare(b.fechaCorte));
  }, [tarjetaActual, movimientos]);

  // Ciclo seleccionado activo
  const cicloActual = useMemo(() => {
    if (!cicloSeleccionadoClave || cicloSeleccionadoClave === 'todos') return null;
    return opcionesCiclos.find(c => c.clave === cicloSeleccionadoClave) || opcionesCiclos[0] || null;
  }, [opcionesCiclos, cicloSeleccionadoClave]);

  // Movimientos filtrados por tarjeta y ciclo
  const movimientosFiltrados = useMemo(() => {
    if (!tarjetaActual) return [];

    return movimientos.filter(mov => {
      // 1. Validar que corresponda a esta tarjeta de crédito o sea un gasto asignado a un familiar
      const tieneUsuarioAsignado = Boolean(mov.usuarioGasto && String(mov.usuarioGasto).trim().length > 0);
      const esTarjetaCoincidente =
        tieneUsuarioAsignado ||
        mov.tarjetaEsFamiliar === true ||
        mov.tarjetaCreditoId === tarjetaActual.id ||
        mov.tarjetaCreditoNombre === tarjetaActual.nombre ||
        mov.cuentaOrigen === 'Tarjeta de crédito' ||
        mov.metodoPago === 'Tarjeta crédito' ||
        (mov.creditCardDetails && mov.creditCardDetails.esFamiliar);

      if (!esTarjetaCoincidente) return false;

      // 2. Determinar ciclo del movimiento
      let claveCicloMov = mov.claveCiclo;
      if (!claveCicloMov && mov.fecha) {
        const infoCiclo = determinarCicloGasto(mov.fecha, tarjetaActual);
        claveCicloMov = infoCiclo.claveCiclo;
      }

      // Filtrar por ciclo seleccionado (si no es 'todos')
      if (cicloSeleccionadoClave && cicloSeleccionadoClave !== 'todos') {
        if (claveCicloMov !== cicloSeleccionadoClave) return false;
      }

      // Filtrar por usuario (si aplica y no es 'todos')
      if (filtroUsuario !== 'todos') {
        const usuarioAsignado = mov.usuarioGasto || 'Sin asignar';
        if (usuarioAsignado !== filtroUsuario) return false;
      }

      return true;
    });
  }, [movimientos, tarjetaActual, cicloSeleccionadoClave, filtroUsuario]);

  // Total acumulado a pagar en este ciclo
  const totalCiclo = useMemo(() => {
    return movimientosFiltrados.reduce((acc, mov) => acc + (parseFloat(mov.cantidad) || 0), 0);
  }, [movimientosFiltrados]);

  // Todos los movimientos asociados a la tarjeta para el resumen histórico
  const totalHistoricoConsumos = useMemo(() => {
    if (!tarjetaActual) return [];
    return movimientos.filter(mov => {
      const tieneUsuario = Boolean(mov.usuarioGasto && String(mov.usuarioGasto).trim().length > 0);
      return (
        tieneUsuario ||
        mov.tarjetaEsFamiliar === true ||
        mov.tarjetaCreditoId === tarjetaActual.id ||
        mov.tarjetaCreditoNombre === tarjetaActual.nombre ||
        mov.cuentaOrigen === 'Tarjeta de crédito' ||
        mov.metodoPago === 'Tarjeta crédito' ||
        (mov.creditCardDetails && mov.creditCardDetails.esFamiliar)
      );
    });
  }, [movimientos, tarjetaActual]);

  const sumaHistoricaConsumos = useMemo(() => {
    return totalHistoricoConsumos.reduce((acc, m) => acc + (parseFloat(m.cantidad) || 0), 0);
  }, [totalHistoricoConsumos]);

  // Desglose de cuánto debe pagar cada usuario / familiar
  const liquidacionPorUsuario = useMemo(() => {
    if (!tarjetaActual) return [];

    const mapa = {};
    const usuariosRegistrados = (tarjetaActual?.usuariosInvolucrados && tarjetaActual.usuariosInvolucrados.length > 0)
      ? tarjetaActual.usuariosInvolucrados
      : ['Usuario 1', 'Usuario 2', 'Usuario 3'];

    // Inicializar cada usuario registrado con monto 0
    usuariosRegistrados.forEach((nombre, idx) => {
      mapa[nombre] = {
        nombre: nombre,
        monto: 0,
        cantidadGastos: 0,
        color: COLORES_USUARIOS[idx % COLORES_USUARIOS.length],
        gastos: []
      };
    });

    // Sumar consumos reales de cada movimiento
    movimientosFiltrados.forEach(mov => {
      const nombreUsuario = mov.usuarioGasto || 'Sin asignar';
      if (!mapa[nombreUsuario]) {
        const idx = Object.keys(mapa).length;
        mapa[nombreUsuario] = {
          nombre: nombreUsuario,
          monto: 0,
          cantidadGastos: 0,
          color: COLORES_USUARIOS[idx % COLORES_USUARIOS.length],
          gastos: []
        };
      }
      const montoMov = parseFloat(mov.cantidad) || 0;
      mapa[nombreUsuario].monto += montoMov;
      mapa[nombreUsuario].cantidadGastos += 1;
      mapa[nombreUsuario].gastos.push(mov);
    });

    const resultado = Object.values(mapa).map(u => ({
      ...u,
      porcentaje: totalCiclo > 0 ? (u.monto / totalCiclo) * 100 : 0
    }));

    return resultado.sort((a, b) => b.monto - a.monto);
  }, [tarjetaActual, movimientosFiltrados, totalCiclo]);

  // Evaluación de alerta de pago
  const alertaPago = useMemo(() => {
    if (!tarjetaActual || !tarjetaActual.fechaPago) {
      return {
        estado: 'sin_fecha',
        titulo: 'Sin fecha de pago',
        color: '#6B7280',
        icono: 'fas fa-calendar'
      };
    }
    const fechaPago = cicloActual?.fechaPago || tarjetaActual.fechaPago;
    return evaluarEstadoPago(fechaPago);
  }, [cicloActual, tarjetaActual]);

  // Abrir modal de configuración de la tarjeta
  const abrirModalConfiguracion = () => {
    if (tarjetaActual) {
      setEditHabilitarTarjeta(tarjetaActual.habilitarTarjeta !== false);
      setEditEsFamiliar(tarjetaActual.esFamiliar === true);
      setEditNombreTarjeta(tarjetaActual.nombre || 'VISA Plata');
      setEditFechaCorte(formatearAFechaInput(tarjetaActual.fechaCorte || '2026-11-06'));
      setEditFechaPago(formatearAFechaInput(tarjetaActual.fechaPago || '2026-12-01'));
      setEditCuotas(tarjetaActual.cuotasPredeterminadas || 1);
      setEditUsuarios([...(tarjetaActual.usuariosInvolucrados || ['Usuario 1', 'Usuario 2'])]);
    } else {
      setEditHabilitarTarjeta(true);
      setEditEsFamiliar(false); // Por defecto es personal
      setEditNombreTarjeta('VISA Plata');
      setEditFechaCorte('2026-11-06');
      setEditFechaPago('2026-12-01');
      setEditCuotas(1);
      setEditUsuarios(['Usuario 1', 'Usuario 2']);
    }
    setNuevoNombreUsuarioInput('');
    setMostrarModalConfig(true);
  };

  // Agregar nuevo usuario a la lista de la tarjeta familiar
  const agregarUsuarioALista = () => {
    const limpio = nuevoNombreUsuarioInput.trim();
    if (!limpio) return;
    if (editUsuarios.includes(limpio)) {
      _swal('Usuario duplicado', `"${limpio}" ya está en la lista de esta tarjeta.`, 'warning');
      return;
    }
    setEditUsuarios([...editUsuarios, limpio]);
    setNuevoNombreUsuarioInput('');
  };

  // Eliminar usuario de la lista de la tarjeta familiar
  const eliminarUsuarioDeLista = (usuarioAEliminar) => {
    if (editUsuarios.length <= 1) {
      _swal('Mínimo 1 usuario', 'La tarjeta familiar debe tener al menos un usuario asignado.', 'info');
      return;
    }
    setEditUsuarios(editUsuarios.filter(u => u !== usuarioAEliminar));
  };

  // Guardar configuración de tarjeta en Firestore
  const guardarConfiguracionTarjeta = async (e) => {
    e.preventDefault();
    if (editHabilitarTarjeta && !editNombreTarjeta.trim()) {
      _swal('Nombre requerido', 'Ingresa el nombre de la tarjeta.', 'warning');
      return;
    }
    if (editHabilitarTarjeta && editEsFamiliar && editUsuarios.length === 0) {
      _swal('Usuarios requeridos', 'Agrega al menos un usuario familiar a la tarjeta.', 'warning');
      return;
    }

    setGuardandoTarjeta(true);
    try {
      const idUsuario = localStorage.getItem('currentId');
      const uidNormalizado = parseUserId(idUsuario);

      const targetId = tarjetaActual?.id || `tc_${Date.now()}`;
      const payload = {
        idUser: uidNormalizado,
        habilitarTarjeta: editHabilitarTarjeta,
        esFamiliar: editEsFamiliar,
        activa: editHabilitarTarjeta,
        nombre: editHabilitarTarjeta ? editNombreTarjeta.trim() : (tarjetaActual?.nombre || 'Tarjeta de Crédito'),
        fechaCorte: editFechaCorte,
        fechaPago: editFechaPago,
        cuotasPredeterminadas: parseInt(editCuotas, 10) || 1,
        usuariosInvolucrados: editEsFamiliar ? editUsuarios : [],
        actualizadoEn: new Date().toISOString()
      };

      await firedb.collection('tarjetas-credito').doc(targetId).set(payload, { merge: true });

      // Actualizar estado local
      const existe = tarjetas.some(t => t.id === targetId);
      let nuevasTarjetas;
      if (existe) {
        nuevasTarjetas = tarjetas.map(t => (t.id === targetId ? { ...t, ...payload } : t));
      } else {
        nuevasTarjetas = [{ id: targetId, ...payload }, ...tarjetas];
      }
      setTarjetas(nuevasTarjetas);
      setTarjetaSeleccionadaId(targetId);
      setMostrarModalConfig(false);

      _swal({
        title: '¡Configuración Guardada!',
        text: editHabilitarTarjeta
          ? `Tarjeta ${editEsFamiliar ? 'Familiar' : 'Personal'} guardada exitosamente.`
          : 'Seguimiento de tarjeta de crédito desactivado.',
        icon: 'success',
        timer: 1400,
        buttons: false
      });
    } catch (error) {
      console.error('Error guardando configuración de tarjeta:', error);
      _swal('Error', 'No se pudieron guardar los cambios en la base de datos.', 'error');
    } finally {
      setGuardandoTarjeta(false);
    }
  };

  return (
    <div className="container pantalla-tarjeta-familiar-contenedor" style={{ paddingTop: '16px', paddingBottom: '90px', maxWidth: '640px' }}>

      {/* =============================================================== */}
      {/* 1. ENCABEZADO SUPERIOR                                          */}
      {/* =============================================================== */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={() => historial.push('/home')}
            title="Volver al Inicio"
          >
            <i className="fas fa-arrow-left text-dark"></i>
          </button>
          <div>
            <h4 className="mb-0 font-weight-bold" style={{ fontSize: '1.2rem', color: '#1E1F30' }}>
              {esTarjetaFamiliar ? 'Tarjeta Familiar' : 'Tarjeta de Crédito'}
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#8E92A4', fontWeight: 600 }}>
              {esTarjetaFamiliar
                ? 'Liquidación por usuario y fecha de corte'
                : 'Control de fecha de corte y pago personal'}
            </span>
          </div>
        </div>

        {/* Botones de acción: recarga y configuración */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={cargarDatos}
            title="Actualizar datos"
          >
            <i className={`fas fa-sync-alt ${cargando ? 'fa-spin' : ''}`} style={{ color: '#4E44EB' }}></i>
          </button>
          <button
            type="button"
            className="btn btn-sm btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={abrirModalConfiguracion}
            title="Configurar tarjeta y opciones"
          >
            <i className="fas fa-cog" style={{ color: '#4E44EB' }}></i>
          </button>
        </div>
      </div>

      {/* Cargando */}
      {cargando ? (
        <div className="text-center py-5">
          <i className="fas fa-spinner fa-spin fa-2x text-primary mb-2"></i>
          <p className="text-muted font-weight-bold" style={{ fontSize: '0.85rem' }}>
            Cargando información de tu tarjeta...
          </p>
        </div>
      ) : (
        <>
          {/* =============================================================== */}
          {/* 2. SELECTOR DE TARJETA Y SELECTOR DESPLEGABLE DE CICLOS        */}
          {/* =============================================================== */}
          <div className="tarjeta-selectores-ciclos-tc mb-3">
            {/* Selector de Tarjeta (si hay múltiples) */}
            {tarjetas.length > 1 && (
              <div className="mb-2">
                <label className="etiqueta-selector-mini">
                  <i className="fas fa-credit-card mr-1 text-primary"></i> Tarjeta de crédito
                </label>
                <select
                  className="form-control selector-dropdown-ciclo"
                  value={tarjetaSeleccionadaId}
                  onChange={(e) => setTarjetaSeleccionadaId(e.target.value)}
                >
                  {tarjetas.map(t => (
                    <option key={t.id} value={t.id}>
                      💳 {t.nombre} {t.esFamiliar ? `(Familiar: ${t.usuariosInvolucrados?.length || 0} miembros)` : '(Personal)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector Desplegable de Ciclos (Fecha de Corte y Fecha de Pago) */}
            <div>
              <label className="etiqueta-selector-mini">
                <i className="fas fa-calendar-alt mr-1 text-primary"></i> Ciclo de Facturación (Corte y Pago)
              </label>
              <select
                className="form-control selector-dropdown-ciclo"
                value={cicloSeleccionadoClave}
                onChange={(e) => setCicloSeleccionadoClave(e.target.value)}
              >
                {opcionesCiclos.map(c => (
                  <option key={c.clave} value={c.clave}>
                    {c.etiqueta} {c.cantidad > 0 ? `(${c.cantidad} ${c.cantidad === 1 ? 'consumo' : 'consumos'} • Q ${c.total.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : '(0 consumos)'}
                  </option>
                ))}
                <option value="todos">
                  🌐 Todos los ciclos acumulados ({totalHistoricoConsumos.length} consumos • Q {sumaHistoricaConsumos.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                </option>
              </select>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 3. ALERTA Y HERO CARD: ESTADO DE PAGO Y TOTAL DEL CICLO         */}
          {/* =============================================================== */}
          <div className="hero-tarjeta-familiar-card mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div className="d-flex align-items-center gap-2">
                <span className="badge-icono-tarjeta">
                  <i className="fas fa-credit-card"></i>
                </span>
                <strong className="nombre-tarjeta-hero">{tarjetaActual.nombre}</strong>
                <span className="badge badge-light" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                  {esTarjetaFamiliar ? 'Familiar' : 'Personal'}
                </span>
              </div>
              <span
                className="badge-estado-pago-tc"
                style={{ backgroundColor: `${alertaPago.color}20`, color: alertaPago.color, border: `1px solid ${alertaPago.color}50` }}
              >
                <i className={`${alertaPago.icono} mr-1`}></i>
                {alertaPago.titulo}
              </span>
            </div>

            {/* Monto Total a Pagar en este ciclo */}
            <div className="hero-tarjeta-monto-bloque my-2">
              <span className="etiqueta-monto-hero-tc">Total a pagar en esta fecha</span>
              <h2 className="monto-hero-tc">
                Q {totalCiclo.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>

            {/* Detalle de Fechas: Corte y Pago */}
            <div className="fechas-hero-tc-grid">
              <div className="fecha-hero-tc-item">
                <span className="label-fecha-tc">
                  <i className="fas fa-cut mr-1 text-muted"></i> Fecha de corte
                </span>
                <strong className="valor-fecha-tc">
                  {cicloActual?.corteVisual || formatearAFechaVisual(tarjetaActual.fechaCorte)}
                </strong>
              </div>

              <div className="fecha-hero-tc-item borde-izq">
                <span className="label-fecha-tc">
                  <i className="fas fa-calendar-check mr-1" style={{ color: '#F46F5F' }}></i> Fecha límite de pago
                </span>
                <strong className="valor-fecha-tc" style={{ color: alertaPago.color }}>
                  {cicloActual?.pagoVisual || formatearAFechaVisual(tarjetaActual.fechaPago)}
                </strong>
              </div>
            </div>

            <div className="aviso-corte-info-tc mt-2">
              <i className="fas fa-info-circle mr-1"></i>
              Los gastos después de la fecha de corte pasan automáticamente al siguiente ciclo de pago.
            </div>
          </div>

          {/* =============================================================== */}
          {/* 4. GRÁFICA VISUAL: DISTRIBUCIÓN DE GASTOS POR USUARIO           */}
          {/* =============================================================== */}
          <div className="tarjeta-widget-home mb-3">
            <div className="widget-titulo-seccion mb-2">
              <span>
                <i className="fas fa-chart-pie mr-2" style={{ color: '#4E44EB' }}></i>
                Distribución de Gastos por Usuario
              </span>
              <span className="badge-cantidad-usuarios">
                {liquidacionPorUsuario.filter(u => u.monto > 0).length > 0
                  ? `${liquidacionPorUsuario.filter(u => u.monto > 0).length} familiares activos`
                  : `${liquidacionPorUsuario.length} miembros`}
              </span>
            </div>

            {totalCiclo === 0 ? (
              <div>
                <div className="d-flex flex-column gap-2 mb-2">
                  {liquidacionPorUsuario.map((u) => (
                    <div key={u.nombre} className="item-grafica-usuario-tc">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="avatar-mini-usuario-tc"
                            style={{ backgroundColor: u.color }}
                          >
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="nombre-usuario-tc">{u.nombre}</span>
                          <span className="badge-gastos-conteo">
                            0 gastos
                          </span>
                        </div>

                        <div className="text-right">
                          <strong className="monto-usuario-tc" style={{ color: '#8E92A4' }}>
                            Q 0.00
                          </strong>
                          <span className="porcentaje-usuario-tc ml-1 text-muted">
                            (0.0%)
                          </span>
                        </div>
                      </div>

                      <div className="barra-fondo-mini-tc">
                        <div
                          className="barra-relleno-mini-tc"
                          style={{
                            width: '0%',
                            backgroundColor: u.color
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center py-2 text-muted" style={{ fontSize: '0.8rem', background: '#F9FAFB', borderRadius: '10px' }}>
                  <i className="fas fa-info-circle mr-1 text-primary"></i>
                  No hay consumos registrados en este ciclo. Todos los miembros están en Q 0.00.
                </div>
              </div>
            ) : (
              <div>
                <div className="barra-segmentada-consumos-tc mb-3">
                  {liquidacionPorUsuario.map((u) => {
                    if (u.monto === 0) return null;
                    return (
                      <div
                        key={u.nombre}
                        className="segmento-barra-tc"
                        style={{
                          width: `${u.porcentaje}%`,
                          backgroundColor: u.color
                        }}
                        title={`${u.nombre}: Q ${u.monto.toFixed(2)} (${u.porcentaje.toFixed(1)}%)`}
                      ></div>
                    );
                  })}
                </div>

                <div className="d-flex flex-column gap-2">
                  {liquidacionPorUsuario.map((u) => (
                    <div key={u.nombre} className="item-grafica-usuario-tc">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="avatar-mini-usuario-tc"
                            style={{ backgroundColor: u.color }}
                          >
                            {u.nombre.charAt(0).toUpperCase()}
                          </div>
                          <span className="nombre-usuario-tc">{u.nombre}</span>
                          <span className="badge-gastos-conteo">
                            {u.cantidadGastos} {u.cantidadGastos === 1 ? 'gasto' : 'gastos'}
                          </span>
                        </div>

                        <div className="text-right">
                          <strong className="monto-usuario-tc">
                            Q {u.monto.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                          <span className="porcentaje-usuario-tc ml-1">
                            ({u.porcentaje.toFixed(1)}%)
                          </span>
                        </div>
                      </div>

                      <div className="barra-fondo-mini-tc">
                        <div
                          className="barra-relleno-mini-tc"
                          style={{
                            width: `${u.porcentaje}%`,
                            backgroundColor: u.color
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* 5. TABLA DE LIQUIDACIÓN: ¿CUÁNTO DEBE PAGAR CADA PERSONA?       */}
          {/* =============================================================== */}
          <div className="tarjeta-widget-home mb-3">
            <div className="widget-titulo-seccion mb-3">
              <span>
                <i className="fas fa-hand-holding-usd mr-2" style={{ color: '#10B981' }}></i>
                ¿Cuánto debe pagar cada persona?
              </span>
              <span className="badge-fecha-pago-mini">
                Pagar antes del {cicloActual?.pagoVisual || formatearAFechaVisual(tarjetaActual.fechaPago)}
              </span>
            </div>

            <div className="d-flex flex-column gap-2">
              {liquidacionPorUsuario.map((u) => (
                <div
                  key={u.nombre}
                  className={`tarjeta-fila-liquidacion-tc ${filtroUsuario === u.nombre ? 'seleccionada' : ''}`}
                  onClick={() => setFiltroUsuario(filtroUsuario === u.nombre ? 'todos' : u.nombre)}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="avatar-liquidacion-tc"
                        style={{ backgroundColor: u.color }}
                      >
                        {u.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong className="nombre-persona-liquidacion">{u.nombre}</strong>
                        <div className="subtexto-persona-liquidacion">
                          {u.cantidadGastos} consumos • {u.porcentaje.toFixed(1)}% de la factura
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="etiqueta-debe-pagar">Debe transferir:</span>
                      <div className="monto-debe-pagar-valor" style={{ color: u.monto > 0 ? '#1E1F30' : '#10B981' }}>
                        Q {u.monto.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="footer-fila-liquidacion-tc mt-2 pt-2 d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '0.72rem', color: u.monto > 0 ? '#8E92A4' : '#10B981' }}>
                      {u.monto > 0
                        ? (filtroUsuario === u.nombre ? 'Mostrando solo sus gastos' : 'Toca para ver solo sus comprobantes')
                        : 'Al día • Sin consumos pendientes'}
                    </span>
                    <span className="badge-ver-gastos-tc" style={{ color: u.color }}>
                      {filtroUsuario === u.nombre ? 'Ver todos' : 'Filtrar'} <i className="fas fa-arrow-right ml-1"></i>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {totalCiclo === 0 && (
              <div className="text-center mt-2 py-2 text-muted" style={{ fontSize: '0.8rem', background: '#ECFDF5', color: '#065F46', borderRadius: '10px' }}>
                <i className="fas fa-check-circle mr-1" style={{ color: '#10B981' }}></i>
                Todos los miembros están al día. No hay pagos pendientes para este ciclo.
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* 6. LISTADO DETALLADO DE CONSUMOS / TICKETS DEL CICLO           */}
          {/* =============================================================== */}
          <div className="tarjeta-widget-home mb-3">
            <div className="widget-titulo-seccion mb-2">
              <span>
                <i className="fas fa-receipt mr-2" style={{ color: '#4E44EB' }}></i>
                Detalle de Consumos ({movimientosFiltrados.length})
              </span>
              {esTarjetaFamiliar && filtroUsuario !== 'todos' && (
                <button
                  type="button"
                  className="btn btn-xs btn-outline-secondary rounded-pill"
                  style={{ fontSize: '0.72rem' }}
                  onClick={() => setFiltroUsuario('todos')}
                >
                  Quitar filtro: {filtroUsuario} ✕
                </button>
              )}
            </div>

            {movimientosFiltrados.length === 0 ? (
              <div className="text-center py-4 bg-light rounded border">
                <i className="fas fa-shopping-bag fa-2x mb-2 text-muted" style={{ opacity: 0.6 }}></i>
                <h6 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E1F30' }}>
                  No hay consumos en este ciclo ({movimientosFiltrados.length})
                </h6>
                <p className="mb-3 text-muted" style={{ fontSize: '0.8rem' }}>
                  Los gastos que registres asignados a esta tarjeta aparecerán detallados aquí.
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  style={{ background: '#4E44EB', borderColor: '#4E44EB', borderRadius: '12px', fontWeight: 700 }}
                  onClick={() => historial.push('/add-data/1')}
                >
                  <i className="fas fa-plus mr-1"></i> Registrar nuevo gasto con tarjeta
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {movimientosFiltrados.map((mov) => {
                  const usuarioGasto = mov.usuarioGasto || (esTarjetaFamiliar ? 'Sin asignar' : null);
                  const usuarioMeta = esTarjetaFamiliar ? liquidacionPorUsuario.find(u => u.nombre === usuarioGasto) : null;
                  const colorUsuario = usuarioMeta?.color || '#4E44EB';

                  return (
                    <div key={mov.id} className="tarjeta-item-consumo-tc">
                      <div className="d-flex align-items-start justify-content-between">
                        <div className="d-flex align-items-start gap-2">
                          <div
                            className="badge-consumo-usuario-icono"
                            style={{ backgroundColor: colorUsuario }}
                            title={usuarioGasto ? `Realizado por ${usuarioGasto}` : 'Gasto con Tarjeta'}
                          >
                            <i className="fas fa-credit-card"></i>
                          </div>
                          <div>
                            <strong className="concepto-consumo-tc">
                              {mov.descripcion || mov.categoria || 'Gasto TC'}
                            </strong>
                            <div className="meta-consumo-tc">
                              {esTarjetaFamiliar && usuarioGasto && (
                                <span className="badge-miembro-nombre mr-1" style={{ color: colorUsuario }}>
                                  <i className="fas fa-user mr-1"></i>{usuarioGasto} •
                                </span>
                              )}
                              {formatearAFechaVisual(mov.fecha)} {mov.hora ? `• ${mov.hora}` : ''}
                              {mov.comercio && ` • ${mov.comercio}`}
                              {mov.cuotas > 1 && ` • ${mov.cuotas} cuotas`}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="monto-consumo-tc">
                            - Q {(parseFloat(mov.cantidad) || 0).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>

                          {/* Botón miniatura de comprobante si existe */}
                          {mov.attachmentUrl && (
                            <button
                              type="button"
                              className="btn-ver-ticket-mini-tc mt-1"
                              onClick={() => setModalImagenGrande(mov.attachmentUrl)}
                              title="Ver comprobante"
                            >
                              <i className="fas fa-image mr-1"></i> Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* =============================================================== */}
      {/* 7. MODAL DE CONFIGURACIÓN CON LOS 2 SWITCHES INDEPENDIENTES     */}
      {/* =============================================================== */}
      <Modal
        show={mostrarModalConfig}
        onHide={() => setMostrarModalConfig(false)}
        centered
        dialogClassName="modal-bottom-sheet-dialog"
      >
        <div className="p-4 bg-white rounded-top-custom">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 font-weight-bold" style={{ fontSize: '1.15rem', color: '#1E1F30' }}>
              <i className="fas fa-credit-card mr-2 text-primary"></i>
              Configuración de Tarjeta
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px' }}
              onClick={() => setMostrarModalConfig(false)}
            >
              <i className="fas fa-times text-muted"></i>
            </button>
          </div>

          <form onSubmit={guardarConfiguracionTarjeta}>
            {/* SWITCH 1: Habilitar Tarjeta de Crédito */}
            <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded mb-3 border">
              <div>
                <strong className="d-block" style={{ fontSize: '0.9rem', color: '#1E1F30' }}>
                  <i className="fas fa-credit-card mr-2" style={{ color: '#4E44EB' }}></i>
                  Habilitar Tarjeta de Crédito
                </strong>
                <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                  Activa el control de fechas de corte, fecha de pago y alertas en Home
                </span>
              </div>
              <div className="custom-control custom-switch">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="switchHabilitarTc"
                  checked={editHabilitarTarjeta}
                  onChange={(e) => setEditHabilitarTarjeta(e.target.checked)}
                />
                <label className="custom-control-label" htmlFor="switchHabilitarTc" style={{ cursor: 'pointer' }}></label>
              </div>
            </div>

            {/* SWITCH 2: Modo Familiar (Compartida con otros usuarios) */}
            {editHabilitarTarjeta && (
              <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded mb-3 border">
                <div>
                  <strong className="d-block" style={{ fontSize: '0.9rem', color: '#1E1F30' }}>
                    <i className="fas fa-users mr-2" style={{ color: '#10B981' }}></i>
                    Tarjeta Familiar (Compartida)
                  </strong>
                  <span style={{ fontSize: '0.74rem', color: '#6B7280' }}>
                    {editEsFamiliar
                      ? 'Activado: Reparte gastos entre familiares con gráfica y tabla de liquidación'
                      : 'Desactivado: Tarjeta personal sin desglose ni asignación de otros usuarios'}
                  </span>
                </div>
                <div className="custom-control custom-switch">
                  <input
                    type="checkbox"
                    className="custom-control-input"
                    id="switchModoFamiliar"
                    checked={editEsFamiliar}
                    onChange={(e) => setEditEsFamiliar(e.target.checked)}
                  />
                  <label className="custom-control-label" htmlFor="switchModoFamiliar" style={{ cursor: 'pointer' }}></label>
                </div>
              </div>
            )}

            {/* CAMPOS DE CONFIGURACIÓN (Solo si está habilitada la tarjeta) */}
            {editHabilitarTarjeta && (
              <>
                {/* Nombre de la tarjeta */}
                <div className="mb-3">
                  <label className="etiqueta-campo-finanzia">Nombre de la Tarjeta</label>
                  <input
                    type="text"
                    className="campo-formulario-finanzia"
                    placeholder="Ej. VISA Plata, BAC Mastercard..."
                    value={editNombreTarjeta}
                    onChange={(e) => setEditNombreTarjeta(e.target.value)}
                    required
                  />
                </div>

                {/* Fechas de Corte y de Pago */}
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="etiqueta-campo-finanzia">Fecha de corte</label>
                    <input
                      type="date"
                      className="campo-formulario-finanzia"
                      value={editFechaCorte}
                      onChange={(e) => setEditFechaCorte(e.target.value)}
                      required
                    />
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      Ej. {formatearAFechaVisual(editFechaCorte)}
                    </small>
                  </div>

                  <div className="col-6">
                    <label className="etiqueta-campo-finanzia">Fecha de pago</label>
                    <input
                      type="date"
                      className="campo-formulario-finanzia"
                      value={editFechaPago}
                      onChange={(e) => setEditFechaPago(e.target.value)}
                      required
                    />
                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                      Ej. {formatearAFechaVisual(editFechaPago)}
                    </small>
                  </div>
                </div>

                {/* Cuotas predeterminadas */}
                <div className="mb-3">
                  <label className="etiqueta-campo-finanzia">Cuotas predeterminadas</label>
                  <select
                    className="campo-formulario-finanzia"
                    value={editCuotas}
                    onChange={(e) => setEditCuotas(parseInt(e.target.value, 10))}
                  >
                    <option value={1}>1 cuota (al contado)</option>
                    <option value={3}>3 cuotas</option>
                    <option value={6}>6 cuotas</option>
                    <option value={10}>10 cuotas</option>
                    <option value={12}>12 cuotas (1 año)</option>
                  </select>
                </div>

                {/* Miembros / Usuarios Involucrados (SOLO si editEsFamiliar es true) */}
                {editEsFamiliar ? (
                  <div className="mb-3">
                    <label className="etiqueta-campo-finanzia d-flex justify-content-between align-items-center">
                      <span>Miembros que usan esta tarjeta</span>
                      <span className="badge badge-light" style={{ fontSize: '0.72rem' }}>
                        {editUsuarios.length} miembros
                      </span>
                    </label>

                    {/* Chips de usuarios actuales */}
                    <div className="d-flex flex-wrap gap-2 mb-2 p-2 bg-light rounded">
                      {editUsuarios.map((u) => (
                        <span key={u} className="badge-chip-usuario-tc">
                          <i className="fas fa-user mr-1 text-primary"></i>
                          {u}
                          <button
                            type="button"
                            className="btn-quitar-chip-usuario"
                            onClick={() => eliminarUsuarioDeLista(u)}
                            title={`Quitar a ${u}`}
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Input para agregar nuevo miembro */}
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="campo-formulario-finanzia"
                        placeholder="Nombre de familiar (ej. Usuario 1, Usuario 2)..."
                        value={nuevoNombreUsuarioInput}
                        onChange={(e) => setNuevoNombreUsuarioInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            agregarUsuarioALista();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ background: '#4E44EB', borderColor: '#4E44EB', borderRadius: '12px', whiteSpace: 'nowrap' }}
                        onClick={agregarUsuarioALista}
                      >
                        <i className="fas fa-plus mr-1"></i> Agregar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2 mb-3 bg-light rounded text-muted" style={{ fontSize: '0.78rem' }}>
                    <i className="fas fa-info-circle mr-1 text-primary"></i>
                    Tarjeta configurada como <strong>personal</strong>. No se requiere lista de usuarios ni distribución de gastos.
                  </div>
                )}
              </>
            )}

            {/* Botón de guardado */}
            <button
              type="submit"
              className="btn btn-primary btn-block py-2 mt-4"
              style={{ background: '#4E44EB', borderColor: '#4E44EB', borderRadius: '14px', fontWeight: 700 }}
              disabled={guardandoTarjeta}
            >
              {guardandoTarjeta ? (
                <span><i className="fas fa-spinner fa-spin mr-2"></i>Guardando...</span>
              ) : (
                <span>Guardar Configuración de Tarjeta</span>
              )}
            </button>
          </form>
        </div>
      </Modal>

      {/* Visor Modal de Comprobante / Ticket a pantalla completa */}
      <VisorImagenModal
        urlImagen={modalImagenGrande}
        titulo="Comprobante de Consumo"
        onCerrar={() => setModalImagenGrande(null)}
      />

    </div>
  );
}
