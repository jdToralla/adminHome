import React, { useEffect, useState } from "react";
import { useHistory, useLocation } from 'react-router-dom';
import _swal from 'sweetalert';
import { auth } from '../firebaseConfig';
import './styles.css';

export default function Nav() {
  const [idUser, setIdUser] = useState('');
  const [userName, setUserName] = useState('Usuario');
  const [userPhoto, setUserPhoto] = useState('');
  const historial = useHistory();
  const location = useLocation();

  useEffect(() => {
    const current = localStorage.getItem('currentId');
    const name = localStorage.getItem('currentUserName');
    const photo = localStorage.getItem('currentUserPhoto');
    setIdUser(current || '');
    if (name) setUserName(name);
    if (photo) setUserPhoto(photo);
  }, [location.pathname]);

  const logout = () => {
    _swal({
      title: '¿Deseas cerrar sesión?',
      text: 'Tendrás que ingresar tus credenciales nuevamente.',
      icon: 'warning',
      buttons: ['Cancelar', 'Sí, salir'],
      dangerMode: true,
    }).then(async (result) => {
      if (result) {
        try {
          await auth.signOut();
        } catch (e) {
          console.log('Firebase sign out:', e);
        }
        localStorage.setItem('currentId', '');
        localStorage.setItem('currentUserEmail', '');
        localStorage.setItem('currentUserName', '');
        localStorage.setItem('currentUserPhoto', '');
        setIdUser('');
        historial.push('/');
      }
    });
  };

  const isAuthPage = location.pathname === '/' || location.pathname === '/login';

  return (
    <nav className="modern-navbar">
      <div className="container d-flex align-items-center justify-content-between">
        
        {/* Left: Hamburger menu + Brand Logo */}
        <div className="d-flex align-items-center gap-3">
          {!isAuthPage && (
            <button
              className="btn-action-icon mr-2 d-md-none"
              title="Menú"
              onClick={() => historial.push('/home')}
              style={{ background: '#FAF6F2' }}
            >
              <i className="fas fa-bars" style={{ fontSize: '1rem', color: '#1E1F30' }}></i>
            </button>
          )}

          <div
            className="d-flex align-items-center"
            style={{ cursor: 'pointer', gap: '10px' }}
            onClick={() => historial.push(idUser ? '/home' : '/')}
          >
            <div className="brand-badge">
              <i className="fas fa-wallet"></i>
            </div>
            <h1 className="brand-title">
              Admin<span>Home</span>
            </h1>
          </div>
        </div>

        {/* Center: Future navigation tabs (Desktop) */}
        {!isAuthPage && idUser && (
          <div className="d-none d-md-flex align-items-center" style={{ gap: '6px' }}>
            <button
              className={`segmented-pill-btn ${location.pathname === '/home' ? 'active' : ''}`}
              onClick={() => historial.push('/home')}
              style={{ padding: '8px 18px', fontSize: '0.88rem' }}
            >
              <i className="fas fa-th-large mr-2"></i>Dashboard
            </button>
            <button
              className="segmented-pill-btn"
              onClick={() => historial.push('/add-data/2')}
              style={{ padding: '8px 18px', fontSize: '0.88rem' }}
            >
              <i className="fas fa-plus-circle mr-2"></i>Movimiento
            </button>
            <button
              className="segmented-pill-btn"
              onClick={() => {
                _swal({
                  title: 'Próximamente',
                  text: 'El módulo de Presupuestos y Metas estará disponible muy pronto.',
                  icon: 'info',
                  button: 'Entendido'
                });
              }}
              style={{ padding: '8px 18px', fontSize: '0.88rem', opacity: 0.8 }}
            >
              <i className="fas fa-chart-pie mr-2"></i>Metas
            </button>
          </div>
        )}

        {/* Right: User Avatar + Logout */}
        <div className="d-flex align-items-center" style={{ gap: '10px' }}>
          {!isAuthPage && idUser ? (
            <div className="d-flex align-items-center" style={{ gap: '10px' }}>
              <div className="nav-user-pill d-none d-sm-flex align-items-center">
                <img
                  src={userPhoto || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"}
                  alt="Usuario"
                  className="user-avatar-img mr-2"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80";
                  }}
                />
                <div className="d-flex flex-column mr-2" style={{ maxWidth: '120px' }}>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#1E1F30',
                      lineHeight: 1.1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {userName}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#8E92A4', fontWeight: 500 }}>
                    Plan Pro
                  </span>
                </div>
              </div>

              <button
                className="nav-logout-btn"
                onClick={logout}
                title="Cerrar sesión"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="d-none d-sm-inline">Salir</span>
              </button>
            </div>
          ) : (
            <button
              className="segmented-pill-btn active px-3 py-1"
              onClick={() => historial.push('/')}
              style={{ fontSize: '0.84rem' }}
            >
              <i className="fas fa-lock mr-2"></i>Acceso
            </button>
          )}
        </div>

      </div>
    </nav>
  );
}
