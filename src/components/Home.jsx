import React, { useEffect, useState } from "react";
import { Modal } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import _swal from 'sweetalert';
import { firedb } from "../firebaseConfig";
import PiggyBankSvg from './PiggyBankSvg';
import { getCategoryMeta } from './categoryIcons';
import './styles.css';

const calculoTotal = {
  egresosTotal: 0,
  ingresosTotal: 0,
  saldoTotal: 0
};

const dataE = {
  id: '',
  cantidad: '',
  descripcion: '',
  newDescripcion: '',
  tipo: '',
  fecha: '',
  hora: ''
};

const parseUserId = (id) => {
  if (id === null || id === undefined) return '';
  const str = id.toString().trim();
  const num = parseInt(str, 10);
  return !isNaN(num) && num.toString() === str ? num : str;
};

export default function Home() {
  const historial = useHistory();
  const [flag, setFlag] = useState(false);
  const [listData, setListData] = useState([]);
  const [sumaTotal, setSumaTotal] = useState(calculoTotal);
  const [showEdit, setShowEdit] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [filterType, setFilterType] = useState('Todos');
  const [selectedDate, setSelectedDate] = useState('');
  const [dataEdit, setDataEdit] = useState(dataE);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mobileTab, setMobileTab] = useState('dashboard'); // 'dashboard' or 'analytics'
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  useEffect(() => {
    const current = localStorage.getItem('currentId');
    if (!current) {
      historial.push('/login');
      return;
    }
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dataFormate = (date) => {
    if (!date) return '';
    const d = date.split('-');
    if (d.length === 3) {
      return `${d[2]}/${d[1]}/${d[0]}`;
    }
    return date;
  };

  const getData = async () => {
    setFlag(true);
    try {
      const idUser = localStorage.getItem('currentId');
      const { docs } = await firedb
        .collection('caja-chica')
        .where("idUser", "==", parseUserId(idUser))
        .orderBy("fecha", "desc")
        .get();

      const newArray = docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

      newArray.forEach(v => {
        v.fechaOriginal = v.fecha;
        v.fecha = dataFormate(v.fecha);
      });

      setListData(newArray);
      calculate(newArray);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setFlag(false);
    }
  };

  const handleFilterSelection = async (type) => {
    setFilterType(type);
    setListData([]);
    setFlag(true);
    try {
      const idUser = localStorage.getItem('currentId');
      if (type === 'Egreso') {
        const { docs } = await firedb
          .collection('caja-chica')
          .where("idUser", "==", parseUserId(idUser))
          .where("tipo", "==", 1)
          .get();
        const newArray = docs.map(item => ({ id: item.id, ...item.data() }));
        newArray.forEach(v => { v.fecha = dataFormate(v.fecha); });
        setListData(newArray);
      } else if (type === 'Ingreso') {
        const { docs } = await firedb
          .collection('caja-chica')
          .where("idUser", "==", parseUserId(idUser))
          .where("tipo", "==", 2)
          .get();
        const newArray = docs.map(item => ({ id: item.id, ...item.data() }));
        newArray.forEach(v => { v.fecha = dataFormate(v.fecha); });
        setListData(newArray);
      } else {
        getData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFlag(false);
    }
  };

  const searchByDate = async (date) => {
    setSelectedDate(date);
    if (!date) {
      getData();
      return;
    }
    setFlag(true);
    setListData([]);
    try {
      const idUser = localStorage.getItem('currentId');
      const { docs } = await firedb
        .collection('caja-chica')
        .where("idUser", "==", parseUserId(idUser))
        .where("fecha", "==", `${date}`)
        .get();

      const newArray = docs.map(item => ({ id: item.id, ...item.data() }));
      newArray.forEach(v => { v.fecha = dataFormate(v.fecha); });
      setListData(newArray);
    } catch (err) {
      console.error(err);
    } finally {
      setFlag(false);
    }
  };

  const addNewExpenseOrIncome = (type) => {
    historial.push(`/add-data/${type}`);
  };

  const eliminarEgreso = (id, description) => {
    setShowDetail(false);
    _swal({
      title: '¿Deseas eliminar este registro?',
      text: `"${description || 'Sin descripción'}"`,
      icon: 'warning',
      buttons: ["Cancelar", "Sí, eliminar"],
      dangerMode: true,
    }).then(async (result) => {
      if (result) {
        try {
          await firedb.collection('caja-chica').doc(id).delete();
          getData();
          _swal({
            title: 'Eliminado correctamente',
            icon: 'success',
            timer: 1200,
            buttons: false
          });
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  const calculate = (arrayData) => {
    let sumEgresos = 0;
    let sumIngresos = 0;

    arrayData.forEach(val => {
      const cant = typeof val.cantidad === 'number' ? val.cantidad : parseFloat(val.cantidad) || 0;
      if (val.tipo === 1) {
        sumEgresos += cant;
      }
      if (val.tipo === 2) {
        sumIngresos += cant;
      }
    });

    setSumaTotal({
      egresosTotal: sumEgresos,
      ingresosTotal: sumIngresos,
      saldoTotal: sumIngresos - sumEgresos
    });
  };

  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleOpenEdit = (item) => {
    setShowDetail(false);
    setDataEdit({ ...item, newDescripcion: item.descripcion });
    setShowEdit(true);
  };

  const saveEditRecord = () => {
    _swal({
      title: '¿Guardar cambios?',
      text: `Se actualizará la descripción a: "${dataEdit.newDescripcion}"`,
      icon: 'info',
      buttons: ["Cancelar", "Sí, guardar"]
    }).then(async (result) => {
      if (result) {
        setShowEdit(false);
        try {
          await firedb.collection('caja-chica').doc(dataEdit.id).update({
            descripcion: dataEdit.newDescripcion
          });
          getData();
          _swal({
            title: 'Actualizado con éxito',
            icon: 'success',
            timer: 1100,
            buttons: false
          });
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  // Mock weekly data matching visual mockup
  const weeklyData = [
    { day: 'Lun', earnedHeight: 40, spentHeight: 28 },
    { day: 'Mar', earnedHeight: 55, spentHeight: 22 },
    { day: 'Mié', earnedHeight: 75, spentHeight: 46 },
    { day: 'Jue', earnedHeight: 50, spentHeight: 38 },
    { day: 'Vie', earnedHeight: 32, spentHeight: 18 },
    { day: 'Sáb', earnedHeight: 65, spentHeight: 60 },
    { day: 'Dom', earnedHeight: 82, spentHeight: 40 },
  ];

  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '70px' }}>
      
      {/* Greeting Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-2 mb-md-4">
        <div>
          <div className="dashboard-greeting-subtitle">Hola {localStorage.getItem('currentUserName') ? localStorage.getItem('currentUserName').split(' ')[0] : ''}, es tu resumen</div>
          <h2 className="dashboard-greeting-title">Dashboard</h2>
        </div>

        {/* Action Buttons for Desktop */}
        <div className="d-none d-md-flex gap-2">
          <button
            className="btn-gradient-primary"
            onClick={() => addNewExpenseOrIncome(2)}
          >
            <i className="fas fa-plus"></i>
            <span>Nuevo Ingreso</span>
          </button>
          <button
            className="btn-gradient-secondary"
            onClick={() => addNewExpenseOrIncome(1)}
          >
            <i className="fas fa-minus"></i>
            <span>Nuevo Egreso</span>
          </button>
        </div>
      </div>

      {/* Action Buttons for Mobile (Responsive 2-column grid row) */}
      <div className="d-flex d-md-none mobile-action-buttons-row">
        <button
          className="btn-gradient-primary flex-fill"
          onClick={() => addNewExpenseOrIncome(2)}
        >
          <i className="fas fa-plus mr-1"></i>
          <span>Nuevo Ingreso</span>
        </button>
        <button
          className="btn-gradient-secondary flex-fill"
          onClick={() => addNewExpenseOrIncome(1)}
        >
          <i className="fas fa-minus mr-1"></i>
          <span>Nuevo Egreso</span>
        </button>
      </div>

      {/* Mobile Tab Switcher (Matches the 2 screens in reference image) */}
      <div className="d-flex d-lg-none mobile-view-switcher">
        <button
          className={`mobile-view-btn ${mobileTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setMobileTab('dashboard')}
        >
          <i className="fas fa-wallet"></i>
          <span>Dashboard</span>
        </button>
        <button
          className={`mobile-view-btn ${mobileTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setMobileTab('analytics')}
        >
          <i className="fas fa-credit-card"></i>
          <span>Tarjeta & Gráficas</span>
        </button>
      </div>

      <div className="row">
        
        {/* ================= Left Column: Main Dashboard ================= */}
        <div className={`col-12 col-lg-7 mb-4 ${mobileTab === 'analytics' ? 'd-none d-lg-block' : ''}`}>

          {/* Hero Total Balance Purple Card (Side-by-side flexbox, no overlap) */}
          <div className="hero-total-card">
            <div className="hero-total-left">
              <div className="hero-total-label">Saldo Disponible Total</div>
              <div className="hero-total-amount">
                Q {sumaTotal.saldoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              {/* Carousel Pagination Dots */}
              <div className="carousel-dots">
                <span className="carousel-dot active"></span>
                <span className="carousel-dot"></span>
                <span className="carousel-dot"></span>
              </div>
            </div>

            {/* Piggy Bank SVG (Right side, scalable, no text collision) */}
            <div className="hero-piggy-container">
              <PiggyBankSvg width={96} height={80} />
            </div>
          </div>

          {/* Split Stat Card: Earned vs Spent */}
          <div className="split-stat-card">
            
            {/* Earned (Ingresos) */}
            <div className="split-stat-item">
              <div className="split-stat-header">
                <span className="stat-indicator-dot dot-earned"></span>
                <span className="split-stat-label">Ingresos</span>
              </div>
              <div className="split-stat-value" title={`Q ${sumaTotal.ingresosTotal.toFixed(2)}`}>
                Q {sumaTotal.ingresosTotal.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Divider */}
            <div className="split-stat-divider"></div>

            {/* Spent (Egresos) */}
            <div className="split-stat-item">
              <div className="split-stat-header">
                <span className="stat-indicator-dot dot-spent"></span>
                <span className="split-stat-label">Egresos</span>
              </div>
              <div className="split-stat-value" title={`Q ${sumaTotal.egresosTotal.toFixed(2)}`}>
                Q {sumaTotal.egresosTotal.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

          </div>

          {/* Filter Bar (Date & Type Segmented Control) */}
          <div className="filter-bar-card">
            <div className="row align-items-center">
              
              {/* Date Input */}
              <div className="col-12 col-md-6 mb-2 mb-md-0">
                <div className="modern-input-group">
                  <i className="fas fa-calendar-alt modern-input-icon"></i>
                  <input
                    type="date"
                    className="modern-form-control"
                    value={selectedDate}
                    onChange={(e) => searchByDate(e.target.value)}
                    placeholder="Filtrar por fecha"
                  />
                  {selectedDate && (
                    <button
                      className="btn btn-sm btn-link text-muted"
                      onClick={() => searchByDate('')}
                      style={{ position: 'absolute', right: '8px', textDecoration: 'none' }}
                      title="Limpiar fecha"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>

              {/* Segmented Type Pills */}
              <div className="col-12 col-md-6">
                <div className="segmented-pills">
                  <button
                    className={`segmented-pill-btn ${filterType === 'Todos' ? 'active' : ''}`}
                    onClick={() => handleFilterSelection('Todos')}
                  >
                    Todos
                  </button>
                  <button
                    className={`segmented-pill-btn ${filterType === 'Ingreso' ? 'active' : ''}`}
                    onClick={() => handleFilterSelection('Ingreso')}
                  >
                    Ingresos
                  </button>
                  <button
                    className={`segmented-pill-btn ${filterType === 'Egreso' ? 'active' : ''}`}
                    onClick={() => handleFilterSelection('Egreso')}
                  >
                    Egresos
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Transactions List Card */}
          <div className="transactions-card">
            <div className="transactions-header">
              <h3 className="transactions-title">Últimas transacciones</h3>
              <span className="transactions-count-badge">
                {listData.length} registros
              </span>
            </div>

            {/* Loading Indicator */}
            {flag && (
              <div className="empty-state-box py-4">
                <i className="fas fa-spinner fa-spin empty-state-icon" style={{ color: '#4E44EB', fontSize: '1.8rem' }}></i>
                <div style={{ fontSize: '0.85rem' }}>Cargando transacciones...</div>
              </div>
            )}

            {/* Empty State */}
            {!flag && listData.length === 0 && (
              <div className="empty-state-box">
                <i className="fas fa-receipt empty-state-icon"></i>
                <h5 style={{ fontWeight: 700, color: '#1E1F30', fontSize: '0.98rem' }}>No hay transacciones</h5>
                <p style={{ fontSize: '0.82rem', color: '#8E92A4' }}>
                  Comienza agregando un nuevo movimiento con los botones superiores.
                </p>
              </div>
            )}

            {/* Clean Mobile List Items (Zero Collisions / Zero Bad Wrapping) */}
            {!flag && listData.length > 0 && (
              <div style={{ maxHeight: '440px', overflowY: 'auto', paddingRight: '2px' }}>
                {listData.map((item) => {
                  const categoryMeta = getCategoryMeta(item.descripcion, item.tipo);
                  const isIngreso = item.tipo === 2;

                  return (
                    <div
                      className="transaction-item"
                      key={item.id}
                      onClick={() => handleOpenDetail(item)}
                      title="Toca para ver opciones"
                    >
                      {/* Left: Category Icon */}
                      <div className="transaction-left">
                        <div className="category-squircle">
                          {categoryMeta.icon}
                        </div>
                        {/* Middle Details (Truncates cleanly with ellipsis) */}
                        <div className="transaction-details">
                          <span className="transaction-name">
                            {item.descripcion || 'Sin descripción'}
                          </span>
                          <span className="transaction-date">
                            <i className="far fa-clock mr-1"></i>
                            {item.fecha} {item.hora ? `• ${item.hora}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right: Amount, Colored Dot & Options Trigger */}
                      <div className="transaction-right">
                        <span
                          className="transaction-amount"
                          style={{ color: isIngreso ? '#4E44EB' : '#1E1F30' }}
                        >
                          {isIngreso ? '+' : '-'} Q {parseFloat(item.cantidad || 0).toFixed(2)}
                        </span>
                        <span
                          className={`transaction-type-dot ${isIngreso ? 'dot-ingreso' : 'dot-egreso'}`}
                        ></span>
                        <button
                          className="btn-item-options"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item);
                          }}
                          title="Opciones"
                        >
                          <i className="fas fa-ellipsis-v"></i>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* ================= Right Column: Cards & Analytics ================= */}
        <div className={`col-12 col-lg-5 ${mobileTab === 'dashboard' ? 'd-none d-lg-block' : ''}`}>

          {/* Virtual Credit Card Widget */}
          <div className="virtual-credit-card mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="card-chip"></div>
              {/* Mastercard circles */}
              <div className="mc-logo">
                <div className="mc-circle-left"></div>
                <div className="mc-circle-right"></div>
              </div>
            </div>

            <div>
              <div className="card-number-masked">•••• •••• •••• 3728</div>
            </div>

            <div className="card-footer-info">
              <div>
                <div className="card-info-label">Titular</div>
                <div className="card-info-val">{localStorage.getItem('currentUserName') || 'Usuario AdminHome'}</div>
              </div>
              <div className="text-right">
                <div className="card-info-label">Vence</div>
                <div className="card-info-val">08/29</div>
              </div>
            </div>
          </div>

          {/* Weekly Activity Chart */}
          <div className="weekly-chart-card mb-3">
            <div className="chart-header">
              <h4 className="chart-header-title">Actividad semanal</h4>
              <div className="d-flex align-items-center" style={{ gap: '6px' }}>
                <button
                  className="chart-nav-btn"
                  onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                  title="Semana anterior"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#8E92A4', padding: '0 2px' }}>
                  {currentWeekOffset === 0 ? 'Esta semana' : `Semana ${currentWeekOffset}`}
                </span>
                <button
                  className="chart-nav-btn"
                  onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                  title="Semana siguiente"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>

            {/* Split Bar Chart */}
            <div className="chart-bars-wrapper">
              {weeklyData.map((d, idx) => (
                <div className="chart-day-col" key={idx}>
                  <div className="chart-bar-guide">
                    <div className="chart-split-bar">
                      <div
                        className="bar-segment-top"
                        style={{ height: `${d.earnedHeight}px` }}
                        title={`${d.day}: Ingreso`}
                      ></div>
                      <div
                        className="bar-segment-bottom"
                        style={{ height: `${d.spentHeight}px` }}
                        title={`${d.day}: Gasto`}
                      ></div>
                    </div>
                  </div>
                  <span className="chart-day-name">{d.day}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="d-flex justify-content-center mt-3 pt-2" style={{ gap: '16px', borderTop: '1px solid #F0ECE8' }}>
              <div className="d-flex align-items-center" style={{ gap: '6px', fontSize: '0.76rem', color: '#8E92A4', fontWeight: 600 }}>
                <span className="stat-indicator-dot dot-earned"></span>
                <span>Ingresos</span>
              </div>
              <div className="d-flex align-items-center" style={{ gap: '6px', fontSize: '0.76rem', color: '#8E92A4', fontWeight: 600 }}>
                <span className="stat-indicator-dot dot-spent"></span>
                <span>Egresos</span>
              </div>
            </div>

          </div>

          {/* Quick Tip Card */}
          <div className="transactions-card" style={{ background: '#FFF9F6', borderColor: '#FFE8DF' }}>
            <div className="d-flex align-items-center gap-2 mb-2">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '9px',
                  background: 'var(--secondary-subtle)',
                  color: 'var(--secondary-hover)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem'
                }}
              >
                <i className="fas fa-lightbulb"></i>
              </div>
              <h5 style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#1E1F30' }}>
                Tip de Ahorro
              </h5>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#8E92A4', margin: 0 }}>
              Mantener tus egresos por debajo del 70% de tus ingresos te permitirá construir tu fondo de emergencia con mayor rapidez.
            </p>
          </div>

        </div>

      </div>

      {/* Transaction Detail & Actions Modal (Solves mobile horizontal cramping!) */}
      {selectedItem && (
        <Modal
          show={showDetail}
          onHide={() => setShowDetail(false)}
          centered
          contentClassName="modern-modal"
        >
          <Modal.Header closeButton className="modern-modal-header">
            <Modal.Title className="modern-modal-title">
              Detalle del Movimiento
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="modern-modal-body">
            <div className="text-center py-2 mb-3">
              <div
                className="category-squircle mx-auto mb-2"
                style={{ width: '56px', height: '56px', fontSize: '1.4rem' }}
              >
                {getCategoryMeta(selectedItem.descripcion, selectedItem.tipo).icon}
              </div>
              <div
                style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  color: selectedItem.tipo === 2 ? '#4E44EB' : '#1E1F30'
                }}
              >
                {selectedItem.tipo === 2 ? '+' : '-'} Q {parseFloat(selectedItem.cantidad || 0).toFixed(2)}
              </div>
              <span
                className={`form-header-badge ${selectedItem.tipo === 2 ? 'badge-income-type' : 'badge-expense-type'} mt-1`}
              >
                {selectedItem.tipo === 2 ? 'Ingreso' : 'Egreso'}
              </span>
            </div>

            <div style={{ background: '#FAF9F7', borderRadius: '14px', padding: '14px 16px' }}>
              <div className="mb-2">
                <span style={{ fontSize: '0.72rem', color: '#8E92A4', fontWeight: 700, textTransform: 'uppercase' }}>
                  Descripción
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E1F30', wordBreak: 'break-word' }}>
                  {selectedItem.descripcion || 'Sin descripción'}
                </div>
              </div>
              <div className="d-flex justify-content-between pt-2" style={{ borderTop: '1px solid #EFECE9' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: '#8E92A4', fontWeight: 700, textTransform: 'uppercase' }}>
                    Fecha
                  </span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E1F30' }}>
                    {selectedItem.fecha}
                  </div>
                </div>
                {selectedItem.hora && (
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#8E92A4', fontWeight: 700, textTransform: 'uppercase' }}>
                      Hora
                    </span>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E1F30' }}>
                      {selectedItem.hora}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="modern-modal-footer d-flex justify-content-between">
            <button
              className="btn btn-sm btn-outline-danger"
              style={{ borderRadius: '12px', padding: '8px 14px', fontWeight: 600 }}
              onClick={() => eliminarEgreso(selectedItem.id, selectedItem.descripcion)}
            >
              <i className="fas fa-trash-alt mr-1"></i> Eliminar
            </button>
            <button
              className="btn-gradient-primary py-2 px-3"
              style={{ fontSize: '0.86rem' }}
              onClick={() => handleOpenEdit(selectedItem)}
            >
              <i className="fas fa-pen mr-1"></i> Editar Descripción
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Edit Description Modal */}
      <Modal
        show={showEdit}
        onHide={() => setShowEdit(false)}
        centered
        contentClassName="modern-modal"
      >
        <Modal.Header closeButton className="modern-modal-header">
          <Modal.Title className="modern-modal-title">
            <i className="fas fa-edit mr-2" style={{ color: '#4E44EB' }}></i>
            Editar Movimiento
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modern-modal-body">
          <div className="mb-3">
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#8E92A4', textTransform: 'uppercase' }}>
              Descripción
            </label>
            <input
              type="text"
              className="modern-form-control"
              value={dataEdit.newDescripcion || ''}
              onChange={(e) => setDataEdit({ ...dataEdit, newDescripcion: e.target.value })}
              placeholder="Nueva descripción..."
              autoFocus
            />
          </div>
          <div className="d-flex align-items-center justify-content-between p-3" style={{ background: '#FAF8F6', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: '#8E92A4', fontWeight: 600 }}>Monto asignado:</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E1F30' }}>
              Q {parseFloat(dataEdit.cantidad || 0).toFixed(2)}
            </span>
          </div>
        </Modal.Body>
        <Modal.Footer className="modern-modal-footer">
          <button
            className="segmented-pill-btn px-3 py-2 mr-2"
            onClick={() => setShowEdit(false)}
          >
            Cancelar
          </button>
          <button
            className="btn-gradient-primary py-2 px-3"
            onClick={saveEditRecord}
          >
            <i className="fas fa-check mr-1"></i> Guardar
          </button>
        </Modal.Footer>
      </Modal>

    </div>
  );
}
