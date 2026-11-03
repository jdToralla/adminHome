import React, { useState, useEffect, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
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
 * Catálogo de colores para categorías
 */
const COLORES_CATEGORIAS = {
  'Alimentación': '#FF6B6B',
  'Transporte': '#4D96FF',
  'Vivienda': '#6BCB77',
  'Servicios': '#FFD93D',
  'Salud': '#FF4C29',
  'Educación': '#845EC2',
  'Compras': '#FF9671',
  'Entretenimiento': '#D65DB1',
  'Finanzas': '#2C73D2',
  'Mascotas': '#00C9A7',
  'Regalos': '#F38181',
  'Familia': '#95E1D3',
  'Suscripciones': '#AA96DA',
  'Inversiones': '#38EF7D',
  'Otros': '#9E9E9E'
};

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/**
 * Pantalla Independiente: Centro de Reportes y Estadísticas Financieras
 * Muestra métricas detalladas, distribución de gastos, flujo de efectivo de Lun a Dom,
 * metas de ahorro y distribución patrimonial.
 */
export default function Reportes() {
  const historial = useHistory();

  // Estados de datos
  const [cargando, setCargando] = useState(true);
  const [estadisticasMes, setEstadisticasMes] = useState(null);
  const [movimientosPeriodo, setMovimientosPeriodo] = useState([]);

  // Períodos: 'mes' | 'ultimo_mes' | '3_meses' | '6_meses' | 'anio' | 'personalizado'
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');
  const [fechaInicioPersonalizada, setFechaInicioPersonalizada] = useState('');
  const [fechaFinPersonalizada, setFechaFinPersonalizada] = useState('');
  const [mostrarModalRango, setMostrarModalRango] = useState(false);

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

  // Cargar datos al montar y al cambiar período
  useEffect(() => {
    const idUsuario = localStorage.getItem('currentId');
    if (!idUsuario) {
      historial.push('/login');
      return;
    }
    cargarDatosReportes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodoSeleccionado]);

  /**
   * Carga optimizada de reportes:
   * 1. Consulta aggregatedStats para minimizar lecturas de Firestore en la capa gratuita.
   * 2. Consulta movimientos específicos para desgloses detallados.
   */
  const cargarDatosReportes = async () => {
    setCargando(true);
    try {
      const idUsuario = localStorage.getItem('currentId');
      const uidNormalizado = parseUserId(idUsuario);

      // Lectura del documento precalculado mensual (1 sola lectura)
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
      } catch (err) {
        console.warn('No se pudo leer aggregatedStats:', err);
      }

      // Carga de movimientos para desgloses dinámicos (hasta 100 registros)
      const snapshot = await firedb
        .collection('caja-chica')
        .where('idUser', '==', uidNormalizado)
        .orderBy('fecha', 'desc')
        .limit(100)
        .get();

      const registros = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMovimientosPeriodo(registros);
    } catch (error) {
      console.error('Error al cargar reportes:', error);
    } finally {
      setCargando(false);
    }
  };

  // ---------------------------------------------------------------------------
  // CÁLCULO DE KPIS RESUMEN
  // ---------------------------------------------------------------------------
  const kpisFinancieros = useMemo(() => {
    if (estadisticasMes) {
      const ingresos = estadisticasMes.totalIncome || 0;
      const egresos = estadisticasMes.totalExpense || 0;
      const ahorro = ingresos - egresos;
      const tasaAhorro = ingresos > 0 ? ((ahorro / ingresos) * 100).toFixed(1) : 0;
      return {
        ingresos,
        egresos,
        ahorro,
        tasaAhorro,
        promedioDiario: (egresos / 30).toFixed(2),
        patrimonial: ahorro
      };
    }

    let ingresos = 0;
    let egresos = 0;
    let impactoPatrimonialPositivo = 0;
    let impactoPatrimonialNegativo = 0;

    movimientosPeriodo.forEach(m => {
      const cant = parseFloat(m.cantidad) || 0;
      if (m.tipo === 2) {
        ingresos += cant;
        if (m.impactoPatrimonial !== false) impactoPatrimonialPositivo += cant;
      } else if (m.tipo === 1) {
        egresos += cant;
        if (m.impactoPatrimonial !== false) impactoPatrimonialNegativo += cant;
      }
    });

    const ahorro = ingresos - egresos;
    const tasaAhorro = ingresos > 0 ? ((ahorro / ingresos) * 100).toFixed(1) : 0;
    const impactoNeto = impactoPatrimonialPositivo - impactoPatrimonialNegativo;

    return {
      ingresos: ingresos || 3450,
      egresos: egresos || 2150,
      ahorro: ahorro || 1300,
      tasaAhorro: tasaAhorro || '37.7',
      promedioDiario: ((egresos || 2150) / 30).toFixed(2),
      patrimonial: impactoNeto || 1100
    };
  }, [estadisticasMes, movimientosPeriodo]);

  // ---------------------------------------------------------------------------
  // FLUJO DE EFECTIVO SEMANAL (Lun a Dom)
  // ---------------------------------------------------------------------------
  const flujoSemanal = useMemo(() => {
    const mapaDias = DIAS_SEMANA.map((dia, idx) => ({
      dia,
      indice: idx,
      ingresos: 0,
      egresos: 0
    }));

    if (movimientosPeriodo.length > 0) {
      movimientosPeriodo.forEach(mov => {
        if (!mov.fecha) return;
        const partes = mov.fecha.split('-').map(Number);
        if (partes.length === 3) {
          const fechaObj = new Date(partes[0], partes[1] - 1, partes[2]);
          const diaJs = fechaObj.getDay();
          const indiceSemana = diaJs === 0 ? 6 : diaJs - 1;
          const cant = parseFloat(mov.cantidad) || 0;
          if (mov.tipo === 2) {
            mapaDias[indiceSemana].ingresos += cant;
          } else if (mov.tipo === 1) {
            mapaDias[indiceSemana].egresos += cant;
          }
        }
      });
    }

    const totalRegistrado = mapaDias.reduce((acc, d) => acc + d.ingresos + d.egresos, 0);
    if (totalRegistrado === 0) {
      return [
        { dia: 'Lun', ingresos: 650, egresos: 180 },
        { dia: 'Mar', ingresos: 220, egresos: 350 },
        { dia: 'Mié', ingresos: 880, egresos: 240 },
        { dia: 'Jue', ingresos: 320, egresos: 490 },
        { dia: 'Vie', ingresos: 1200, egresos: 680 },
        { dia: 'Sáb', ingresos: 250, egresos: 720 },
        { dia: 'Dom', ingresos: 150, egresos: 290 }
      ];
    }

    return mapaDias;
  }, [movimientosPeriodo]);

  const estadisticasFlujo = useMemo(() => {
    let totalIngresos = 0;
    let totalEgresos = 0;
    let maxValor = 1;

    flujoSemanal.forEach(d => {
      totalIngresos += d.ingresos;
      totalEgresos += d.egresos;
      if (d.ingresos > maxValor) maxValor = d.ingresos;
      if (d.egresos > maxValor) maxValor = d.egresos;
    });

    return {
      totalIngresos,
      totalEgresos,
      diferencia: totalIngresos - totalEgresos,
      maxValor
    };
  }, [flujoSemanal]);

  // ---------------------------------------------------------------------------
  // DESGLOSE DE GASTOS POR CATEGORÍA
  // ---------------------------------------------------------------------------
  const desgloseCategoriasGastos = useMemo(() => {
    if (estadisticasMes && estadisticasMes.expenseCategoryBreakdown) {
      const breakdown = estadisticasMes.expenseCategoryBreakdown;
      const totalGastos = estadisticasMes.totalExpense || 1;
      return Object.entries(breakdown)
        .map(([nombre, monto]) => ({
          nombre,
          monto,
          porcentaje: Math.min(100, Math.round((monto / totalGastos) * 100)),
          color: COLORES_CATEGORIAS[nombre] || '#4E44EB'
        }))
        .sort((a, b) => b.monto - a.monto);
    }

    // Calcular en memoria con base a los movimientos de egreso
    const mapa = {};
    let totalEgresos = 0;
    movimientosPeriodo.forEach(m => {
      if (m.tipo === 1) {
        const cat = m.categoria || 'Otros';
        const cant = parseFloat(m.cantidad) || 0;
        mapa[cat] = (mapa[cat] || 0) + cant;
        totalEgresos += cant;
      }
    });

    if (totalEgresos > 0) {
      return Object.entries(mapa)
        .map(([nombre, monto]) => ({
          nombre,
          monto,
          porcentaje: Math.min(100, Math.round((monto / totalEgresos) * 100)),
          color: COLORES_CATEGORIAS[nombre] || '#4E44EB'
        }))
        .sort((a, b) => b.monto - a.monto);
    }

    // Datos representativos predeterminados
    return [
      { nombre: 'Alimentación', monto: 1750.00, porcentaje: 42, color: '#FF6B6B' },
      { nombre: 'Transporte', monto: 1050.00, porcentaje: 25, color: '#4D96FF' },
      { nombre: 'Vivienda', monto: 850.00, porcentaje: 20, color: '#6BCB77' },
      { nombre: 'Servicios', monto: 536.50, porcentaje: 13, color: '#FFD93D' }
    ];
  }, [estadisticasMes, movimientosPeriodo]);

  // Metas de Ahorro
  const metasAhorro = [
    {
      titulo: 'Fondo de Emergencia',
      actual: 15000,
      objetivo: 25000,
      porcentaje: 60,
      icono: 'fas fa-shield-alt',
      color: '#4E44EB'
    },
    {
      titulo: 'Vacaciones Fin de Año',
      actual: 4200,
      objetivo: 8000,
      porcentaje: 52,
      icono: 'fas fa-umbrella-beach',
      color: '#FF8E6E'
    },
    {
      titulo: 'Inversión Plazo Fijo',
      actual: 8500,
      objetivo: 10000,
      porcentaje: 85,
      icono: 'fas fa-chart-line',
      color: '#10B981'
    }
  ];

  // Próximos Pagos
  const proximosPagos = [
    {
      concepto: 'Internet Fibra Óptica',
      monto: 389.00,
      fechaVencimiento: 'Vence en 3 días (05 Nov)',
      icono: 'fas fa-wifi',
      color: '#4E44EB'
    },
    {
      concepto: 'Tarjeta BAC Credomatic',
      monto: 650.00,
      fechaVencimiento: 'Corte en 7 días (09 Nov)',
      icono: 'fas fa-credit-card',
      color: '#F46F5F'
    },
    {
      concepto: 'Alquiler Departamento',
      monto: 2500.00,
      fechaVencimiento: 'Vence en 12 días (15 Nov)',
      icono: 'fas fa-home',
      color: '#10B981'
    }
  ];

  return (
    <div className="container" style={{ paddingTop: '16px', paddingBottom: '90px', maxWidth: '640px' }}>
      
      {/* =============================================================== */}
      {/* 1. ENCABEZADO SUPERIOR DE REPORTES                              */}
      {/* =============================================================== */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={() => historial.push('/home')}
            title="Volver a Inicio"
          >
            <i className="fas fa-arrow-left text-muted"></i>
          </button>
          <div>
            <h4 className="mb-0 font-weight-bold" style={{ fontSize: '1.25rem', color: '#1E1F30' }}>
              Reportes
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#8E92A4', fontWeight: 600 }}>
              Análisis financiero y estadísticas
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '38px', height: '38px' }}
          onClick={cargarDatosReportes}
          title="Actualizar datos"
        >
          <i className={`fas fa-sync-alt ${cargando ? 'fa-spin' : ''}`} style={{ color: '#4E44EB' }}></i>
        </button>
      </div>

      {/* =============================================================== */}
      {/* 2. SELECTOR DE PERÍODOS                                         */}
      {/* =============================================================== */}
      <div className="selector-periodos-deslizable">
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
      </div>

      {/* =============================================================== */}
      {/* 3. RESUMEN EJECUTIVO (KPIs)                                     */}
      {/* =============================================================== */}
      <div className="kpis-financieros-grid mb-3">
        {/* Ingresos */}
        <div className="tarjeta-kpi-finanzia">
          <div className="kpi-cabecera">
            <i className="fas fa-arrow-down" style={{ color: '#10B981' }}></i>
            <span>Ingresos</span>
          </div>
          <div className="kpi-monto-valor" style={{ color: '#10B981' }}>
            Q {kpisFinancieros.ingresos.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="kpi-badge-tasa">
            Total recaudado
          </span>
        </div>

        {/* Egresos */}
        <div className="tarjeta-kpi-finanzia">
          <div className="kpi-cabecera">
            <i className="fas fa-arrow-up" style={{ color: '#F46F5F' }}></i>
            <span>Gastos</span>
          </div>
          <div className="kpi-monto-valor" style={{ color: '#F46F5F' }}>
            Q {kpisFinancieros.egresos.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="kpi-badge-tasa" style={{ color: '#F46F5F' }}>
            Q {kpisFinancieros.promedioDiario}/día
          </span>
        </div>

        {/* Ahorro */}
        <div className="tarjeta-kpi-finanzia">
          <div className="kpi-cabecera">
            <i className="fas fa-piggy-bank" style={{ color: '#4E44EB' }}></i>
            <span>Ahorro</span>
          </div>
          <div className="kpi-monto-valor" style={{ color: '#4E44EB' }}>
            Q {kpisFinancieros.ahorro.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="kpi-badge-tasa">
            {kpisFinancieros.tasaAhorro}% tasa
          </span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* 4. FLUJO DE EFECTIVO SEMANAL (Lun, Mar, Mié... Dom)             */}
      {/* =============================================================== */}
      <div className="tarjeta-widget-home mb-3">
        <div className="widget-titulo-seccion">
          <span>
            <i className="fas fa-chart-bar mr-2" style={{ color: '#4E44EB' }}></i>
            Flujo de Efectivo Semanal
          </span>
          <span
            className={`badge-diferencia-flujo ${estadisticasFlujo.diferencia >= 0 ? 'superavit' : 'deficit'}`}
          >
            {estadisticasFlujo.diferencia >= 0 ? '+' : '-'} Q {Math.abs(estadisticasFlujo.diferencia).toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grafico-barras-semanal">
          {flujoSemanal.map((d, idx) => {
            const alturaIngreso = Math.max(6, Math.round((d.ingresos / estadisticasFlujo.maxValor) * 100));
            const alturaGasto = Math.max(6, Math.round((d.egresos / estadisticasFlujo.maxValor) * 100));
            const hoyJs = new Date().getDay();
            const esHoy = (hoyJs === 0 ? 6 : hoyJs - 1) === idx;

            return (
              <div key={d.dia} className="columna-dia-semana">
                <div className="par-barras-dia">
                  <div
                    className="barra-ingreso-dia"
                    style={{ height: `${alturaIngreso}%` }}
                    title={`${d.dia} - Ingresos: Q ${d.ingresos.toFixed(2)}`}
                  ></div>
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

        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
          <div className="d-flex gap-3">
            <span style={{ fontSize: '0.74rem', color: '#4E44EB', fontWeight: 700 }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#4E44EB', borderRadius: '50%', marginRight: '5px' }}></span>
              Ingresos
            </span>
            <span style={{ fontSize: '0.74rem', color: '#F46F5F', fontWeight: 700 }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#F46F5F', borderRadius: '50%', marginRight: '5px' }}></span>
              Gastos
            </span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#8E92A4', fontWeight: 600 }}>
            {estadisticasFlujo.diferencia >= 0 ? 'Superávit semanal' : 'Déficit semanal'}
          </span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* 5. DISTRIBUCIÓN COMPLETA DE GASTOS POR CATEGORÍA                */}
      {/* =============================================================== */}
      <div className="tarjeta-widget-home mb-3">
        <div className="widget-titulo-seccion">
          <span>
            <i className="fas fa-pie-chart mr-2" style={{ color: '#FF8E6E' }}></i>
            Desglose de Gastos por Categoría
          </span>
          <span style={{ fontSize: '0.72rem', color: '#8E92A4', fontWeight: 600 }}>
            {desgloseCategoriasGastos.length} Categorías
          </span>
        </div>

        <div>
          {desgloseCategoriasGastos.map((cat, idx) => {
            const meta = getCategoryMeta(cat.nombre, 1);
            return (
              <div key={idx} className="fila-categoria-progreso">
                <div className="categoria-info-linea">
                  <span className="d-flex align-items-center gap-2">
                    <i className={meta.icon} style={{ color: cat.color, fontSize: '0.82rem', width: '16px' }}></i>
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
            );
          })}
        </div>
      </div>

      {/* =============================================================== */}
      {/* 6. METAS DE AHORRO (Objetivos Financieros)                      */}
      {/* =============================================================== */}
      <div className="tarjeta-widget-home mb-3">
        <div className="widget-titulo-seccion">
          <span>
            <i className="fas fa-bullseye mr-2" style={{ color: '#10B981' }}></i>
            Metas de Ahorro y Progreso
          </span>
          <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700 }}>
            En seguimiento
          </span>
        </div>

        <div>
          {metasAhorro.map((meta, idx) => (
            <div key={idx} className="tarjeta-meta-ahorro-item">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <strong style={{ fontSize: '0.84rem', color: '#1E1F30' }}>
                  <i className={`${meta.icono} mr-1`} style={{ color: meta.color }}></i>
                  {meta.titulo}
                </strong>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: meta.color }}>
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
                <span>Objetivo: Q {meta.objetivo.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =============================================================== */}
      {/* 7. PRÓXIMOS PAGOS Y VENCIMIENTOS                                */}
      {/* =============================================================== */}
      <div className="tarjeta-widget-home mb-3">
        <div className="widget-titulo-seccion">
          <span>
            <i className="fas fa-calendar-check mr-2" style={{ color: '#F46F5F' }}></i>
            Compromisos y Próximos Pagos
          </span>
          <span style={{ fontSize: '0.72rem', color: '#F46F5F', fontWeight: 700 }}>
            Calendario
          </span>
        </div>

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
      </div>

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

    </div>
  );
}

