import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import _swal from 'sweetalert';
import { auth, firedb, fire_storage, firebase } from '../firebaseConfig';
import './styles.css';

/**
 * Catálogo maestro de categorías de ingresos de Finanzia
 * Incluye el nombre, icono de FontAwesome y su impacto patrimonial predeterminado.
 */
const CATEGORIAS_INGRESOS = [
  { nombre: 'Sueldo', icono: 'fas fa-briefcase', patrimonial: true },
  { nombre: 'Bonificaciones', icono: 'fas fa-award', patrimonial: true },
  { nombre: 'Comisiones', icono: 'fas fa-percentage', patrimonial: true },
  { nombre: 'Freelance', icono: 'fas fa-laptop-code', patrimonial: true },
  { nombre: 'Negocio propio', icono: 'fas fa-store', patrimonial: true },
  { nombre: 'Alquileres', icono: 'fas fa-building', patrimonial: true },
  { nombre: 'Inversiones', icono: 'fas fa-chart-line', patrimonial: true },
  { nombre: 'Intereses', icono: 'fas fa-coins', patrimonial: true },
  { nombre: 'Reembolsos', icono: 'fas fa-undo-alt', patrimonial: true },
  { nombre: 'Préstamos recibidos', icono: 'fas fa-hand-holding-usd', patrimonial: false },
  { nombre: 'Tarjeta de crédito', icono: 'fas fa-credit-card', patrimonial: false },
  { nombre: 'Regalos', icono: 'fas fa-gift', patrimonial: true },
  { nombre: 'Otros', icono: 'fas fa-ellipsis-h', patrimonial: true }
];

/** Opciones de Cuentas Destino */
const CUENTAS_DESTINO = [
  'Efectivo',
  'Cuenta bancaria',
  'Cuenta de ahorro',
  'Tarjeta prepago',
  'Billetera digital',
  'Personalizada'
];

/** Opciones de Métodos de Ingreso */
const METODOS_INGRESO = [
  'Transferencia',
  'Efectivo',
  'Depósito',
  'Cheque',
  'Tarjeta',
  'Otro'
];

/** Opciones de Frecuencia de Recurrencia */
const FRECUENCIAS_RECURRENCIA = [
  'Diaria',
  'Semanal',
  'Quincenal',
  'Mensual',
  'Anual'
];

/** Opciones de Estado de la Transacción */
const ESTADOS_TRANSACCION = [
  'Confirmado',
  'Pendiente',
  'Cancelado'
];

/**
 * Función utilitaria para normalizar identificadores de usuario (legacy o UID de Firebase)
 */
const parseUserId = (id) => {
  if (id === null || id === undefined) return '';
  const str = id.toString().trim();
  const num = parseInt(str, 10);
  return !isNaN(num) && num.toString() === str ? num : str;
};

export default function AddData() {
  const historial = useHistory();
  const { id } = useParams();

  // Tipo de movimiento: 2 = Ingreso, 1 = Egreso
  const [tipoMovimiento, setTipoMovimiento] = useState(id === '1' ? 1 : 2);

  // ---------------------------------------------------------------------------
  // 1. ESTADOS DEL MODO RÁPIDO (Por defecto)
  // ---------------------------------------------------------------------------
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(CATEGORIAS_INGRESOS[0].nombre);

  // Función para obtener la fecha de hoy en formato YYYY-MM-DD
  const obtenerFechaHoy = () => {
    const fechaActual = new Date();
    const anio = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaActual.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  };

  // Función para obtener la hora actual en formato HH:MM
  const obtenerHoraActual = () => {
    const fechaActual = new Date();
    const horas = String(fechaActual.getHours()).padStart(2, '0');
    const minutos = String(fechaActual.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
  };

  const [fecha, setFecha] = useState(obtenerFechaHoy());
  const [hora, setHora] = useState(obtenerHoraActual());

  // ---------------------------------------------------------------------------
  // 2. ESTADOS DEL MODO AVANZADO (Opciones desplegables)
  // ---------------------------------------------------------------------------
  const [mostrarOpcionesAvanzadas, setMostrarOpcionesAvanzadas] = useState(false);
  const [cuentaDestino, setCuentaDestino] = useState(() => {
    return localStorage.getItem('ultima_cuenta_ingreso') || 'Cuenta bancaria';
  });
  const [metodoIngreso, setMetodoIngreso] = useState('Transferencia');
  const [subcategoria, setSubcategoria] = useState('');
  const [fuentePagador, setFuentePagador] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [estadoTransaccion, setEstadoTransaccion] = useState('Confirmado');
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [frecuenciaRecurrencia, setFrecuenciaRecurrencia] = useState('Quincenal');
  const [archivoComprobante, setArchivoComprobante] = useState(null);
  const [impactoPatrimonial, setImpactoPatrimonial] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // ---------------------------------------------------------------------------
  // EFECTO: Actualizar impactoPatrimonial automáticamente según la categoría
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const categoriaEncontrada = CATEGORIAS_INGRESOS.find(c => c.nombre === categoriaSeleccionada);
    if (categoriaEncontrada) {
      setImpactoPatrimonial(categoriaEncontrada.patrimonial);
    }
  }, [categoriaSeleccionada]);

  // Función para agregar sumas rápidas al monto (+Q100, +Q500, etc.)
  const agregarMontoRapido = (incremento) => {
    const montoActual = parseFloat(monto) || 0;
    setMonto((montoActual + incremento).toString());
  };

  // Función para seleccionar categoría (ingreso manual de descripción preservado)
  const seleccionarCategoria = (nombreCategoria) => {
    setCategoriaSeleccionada(nombreCategoria);
  };

  // Manejador para el archivo de comprobante
  const manejarCambioArchivo = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoComprobante(e.target.files[0]);
    }
  };

  // ---------------------------------------------------------------------------
  // FUNCIÓN PRINCIPAL: Guardar Ingreso con Arquitectura Optimizada
  // ---------------------------------------------------------------------------
  const guardarIngreso = async (e) => {
    e.preventDefault();

    const montoNumerico = parseFloat(monto);
    if (!montoNumerico || montoNumerico <= 0) {
      _swal({
        title: 'Monto inválido',
        text: 'Por favor ingresa un monto numérico mayor a cero.',
        icon: 'warning',
        button: 'Entendido'
      });
      return;
    }

    if (!fecha) {
      _swal({
        title: 'Fecha requerida',
        text: 'Selecciona la fecha del ingreso.',
        icon: 'warning'
      });
      return;
    }

    // Identificación del usuario activo
    const usuarioActual = auth.currentUser;
    const idUsuario = usuarioActual ? usuarioActual.uid : localStorage.getItem('currentId');

    if (!idUsuario) {
      _swal({
        title: 'Sesión no iniciada',
        text: 'Debes iniciar sesión para registrar tus transacciones.',
        icon: 'error'
      }).then(() => historial.push('/login'));
      return;
    }

    setGuardando(true);

    try {
      // 1. Subir comprobante a Firebase Storage si se adjuntó un archivo
      let urlFinalComprobante = null;
      if (archivoComprobante) {
        try {
          const nombreArchivo = `${Date.now()}_${archivoComprobante.name}`;
          const referenciaStorage = fire_storage.child(`comprobantes/${idUsuario}/${nombreArchivo}`);
          const resultadoSubida = await referenciaStorage.put(archivoComprobante);
          urlFinalComprobante = await resultadoSubida.ref.getDownloadURL();
        } catch (errorStorage) {
          console.warn('No se pudo subir comprobante a Storage, continuando:', errorStorage);
        }
      }

      // Clave del mes actual en formato "YYYY-MM" para estadísticas agregadas
      const claveMes = fecha.substring(0, 7);

      // Objeto de la entidad de Ingreso completa
      const entidadIngreso = {
        userId: idUsuario,
        amount: montoNumerico,
        currency: 'GTQ',
        category: categoriaSeleccionada,
        subcategory: subcategoria.trim() || null,
        account: cuentaDestino,
        paymentMethod: metodoIngreso,
        description: descripcion.trim() || categoriaSeleccionada,
        date: fecha,
        time: hora || obtenerHoraActual(),
        tags: [],
        source: fuentePagador.trim() || null,
        project: proyecto.trim() || null,
        status: estadoTransaccion,
        isRecurring: esRecurrente,
        recurrenceFrequency: esRecurrente ? frecuenciaRecurrencia : null,
        attachmentUrl: urlFinalComprobante,
        impactoPatrimonial: impactoPatrimonial,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 2. Operación por lotes (Batch) para optimizar lecturas/escrituras en Firestore
      const loteEscritura = firedb.batch();

      // a) Escritura en la subcolección dedicada del usuario: users/{idUsuario}/incomes
      const referenciaIngreso = firedb.collection('users').doc(idUsuario).collection('incomes').doc();
      loteEscritura.set(referenciaIngreso, entidadIngreso);

      // b) Agregación mensual desnormalizada: users/{idUsuario}/aggregatedStats/{claveMes}
      // Esta optimización permite que los reportes mensuales lean 1 solo documento en lugar de cientos
      const referenciaEstadisticas = firedb.collection('users').doc(idUsuario).collection('aggregatedStats').doc(claveMes);
      loteEscritura.set(referenciaEstadisticas, {
        monthKey: claveMes,
        totalIncome: firebase.firestore.FieldValue.increment(montoNumerico),
        realWealthIncome: impactoPatrimonial
          ? firebase.firestore.FieldValue.increment(montoNumerico)
          : firebase.firestore.FieldValue.increment(0),
        [`categoryBreakdown.${categoriaSeleccionada}`]: firebase.firestore.FieldValue.increment(montoNumerico),
        [`accountBreakdown.${cuentaDestino}`]: firebase.firestore.FieldValue.increment(montoNumerico),
        ultimaActualizacion: new Date().toISOString()
      }, { merge: true });

      // Ejecutar lote atómico
      await loteEscritura.commit();

      // c) Escritura en la colección 'caja-chica' para mantener compatibilidad total con Home.jsx
      await firedb.collection('caja-chica').add({
        cantidad: montoNumerico,
        fecha: fecha,
        hora: hora || obtenerHoraActual(),
        descripcion: descripcion.trim() || categoriaSeleccionada,
        idUser: parseUserId(idUsuario),
        tipo: 2, // 2 = Ingreso
        categoria: categoriaSeleccionada,
        subcategoria: subcategoria.trim() || null,
        cuentaDestino: cuentaDestino,
        metodoIngreso: metodoIngreso,
        impactoPatrimonial: impactoPatrimonial,
        esRecurrente: esRecurrente,
        estado: estadoTransaccion
      });

      // Recordar la última cuenta utilizada en el almacenamiento local
      localStorage.setItem('ultima_cuenta_ingreso', cuentaDestino);

      _swal({
        title: '¡Ingreso Guardado!',
        text: `Se registraron Q ${montoNumerico.toFixed(2)} en ${categoriaSeleccionada}.`,
        icon: 'success',
        timer: 1300,
        buttons: false
      });

      historial.push('/home');
    } catch (error) {
      console.error('Error al guardar ingreso en Firestore:', error);
      _swal({
        title: 'Error al registrar',
        text: 'Ocurrió un error al guardar en la base de datos. Inténtalo de nuevo.',
        icon: 'error'
      });
    } finally {
      setGuardando(false);
    }
  };

  // Manejador alternativo para cuando el usuario cambia a modo Egreso
  const guardarEgreso = async (e) => {
    e.preventDefault();
    const montoNumerico = parseFloat(monto);
    if (!montoNumerico || montoNumerico <= 0) {
      _swal('Monto inválido', 'Por favor ingresa un monto mayor a cero.', 'warning');
      return;
    }

    const idUsuario = localStorage.getItem('currentId');
    if (!idUsuario) {
      historial.push('/login');
      return;
    }

    setGuardando(true);
    try {
      await firedb.collection('caja-chica').add({
        cantidad: montoNumerico,
        fecha: fecha,
        hora: hora || obtenerHoraActual(),
        descripcion: descripcion.trim() || 'Egreso vario',
        idUser: parseUserId(idUsuario),
        tipo: 1 // 1 = Egreso
      });

      _swal({
        title: '¡Egreso Registrado!',
        text: `Q ${montoNumerico.toFixed(2)} registrado correctamente.`,
        icon: 'success',
        timer: 1200,
        buttons: false
      });
      historial.push('/home');
    } catch (err) {
      console.error(err);
      _swal('Error', 'No se pudo guardar el egreso.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const esModoIngreso = tipoMovimiento === 2;

  return (
    <div className="container" style={{ paddingTop: '80px', paddingBottom: '70px' }}>
      
      {/* Botón superior de regreso al Dashboard */}
      <div className="mb-3 d-flex align-items-center justify-content-between" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <button
          className="segmented-pill-btn d-inline-flex align-items-center"
          onClick={() => historial.push('/home')}
          style={{ padding: '8px 16px', background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <i className="fas fa-arrow-left mr-2" style={{ color: '#4E44EB' }}></i>
          <span>Volver al Dashboard</span>
        </button>

        <span style={{ fontSize: '0.82rem', color: '#8E92A4', fontWeight: 600 }}>
          Finanzia &bull; Captura Rápida
        </span>
      </div>

      <div className="modulo-ingreso-contenedor">
        
        {/* Selector de Tipo (Ingreso vs Egreso) */}
        <div className="type-switcher-pills mb-3">
          <button
            type="button"
            className={`type-switcher-btn ${esModoIngreso ? 'active-income' : ''}`}
            onClick={() => setTipoMovimiento(2)}
          >
            <i className="fas fa-arrow-down"></i>
            <span>Nuevo Ingreso</span>
          </button>
          <button
            type="button"
            className={`type-switcher-btn ${!esModoIngreso ? 'active-expense' : ''}`}
            onClick={() => setTipoMovimiento(1)}
          >
            <i className="fas fa-arrow-up"></i>
            <span>Nuevo Egreso</span>
          </button>
        </div>

        {/* =================================================================== */}
        {/* FORMULARIO DE INGRESO (Módulo Finanzia con Divulgación Progresiva)   */}
        {/* =================================================================== */}
        {esModoIngreso ? (
          <form onSubmit={guardarIngreso}>
            
            {/* 1. CAJA DESTACADA DEL MONTO */}
            <div className="caja-captura-monto">
              <div className="etiqueta-monto-guia">
                Monto del Ingreso
              </div>
              <div className="fila-entrada-monto">
                <span className="prefijo-moneda-monto">Q</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="entrada-monto-grande"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              {/* Píldoras de sumas rápidas */}
              <div className="pildoras-sumas-rapidas">
                {[50, 100, 500, 1000, 2500].map((cantidadRapida) => (
                  <button
                    type="button"
                    key={cantidadRapida}
                    className="boton-suma-rapida"
                    onClick={() => agregarMontoRapido(cantidadRapida)}
                  >
                    +Q{cantidadRapida}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. CAMPO DESCRIPCIÓN O CONCEPTO (Visible en modo rápido) */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="etiqueta-campo-finanzia mb-0">
                  <i className="fas fa-file-signature mr-1" style={{ color: '#4E44EB' }}></i> Descripción o Concepto
                </label>
                {descripcion && (
                  <button
                    type="button"
                    className="btn btn-link p-0 text-muted"
                    style={{ fontSize: '0.74rem', textDecoration: 'none' }}
                    onClick={() => setDescripcion('')}
                  >
                    <i className="fas fa-times-circle mr-1"></i> Limpiar
                  </button>
                )}
              </div>

              <div className="contenedor-entrada-icono">
                <i className="fas fa-pen icono-entrada-flotante"></i>
                <input
                  type="text"
                  className="campo-formulario-finanzia campo-formulario-con-icono"
                  placeholder="Ej. Pago de noviembre 2026, Alquiler mes octubre Josue..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </div>

            {/* 3. SELECCIÓN DE CATEGORÍA CON ICONOS */}
            <div className="mb-3">
              <div className="seccion-categorias-titulo">
                <span>Categoría</span>
                <span style={{ fontSize: '0.74rem', color: '#8E92A4', fontWeight: 500 }}>
                  Seleccionada: <strong style={{ color: '#4E44EB' }}>{categoriaSeleccionada}</strong>
                </span>
              </div>
              
              <div className="grilla-categorias-finanzia">
                {CATEGORIAS_INGRESOS.map((cat) => (
                  <div
                    key={cat.nombre}
                    className={`tarjeta-categoria-finanzia ${categoriaSeleccionada === cat.nombre ? 'activa' : ''}`}
                    onClick={() => seleccionarCategoria(cat.nombre)}
                  >
                    <div className="icono-categoria-finanzia">
                      <i className={cat.icono} style={{ color: categoriaSeleccionada === cat.nombre ? '#4E44EB' : '#8E92A4' }}></i>
                    </div>
                    <span className="etiqueta-categoria-finanzia">{cat.nombre}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. FECHA Y HORA (Precargadas en automático con espaciado amplio de icono) */}
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                <label className="etiqueta-campo-finanzia">Fecha</label>
                <div className="modern-input-group">
                  <i className="fas fa-calendar-alt modern-input-icon"></i>
                  <input
                    type="date"
                    className="campo-formulario-finanzia"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-12 col-sm-6">
                <label className="etiqueta-campo-finanzia">Hora</label>
                <div className="modern-input-group">
                  <i className="fas fa-clock modern-input-icon"></i>
                  <input
                    type="time"
                    className="campo-formulario-finanzia"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* BOTÓN DESPLEGABLE PARA OPCIONES AVANZADAS (Siempre opcional, antes de Guardar) */}
            <button
              type="button"
              className="boton-desplegar-avanzado my-3"
              onClick={() => setMostrarOpcionesAvanzadas(!mostrarOpcionesAvanzadas)}
            >
              <span>{mostrarOpcionesAvanzadas ? '▲ Ocultar opciones avanzadas' : '▼ Opciones avanzadas (opcional: cuenta, recurrencia, comprobante)'}</span>
            </button>

            {/* =============================================================== */}
            {/* PANEL DE OPCIONES AVANZADAS (Progressive Disclosure)            */}
            {/* =============================================================== */}
            {mostrarOpcionesAvanzadas && (
              <div className="panel-opciones-avanzadas mb-3">
                
                {/* BLOQUE A: INFORMACIÓN FINANCIERA */}
                <div className="seccion-avanzada-bloque">
                  <div className="titulo-seccion-avanzada">
                    <i className="fas fa-university mr-1" style={{ color: '#4E44EB' }}></i> Información Financiera
                  </div>
                  
                  <div className="row g-2">
                    <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                      <label className="etiqueta-campo-finanzia">Cuenta destino</label>
                      <select
                        className="campo-formulario-finanzia"
                        value={cuentaDestino}
                        onChange={(e) => setCuentaDestino(e.target.value)}
                      >
                        {CUENTAS_DESTINO.map(cuenta => (
                          <option key={cuenta} value={cuenta}>{cuenta}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="etiqueta-campo-finanzia">Método de ingreso</label>
                      <select
                        className="campo-formulario-finanzia"
                        value={metodoIngreso}
                        onChange={(e) => setMetodoIngreso(e.target.value)}
                      >
                        {METODOS_INGRESO.map(metodo => (
                          <option key={metodo} value={metodo}>{metodo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BLOQUE B: CLASIFICACIÓN Y PROCEDENCIA (Sin sección de etiquetas) */}
                <div className="seccion-avanzada-bloque">
                  <div className="titulo-seccion-avanzada">
                    <i className="fas fa-layer-group mr-1" style={{ color: '#4E44EB' }}></i> Clasificación y Procedencia
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                      <label className="etiqueta-campo-finanzia">Subcategoría</label>
                      <input
                        type="text"
                        placeholder="Ej. Quincena 1, Bono anual"
                        className="campo-formulario-finanzia"
                        value={subcategoria}
                        onChange={(e) => setSubcategoria(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="etiqueta-campo-finanzia">Proyecto o Fuente</label>
                      <input
                        type="text"
                        placeholder="Nombre del proyecto o procedencia"
                        className="campo-formulario-finanzia"
                        value={proyecto}
                        onChange={(e) => setProyecto(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="row g-2">
                    <div className="col-12">
                      <label className="etiqueta-campo-finanzia">Pagador / Entidad</label>
                      <input
                        type="text"
                        placeholder="Empresa, cliente o persona que realiza el pago"
                        className="campo-formulario-finanzia"
                        value={fuentePagador}
                        onChange={(e) => setFuentePagador(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* BLOQUE C: ESTADO Y RECURRENCIA */}
                <div className="seccion-avanzada-bloque">
                  <div className="titulo-seccion-avanzada">
                    <i className="fas fa-sync-alt mr-1" style={{ color: '#4E44EB' }}></i> Seguimiento y Recurrencia
                  </div>

                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                      <label className="etiqueta-campo-finanzia">Estado del ingreso</label>
                      <select
                        className="campo-formulario-finanzia"
                        value={estadoTransaccion}
                        onChange={(e) => setEstadoTransaccion(e.target.value)}
                      >
                        {ESTADOS_TRANSACCION.map(est => (
                          <option key={est} value={est}>{est}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="etiqueta-campo-finanzia">¿Es recurrente?</label>
                      <div className="d-flex align-items-center gap-2 p-2 bg-white rounded border">
                        <input
                          type="checkbox"
                          id="checkRecurrente"
                          checked={esRecurrente}
                          onChange={(e) => setEsRecurrente(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#4E44EB' }}
                        />
                        <label htmlFor="checkRecurrente" className="mb-0" style={{ fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                          Repetir ingreso automáticamente
                        </label>
                      </div>
                    </div>
                  </div>

                  {esRecurrente && (
                    <div className="mt-2">
                      <label className="etiqueta-campo-finanzia">Frecuencia de repetición</label>
                      <select
                        className="campo-formulario-finanzia"
                        value={frecuenciaRecurrencia}
                        onChange={(e) => setFrecuenciaRecurrencia(e.target.value)}
                      >
                        {FRECUENCIAS_RECURRENCIA.map(frec => (
                          <option key={frec} value={frec}>{frec}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* BLOQUE D: AUDITORÍA Y NOTAS */}
                <div className="seccion-avanzada-bloque">
                  <div className="titulo-seccion-avanzada">
                    <i className="fas fa-file-alt mr-1" style={{ color: '#4E44EB' }}></i> Auditoría y Comprobante
                  </div>

                  <div className="mb-2">
                    <label className="etiqueta-campo-finanzia">Descripción detallada / Notas adicionales</label>
                    <textarea
                      rows="2"
                      className="campo-formulario-finanzia"
                      placeholder="Escribe detalles o notas sobre este ingreso..."
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    ></textarea>
                  </div>

                  <div>
                    <label className="etiqueta-campo-finanzia">Adjuntar comprobante o voucher</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="campo-formulario-finanzia"
                      onChange={manejarCambioArchivo}
                      style={{ padding: '6px 10px' }}
                    />
                    {archivoComprobante && (
                      <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
                        <i className="fas fa-check mr-1"></i> Archivo seleccionado: {archivoComprobante.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* BLOQUE E: INTELIGENCIA PATRIMONIAL */}
                <div className={`tarjeta-inteligencia-patrimonial ${impactoPatrimonial ? 'positivo' : 'neutral'}`}>
                  <div>
                    <strong style={{ fontSize: '0.86rem', color: impactoPatrimonial ? '#3730A3' : '#9F1239', display: 'block' }}>
                      {impactoPatrimonial ? '✓ Suma a Patrimonio Real (Activo Neto)' : '⚠ Excluido de Patrimonio Real'}
                    </strong>
                    <span style={{ fontSize: '0.74rem', color: '#6B7280', display: 'block', marginTop: '2px' }}>
                      {impactoPatrimonial
                        ? 'Este ingreso incrementa tu patrimonio neto real sin generar deuda o pasivo.'
                        : 'Identificado como préstamo, adelanto o crédito (genera obligación financiera neutra).'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={impactoPatrimonial}
                    onChange={(e) => setImpactoPatrimonial(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: impactoPatrimonial ? '#4E44EB' : '#F46F5F' }}
                    title="Alternar impacto patrimonial"
                  />
                </div>

              </div>
            )}

            {/* BOTÓN PRINCIPAL DE GUARDAR INGRESO (Siempre al final, después de opciones avanzadas) */}
            <button
              type="submit"
              className="boton-guardar-principal"
              disabled={guardando}
            >
              {guardando ? (
                <span><i className="fas fa-spinner fa-spin mr-2"></i> Guardando ingreso...</span>
              ) : (
                <span>
                  <i className="fas fa-check-circle mr-1"></i>
                  Guardar Ingreso {monto ? `(Q ${parseFloat(monto || 0).toFixed(2)})` : ''}
                </span>
              )}
            </button>

          </form>
        ) : (
          /* =================================================================== */
          /* FORMULARIO DE EGRESO COMPACTO                                      */
          /* =================================================================== */
          <form onSubmit={guardarEgreso}>
            <div className="caja-captura-monto">
              <div className="etiqueta-monto-guia">Monto del Egreso</div>
              <div className="fila-entrada-monto">
                <span className="prefijo-moneda-monto" style={{ color: '#F46F5F' }}>Q</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="entrada-monto-grande"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="pildoras-sumas-rapidas">
                {[25, 50, 100, 200, 500].map((val) => (
                  <button
                    type="button"
                    key={val}
                    className="boton-suma-rapida"
                    onClick={() => agregarMontoRapido(val)}
                  >
                    +Q{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="etiqueta-campo-finanzia">Concepto o Descripción</label>
              <input
                type="text"
                placeholder="Ej. Almuerzo, Gasolina, Supermercado..."
                className="campo-formulario-finanzia"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            </div>

            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                <label className="etiqueta-campo-finanzia">Fecha</label>
                <input
                  type="date"
                  className="campo-formulario-finanzia"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  required
                />
              </div>
              <div className="col-12 col-sm-6">
                <label className="etiqueta-campo-finanzia">Hora</label>
                <input
                  type="time"
                  className="campo-formulario-finanzia"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-gradient-secondary w-100 py-3"
              disabled={guardando}
              style={{ borderRadius: '16px', fontSize: '1rem', fontWeight: 800 }}
            >
              {guardando ? (
                <span><i className="fas fa-spinner fa-spin mr-2"></i> Guardando...</span>
              ) : (
                <span><i className="fas fa-check mr-2"></i> Guardar Egreso</span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
