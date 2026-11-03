import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Modal } from 'react-bootstrap';
import _swal from 'sweetalert';
import { auth } from '../firebaseConfig';
import './styles.css';

/**
 * Componente de Navegación Inferior Fija (Bottom Navigation Bar)
 * Estilo Mobile First tipo Wallet, Revolut y Money Manager.
 * Variables y métodos en español para fácil mantenimiento.
 */
export default function NavegacionInferior() {
  const historial = useHistory();
  const ubicacion = useLocation();
  const rutaActual = ubicacion.pathname;

  // Estado para el modal de nuevo movimiento (Botón central flotante +)
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  // Estado para el modal de ajustes
  const [mostrarModalAjustes, setMostrarModalAjustes] = useState(false);

  // No mostrar la barra inferior en pantallas de login o inicio de sesión
  if (rutaActual === '/' || rutaActual === '/login') {
    return null;
  }

  // Nombre y foto del usuario activo
  const nombreUsuario = localStorage.getItem('currentUserName') || 'Usuario';
  const correoUsuario = localStorage.getItem('currentUserEmail') || '';
  const fotoUsuario = localStorage.getItem('currentUserPhoto') || '';

  // Función para cerrar sesión con confirmación
  const confirmarCerrarSesion = () => {
    setMostrarModalAjustes(false);
    _swal({
      title: '¿Cerrar sesión?',
      text: 'Tendrás que ingresar tus credenciales nuevamente.',
      icon: 'warning',
      buttons: ['Cancelar', 'Sí, salir'],
      dangerMode: true,
    }).then(async (confirmado) => {
      if (confirmado) {
        try {
          await auth.signOut();
        } catch (error) {
          console.warn('Error al cerrar sesión:', error);
        }
        localStorage.clear();
        historial.push('/login');
      }
    });
  };

  // Navegar a nuevo ingreso o egreso
  const irANuevoMovimiento = (tipo) => {
    setMostrarModalNuevo(false);
    historial.push(`/add-data/${tipo}`);
  };

  return (
    <>
      {/* =============================================================== */}
      {/* BARRA INFERIOR FIJA (Bottom Nav Bar)                            */}
      {/* =============================================================== */}
      <nav className="barra-navegacion-inferior">
        <div className="contenedor-items-barra-inferior">
          
          {/* 1. INICIO */}
          <button
            type="button"
            className={`boton-item-nav-inferior ${rutaActual === '/home' ? 'activo' : ''}`}
            onClick={() => historial.push('/home')}
          >
            <i className="fas fa-home icono-nav-inferior"></i>
            <span className="etiqueta-nav-inferior">Inicio</span>
          </button>

          {/* 2. MOVIMIENTOS */}
          <button
            type="button"
            className={`boton-item-nav-inferior ${rutaActual === '/movimientos' ? 'activo' : ''}`}
            onClick={() => historial.push('/movimientos')}
          >
            <i className="fas fa-receipt icono-nav-inferior"></i>
            <span className="etiqueta-nav-inferior">Movimientos</span>
          </button>

          {/* 3. BOTÓN CENTRAL FLOTANTE (Nuevo Movimiento) */}
          <div className="contenedor-boton-central-flotante">
            <button
              type="button"
              className="boton-central-flotante"
              title="Registrar nuevo movimiento"
              onClick={() => setMostrarModalNuevo(true)}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* 4. REPORTES */}
          <button
            type="button"
            className={`boton-item-nav-inferior ${rutaActual === '/reportes' ? 'activo' : ''}`}
            onClick={() => historial.push('/reportes')}
          >
            <i className="fas fa-chart-pie icono-nav-inferior"></i>
            <span className="etiqueta-nav-inferior">Reportes</span>
          </button>

          {/* 5. AJUSTES */}
          <button
            type="button"
            className={`boton-item-nav-inferior ${mostrarModalAjustes ? 'activo' : ''}`}
            onClick={() => setMostrarModalAjustes(true)}
          >
            <i className="fas fa-cog icono-nav-inferior"></i>
            <span className="etiqueta-nav-inferior">Ajustes</span>
          </button>

        </div>
      </nav>

      {/* =============================================================== */}
      {/* MODAL BOTTOM-SHEET: SELECCIÓN DE NUEVO MOVIMIENTO               */}
      {/* =============================================================== */}
      <Modal
        show={mostrarModalNuevo}
        onHide={() => setMostrarModalNuevo(false)}
        centered
        dialogClassName="modal-bottom-sheet-dialog"
      >
        <div className="p-4 bg-white rounded-top-custom">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 font-weight-bold" style={{ fontSize: '1.15rem', color: '#1E1F30' }}>
              Nuevo Movimiento
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px' }}
              onClick={() => setMostrarModalNuevo(false)}
            >
              <i className="fas fa-times text-muted"></i>
            </button>
          </div>

          <div className="d-flex flex-column gap-3 py-2">
            {/* Botón Vibrante: Nuevo Ingreso */}
            <button
              type="button"
              className="boton-accion-modal-vibrante ingreso"
              onClick={() => irANuevoMovimiento(2)}
            >
              <div className="icono-circulo-vibrante">
                <i className="fas fa-arrow-down"></i>
              </div>
              <span className="texto-accion-vibrante">Nuevo Ingreso</span>
              <i className="fas fa-chevron-right flecha-vibrante"></i>
            </button>

            {/* Botón Vibrante: Nuevo Gasto */}
            <button
              type="button"
              className="boton-accion-modal-vibrante gasto"
              onClick={() => irANuevoMovimiento(1)}
            >
              <div className="icono-circulo-vibrante">
                <i className="fas fa-arrow-up"></i>
              </div>
              <span className="texto-accion-vibrante">Nuevo Gasto</span>
              <i className="fas fa-chevron-right flecha-vibrante"></i>
            </button>
          </div>
        </div>
      </Modal>

      {/* =============================================================== */}
      {/* MODAL DE AJUSTES Y PERFIL DE USUARIO                            */}
      {/* =============================================================== */}
      <Modal
        show={mostrarModalAjustes}
        onHide={() => setMostrarModalAjustes(false)}
        centered
        dialogClassName="modal-bottom-sheet-dialog"
      >
        <div className="p-4 bg-white rounded-top-custom">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0 font-weight-bold" style={{ fontSize: '1.1rem', color: '#1E1F30' }}>
              Mi Perfil y Ajustes
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle"
              onClick={() => setMostrarModalAjustes(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Tarjeta de usuario */}
          <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-lg mb-3">
            {fotoUsuario ? (
              <img
                src={fotoUsuario}
                alt="Avatar"
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4E44EB, #FF8E6E)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}
              >
                {nombreUsuario.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#1E1F30', display: 'block' }}>
                {nombreUsuario}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#8E92A4' }}>
                {correoUsuario || 'Usuario Finanzia'}
              </span>
            </div>
          </div>

          {/* Opciones de Ajustes */}
          <div className="d-flex flex-column gap-2 mb-4">
            <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
              <span style={{ fontSize: '0.85rem', color: '#4B5563', fontWeight: 600 }}>
                <i className="fas fa-money-bill-wave mr-2" style={{ color: '#4E44EB' }}></i> Moneda predeterminada
              </span>
              <span style={{ fontSize: '0.82rem', color: '#1E1F30', fontWeight: 700 }}>GTQ (Q)</span>
            </div>
            <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
              <span style={{ fontSize: '0.85rem', color: '#4B5563', fontWeight: 600 }}>
                <i className="fas fa-shield-alt mr-2" style={{ color: '#10B981' }}></i> Base de datos
              </span>
              <span style={{ fontSize: '0.82rem', color: '#10B981', fontWeight: 700 }}>Firestore Free-Tier</span>
            </div>
            <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
              <span style={{ fontSize: '0.85rem', color: '#4B5563', fontWeight: 600 }}>
                <i className="fas fa-code-branch mr-2" style={{ color: '#8E92A4' }}></i> Versión
              </span>
              <span style={{ fontSize: '0.82rem', color: '#8E92A4' }}>Finanzia 2.0 Mobile</span>
            </div>
          </div>

          {/* Botón Cerrar Sesión */}
          <button
            type="button"
            className="btn btn-outline-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            style={{ borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem' }}
            onClick={confirmarCerrarSesion}
          >
            <i className="fas fa-sign-out-alt"></i>
            Cerrar Sesión
          </button>
        </div>
      </Modal>
    </>
  );
}

