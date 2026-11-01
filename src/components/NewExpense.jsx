import React, { useState } from "react";
import { useHistory } from 'react-router-dom';
import _swal from 'sweetalert';
import { firedb } from "../firebaseConfig";
import './styles.css';

export default function NewExpense() {
  const history = useHistory();

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentUserId = localStorage.getItem('currentId');

    if (!currentUserId) {
      _swal({
        title: 'Sesión expirada',
        text: 'Por favor inicia sesión.',
        icon: 'error'
      }).then(() => history.push('/login'));
      return;
    }

    const parsedCant = parseFloat(cantidad);
    if (!parsedCant || parsedCant <= 0) {
      _swal({
        title: 'Monto inválido',
        text: 'Ingresa un monto mayor a cero.',
        icon: 'warning'
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      cantidad: parsedCant,
      fecha: fecha,
      hora: hora || getHora(),
      descripcion: descripcion.trim() || 'Egreso',
      idUser: parseInt(currentUserId),
      tipo: 1
    };

    try {
      await firedb.collection('caja-chica').add(payload);
      _swal({
        title: '¡Egreso registrado!',
        text: `Monto de Q ${parsedCant.toFixed(2)} registrado correctamente.`,
        icon: 'success',
        timer: 1200,
        buttons: false
      });
      history.push('/home');
    } catch (err) {
      console.error(err);
      _swal({
        title: 'Error',
        text: 'No se pudo guardar el registro.',
        icon: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '60px' }}>
      
      {/* Back button */}
      <div className="mb-4 d-flex align-items-center justify-content-between" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <button
          className="segmented-pill-btn d-inline-flex align-items-center"
          onClick={() => history.push('/home')}
          style={{ padding: '8px 18px', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <i className="fas fa-arrow-left mr-2" style={{ color: '#4E44EB' }}></i>
          <span>Volver al Dashboard</span>
        </button>
      </div>

      <div className="form-card-container">
        
        <div className="d-flex align-items-center gap-2 mb-3">
          <span className="form-header-badge badge-expense-type">
            <i className="fas fa-arrow-up mr-1"></i> Formulario de Egreso
          </span>
        </div>

        <h3 style={{ fontWeight: 800, fontSize: '1.45rem', color: '#1E1F30', letterSpacing: '-0.4px', marginBottom: '20px' }}>
          Registrar nuevo gasto
        </h3>

        <form onSubmit={handleSubmit}>
          
          {/* Amount Hero Box */}
          <div className="amount-hero-input-wrapper">
            <div className="amount-hero-label">Monto del Gasto</div>
            <div className="amount-input-inner">
              <span className="amount-currency-prefix" style={{ color: '#F46F5F' }}>Q</span>
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
            <div className="quick-amount-chips">
              {[25, 50, 100, 200, 500].map((val) => (
                <button
                  type="button"
                  key={val}
                  className="quick-chip-btn"
                  onClick={() => {
                    const c = parseFloat(cantidad) || 0;
                    setCantidad((c + val).toString());
                  }}
                >
                  +Q {val}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-3">
            <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#1E1F30', marginBottom: '6px', display: 'block' }}>
              Concepto / Detalle
            </label>
            <div className="modern-input-group">
              <i className="fas fa-comment-dollar modern-input-icon"></i>
              <input
                type="text"
                className="modern-form-control"
                placeholder="Ej. Almuerzo, Gasolina, Farmacia..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Date & Time */}
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

          <button
            type="submit"
            className="btn-gradient-secondary w-100 py-3"
            disabled={isSubmitting}
            style={{ fontSize: '1.05rem', borderRadius: '18px' }}
          >
            {isSubmitting ? (
              <span><i className="fas fa-spinner fa-spin mr-2"></i> Guardando...</span>
            ) : (
              <span><i className="fas fa-check mr-2"></i> Guardar Egreso</span>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
