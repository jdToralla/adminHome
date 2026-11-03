import React, { useState } from "react";
import { useHistory, useParams } from 'react-router-dom';
import _swal from 'sweetalert';
import { firedb } from "../firebaseConfig";
import './styles.css';

const parseUserId = (id) => {
  if (id === null || id === undefined) return '';
  const str = id.toString().trim();
  const num = parseInt(str, 10);
  return !isNaN(num) && num.toString() === str ? num : str;
};

export default function AddData() {
  const history = useHistory();
  const { id } = useParams();

  // 1 = Egreso, 2 = Ingreso
  const [currentType, setCurrentType] = useState(id === '1' ? 1 : 2);

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getHora = () => {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(getTodayDate());
  const [hora, setHora] = useState(getHora());
  const [descripcion, setDescripcion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    { label: 'Alimentos', icon: 'fas fa-utensils' },
    { label: 'Supermercado', icon: 'fas fa-shopping-basket' },
    { label: 'Transporte', icon: 'fas fa-car-side' },
    { label: 'Servicios', icon: 'fas fa-bolt' },
    { label: 'Sueldo', icon: 'fas fa-coins' },
    { label: 'Spotify/Ocio', icon: 'fab fa-spotify' },
    { label: 'Salud', icon: 'fas fa-heartbeat' },
    { label: 'Otros', icon: 'fas fa-receipt' },
  ];

  const handleCategorySelect = (catLabel) => {
    setSelectedCategory(catLabel);
    if (!descripcion || categories.some(c => c.label === descripcion)) {
      setDescripcion(catLabel);
    }
  };

  const handleQuickAddAmount = (val) => {
    const curr = parseFloat(cantidad) || 0;
    setCantidad((curr + val).toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const parsedCant = parseFloat(cantidad);
    if (!parsedCant || parsedCant <= 0) {
      _swal({
        title: 'Monto inválido',
        text: 'Por favor ingresa una cantidad válida mayor a cero.',
        icon: 'warning',
        button: 'Entendido'
      });
      return;
    }

    if (!fecha) {
      _swal({
        title: 'Fecha requerida',
        text: 'Por favor selecciona la fecha del movimiento.',
        icon: 'warning',
        button: 'Entendido'
      });
      return;
    }

    const currentUserId = localStorage.getItem('currentId');
    if (!currentUserId) {
      _swal({
        title: 'Sesión expirada',
        text: 'Por favor inicia sesión nuevamente.',
        icon: 'error'
      }).then(() => history.push('/login'));
      return;
    }

    setIsSubmitting(true);

    const payload = {
      cantidad: parsedCant,
      fecha: fecha,
      hora: hora || getHora(),
      descripcion: descripcion.trim() || (currentType === 2 ? 'Ingreso vario' : 'Egreso vario'),
      idUser: parseUserId(currentUserId),
      tipo: currentType
    };

    try {
      await firedb.collection('caja-chica').add(payload);
      _swal({
        title: '¡Registrado con éxito!',
        text: `${currentType === 2 ? 'Ingreso' : 'Egreso'} de Q ${parsedCant.toFixed(2)} guardado.`,
        icon: 'success',
        timer: 1200,
        buttons: false
      });
      history.push('/home');
    } catch (err) {
      console.error(err);
      _swal({
        title: 'Error al guardar',
        text: 'No se pudo conectar con el servidor. Intenta de nuevo.',
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isIncome = currentType === 2;

  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
      
      {/* Back to dashboard button */}
      <div className="mb-4 d-flex align-items-center justify-content-between" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <button
          className="segmented-pill-btn d-inline-flex align-items-center"
          onClick={() => history.push('/home')}
          style={{ padding: '8px 18px', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <i className="fas fa-arrow-left mr-2" style={{ color: '#4E44EB' }}></i>
          <span>Volver al Dashboard</span>
        </button>

        <span style={{ fontSize: '0.84rem', color: '#8E92A4', fontWeight: 600 }}>
          Paso 1 de 1
        </span>
      </div>

      <div className="form-card-container">
        
        {/* Type Switcher Segmented Pills */}
        <div className="type-switcher-pills">
          <button
            type="button"
            className={`type-switcher-btn ${isIncome ? 'active-income' : ''}`}
            onClick={() => setCurrentType(2)}
          >
            <i className="fas fa-arrow-down"></i>
            <span>Nuevo Ingreso</span>
          </button>
          <button
            type="button"
            className={`type-switcher-btn ${!isIncome ? 'active-expense' : ''}`}
            onClick={() => setCurrentType(1)}
          >
            <i className="fas fa-arrow-up"></i>
            <span>Nuevo Egreso</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* Big Amount Hero Box */}
          <div className="amount-hero-input-wrapper">
            <div className="amount-hero-label">
              Monto a {isIncome ? 'Ingresar' : 'Gastar'}
            </div>
            <div className="amount-input-inner">
              <span className="amount-currency-prefix" style={{ color: isIncome ? '#4E44EB' : '#F46F5F' }}>
                Q
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="amount-input-field"
                placeholder="0.00"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                autoFocus
                required
              />
            </div>

            {/* Quick Amount Suggestion Chips */}
            <div className="quick-amount-chips">
              {[50, 100, 200, 500, 1000].map((val) => (
                <button
                  type="button"
                  key={val}
                  className="quick-chip-btn"
                  onClick={() => handleQuickAddAmount(val)}
                >
                  +Q {val}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Category Chips Selector */}
          <div className="mb-3">
            <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E1F30', marginBottom: '8px', display: 'block' }}>
              Categoría sugerida
            </label>
            <div className="category-chips-grid">
              {categories.map((cat) => (
                <div
                  key={cat.label}
                  className={`category-chip-card ${selectedCategory === cat.label ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(cat.label)}
                >
                  <div className="category-chip-icon">
                    <i className={cat.icon}></i>
                  </div>
                  <span className="category-chip-label">{cat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Description Input */}
          <div className="mb-3">
            <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E1F30', marginBottom: '6px', display: 'block' }}>
              Descripción / Concepto
            </label>
            <div className="modern-input-group">
              <i className="fas fa-pencil-alt modern-input-icon"></i>
              <input
                type="text"
                className="modern-form-control"
                placeholder="Ej. Supermercado semanal, Pago nómina..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="row mb-4">
            <div className="col-12 col-md-6 mb-3 mb-md-0">
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E1F30', marginBottom: '6px', display: 'block' }}>
                Fecha
              </label>
              <div className="modern-input-group">
                <i className="fas fa-calendar-alt modern-input-icon"></i>
                <input
                  type="date"
                  className="modern-form-control"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="col-12 col-md-6">
              <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E1F30', marginBottom: '6px', display: 'block' }}>
                Hora
              </label>
              <div className="modern-input-group">
                <i className="fas fa-clock modern-input-icon"></i>
                <input
                  type="time"
                  className="modern-form-control"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            className={isIncome ? 'btn-gradient-primary w-100 py-3' : 'btn-gradient-secondary w-100 py-3'}
            disabled={isSubmitting}
            style={{ fontSize: '1.05rem', borderRadius: '18px' }}
          >
            {isSubmitting ? (
              <span><i className="fas fa-spinner fa-spin mr-2"></i> Guardando...</span>
            ) : (
              <span>
                <i className={`fas ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'} mr-2`}></i>
                Guardar {isIncome ? 'Ingreso' : 'Egreso'}
              </span>
            )}
          </button>

        </form>

      </div>

    </div>
  );
}
