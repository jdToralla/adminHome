import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import _swal from 'sweetalert';
import { auth, firedb, googleProvider } from '../firebaseConfig';
import './styles.css';

function Login() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [msgerror, setMsgError] = useState(null);
  const [loading, setLoading] = useState(false);
  const historial = useHistory();

  useEffect(() => {
    // 1. Check if user already has an active session to skip login
    const savedId = localStorage.getItem('currentId');
    const savedEmail = localStorage.getItem('rememberedEmail');

    if (savedEmail) {
      setEmail(savedEmail);
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        localStorage.setItem('currentId', user.uid);
        localStorage.setItem('currentUserEmail', user.email || '');
        localStorage.setItem('currentUserName', user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario'));
        if (user.photoURL) {
          localStorage.setItem('currentUserPhoto', user.photoURL);
        }
        historial.push('/home');
      } else if (savedId) {
        // Legacy active session
        historial.push('/home');
      }
    });

    return () => unsubscribe();
  }, [historial]);

  // Google Sign In & Auto-Registration
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

        // Auto-sync in Firestore 'users'
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
            text: 'El proveedor de Google aún no está activado en tu consola de Firebase. Debes ingresar a Firebase Console > Authentication > Sign-in method y activar "Google". Consulta GUIA_ADMINISTRADOR_FIREBASE.md',
            icon: 'info',
            button: 'Entendido'
          });
          setMsgError('Debes habilitar el proveedor "Google" en la consola de Firebase.');
        } else {
          setMsgError(error.message || 'Error al iniciar sesión con Google.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit Handler: Login or Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsgError(null);
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPass = pass.trim();

    // Mode: REGISTRO DE NUEVA CUENTA
    if (mode === 'register') {
      if (!cleanEmail.includes('@')) {
        setMsgError('Por favor ingresa un correo electrónico válido.');
        setLoading(false);
        return;
      }
      if (cleanPass.length < 6) {
        setMsgError('La contraseña debe tener al menos 6 caracteres.');
        setLoading(false);
        return;
      }
      if (cleanPass !== confirmPass.trim()) {
        setMsgError('Las contraseñas no coinciden. Por favor verifícalas.');
        setLoading(false);
        return;
      }

      try {
        const userCred = await auth.createUserWithEmailAndPassword(cleanEmail, cleanPass);
        const user = userCred.user;
        if (user) {
          const displayName = name.trim() || cleanEmail.split('@')[0];
          try {
            await user.updateProfile({ displayName: displayName });
          } catch (pErr) {
            console.warn('Update profile error:', pErr);
          }

          // Register in Firestore 'users'
          try {
            await firedb.collection('users').doc(user.uid).set({
              uid: user.uid,
              user: displayName,
              email: cleanEmail,
              createdAt: new Date().toISOString(),
              authProvider: 'password'
            });
          } catch (fErr) {
            console.warn('Firestore user save error:', fErr);
          }

          if (rememberMe) {
            localStorage.setItem('rememberedEmail', cleanEmail);
          }
          localStorage.setItem('currentId', user.uid);
          localStorage.setItem('currentUserEmail', cleanEmail);
          localStorage.setItem('currentUserName', displayName);

          _swal({
            title: '¡Cuenta creada con éxito!',
            text: `Bienvenido a AdminHome, ${displayName}.`,
            icon: 'success',
            timer: 1300,
            buttons: false
          });
          historial.push('/home');
        }
      } catch (regError) {
        console.error('Registration error:', regError);
        let msg = 'No se pudo crear la cuenta.';
        if (regError.code === 'auth/email-already-in-use') {
          msg = 'Este correo ya está registrado. Puedes iniciar sesión directamente.';
        } else if (regError.code === 'auth/invalid-email') {
          msg = 'El formato del correo electrónico es inválido.';
        } else if (regError.code === 'auth/weak-password') {
          msg = 'La contraseña es demasiado débil (mínimo 6 caracteres).';
        }
        setMsgError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Mode: INICIO DE SESIÓN
    try {
      // 1. Try Firebase Authentication (Email + Password)
      const userCred = await auth.signInWithEmailAndPassword(cleanEmail, cleanPass);
      const user = userCred.user;
      if (user) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', cleanEmail);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        localStorage.setItem('currentId', user.uid);
        localStorage.setItem('currentUserEmail', user.email || cleanEmail);
        localStorage.setItem('currentUserName', user.displayName || cleanEmail.split('@')[0]);
        historial.push('/home');
        return;
      }
    } catch (authError) {
      console.log('Firebase auth failed, checking legacy Firestore fallback:', authError.code);

      // 2. Fallback to legacy Firestore 'users' (for existing accounts like norma77)
      try {
        const { docs } = await firedb.collection('users').get();
        const matched = docs.map(d => ({ id: d.id, ...d.data() })).find(
          u => (u.email === cleanEmail || u.user === cleanEmail) && u.pass === cleanPass
        );

        if (matched) {
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', cleanEmail);
          }
          localStorage.setItem('currentId', matched.id);
          localStorage.setItem('currentUserEmail', matched.email || matched.user);
          localStorage.setItem('currentUserName', matched.user || 'Usuario');
          historial.push('/home');
          return;
        }
      } catch (legacyErr) {
        console.warn('Legacy fallback error:', legacyErr);
      }

      // Friendly error mapping
      let msg = 'Correo o contraseña incorrectos.';
      if (authError.code === 'auth/wrong-password') {
        msg = 'Contraseña incorrecta. Puedes recuperarla con el enlace de abajo.';
      } else if (authError.code === 'auth/user-not-found') {
        msg = 'No se encontró ninguna cuenta registrada con este correo.';
      } else if (authError.code === 'auth/invalid-email') {
        msg = 'Por favor ingresa un formato de correo electrónico válido.';
      } else if (authError.code === 'auth/too-many-requests') {
        msg = 'Demasiados intentos fallidos. Intenta más tarde o restablece tu clave.';
      }
      setMsgError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Password Recovery via Email
  const recuperarPassword = () => {
    _swal({
      title: 'Recuperar contraseña',
      text: 'Ingresa tu correo electrónico registrado y te enviaremos un enlace oficial para restablecerla:',
      content: {
        element: 'input',
        attributes: {
          placeholder: 'correo@ejemplo.com',
          type: 'email',
          defaultValue: email.includes('@') ? email : ''
        }
      },
      buttons: {
        cancel: 'Cancelar',
        confirm: {
          text: 'Enviar enlace',
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
          text: `Hemos enviado el enlace de recuperación a ${targetEmail}. Revisa tu bandeja de entrada o spam.`,
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
          <i className="fas fa-wallet"></i>
        </div>

        {/* Header Titles */}
        <h2 className="login-card-title">
          {mode === 'login' ? 'Bienvenido a AdminHome' : 'Crea tu cuenta'}
        </h2>
        <p className="login-card-subtitle">
          {mode === 'login'
            ? 'Ingresa con tu correo y contraseña para administrar tus finanzas.'
            : 'Completa tus datos para registrarte y empezar a usar la aplicación.'}
        </p>

        {/* Mode Selector (Iniciar Sesión vs Crear Cuenta) */}
        <div className="segmented-pills mb-3" style={{ background: '#F4F2F0', padding: '4px' }}>
          <button
            type="button"
            className={`segmented-pill-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setMsgError(null); }}
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <i className="fas fa-sign-in-alt mr-1"></i> Iniciar Sesión
          </button>
          <button
            type="button"
            className={`segmented-pill-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setMsgError(null); }}
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <i className="fas fa-user-plus mr-1"></i> Registrarse
          </button>
        </div>

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
              fontSize: '0.84rem',
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
          <span>{mode === 'login' ? 'Continuar con Google' : 'Registrarme con Google'}</span>
        </button>

        {/* Divider */}
        <div className="auth-divider">
          <span>o con correo electrónico</span>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          
          {/* Nombre (solo en modo registro) */}
          {mode === 'register' && (
            <div className="auth-input-wrapper">
              <i className="fas fa-user auth-input-icon"></i>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="auth-input-field"
                type="text"
                placeholder="Nombre completo (ej. Diego)"
                required
              />
            </div>
          )}

          {/* Correo Electrónico */}
          <div className="auth-input-wrapper">
            <i className="fas fa-envelope auth-input-icon"></i>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              className="auth-input-field"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              autoFocus
            />
          </div>

          {/* Contraseña */}
          <div className="auth-input-wrapper">
            <i className="fas fa-lock auth-input-icon"></i>
            <input
              onChange={(e) => setPass(e.target.value)}
              value={pass}
              className="auth-input-field"
              type={showPass ? 'text' : 'password'}
              placeholder={mode === 'register' ? 'Contraseña (mínimo 6 caracteres)' : 'Contraseña'}
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

          {/* Confirmar Contraseña (solo en modo registro) */}
          {mode === 'register' && (
            <div className="auth-input-wrapper">
              <i className="fas fa-check-double auth-input-icon"></i>
              <input
                onChange={(e) => setConfirmPass(e.target.value)}
                value={confirmPass}
                className="auth-input-field"
                type={showPass ? 'text' : 'password'}
                placeholder="Confirmar contraseña"
                required
              />
            </div>
          )}

          {/* Remember me & Forgot password (en modo login) */}
          {mode === 'login' && (
            <div className="d-flex justify-content-between align-items-center mb-3 px-1">
              <label className="d-flex align-items-center mb-0" style={{ fontSize: '0.8rem', color: '#8E92A4', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                  style={{ accentColor: '#4E44EB' }}
                />
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
          )}

          {/* Submit Button */}
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
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta y Entrar'} <i className="fas fa-arrow-right ml-2"></i>
              </span>
            )}
          </button>
        </form>

        {/* Bottom Switcher Link */}
        <div className="text-center mt-3 pt-2" style={{ borderTop: '1px solid #F0ECE8' }}>
          {mode === 'login' ? (
            <span style={{ fontSize: '0.82rem', color: '#8E92A4' }}>
              ¿Aún no tienes cuenta?{' '}
              <strong
                style={{ color: '#4E44EB', cursor: 'pointer' }}
                onClick={() => { setMode('register'); setMsgError(null); }}
              >
                Regístrate aquí
              </strong>
            </span>
          ) : (
            <span style={{ fontSize: '0.82rem', color: '#8E92A4' }}>
              ¿Ya tienes una cuenta?{' '}
              <strong
                style={{ color: '#4E44EB', cursor: 'pointer' }}
                onClick={() => { setMode('login'); setMsgError(null); }}
              >
                Inicia sesión
              </strong>
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

export default Login;
