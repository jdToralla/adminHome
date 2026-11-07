import React, { useState, useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import { auth, firedb } from '../firebaseConfig';
import PiggyBankSvg from './PiggyBankSvg';
import { getCategoryMeta } from './categoryIcons';
import VisorImagenModal from './VisorImagenModal';
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
 * Días de la semana para el flujo de efectivo (Lun a Dom)
 */
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Pantalla Principal (Home) de Finanzia
 * Rediseñada bajo estándares Mobile First tipo Wallet, Revolut y Money Manager.
 * Optimizada para la capa gratuita de Firestore (agregados mensuales y lecturas mínimas).
 */
export default function Home() {
  const historial = useHistory();

  // Estados de datos
  const [cargando, setCargando] = useState(true);
  const [todosLosMovimientos, setTodosLosMovimientos] = useState([]);
  const [ultimosMovimientos, setUltimosMovimientos] = useState([]);
  const [estadisticasMes, setEstadisticasMes] = useState(null);
  const [saldoHistoricoTotal, setSaldoHistoricoTotal] = useState(0);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [modalImagenGrande, setModalImagenGrande] = useState(null);
  const [metasAhorro] = useState([]);

  // Períodos disponibles: 'mes' | 'ultimo_mes' | '3_meses' | '6_meses' | 'anio' | 'personalizado'
  // eslint-disable-next-line no-unused-vars
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');
  const [fechaInicioPersonalizada, setFechaInicioPersonalizada] = useState('');
  const [fechaFinPersonalizada, setFechaFinPersonalizada] = useState('');
  const [mostrarModalRango, setMostrarModalRango] = useState(false);

  // Datos del usuario activo
  const nombreUsuario = localStorage.getItem('currentUserName') || 'Usuario';
  const fotoUsuario = localStorage.getItem('currentUserPhoto') || '';

  // Clave del mes actual en formato "YYYY-MM"
  const claveMesActual = useMemo(() => {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}`;
  }, []);

  // Clave del mes anterior en formato "YYYY-MM"
  const claveMesAnterior = useMemo(() => {
    const ahora = new Date();
    ahora.setMonth(ahora.getMonth() - 1);
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    return `${anio}-${mes}`;
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    const idUsuario = localStorage.getItem('currentId');
    if (!idUsuario) {
      historial.push('/login');
      return;
    }
    cargarDatosHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoSeleccionado]);

  /**
   * Carga optimizada para la Capa Gratuita de Firebase:
   * 1. Consulta el documento precalculado de agregados del mes (1 sola lectura).
   * 2. Consulta únicamente 4 documentos recientes para la vista previa de movimientos.
   */
  const cargarDatosHome = async () => {
    setCargando(true);
    try {
      const idUsuario = localStorage.getItem('currentId');
      const uidNormalizado = parseUserId(idUsuario);

      // 1. Lectura de documento agregado mensual (Solo 1 lectura a Firestore)
      let claveMesConsulta = claveMesActual;
      if (periodoSeleccionado === 'ultimo_mes') {
        claveMesConsulta = claveMesAnterior;
      }

      try {
        const docStats = await firedb
          .collection('users')
          .doc(idUsuario)
          .collection('aggregatedStats')
          .doc(claveMesConsulta)
          .get();

        if (docStats.exists) {
          setEstadisticasMes(docStats.data());
        } else {
          setEstadisticasMes(null);
        }
      } catch (eStats) {
        console.warn('No se pudo leer aggregatedStats (posible cuenta legacy):', eStats);
      }

      // 2. Consulta optimizada de los movimientos del usuario en Firestore (hasta 100 registros)
      const snapshotTotales = await firedb
        .collection('caja-chica')
        .where('idUser', '==', uidNormalizado)
        .orderBy('fecha', 'desc')
        .limit(100)
        .get();

      let itemsTotales = snapshotTotales.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sincronización inteligente de comprobantes para movimientos recientes
      try {
        const sinAdjunto = itemsTotales.slice(0, 10).filter(r => !r.attachmentUrl && !r.urlComprobante);
        if (sinAdjunto.length > 0 && idUsuario) {
          const authUser = auth.currentUser;
          const uidEfectivo = (authUser && authUser.uid) ? authUser.uid : idUsuario.toString();

          const [gastosSnap, ingresosSnap] = await Promise.all([
            firedb.collection('users').doc(uidEfectivo).collection('expenses').where('attachmentUrl', '!=', null).limit(10).get().catch(() => null),
            firedb.collection('users').doc(uidEfectivo).collection('incomes').where('attachmentUrl', '!=', null).limit(10).get().catch(() => null)
          ]);

          const mapaAdjuntos = {};
          if (gastosSnap && !gastosSnap.empty) {
            gastosSnap.forEach(d => {
              const data = d.data();
              if (data.attachmentUrl) {
                mapaAdjuntos[`${data.date}_${data.amount}`] = data.attachmentUrl;
              }
            });
          }
          if (ingresosSnap && !ingresosSnap.empty) {
            ingresosSnap.forEach(d => {
              const data = d.data();
              if (data.attachmentUrl) {
                mapaAdjuntos[`${data.date}_${data.amount}`] = data.attachmentUrl;
              }
            });
          }

          if (Object.keys(mapaAdjuntos).length > 0) {
            itemsTotales = itemsTotales.map(reg => {
              if (!reg.attachmentUrl && !reg.urlComprobante) {
                const llave = `${reg.fecha}_${reg.cantidad}`;
                const urlEncontrada = mapaAdjuntos[llave];
                if (urlEncontrada) {
                  firedb.collection('caja-chica').doc(reg.id).update({
                    attachmentUrl: urlEncontrada
                  }).catch(() => { });
                  return { ...reg, attachmentUrl: urlEncontrada };
                }
              }
              return reg;
            });
          }
        }
      } catch (errSync) {
        console.warn('Fallback sync comprobantes en Home:', errSync);
      }

      setTodosLosMovimientos(itemsTotales);
      setUltimosMovimientos(itemsTotales.slice(0, 4));

      // 3. Balance acumulado total real
      let totalIngresos = 0;
      let totalEgresos = 0;
      itemsTotales.forEach(doc => {
        const cant = parseFloat(doc.cantidad || doc.amount) || 0;
        if (doc.tipo === 2) totalIngresos += cant;
        else if (doc.tipo === 1) totalEgresos += cant;
      });
      setSaldoHistoricoTotal(totalIngresos - totalEgresos);
    } catch (error) {
      console.error('Error al cargar datos del Home:', error);
    } finally {
      setCargando(false);
    }
  };

  // Formato legible de fecha corta
  const formatearFechaCorta = (fechaStr) => {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}`;
    }
    return fechaStr;
  };

  // ---------------------------------------------------------------------------
  // CÁLCULO DE KPIS SEGÚN EL PERÍODO SELECCIONADO (100% DINÁMICO)
  // ---------------------------------------------------------------------------
  const kpisCalculados = useMemo(() => {
    // Si tenemos agregados mensuales precalculados de Firestore:
    if (estadisticasMes) {
      const ingresos = estadisticasMes.totalIncome || 0;
      const egresos = estadisticasMes.totalExpense || 0;
      const ahorro = ingresos - egresos;
      const tasaAhorro = ingresos > 0 ? ((ahorro / ingresos) * 100).toFixed(1) : 0;
      return {
        ingresos,
        egresos,
        ahorro,
        tasaAhorro
      };
    }

    // Cálculo con los movimientos reales
    let ingresos = 0;
    let egresos = 0;
    todosLosMovimientos.forEach(m => {
      const cant = parseFloat(m.cantidad || m.amount) || 0;
      if (m.tipo === 2) ingresos += cant;
      else if (m.tipo === 1) egresos += cant;
    });
    const ahorro = ingresos - egresos;
    const tasaAhorro = ingresos > 0 ? ((ahorro / ingresos) * 100).toFixed(1) : 0;

    return {
      ingresos,
      egresos,
      ahorro,
      tasaAhorro
    };
  }, [estadisticasMes, todosLosMovimientos]);

  // Fechas correspondientes a los días de la semana en curso (Lunes a Domingo)
  const diasSemanaFechas = useMemo(() => {
    const ahora = new Date();
    const diaActual = ahora.getDay();
    const distanciaAlLunes = diaActual === 0 ? -6 : 1 - diaActual;
    const lunes = new Date(ahora);
    lunes.setDate(ahora.getDate() + distanciaAlLunes);

    return DIAS_SEMANA.map((dia, idx) => {
      const fechaDia = new Date(lunes);
      fechaDia.setDate(lunes.getDate() + idx);
      const anio = fechaDia.getFullYear();
      const mes = String(fechaDia.getMonth() + 1).padStart(2, '0');
      const d = String(fechaDia.getDate()).padStart(2, '0');
      return {
        dia,
        fechaStr: `${anio}-${mes}-${d}`
      };
    });
  }, []);

  // Flujo de efectivo agrupado por días de la semana con DATOS REALES (sin datos quemados)
  const flujoSemanalDias = useMemo(() => {
    return diasSemanaFechas.map(({ dia, fechaStr }, idx) => {
      let ingresos = 0;
      let egresos = 0;

      todosLosMovimientos.forEach(mov => {
        if (mov.fecha === fechaStr) {
          const cant = parseFloat(mov.cantidad || mov.amount) || 0;
          if (mov.tipo === 2) ingresos += cant;
          else if (mov.tipo === 1) egresos += cant;
        }
      });

      return {
        dia,
        fechaStr,
        indice: idx,
        ingresos,
        egresos
      };
    });
  }, [diasSemanaFechas, todosLosMovimientos]);

  // Indicador de si existen movimientos registrados en la semana en curso
  const hayDatosFlujoSemanal = useMemo(() => {
    return flujoSemanalDias.some(d => d.ingresos > 0 || d.egresos > 0);
  }, [flujoSemanalDias]);

  // Totales y balance neto del flujo semanal
  const estadisticasFlujoSemanal = useMemo(() => {
    let totalIngresos = 0;
    let totalEgresos = 0;
    let maxValor = 1;

    flujoSemanalDias.forEach(d => {
      totalIngresos += d.ingresos;
      totalEgresos += d.egresos;
      if (d.ingresos > maxValor) maxValor = d.ingresos;
      if (d.egresos > maxValor) maxValor = d.egresos;
    });

    const diferencia = totalIngresos - totalEgresos;
    return {
      totalIngresos,
      totalEgresos,
      diferencia,
      maxValor
    };
  }, [flujoSemanalDias]);

  // Desglose de categorías de gasto para el gráfico (100% dinámico, sin datos quemados)
  const desgloseCategorias = useMemo(() => {
    // 1. Si hay agregados mensuales precalculados
    if (estadisticasMes && estadisticasMes.expenseCategoryBreakdown) {
      const breakdown = estadisticasMes.expenseCategoryBreakdown;
      const totalGastos = estadisticasMes.totalExpense || 1;
      const categorias = Object.entries(breakdown)
        .filter(([, monto]) => monto > 0)
        .map(([nombre, monto]) => {
          const meta = getCategoryMeta(nombre, 1);
          return {
            nombre,
            monto,
            porcentaje: Math.min(100, Math.round((monto / totalGastos) * 100)),
            color: meta.color || '#4E44EB',
            icono: meta.icon || 'fas fa-tag'
          };
        })
        .sort((a, b) => b.monto - a.monto);

      if (categorias.length > 0) return categorias;
    }

    // 2. Calcular a partir de los egresos reales en todosLosMovimientos
    const egresosReales = todosLosMovimientos.filter(m => m.tipo === 1);
    if (egresosReales.length === 0) {
      return []; // RETORNA VACÍO PARA MOSTRAR EMPTY STATE
    }

    const acumulador = {};
    let totalMonto = 0;

    egresosReales.forEach(g => {
      const cat = g.categoria || g.category || 'Otros';
      const cant = parseFloat(g.cantidad || g.amount) || 0;
      acumulador[cat] = (acumulador[cat] || 0) + cant;
      totalMonto += cant;
    });

    if (totalMonto === 0) return [];

    return Object.entries(acumulador)
      .map(([nombre, monto]) => {
        const meta = getCategoryMeta(nombre, 1);
        return {
          nombre,
          monto,
          porcentaje: Math.min(100, Math.round((monto / totalMonto) * 100)),
          color: meta.color || '#4E44EB',
          icono: meta.icon || 'fas fa-tag'
        };
      })
      .sort((a, b) => b.monto - a.monto);
  }, [estadisticasMes, todosLosMovimientos]);

  // Próximos pagos calculados dinámicamente de los movimientos reales (sin datos quemados)
  const proximosPagos = useMemo(() => {
    return todosLosMovimientos
      .filter(m => {
        const tieneVencimiento = Boolean(m.vencimientoGasto || m.dueDate);
        const esPendiente = m.estado === 'Pendiente' || m.status === 'Pendiente';
        const tieneCuotasPendientes = m.cuotas && m.cuotas > 1;
        return (tieneVencimiento || esPendiente || tieneCuotasPendientes) && m.tipo === 1;
      })
      .slice(0, 4)
      .map(m => {
        const meta = getCategoryMeta(m.descripcion || m.categoria, 1);
        const montoNum = parseFloat(m.cantidad || m.amount) || 0;
        let textoVencimiento = 'Pendiente de pago';
        if (m.vencimientoGasto || m.dueDate) {
          textoVencimiento = `Vence: ${m.vencimientoGasto || m.dueDate}`;
        } else if (m.diaPago) {
          textoVencimiento = `Día de pago: ${m.diaPago}`;
        } else if (m.cuotas && m.cuotas > 1) {
          textoVencimiento = `${m.cuotas} cuotas pendientes`;
        }

        return {
          id: m.id,
          concepto: m.descripcion || m.comercio || m.categoria || 'Gasto pendiente',
          monto: montoNum,
          fechaVencimiento: textoVencimiento,
          icono: meta.icon || 'fas fa-calendar-check',
          color: meta.color || '#F46F5F'
        };
      });
  }, [todosLosMovimientos]);

  return (
    <div className="container" style={{ paddingTop: '16px', paddingBottom: '90px', maxWidth: '640px' }}>

      {/* =============================================================== */}
      {/* 1. ENCABEZADO MINIMALISTA NATIVO (Reemplaza navbar tradicional)  */}
      {/* =============================================================== */}
      <div className="encabezado-minimalista-home">
        <div className="d-flex align-items-center">
          {fotoUsuario ? (
            <img src={fotoUsuario} alt="Avatar" className="usuario-avatar-circulo" />
          ) : (
            <div className="usuario-avatar-placeholder">
              {nombreUsuario.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="contenedor-saludo-usuario">
            <span className="saludo-subtitulo">
              Hola de nuevo,
            </span>
            <strong className="saludo-nombre-usuario">
              {nombreUsuario} 👋
            </strong>
          </div>
        </div>

        {/* Botón de recarga y notificaciones */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={cargarDatosHome}
            title="Actualizar datos"
          >
            <i className={`fas fa-sync-alt ${cargando ? 'fa-spin' : ''}`} style={{ color: '#4E44EB' }}></i>
          </button>
        </div>
      </div>

      {/* =============================================================== */}
      {/* 2. SELECTOR DESLIZABLE DE PERÍODOS                             */}
      {/* =============================================================== */}
      {/* <div className="selector-periodos-deslizable">
        <button
          type="button"
          className={`pildora-periodo-item ${periodoSeleccionado === 'mes' ? 'activo' : ''}`}
          onClick={() => setPeriodoSeleccionado('mes')}
        >
          Mes Actual
        </button>
        <button
          type="button"
          className={`pildora-periodo-item ${periodoSeleccionado === 'ultimo_mes' ? 'activo' : ''}`}
          onClick={() => setPeriodoSeleccionado('ultimo_mes')}
        >
          Último Mes
        </button>
        <button
          type="button"
          className={`pildora-periodo-item ${periodoSeleccionado === '3_meses' ? 'activo' : ''}`}
          onClick={() => setPeriodoSeleccionado('3_meses')}
        >
          3 Meses
        </button>
        <button
          type="button"
          className={`pildora-periodo-item ${periodoSeleccionado === '6_meses' ? 'activo' : ''}`}
          onClick={() => setPeriodoSeleccionado('6_meses')}
        >
          6 Meses
        </button>
        <button
          type="button"
          className={`pildora-periodo-item ${periodoSeleccionado === 'anio' ? 'activo' : ''}`}
          onClick={() => setPeriodoSeleccionado('anio')}
        >
          Año
        </button>
        <button
          type="button"
          className={`pildora-periodo-item ${periodoSeleccionado === 'personalizado' ? 'activo' : ''}`}
          onClick={() => setMostrarModalRango(true)}
        >
          <i className="fas fa-calendar-alt mr-1"></i> Personalizado
        </button>
      </div> */}

      {/* =============================================================== */}
      {/* 3. TARJETA HERO DE SALDO DISPONIBLE CON PIGGY BANK              */}
      {/* (Fiel al diseño exacto: Saldo, Monto, Píldoras y Cerdito SVG)   */}
      {/* =============================================================== */}
      <div className="hero-balance-card mb-3">
        <div className="hero-balance-content">
          <span className="hero-balance-label">
            Saldo Disponible Total
          </span>
          <div className="hero-balance-amount">
            Q {saldoHistoricoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="hero-balance-pills">
            <span className="pill-indicador activa"></span>
            <span className="pill-indicador"></span>
            <span className="pill-indicador"></span>
          </div>
        </div>

        <div className="hero-piggy-container">
          <PiggyBankSvg width={135} height={105} />
        </div>
      </div>

      {/* =============================================================== */}
      {/* 4. KPIS FINANCIEROS CLAVE (Ingresos | Egresos | Ahorro)         */}
      {/* =============================================================== */}
      <div className="kpis-financieros-grid">
        {/* KPI Ingresos */}
        <div className="tarjeta-kpi-finanzia">
          <div className="kpi-cabecera">
            <i className="fas fa-arrow-down" style={{ color: '#10B981' }}></i>
            <span>Ingresos</span>
          </div>
          <div className="kpi-monto-valor" style={{ color: '#10B981' }}>
            Q {kpisCalculados.ingresos.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="kpi-badge-tasa">
            Entradas del período
          </span>
        </div>

        {/* KPI Egresos */}
        <div className="tarjeta-kpi-finanzia">
          <div className="kpi-cabecera">
            <i className="fas fa-arrow-up" style={{ color: '#F46F5F' }}></i>
            <span>Egresos</span>
          </div>
          <div className="kpi-monto-valor" style={{ color: '#F46F5F' }}>
            Q {kpisCalculados.egresos.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="kpi-badge-tasa" style={{ color: '#F46F5F' }}>
            Gastos realizados
          </span>
        </div>

        {/* KPI Ahorro Neto */}
        <div className="tarjeta-kpi-finanzia">
          <div className="kpi-cabecera">
            <i className="fas fa-piggy-bank" style={{ color: '#4E44EB' }}></i>
            <span>Ahorro</span>
          </div>
          <div className="kpi-monto-valor" style={{ color: '#4E44EB' }}>
            Q {kpisCalculados.ahorro.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="kpi-badge-tasa">
            {kpisCalculados.tasaAhorro}% tasa
          </span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* 5. GRÁFICO COMPARATIVO INGRESOS VS GASTOS (Lun a Dom)           */}
      {/* =============================================================== */}
      <div className="tarjeta-widget-home" id="seccion-graficos-home">
        <div className="widget-titulo-seccion">
          <span>
            <i className="fas fa-chart-bar mr-2" style={{ color: '#4E44EB' }}></i>
            Ingresos vs Gastos
          </span>
          <span
            className={`badge-diferencia-flujo ${estadisticasFlujoSemanal.diferencia >= 0 ? 'superavit' : 'deficit'}`}
          >
            {estadisticasFlujoSemanal.diferencia >= 0 ? '+' : '-'} Q {Math.abs(estadisticasFlujoSemanal.diferencia).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Gráfico de barras duales de Lun a Dom o Empty State */}
        {!hayDatosFlujoSemanal ? (
          <div className="text-center py-4 px-3">
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>📊</div>
            <h6 style={{ fontWeight: 700, color: '#1E1F30', fontSize: '0.92rem', marginBottom: '4px' }}>
              Sin flujo registrado esta semana
            </h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              Tus ingresos y gastos por día (Lun a Dom) se graficarán automáticamente aquí a medida que agregues transacciones.
            </p>
          </div>
        ) : (
          <>
            <div className="grafico-barras-semanal">
              {flujoSemanalDias.map((d, idx) => {
                const alturaIngreso = Math.max(6, Math.round((d.ingresos / estadisticasFlujoSemanal.maxValor) * 100));
                const alturaGasto = Math.max(6, Math.round((d.egresos / estadisticasFlujoSemanal.maxValor) * 100));
                const hoyJs = new Date().getDay();
                const esHoy = (hoyJs === 0 ? 6 : hoyJs - 1) === idx;

                return (
                  <div key={d.dia} className="columna-dia-semana">
                    <div className="par-barras-dia">
                      {/* Barra de Ingreso */}
                      <div
                        className="barra-ingreso-dia"
                        style={{ height: `${alturaIngreso}%` }}
                        title={`${d.dia} - Ingresos: Q ${d.ingresos.toFixed(2)}`}
                      ></div>
                      {/* Barra de Gasto */}
                      <div
                        className="barra-gasto-dia"
                        style={{ height: `${alturaGasto}%` }}
                        title={`${d.dia} - Gastos: Q ${d.egresos.toFixed(2)}`}
                      ></div>
                    </div>
                    <span className={`etiqueta-dia-semana ${esHoy ? 'hoy' : ''}`}>
                      {d.dia}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
              <div className="d-flex gap-3">
                <span style={{ fontSize: '0.74rem', color: '#4E44EB', fontWeight: 700 }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#4E44EB', borderRadius: '50%', marginRight: '5px' }}></span>
                  Ingresos
                </span>
                <span style={{ fontSize: '0.74rem', color: '#F46F5F', fontWeight: 700, marginLeft: '10px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#F46F5F', borderRadius: '50%', marginRight: '5px' }}></span>
                  Gastos
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* =============================================================== */}
      {/* 6. DISTRIBUCIÓN DE GASTOS POR CATEGORÍA                         */}
      {/* =============================================================== */}
      <div className="tarjeta-widget-home">
        <div className="widget-titulo-seccion">
          <span>
            <i className="fas fa-pie-chart mr-2" style={{ color: '#FF8E6E' }}></i>
            Gastos por Categoría
          </span>
          <span style={{ fontSize: '0.72rem', color: '#8E92A4', fontWeight: 600 }}>
            Top Categorías
          </span>
        </div>

        {desgloseCategorias.length === 0 ? (
          <div className="text-center py-4 px-3">
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🏷️</div>
            <h6 style={{ fontWeight: 700, color: '#1E1F30', fontSize: '0.92rem', marginBottom: '4px' }}>
              Sin gastos registrados
            </h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              Registra tus primeros egresos para ver la distribución y desglose de gastos por categoría.
            </p>
          </div>
        ) : (
          <div>
            {desgloseCategorias.map((cat, idx) => (
              <div key={idx} className="fila-categoria-progreso">
                <div className="categoria-info-linea">
                  <span>
                    <i className={`${cat.icono || 'fas fa-tag'} mr-2`} style={{ color: cat.color }}></i>
                    {cat.nombre}
                  </span>
                  <span>Q {cat.monto.toFixed(2)} ({cat.porcentaje}%)</span>
                </div>
                <div className="barra-progreso-fondo">
                  <div
                    className="barra-progreso-relleno"
                    style={{
                      width: `${cat.porcentaje}%`,
                      background: cat.color || '#4E44EB'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =============================================================== */}
      {/* 7. METAS DE AHORRO (Progreso de objetivos)                      */}
      {/* =============================================================== */}
      <div className="tarjeta-widget-home">
        <div className="widget-titulo-seccion">
          <span>
            <i className="fas fa-bullseye mr-2" style={{ color: '#10B981' }}></i>
            Metas de Ahorro
          </span>
          <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
            {metasAhorro.length > 0 ? 'Activas' : 'Objetivos'}
          </span>
        </div>

        {metasAhorro.length === 0 ? (
          <div className="text-center py-4 px-3">
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🎯</div>
            <h6 style={{ fontWeight: 700, color: '#1E1F30', fontSize: '0.92rem', marginBottom: '4px' }}>
              Sin metas de ahorro activas
            </h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              Próximamente podrás definir tus metas financieras para monitorear tu progreso de ahorro.
            </p>
          </div>
        ) : (
          <div>
            {metasAhorro.map((meta, idx) => (
              <div key={idx} className="tarjeta-meta-ahorro-item">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <strong style={{ fontSize: '0.82rem', color: '#1E1F30' }}>
                    <i className={`${meta.icono} mr-1`} style={{ color: meta.color }}></i>
                    {meta.titulo}
                  </strong>
                  <span style={{ fontSize: '0.76rem', fontWeight: 800, color: meta.color }}>
                    {meta.porcentaje}%
                  </span>
                </div>
                <div className="barra-progreso-fondo mb-1">
                  <div
                    className="barra-progreso-relleno"
                    style={{ width: `${meta.porcentaje}%`, background: meta.color }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between" style={{ fontSize: '0.72rem', color: '#8E92A4' }}>
                  <span>Ahorrado: Q {meta.actual.toLocaleString()}</span>
                  <span>Meta: Q {meta.objetivo.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =============================================================== */}
      {/* 8. PRÓXIMOS PAGOS Y VENCIMIENTOS                                */}
      {/* =============================================================== */}
      <div className="tarjeta-widget-home">
        <div className="widget-titulo-seccion">
          <span>
            <i className="fas fa-calendar-check mr-2" style={{ color: '#F46F5F' }}></i>
            Próximos Pagos
          </span>
          <span style={{ fontSize: '0.72rem', color: '#F46F5F', fontWeight: 700 }}>
            {proximosPagos.length > 0 ? 'Pendientes' : 'Al día'}
          </span>
        </div>

        {proximosPagos.length === 0 ? (
          <div className="text-center py-4 px-3">
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>🎉</div>
            <h6 style={{ fontWeight: 700, color: '#1E1F30', fontSize: '0.92rem', marginBottom: '4px' }}>
              Todo al día
            </h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              No tienes cuentas por pagar ni vencimientos próximos registrados.
            </p>
          </div>
        ) : (
          <div>
            {proximosPagos.map((pago, idx) => (
              <div key={idx} className="tarjeta-proximo-pago-item">
                <div className="d-flex align-items-center gap-2">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: pago.color,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}
                  >
                    <i className={pago.icono}></i>
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: '#1E1F30', display: 'block' }}>
                      {pago.concepto}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#8E92A4' }}>
                      {pago.fechaVencimiento}
                    </span>
                  </div>
                </div>
                <strong style={{ fontSize: '0.9rem', color: '#1E1F30' }}>
                  Q {pago.monto.toFixed(2)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =============================================================== */}
      {/* 9. ÚLTIMOS MOVIMIENTOS (Vista previa compacta de 3-4 registros) */}
      {/* =============================================================== */}
      <div className="tarjeta-widget-home">
        <div className="widget-titulo-seccion">
          <span>
            <i className="fas fa-clock mr-2" style={{ color: '#4E44EB' }}></i>
            Últimos Movimientos
          </span>
          <button
            type="button"
            className="btn btn-sm btn-link p-0 font-weight-bold"
            style={{ fontSize: '0.78rem', color: '#4E44EB', textDecoration: 'none' }}
            onClick={() => historial.push('/movimientos')}
          >
            Ver todos ➔
          </button>
        </div>

        {ultimosMovimientos.length === 0 ? (
          <div className="text-center py-4 px-3 mb-2">
            <div style={{ fontSize: '2.2rem', marginBottom: '8px' }}>💳</div>
            <h6 style={{ fontWeight: 700, color: '#1E1F30', fontSize: '0.92rem', marginBottom: '4px' }}>
              Sin transacciones recientes
            </h6>
            <p className="text-muted mb-0" style={{ fontSize: '0.78rem' }}>
              Aún no has registrado movimientos. Toca en el botón central <strong>(+)</strong> para agregar tu primer ingreso o gasto.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2 mb-3">
            {ultimosMovimientos.map((item) => {
              const meta = getCategoryMeta(item.descripcion, item.tipo);
              const esIngreso = item.tipo === 2;
              const cantidadNum = parseFloat(item.cantidad) || 0;

              return (
                <div
                  key={item.id}
                  className="fila-transaccion-moderna"
                  onClick={() => {
                    setMovimientoSeleccionado(item);
                    setMostrarModalDetalle(true);
                  }}
                >
                  <div
                    className="squircle-icon-wrapper"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <i className={meta.icon}></i>
                  </div>

                  <div className="transaccion-info-col">
                    <span className="transaccion-titulo">
                      {item.descripcion || (esIngreso ? 'Ingreso' : 'Egreso')}
                    </span>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className="transaccion-fecha-texto">
                        {formatearFechaCorta(item.fecha)} &bull; {item.categoria || (esIngreso ? 'Ingreso' : 'Gasto')}
                      </span>
                      {(item.attachmentUrl || item.urlComprobante) && (
                        <div
                          className="d-flex align-items-center gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalImagenGrande(item.attachmentUrl || item.urlComprobante);
                          }}
                          title="Toca para ver comprobante en grande"
                        >
                          <img
                            src={item.attachmentUrl || item.urlComprobante}
                            alt="Ticket"
                            className="miniatura-fila-transaccion"
                          />
                          <span className="badge-ticket-adjunto">
                            <i className="fas fa-receipt"></i>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="transaccion-monto-col">
                    <span className={`transaccion-monto ${esIngreso ? 'ingreso' : 'gasto'}`}>
                      {esIngreso ? '+' : '-'} Q {cantidadNum.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botón destacado hacia la pantalla de Movimientos */}
        <button
          type="button"
          className="btn btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-2"
          style={{ borderRadius: '14px', fontWeight: 700, fontSize: '0.86rem' }}
          onClick={() => historial.push('/movimientos')}
        >
          <i className="fas fa-receipt mx-2"></i>
          Ver todos los movimientos
        </button>

        {/* Acceso directo a la nueva pantalla dedicada de Reportes */}
        <button
          type="button"
          className="btn btn-light w-100 py-2 d-flex align-items-center justify-content-center gap-2"
          style={{ borderRadius: '14px', fontWeight: 700, fontSize: '0.86rem', color: '#4E44EB', background: '#F5F4FE', border: '1px solid #E0DCFE' }}
          onClick={() => historial.push('/reportes')}
        >
          <i className="fas fa-chart-pie mx-2"></i>
          Ir Reportes y Estadísticas ➔
        </button>
      </div>

      {/* =============================================================== */}
      {/* MODAL DETALLE DE MOVIMIENTO                                     */}
      {/* =============================================================== */}
      <Modal
        show={mostrarModalDetalle}
        onHide={() => setMostrarModalDetalle(false)}
        centered
        dialogClassName="modal-bottom-sheet-dialog"
      >
        {movimientoSeleccionado && (() => {
          const meta = getCategoryMeta(movimientoSeleccionado.descripcion || movimientoSeleccionado.description, movimientoSeleccionado.tipo);
          const esIngreso = movimientoSeleccionado.tipo === 2;
          const cantidadNum = parseFloat(movimientoSeleccionado.cantidad || movimientoSeleccionado.amount) || 0;

          // Extracción inteligente de propiedades
          const cuentaTexto = movimientoSeleccionado.cuentaOrigen || movimientoSeleccionado.cuentaDestino || movimientoSeleccionado.account;
          const metodoPagoTexto = movimientoSeleccionado.metodoPago || movimientoSeleccionado.metodoIngreso || movimientoSeleccionado.paymentMethod;
          const subcategoriaTexto = movimientoSeleccionado.subcategoria || movimientoSeleccionado.subcategory;
          const comercioTexto = movimientoSeleccionado.comercio || movimientoSeleccionado.merchant;
          const fuenteTexto = movimientoSeleccionado.fuentePagador || movimientoSeleccionado.source;
          const proyectoTexto = movimientoSeleccionado.proyecto || movimientoSeleccionado.project;
          const estadoTexto = movimientoSeleccionado.estado || movimientoSeleccionado.status;
          const tieneCuotas = movimientoSeleccionado.cuotas && movimientoSeleccionado.cuotas > 1;
          const tarjetaTexto = movimientoSeleccionado.tarjetaNombre || movimientoSeleccionado.creditCardDetails?.cardName;
          const tieneRecurrencia = movimientoSeleccionado.esRecurrente || movimientoSeleccionado.isRecurring;
          const frecuenciaTexto = movimientoSeleccionado.frecuenciaRecurrencia || movimientoSeleccionado.frecuenciaGasto || movimientoSeleccionado.recurrenceFrequency;
          const tieneImpactoPatrimonial = movimientoSeleccionado.impactoPatrimonial !== undefined && movimientoSeleccionado.impactoPatrimonial !== null;
          const urlComprobante = movimientoSeleccionado.attachmentUrl || movimientoSeleccionado.urlComprobante || movimientoSeleccionado.comprobanteUrl || movimientoSeleccionado.ticketUrl || movimientoSeleccionado.fotoUrl || movimientoSeleccionado.imageUrl;
          const tieneComprobante = Boolean(urlComprobante);

          return (
            <div className="p-4 bg-white rounded-top-custom">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <div
                    className="squircle-icon-wrapper"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <i className={meta.icon}></i>
                  </div>
                  <div>
                    <h5 className="mb-0 font-weight-bold" style={{ fontSize: '1rem', color: '#1E1F30' }}>
                      {movimientoSeleccionado.descripcion || movimientoSeleccionado.description || (esIngreso ? 'Ingreso' : 'Egreso')}
                    </h5>
                    <span style={{ fontSize: '0.74rem', color: '#8E92A4' }}>
                      {movimientoSeleccionado.categoria || movimientoSeleccionado.category || (esIngreso ? 'Ingreso' : 'Gasto')}
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

              <div className="text-center py-2 bg-light rounded-lg mb-3">
                <div className="d-flex justify-content-center align-items-center gap-2 mb-1">
                  <span style={{ fontSize: '0.74rem', color: '#8E92A4', textTransform: 'uppercase', fontWeight: 700 }}>
                    Monto registrado
                  </span>
                  {estadoTexto && (
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: estadoTexto === 'Pagado' || estadoTexto === 'Confirmado' ? '#ECFDF5' : estadoTexto === 'Pendiente' ? '#FEF3C7' : '#FEE2E2',
                        color: estadoTexto === 'Pagado' || estadoTexto === 'Confirmado' ? '#10B981' : estadoTexto === 'Pendiente' ? '#D97706' : '#EF4444'
                      }}
                    >
                      {estadoTexto}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: esIngreso ? '#10B981' : '#F46F5F' }}>
                  {esIngreso ? '+' : '-'} Q {cantidadNum.toFixed(2)}
                </span>
              </div>

              {/* Lista Condicional de Atributos */}
              <div className="d-flex flex-column gap-2 mb-3" style={{ fontSize: '0.82rem' }}>
                <div className="d-flex justify-content-between border-bottom pb-1">
                  <span className="text-muted">Fecha y hora</span>
                  <span className="font-weight-bold">{movimientoSeleccionado.fecha} &bull; {movimientoSeleccionado.hora || 'No especificada'}</span>
                </div>

                {cuentaTexto && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Cuenta</span>
                    <span className="font-weight-bold">{cuentaTexto}</span>
                  </div>
                )}

                {metodoPagoTexto && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Método</span>
                    <span className="font-weight-bold">{metodoPagoTexto}</span>
                  </div>
                )}

                {subcategoriaTexto && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Subcategoría</span>
                    <span className="font-weight-bold">{subcategoriaTexto}</span>
                  </div>
                )}

                {comercioTexto && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Comercio</span>
                    <span className="font-weight-bold">{comercioTexto}</span>
                  </div>
                )}

                {fuenteTexto && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Fuente / Pagador</span>
                    <span className="font-weight-bold">{fuenteTexto}</span>
                  </div>
                )}

                {proyectoTexto && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Proyecto</span>
                    <span className="font-weight-bold">{proyectoTexto}</span>
                  </div>
                )}

                {tarjetaTexto && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Tarjeta</span>
                    <span className="font-weight-bold">{tarjetaTexto}</span>
                  </div>
                )}

                {tieneCuotas && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Financiamiento</span>
                    <span className="badge badge-primary">{movimientoSeleccionado.cuotas} cuotas</span>
                  </div>
                )}

                {tieneRecurrencia && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Recurrencia</span>
                    <span className="badge badge-info">{frecuenciaTexto || 'Frecuente'}</span>
                  </div>
                )}

                {tieneImpactoPatrimonial && (
                  <div className="d-flex justify-content-between border-bottom pb-1">
                    <span className="text-muted">Patrimonio real</span>
                    <span style={{ fontWeight: 700, color: movimientoSeleccionado.impactoPatrimonial ? '#10B981' : '#6B7280' }}>
                      {movimientoSeleccionado.impactoPatrimonial ? '✓ Suma a patrimonio' : '○ Neutro / Pasivo'}
                    </span>
                  </div>
                )}
              </div>

              {/* SECCIÓN DE COMPROBANTE CON FOTO O EMPTY STATE */}
              {tieneComprobante ? (
                <div className="mb-3 p-3 bg-light rounded-lg border text-center">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="font-weight-bold" style={{ fontSize: '0.8rem', color: '#1E1F30' }}>
                      <i className="fas fa-receipt mr-1" style={{ color: '#4E44EB' }}></i>
                      Comprobante / Ticket adjunto
                    </span>
                    <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                      <i className="fas fa-check-circle mr-1"></i>En Cloudinary
                    </span>
                  </div>

                  {/* Tarjeta de preview interactiva con miniatura */}
                  <div
                    className="tarjeta-preview-comprobante my-2"
                    onClick={() => setModalImagenGrande(urlComprobante)}
                    title="Toca para ver comprobante en grande"
                  >
                    <img
                      src={urlComprobante}
                      alt="Ticket"
                      className="img-preview-comprobante"
                      style={{ maxHeight: '160px' }}
                    />
                    <div className="overlay-preview-comprobante">
                      <i className="fas fa-search-plus"></i>
                      <span>Ver en grande</span>
                    </div>
                  </div>

                  <div className="d-flex gap-2 mt-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary flex-grow-1 py-2 font-weight-bold d-flex align-items-center justify-content-center gap-2"
                      style={{ borderRadius: '10px', fontSize: '0.82rem' }}
                      onClick={() => setModalImagenGrande(urlComprobante)}
                    >
                      <i className="fas fa-expand"></i> Ver en grande
                    </button>
                    <a
                      href={urlComprobante}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-secondary py-2 px-3 d-flex align-items-center justify-content-center"
                      style={{ borderRadius: '10px', fontSize: '0.82rem' }}
                      title="Abrir URL original"
                    >
                      <i className="fas fa-external-link-alt"></i>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="mb-3 py-3 px-2 bg-light rounded text-center border">
                  <div className="mb-1" style={{ opacity: 0.55 }}>
                    <i className="fas fa-receipt text-muted" style={{ fontSize: '1.4rem' }}></i>
                  </div>
                  <strong style={{ fontSize: '0.8rem', color: '#1E1F30', display: 'block' }}>
                    Sin comprobante adjunto
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: '#8E92A4', display: 'block' }}>
                    No se subió foto o ticket para este movimiento.
                  </span>
                </div>
              )}

              <button
                type="button"
                className="btn btn-outline-primary w-100 py-2 font-weight-bold"
                style={{ borderRadius: '12px' }}
                onClick={() => {
                  setMostrarModalDetalle(false);
                  historial.push('/movimientos');
                }}
              >
                Abrir en listado completo de Movimientos
              </button>
            </div>
          );
        })()}
      </Modal>

      {/* =============================================================== */}
      {/* MODAL PARA FILTRO PERSONALIZADO DE RANGO                        */}
      {/* =============================================================== */}
      <Modal
        show={mostrarModalRango}
        onHide={() => setMostrarModalRango(false)}
        centered
        dialogClassName="modal-bottom-sheet-dialog"
      >
        <div className="p-4 bg-white rounded-top-custom">
          <h5 className="font-weight-bold mb-3" style={{ fontSize: '1.05rem', color: '#1E1F30' }}>
            Rango de Fechas Personalizado
          </h5>
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="etiqueta-filtro-mini">Fecha inicio</label>
              <input
                type="date"
                className="campo-filtro-mini"
                value={fechaInicioPersonalizada}
                onChange={(e) => setFechaInicioPersonalizada(e.target.value)}
              />
            </div>
            <div className="col-6">
              <label className="etiqueta-filtro-mini">Fecha fin</label>
              <input
                type="date"
                className="campo-filtro-mini"
                value={fechaFinPersonalizada}
                onChange={(e) => setFechaFinPersonalizada(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary w-100 py-2 font-weight-bold"
            style={{ borderRadius: '12px' }}
            onClick={() => setMostrarModalRango(false)}
          >
            Aplicar Rango
          </button>
        </div>
      </Modal>

      {/* Modal Visor de Comprobante en Grande */}
      <VisorImagenModal
        urlImagen={modalImagenGrande}
        alCerrar={() => setModalImagenGrande(null)}
        titulo="Comprobante / Ticket de Transacción"
      />

    </div>
  );
}
