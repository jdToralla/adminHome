import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import _swal from 'sweetalert';
import { auth, firedb, googleProvider } from '../firebaseConfig';
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
    localStorage.setItem('currentUserEmail', '');
    localStorage.setItem('currentUserName', '');
    localStorage.setItem('currentUserPhoto', '');
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

  // Google Sign In (Authentication + auto registration)
  const iniciarConGoogle = async () => {
    setMsgError(null);
    setLoading(true);
    try {
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      if (user) {
        localStorage.setItem('currentId', user.uid);
        localStorage.setItem('currentUserEmail', user.email || '');
        localStorage.setItem('currentUserName', user.displayName || user.email.split('@')[0]);
        if (user.photoURL) {
          localStorage.setItem('currentUserPhoto', user.photoURL);
        }

        // Auto-register/sync user in Firestore 'users' collection
        try {
          const userDoc = await firedb.collection('users').doc(user.uid).get();
          if (!userDoc.exists) {
            await firedb.collection('users').doc(user.uid).set({
              uid: user.uid,
              user: user.displayName || user.email.split('@')[0],
              email: user.email,
              photoURL: user.photoURL || '',
              createdAt: new Date().toISOString(),
              authProvider: 'google'
            });
          }
        } catch (syncErr) {
          console.warn('Sync user doc error:', syncErr);
        }

        _swal({
          title: `¡Bienvenido!`,
          text: `Sesión iniciada como ${user.displayName || user.email}`,
          icon: 'success',
          timer: 1200,
          buttons: false
        });
        historial.push('/home');
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        const errorText = error.message || '';
        if (errorText.includes('CONFIGURATION_NOT_FOUND') || error.code === 'auth/configuration-not-found') {
          _swal({
            title: 'Habilitar Google en Firebase',
            text: 'El proveedor de Google aún no está activado en tu consola de Firebase. Debes ingresar a Firebase Console > Authentication > Sign-in method y activar "Google". Consulta el archivo GUIA_ADMINISTRADOR_FIREBASE.md para el paso a paso.',
            icon: 'info',
            button: 'Entendido'
          });
          setMsgError('Debes habilitar el proveedor "Google" en la consola de Firebase. Consulta GUIA_ADMINISTRADOR_FIREBASE.md');
        } else {
          setMsgError(error.message || 'Error al iniciar sesión con Google.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Email / Password Login (Firebase Auth with legacy fallback)
  const registrarUsuario = async (e) => {
    e.preventDefault();
    setMsgError(null);
    setLoading(true);

    const cleanInput = email.trim();
    const cleanPass = pass.trim();

    try {
      // 1. Try Firebase Authentication (if input is email or auth user)
      if (cleanInput.includes('@')) {
        const userCred = await auth.signInWithEmailAndPassword(cleanInput, cleanPass);
        const user = userCred.user;
        if (user) {
          localStorage.setItem('currentId', user.uid);
          localStorage.setItem('currentUserEmail', user.email || cleanInput);
          localStorage.setItem('currentUserName', user.displayName || cleanInput.split('@')[0]);
          historial.push('/home');
          return;
        }
      }
      throw new Error('FallbackToLegacy');
    } catch (authErr) {
      // 2. Fallback to Firestore 'users' collection for legacy credentials (e.g. norma77 / toralla12)
      const matchedUser = dataUser.find(
        (u) => (u.user === cleanInput || u.email === cleanInput) && u.pass === cleanPass
      );

      if (matchedUser) {
        localStorage.setItem('currentId', matchedUser.id);
        localStorage.setItem('currentUserEmail', matchedUser.email || matchedUser.user);
        localStorage.setItem('currentUserName', matchedUser.user || 'Usuario');
        historial.push('/home');
      } else {
        let msg = 'Usuario o contraseña incorrectos.';
        if (authErr.code === 'auth/wrong-password') {
          msg = 'Contraseña incorrecta. Puedes recuperarla con el enlace de abajo.';
        } else if (authErr.code === 'auth/too-many-requests') {
          msg = 'Demasiados intentos fallidos. Intenta más tarde o restablece tu clave.';
        }
        setMsgError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Password Recovery via Email
  const recuperarPassword = () => {
    _swal({
      title: 'Recuperar contraseña',
      text: 'Ingresa tu correo electrónico registrado para enviarte las instrucciones de restablecimiento:',
      content: {
        element: 'input',
        attributes: {
          placeholder: 'tu-correo@ejemplo.com',
          type: 'email',
          defaultValue: email.includes('@') ? email : ''
        }
      },
      buttons: {
        cancel: 'Cancelar',
        confirm: {
          text: 'Enviar correo',
          closeModal: false
        }
      }
    }).then(async (val) => {
      if (!val) return;
      const targetEmail = val.trim();
      if (!targetEmail || !targetEmail.includes('@')) {
        _swal({
          title: 'Correo inválido',
          text: 'Por favor ingresa un formato de correo electrónico válido.',
          icon: 'warning'
        });
        return;
      }

      try {
        await auth.sendPasswordResetEmail(targetEmail);
        _swal({
          title: '¡Correo enviado!',
          text: `Hemos enviado un enlace de recuperación a ${targetEmail}. Por favor revisa tu bandeja de entrada o spam.`,
          icon: 'success'
        });
      } catch (err) {
        console.error('Password reset error:', err);
        let msg = 'No se pudo enviar el correo de recuperación.';
        if (err.code === 'auth/user-not-found') {
          msg = 'No existe ninguna cuenta registrada con este correo en Authentication.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'El formato del correo ingresado no es válido.';
        }
        _swal({
          title: 'No se pudo enviar',
          text: msg,
          icon: 'error'
        });
      }
    });
  };

  return (
    <div className="login-container-wrapper">
      <div className="login-glass-card">
        
        {/* Brand Icon Badge */}
        <div className="login-brand-icon-wrap">
          <i className="fas fa-piggy-bank"></i>
        </div>

        {/* Header Titles */}
        <h2 className="login-card-title">Bienvenido a AdminHome</h2>
        <p className="login-card-subtitle">
          Inicia sesión o continúa con tu cuenta de Google para administrar tus finanzas.
        </p>

        {/* Error Alert */}
        {msgerror && (
          <div
            className="alert d-flex align-items-center mb-3"
            role="alert"
            style={{
              background: '#FFF0ED',
              border: '1px solid #FFD4C9',
              borderRadius: '14px',
              color: '#F46F5F',
              fontSize: '0.86rem',
              fontWeight: 600,
              padding: '10px 14px'
            }}
          >
            <i className="fas fa-exclamation-circle mr-2" style={{ fontSize: '1.1rem' }}></i>
            <div>{msgerror}</div>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          className="google-sign-in-btn mb-2"
          onClick={iniciarConGoogle}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span>o con correo electrónico</span>
        </div>

        {/* Login Form */}
        <form onSubmit={registrarUsuario}>
          <div className="auth-input-wrapper">
            <i className="fas fa-envelope auth-input-icon"></i>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="auth-input-field"
              type="text"
              placeholder="Correo o usuario"
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

          {/* Remember me & Forgot password link */}
          <div className="d-flex justify-content-between align-items-center mb-3 px-1">
            <label className="d-flex align-items-center mb-0" style={{ fontSize: '0.8rem', color: '#8E92A4', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked className="mr-2" style={{ accentColor: '#4E44EB' }} />
              Recordarme
            </label>
            <span
              style={{ fontSize: '0.8rem', color: '#4E44EB', fontWeight: 700, cursor: 'pointer' }}
              onClick={recuperarPassword}
              title="Recuperar contraseña por correo"
            >
              ¿Olvidaste tu contraseña?
            </span>
          </div>

          <button
            type="submit"
            className="auth-btn-submit"
            disabled={loading}
          >
            {loading ? (
              <span>
                <i className="fas fa-spinner fa-spin mr-2"></i> Procesando...
              </span>
            ) : (
              <span>
                Iniciar Sesión <i className="fas fa-arrow-right ml-2"></i>
              </span>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper Box */}
        <div className="demo-credentials-card">
          <i className="fas fa-info-circle" style={{ color: '#4E44EB', fontSize: '0.95rem' }}></i>
          <span>
            <strong>Acceso demo:</strong> <code>norma77</code> / <code>toralla12</code> o tu cuenta de Google.
          </span>
        </div>

      </div>
    </div>
  );
}

export default Login;
