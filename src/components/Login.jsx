import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { firedb } from '../firebaseConfig';
import './styles.css';

function Login() {
  const [email, setEmail] = useState('norma77');
  const [pass, setPass] = useState('toralla12');
  const [showPass, setShowPass] = useState(false);
  const [msgerror, setMsgError] = useState(null);
  const [dataUser, setDataUser] = useState([]);
  const [loading, setLoading] = useState(false);
  const historial = useHistory();

  useEffect(() => {
    localStorage.setItem('currentId', '');
    getData();
  }, []);

  const getData = async () => {
    try {
      const { docs } = await firedb.collection('users').get();
      const nuevoArray = docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
      setDataUser(nuevoArray);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const registrarUsuario = async (e) => {
    e.preventDefault();
    setMsgError(null);
    setLoading(true);

    // Give subtle smooth delay for better UX
    setTimeout(() => {
      const matchedUser = dataUser.find(
        (user) => email.trim() === user.user && pass.trim() === user.pass
      );

      if (matchedUser) {
        localStorage.setItem('currentId', matchedUser.id);
        historial.push('/home');
      } else {
        setMsgError('Usuario o contraseña incorrectos. Verifica tus datos.');
        setLoading(false);
      }
    }, 400);
  };

  return (
    <div className="login-container-wrapper">
      <div className="login-glass-card">
        
        {/* Brand Icon Badge */}
        <div className="login-brand-icon-wrap">
          <i className="fas fa-piggy-bank"></i>
        </div>

        {/* Header Titles */}
        <h2 className="login-card-title">Bienvenido de nuevo</h2>
        <p className="login-card-subtitle">
          Administra tus ingresos y gastos con estilo y simplicidad.
        </p>

        {/* Error Alert */}
        {msgerror && (
          <div
            className="alert d-flex align-items-center mb-4"
            role="alert"
            style={{
              background: '#FFF0ED',
              border: '1px solid #FFD4C9',
              borderRadius: '16px',
              color: '#F46F5F',
              fontSize: '0.88rem',
              fontWeight: 600,
              padding: '12px 16px'
            }}
          >
            <i className="fas fa-exclamation-circle mr-2" style={{ fontSize: '1.1rem' }}></i>
            <div>{msgerror}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={registrarUsuario}>
          <div className="auth-input-wrapper">
            <i className="fas fa-user auth-input-icon"></i>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="auth-input-field"
              type="text"
              placeholder="Nombre de usuario"
              required
            />
          </div>

          <div className="auth-input-wrapper">
            <i className="fas fa-lock auth-input-icon"></i>
            <input
              onChange={(e) => setPass(e.target.value)}
              value={pass}
              className="auth-input-field"
              type={showPass ? 'text' : 'password'}
              placeholder="Contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#8E92A4',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
              title={showPass ? 'Ocultar' : 'Mostrar'}
            >
              <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </div>

          {/* Remember me & forgot password future placeholders */}
          <div className="d-flex justify-content-between align-items-center mb-3 px-1">
            <label className="d-flex align-items-center mb-0" style={{ fontSize: '0.82rem', color: '#8E92A4', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked className="mr-2" style={{ accentColor: '#4E44EB' }} />
              Recordarme
            </label>
            <span
              style={{ fontSize: '0.82rem', color: '#4E44EB', fontWeight: 600, cursor: 'pointer' }}
              onClick={() => alert('Para soporte o recuperación de cuenta, contacta al administrador.')}
            >
              ¿Olvidaste tu clave?
            </span>
          </div>

          <button
            type="submit"
            className="auth-btn-submit"
            disabled={loading}
          >
            {loading ? (
              <span>
                <i className="fas fa-spinner fa-spin mr-2"></i> Ingresando...
              </span>
            ) : (
              <span>
                Ingresar al Dashboard <i className="fas fa-arrow-right ml-2"></i>
              </span>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper Box */}
        <div className="demo-credentials-card">
          <i className="fas fa-info-circle" style={{ color: '#4E44EB', fontSize: '1rem' }}></i>
          <span>
            <strong>Demo:</strong> Usuario <code>norma77</code> & Clave <code>toralla12</code>
          </span>
        </div>

      </div>
    </div>
  );
}

export default Login;
