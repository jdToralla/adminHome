import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import _swal from 'sweetalert';
import { auth, firedb, googleProvider } from '../firebaseConfig';
import './styles.css';

/** Dominio virtual interno para cuentas creadas con nombre de usuario en Firebase Auth */
const DOMINIO_VIRTUAL = '@finanzia.local';

/**
 * Normaliza y limpia un nombre de usuario (tipo Instagram/Twitter):
 * - Minúsculas
 * - Sin espacios
 * - Solo caracteres alfanuméricos, puntos y guiones bajos
 */
const normalizarUsuario = (texto) => {
  if (!texto) return '';
  return texto.toLowerCase().trim().replace(/[^a-z0-9_.]/g, '');
};

/**
 * Valida el formato del nombre de usuario
 */
const validarFormatoUsuario = (userStr) => {
  if (!userStr || userStr.length < 3) {
    return 'El nombre de usuario debe tener al menos 3 caracteres.';
  }
  if (userStr.length > 20) {
    return 'El nombre de usuario no puede exceder los 20 caracteres.';
  }
  if (!/^[a-z0-9_.]+$/.test(userStr)) {
    return 'El usuario solo puede contener letras (a-z), números (0-9), puntos o guiones bajos (sin espacios).';
  }
  return null;
};

/**
 * Genera sugerencias cuando un nombre de usuario ya está ocupado
 */
const generarSugerenciasUsuario = (base) => {
  const aleatorio = Math.floor(Math.random() * 89 + 10);
  return [
    `${base}1`,
    `${base}2`,
    `${base}_${aleatorio}`,
    `${base}_app`
  ];
};

/**
 * Verifica si un nombre de usuario ya está registrado en Firestore
 */
const verificarDisponibilidadUsuario = async (nombreUsuarioLower) => {
  try {
    // 1. Verificar en la colección de índices únicos 'usernames'
    const docUsername = await firedb.collection('usernames').doc(nombreUsuarioLower).get();
    if (docUsername.exists) {
      return false;
    }

    // 2. Verificar en la colección de usuarios 'users' por retrocompatibilidad
    const snapUser = await firedb
      .collection('users')
      .where('user', '==', nombreUsuarioLower)
      .limit(1)
      .get();
    if (!snapUser.empty) {
      return false;
    }

    const snapUsername = await firedb
      .collection('users')
      .where('username', '==', nombreUsuarioLower)
      .limit(1)
      .get();
    if (!snapUsername.empty) {
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Error al verificar disponibilidad de usuario en Firestore:', error);
    return true;
  }
};

function Login() {
  const [mode, setMode] = useState('login'); // 'login' or 'register'

  // Estados para Login
  const [identificador, setIdentificador] = useState(''); // Usuario o Correo
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Estados para Registro
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [sugerencias, setSugerencias] = useState([]);

  // Estados de feedback
  const [msgerror, setMsgError] = useState(null);
  const [loading, setLoading] = useState(false);
  const historial = useHistory();

  // 1. Comprobar si ya existe una sesión abierta permanente (tipo Gmail/YouTube)
  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('currentId');
    const recordado = localStorage.getItem('rememberedIdentifier');

    if (recordado) {
      setIdentificador(recordado);
    }

    if (usuarioGuardado) {
      historial.push('/home');
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        localStorage.setItem('currentId', user.uid);
        localStorage.setItem('currentUserEmail', user.email || '');
        const nombreFinal = user.displayName || (user.email ? user.email.split('@')[0] : 'Usuario');
        localStorage.setItem('currentUserName', nombreFinal);
        if (user.photoURL) {
          localStorage.setItem('currentUserPhoto', user.photoURL);
        }
        historial.push('/home');
      }
    });

    return () => unsubscribe();
  }, [historial]);

  // Iniciar Sesión o Registrarse con Google
  const iniciarConGoogle = async () => {
    setMsgError(null);
    setLoading(true);
    try {
      const result = await auth.signInWithPopup(googleProvider);
      const user = result.user;
      if (user) {
        const emailPrefix = user.email ? user.email.split('@')[0] : 'usuario';
        const usernameBase = normalizarUsuario(emailPrefix) || 'usuario';

        // Auto-sincronización en Firestore
        try {
          const userDoc = await firedb.collection('users').doc(user.uid).get();
          let usernameAsignado = usernameBase;

          if (!userDoc.exists) {
            const libre = await verificarDisponibilidadUsuario(usernameBase);
            usernameAsignado = libre ? usernameBase : `${usernameBase}${Math.floor(Math.random() * 89 + 10)}`;

            await firedb.collection('users').doc(user.uid).set({
              uid: user.uid,
              user: usernameAsignado,
              username: usernameAsignado,
              displayName: user.displayName || usernameAsignado,
              email: user.email,
              photoURL: user.photoURL || '',
              createdAt: new Date().toISOString(),
              authProvider: 'google'
            });

            await firedb.collection('usernames').doc(usernameAsignado).set({
              uid: user.uid,
              username: usernameAsignado,
              email: user.email,
              displayName: user.displayName || usernameAsignado,
              createdAt: new Date().toISOString()
            }).catch(() => {});
          } else {
            usernameAsignado = userDoc.data().username || userDoc.data().user || usernameBase;
          }

          localStorage.setItem('currentId', user.uid);
          localStorage.setItem('currentUserEmail', user.email || '');
          localStorage.setItem('currentUserName', user.displayName || usernameAsignado);
          localStorage.setItem('currentUsername', usernameAsignado);
          if (user.photoURL) {
            localStorage.setItem('currentUserPhoto', user.photoURL);
          }
        } catch (syncErr) {
          console.warn('Sync user doc error:', syncErr);
          localStorage.setItem('currentId', user.uid);
          localStorage.setItem('currentUserEmail', user.email || '');
          localStorage.setItem('currentUserName', user.displayName || usernameBase);
          localStorage.setItem('currentUsername', usernameBase);
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
            text: 'Debes habilitar Google en Firebase Console > Authentication > Sign-in method.',
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

  // Manejador principal de formulario (Login o Registro por Usuario)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsgError(null);
    setSugerencias([]);
    setLoading(true);

    // =========================================================================
    // MODO: REGISTRO DE NUEVA CUENTA POR NOMBRE DE USUARIO
    // =========================================================================
    if (mode === 'register') {
      const cleanUser = normalizarUsuario(username);
      const cleanPass = pass.trim();

      const errorFormato = validarFormatoUsuario(cleanUser);
      if (errorFormato) {
        setMsgError(errorFormato);
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
        // 1. VALIDACIÓN DE UNICIDAD: Verificar si el usuario ya existe
        const disponible = await verificarDisponibilidadUsuario(cleanUser);
        if (!disponible) {
          const nuevasSugerencias = generarSugerenciasUsuario(cleanUser);
          setSugerencias(nuevasSugerencias);
          setMsgError(`El usuario "@${cleanUser}" ya está en uso. Elige uno de los nombres sugeridos abajo o prueba otro.`);
          setLoading(false);
          return;
        }

        // 2. Generar credencial virtual para Firebase Auth
        const emailAuth = `${cleanUser}${DOMINIO_VIRTUAL}`;
        const userCred = await auth.createUserWithEmailAndPassword(emailAuth, cleanPass);
        const user = userCred.user;

        if (user) {
          const displayName = name.trim() || cleanUser;
          try {
            await user.updateProfile({ displayName: displayName });
          } catch (pErr) {
            console.warn('Update profile error:', pErr);
          }

          // 3. Registrar índice de unicidad en la colección 'usernames'
          await firedb.collection('usernames').doc(cleanUser).set({
            uid: user.uid,
            username: cleanUser,
            email: emailAuth,
            displayName: displayName,
            createdAt: new Date().toISOString()
          });

          // 4. Registrar en la colección 'users'
          await firedb.collection('users').doc(user.uid).set({
            uid: user.uid,
            username: cleanUser,
            user: cleanUser,
            displayName: displayName,
            email: emailAuth,
            authProvider: 'username',
            createdAt: new Date().toISOString()
          });

          // 5. Dejar sesión abierta permanentemente (tipo Gmail/YouTube)
          localStorage.setItem('currentId', user.uid);
          localStorage.setItem('currentUserEmail', emailAuth);
          localStorage.setItem('currentUserName', displayName);
          localStorage.setItem('currentUsername', cleanUser);
          localStorage.setItem('rememberedIdentifier', cleanUser);

          _swal({
            title: `¡Bienvenido, @${cleanUser}!`,
            text: 'Tu cuenta ha sido creada exitosamente. Tu sesión permanecerá abierta.',
            icon: 'success',
            timer: 1400,
            buttons: false
          });
          historial.push('/home');
        }
      } catch (regError) {
        console.error('Error al registrar usuario:', regError);
        let msg = 'No se pudo crear la cuenta.';
        if (regError.code === 'auth/email-already-in-use') {
          msg = `El usuario "@${cleanUser}" ya está registrado. Si es tu cuenta, inicia sesión directamente.`;
        } else if (regError.code === 'auth/weak-password') {
          msg = 'La contraseña debe tener al menos 6 caracteres.';
        }
        setMsgError(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    // =========================================================================
    // MODO: INICIO DE SESIÓN RÁPIDO (Por Usuario o Correo)
    // =========================================================================
    const idLimpio = identificador.trim();
    const cleanPass = pass.trim();

    if (!idLimpio) {
      setMsgError('Por favor ingresa tu nombre de usuario o correo.');
      setLoading(false);
      return;
    }
    if (!cleanPass) {
      setMsgError('Por favor ingresa tu contraseña.');
      setLoading(false);
      return;
    }

    let emailDestino = idLimpio;
    let usernameDetectado = idLimpio;

    // Si el identificador NO tiene @, es un nombre de usuario (ej. 'jose')
    if (!idLimpio.includes('@')) {
      const userLower = normalizarUsuario(idLimpio);
      usernameDetectado = userLower;
      emailDestino = `${userLower}${DOMINIO_VIRTUAL}`;

      try {
        // Buscar el email real asociado en 'usernames'
        const docUsername = await firedb.collection('usernames').doc(userLower).get();
        if (docUsername.exists && docUsername.data().email) {
          emailDestino = docUsername.data().email;
        } else {
          // Fallback a 'users'
          const snapUser = await firedb.collection('users')
            .where('user', '==', userLower)
            .limit(1)
            .get();
          if (!snapUser.empty && snapUser.docs[0].data().email) {
            emailDestino = snapUser.docs[0].data().email;
          }
        }
      } catch (eLookup) {
        console.warn('Error resolviendo email de usuario:', eLookup);
      }
    }

    try {
      // 1. Intento en Firebase Authentication
      const userCred = await auth.signInWithEmailAndPassword(emailDestino, cleanPass);
      const user = userCred.user;
      if (user) {
        if (rememberMe) {
          localStorage.setItem('rememberedIdentifier', idLimpio);
        } else {
          localStorage.removeItem('rememberedIdentifier');
        }
        localStorage.setItem('currentId', user.uid);
        localStorage.setItem('currentUserEmail', user.email || emailDestino);
        localStorage.setItem('currentUserName', user.displayName || usernameDetectado);
        localStorage.setItem('currentUsername', usernameDetectado);

        historial.push('/home');
        return;
      }
    } catch (authError) {
      console.log('Firebase auth no coincidió, revisando cuentas legacy en Firestore:', authError.code);

      // 2. Fallback de retrocompatibilidad con cuentas legacy en Firestore (ej. norma77)
      try {
        const userLower = normalizarUsuario(idLimpio);
        const { docs } = await firedb.collection('users').get();
        const matched = docs.map(d => ({ id: d.id, ...d.data() })).find(
          u => (
            (u.user && u.user.toLowerCase() === userLower) ||
            (u.username && u.username.toLowerCase() === userLower) ||
            (u.email && u.email.toLowerCase() === idLimpio.toLowerCase())
          ) && u.pass === cleanPass
        );

        if (matched) {
          if (rememberMe) {
            localStorage.setItem('rememberedIdentifier', idLimpio);
          }
          localStorage.setItem('currentId', matched.id);
          localStorage.setItem('currentUserEmail', matched.email || matched.user);
          localStorage.setItem('currentUserName', matched.user || matched.displayName || 'Usuario');
          localStorage.setItem('currentUsername', matched.user || userLower);

          historial.push('/home');
          return;
        }
      } catch (legacyErr) {
        console.warn('Error en fallback legacy:', legacyErr);
      }

      // Mapeo amigable de errores
      let msg = 'Usuario o contraseña incorrectos.';
      if (authError.code === 'auth/wrong-password') {
        msg = 'Contraseña incorrecta. Por favor verifica tu clave.';
      } else if (authError.code === 'auth/user-not-found') {
        msg = `No se encontró el usuario o correo "${idLimpio}". Revisa la ortografía o regístrate.`;
      } else if (authError.code === 'auth/too-many-requests') {
        msg = 'Demasiados intentos fallidos. Por seguridad, espera un momento.';
      }
      setMsgError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Recuperación de contraseña por correo (si se usó un correo real)
  const recuperarPassword = () => {
    _swal({
      title: 'Recuperar contraseña',
      text: 'Ingresa tu correo electrónico registrado para enviarte el enlace oficial de restablecimiento:',
      content: {
        element: 'input',
        attributes: {
          placeholder: 'correo@ejemplo.com',
          type: 'email',
          defaultValue: identificador.includes('@') ? identificador : ''
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
          msg = 'No existe ninguna cuenta registrada con este correo.';
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
        
        {/* Icono de Marca */}
        <div className="login-brand-icon-wrap">
          <i className="fas fa-wallet"></i>
        </div>

        {/* Títulos */}
        <h2 className="login-card-title">
          {mode === 'login' ? 'Bienvenido a AdminHome' : 'Crea tu usuario'}
        </h2>
        <p className="login-card-subtitle">
          {mode === 'login'
            ? 'Ingresa tu usuario y contraseña. Tu sesión permanecerá abierta.'
            : 'Elige tu nombre de usuario para registrarte y empezar a usar la aplicación.'}
        </p>

        {/* Selector de Modo (Iniciar Sesión vs Registrarse) */}
        <div className="segmented-pills mb-3" style={{ background: '#F4F2F0', padding: '4px' }}>
          <button
            type="button"
            className={`segmented-pill-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setMsgError(null); setSugerencias([]); }}
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <i className="fas fa-sign-in-alt mr-1"></i> Iniciar Sesión
          </button>
          <button
            type="button"
            className={`segmented-pill-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setMsgError(null); setSugerencias([]); }}
            style={{ padding: '8px 12px', fontSize: '0.84rem' }}
          >
            <i className="fas fa-user-plus mr-1"></i> Registrarse
          </button>
        </div>

        {/* Alerta de Error */}
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
            <i className="fas fa-exclamation-circle mr-2" style={{ fontSize: '1.1rem', flexShrink: 0 }}></i>
            <div>{msgerror}</div>
          </div>
        )}

        {/* Sugerencias interactivas de nombre de usuario cuando ya está en uso */}
        {sugerencias.length > 0 && mode === 'register' && (
          <div className="sugerencias-usuarios-container">
            <div className="sugerencias-usuarios-titulo">
              <i className="fas fa-lightbulb"></i>
              <span>Sugerencias disponibles (toca una para usarla):</span>
            </div>
            <div className="sugerencias-usuarios-lista">
              {sugerencias.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  className="pildora-sugerencia-usuario"
                  onClick={() => {
                    setUsername(sug);
                    setSugerencias([]);
                    setMsgError(null);
                  }}
                  title={`Usar @${sug}`}
                >
                  @{sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botón de Google Sign In */}
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

        {/* Divisor visual */}
        <div className="auth-divider">
          <span>{mode === 'login' ? 'o con tu nombre de usuario' : 'o con nombre de usuario'}</span>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleSubmit}>

          {/* ============================================================= */}
          {/* CAMPOS PARA MODO REGISTRO                                      */}
          {/* ============================================================= */}
          {mode === 'register' && (
            <>
              {/* Campo Usuario Único (Tipo Instagram) */}
              <div className="auth-input-wrapper mb-2">
                <i className="fas fa-at auth-input-icon" style={{ color: '#4E44EB', fontWeight: 700 }}></i>
                <input
                  onChange={(e) => {
                    setUsername(normalizarUsuario(e.target.value));
                    setMsgError(null);
                  }}
                  value={username}
                  className="auth-input-field"
                  type="text"
                  placeholder="Nombre de usuario (ej. jose)"
                  autoCapitalize="none"
                  autoCorrect="off"
                  required
                  autoFocus
                />
              </div>
              <span className="auth-input-helper">
                Tu usuario único para entrar rápido sin escribir correos largos.
              </span>

              {/* Nombre completo o visible (opcional) */}
              <div className="auth-input-wrapper">
                <i className="fas fa-user auth-input-icon"></i>
                <input
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  className="auth-input-field"
                  type="text"
                  placeholder="Nombre visible (opcional, ej. José)"
                />
              </div>
            </>
          )}

          {/* ============================================================= */}
          {/* CAMPOS PARA MODO LOGIN                                         */}
          {/* ============================================================= */}
          {mode === 'login' && (
            <div className="auth-input-wrapper">
              <i className="fas fa-user-circle auth-input-icon"></i>
              <input
                onChange={(e) => {
                  setIdentificador(e.target.value);
                  setMsgError(null);
                }}
                value={identificador}
                className="auth-input-field"
                type="text"
                placeholder="Usuario (ej. jose) o correo"
                autoCapitalize="none"
                autoCorrect="off"
                required
                autoFocus
              />
            </div>
          )}

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

          {/* Recordarme y sesión permanente */}
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
                Mantener sesión iniciada
              </label>
              <span
                style={{ fontSize: '0.8rem', color: '#4E44EB', fontWeight: 700, cursor: 'pointer' }}
                onClick={recuperarPassword}
                title="Recuperar contraseña"
              >
                ¿Olvidaste tu clave?
              </span>
            </div>
          )}

          {/* Botón de envío */}
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
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta y Entrar'}{' '}
                <i className="fas fa-arrow-right ml-2"></i>
              </span>
            )}
          </button>
        </form>

        {/* Selector inferior para alternar entre Login y Registro */}
        <div className="text-center mt-3 pt-2" style={{ borderTop: '1px solid #F0ECE8' }}>
          {mode === 'login' ? (
            <span style={{ fontSize: '0.82rem', color: '#8E92A4' }}>
              ¿Aún no tienes cuenta?{' '}
              <strong
                style={{ color: '#4E44EB', cursor: 'pointer' }}
                onClick={() => { setMode('register'); setMsgError(null); setSugerencias([]); }}
              >
                Regístrate aquí
              </strong>
            </span>
          ) : (
            <span style={{ fontSize: '0.82rem', color: '#8E92A4' }}>
              ¿Ya tienes una cuenta?{' '}
              <strong
                style={{ color: '#4E44EB', cursor: 'pointer' }}
                onClick={() => { setMode('login'); setMsgError(null); setSugerencias([]); }}
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
