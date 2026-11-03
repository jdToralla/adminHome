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

/**
 * Catálogo maestro de categorías de egresos (gastos) de Finanzia
 * Con iconos, subcategorías sugeridas y colores temáticos
 */
const CATEGORIAS_EGRESOS = [
  {
    nombre: 'Alimentación',
    icono: 'fas fa-utensils',
    color: '#FF6B6B',
    subcategorias: ['Supermercado', 'Restaurantes', 'Comida rápida', 'Café', 'Otros alimentos']
  },
  {
    nombre: 'Transporte',
    icono: 'fas fa-car',
    color: '#4D96FF',
    subcategorias: ['Combustible', 'Taxi', 'Uber', 'Autobús', 'Parqueo', 'Mantenimiento auto']
  },
  {
    nombre: 'Vivienda',
    icono: 'fas fa-home',
    color: '#6BCB77',
    subcategorias: ['Alquiler', 'Hipoteca', 'Mantenimiento', 'Decoración', 'Reparaciones']
  },
  {
    nombre: 'Servicios',
    icono: 'fas fa-bolt',
    color: '#FFD93D',
    subcategorias: ['Agua', 'Electricidad', 'Internet', 'Teléfono', 'Streaming', 'Gas']
  },
  {
    nombre: 'Salud',
    icono: 'fas fa-heartbeat',
    color: '#FF4C29',
    subcategorias: ['Medicina', 'Consultas', 'Hospital', 'Dentista', 'Seguro médico']
  },
  {
    nombre: 'Educación',
    icono: 'fas fa-graduation-cap',
    color: '#845EC2',
    subcategorias: ['Cursos', 'Colegiaturas', 'Libros', 'Materiales', 'Talleres']
  },
  {
    nombre: 'Compras',
    icono: 'fas fa-shopping-bag',
    color: '#FF9671',
    subcategorias: ['Ropa', 'Electrónicos', 'Hogar', 'Calzado', 'Accesorios']
  },
  {
    nombre: 'Entretenimiento',
    icono: 'fas fa-glass-cheers',
    color: '#D65DB1',
    subcategorias: ['Cine', 'Salidas', 'Viajes', 'Videojuegos', 'Eventos']
  },
  {
    nombre: 'Finanzas',
    icono: 'fas fa-credit-card',
    color: '#2C73D2',
    subcategorias: ['Pago de préstamo', 'Pago tarjeta de crédito', 'Intereses bancarios', 'Comisiones bancarias']
  },
  {
    nombre: 'Mascotas',
    icono: 'fas fa-paw',
    color: '#00C9A7',
    subcategorias: ['Comida', 'Veterinario', 'Accesorios', 'Higiene']
  },
  {
    nombre: 'Regalos',
    icono: 'fas fa-gift',
    color: '#F38181',
    subcategorias: ['Cumpleaños', 'Aniversario', 'Navidad', 'Detalle']
  },
  {
    nombre: 'Familia',
    icono: 'fas fa-users',
    color: '#95E1D3',
    subcategorias: ['Apoyo familiar', 'Hijos', 'Cuidado', 'Gastos compartidos']
  },
  {
    nombre: 'Suscripciones',
    icono: 'fas fa-box-open',
    color: '#AA96DA',
    subcategorias: ['Software', 'Música', 'Gimnasio', 'Clubes']
  },
  {
    nombre: 'Inversiones',
    icono: 'fas fa-chart-line',
    color: '#38EF7D',
    subcategorias: ['Ahorro a plazo', 'Cripto', 'Bolsa', 'Bienes raíces']
  },
  {
    nombre: 'Otros',
    icono: 'fas fa-wrench',
    color: '#9E9E9E',
    subcategorias: ['Imprevistos', 'Donaciones', 'Varios']
  }
];

/** Opciones de Cuentas Destino para Ingresos */
const CUENTAS_DESTINO = [
  'Efectivo',
  'Cuenta bancaria',
  'Cuenta de ahorro',
  'Tarjeta prepago',
  'Billetera digital',
  'Personalizada'
];

/** Opciones de Cuentas Origen para Egresos */
const CUENTAS_ORIGEN_EGRESOS = [
  'Tarjeta de débito',
  'Efectivo',
  'Cuenta bancaria',
  'Cuenta de ahorro',
  'Tarjeta de crédito',
  'Billetera digital'
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

/** Opciones de Métodos de Pago para Egresos */
const METODOS_PAGO_EGRESOS = [
  'Tarjeta débito',
  'Tarjeta crédito',
  'Efectivo',
  'Transferencia',
  'QR',
  'Cheque',
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

/** Opciones de Estado de Egresos */
const ESTADOS_EGRESOS = [
  'Pagado',
  'Pendiente',
  'Parcial'
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
  // 3. ESTADOS DEL MÓDULO DE EGRESOS (GASTOS)
  // ---------------------------------------------------------------------------
  const [categoriaGasto, setCategoriaGasto] = useState(CATEGORIAS_EGRESOS[0].nombre);
  const [subcategoriaGasto, setSubcategoriaGasto] = useState('');
  const [cuentaOrigenGasto, setCuentaOrigenGasto] = useState(() => {
    return localStorage.getItem('ultima_cuenta_gasto') || 'Tarjeta de débito';
  });
  const [metodoPagoGasto, setMetodoPagoGasto] = useState(() => {
    return localStorage.getItem('ultimo_metodo_pago_gasto') || 'Tarjeta débito';
  });
  const [comercioGasto, setComercioGasto] = useState(() => {
    return localStorage.getItem('ultimo_comercio_gasto') || '';
  });
  const [estadoGasto, setEstadoGasto] = useState('Pagado');
  const [esRecurrenteGasto, setEsRecurrenteGasto] = useState(false);
  const [frecuenciaGasto, setFrecuenciaGasto] = useState('Mensual');
  const [vencimientoGasto, setVencimientoGasto] = useState('');
  const [tarjetaCreditoNombre, setTarjetaCreditoNombre] = useState('BAC Credomatic Visa');
  const [cuotasGasto, setCuotasGasto] = useState(1);
  const [diaCorteGasto, setDiaCorteGasto] = useState('15');
  const [diaPagoGasto, setDiaPagoGasto] = useState('05');
  const [archivoComprobanteGasto, setArchivoComprobanteGasto] = useState(null);

  // Manejador para el archivo de comprobante de gasto
  const manejarCambioArchivoGasto = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoComprobanteGasto(e.target.files[0]);
    }
  };

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

  // ---------------------------------------------------------------------------
  // FUNCIÓN PRINCIPAL: Guardar Egreso (Gasto) con Arquitectura Optimizada
  // ---------------------------------------------------------------------------
  const guardarGasto = async (e) => {
    e.preventDefault();

    const montoNumerico = parseFloat(monto);
    if (!montoNumerico || montoNumerico <= 0) {
      _swal({
        title: 'Monto inválido',
        text: 'Por favor ingresa un monto numérico mayor a cero para el gasto.',
        icon: 'warning',
        button: 'Entendido'
      });
      return;
    }

    if (!fecha) {
      _swal({
        title: 'Fecha requerida',
        text: 'Selecciona la fecha del gasto.',
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
        text: 'Debes iniciar sesión para registrar tus gastos.',
        icon: 'error'
      }).then(() => historial.push('/login'));
      return;
    }

    setGuardando(true);

    try {
      // 1. Subir comprobante a Firebase Storage si se adjuntó un archivo
      let urlFinalComprobante = null;
      if (archivoComprobanteGasto) {
        try {
          const nombreArchivo = `${Date.now()}_${archivoComprobanteGasto.name}`;
          const referenciaStorage = fire_storage.child(`comprobantes/${idUsuario}/${nombreArchivo}`);
          const resultadoSubida = await referenciaStorage.put(archivoComprobanteGasto);
          urlFinalComprobante = await resultadoSubida.ref.getDownloadURL();
        } catch (errorStorage) {
          console.warn('No se pudo subir comprobante de gasto a Storage:', errorStorage);
        }
      }

      // Clave del mes actual en formato "YYYY-MM" para estadísticas agregadas
      const claveMes = fecha.substring(0, 7);

      // Regla de Flujo de Efectivo:
      // affectsCashFlow es false si es compra financiada en múltiples cuotas (> 1) o transferencia propia
      const esTarjetaCredito = cuentaOrigenGasto === 'Tarjeta de crédito' || metodoPagoGasto === 'Tarjeta crédito';
      const cuotasNumero = parseInt(cuotasGasto, 10) || 1;
      const afectaFlujoEfectivo = !esTarjetaCredito || cuotasNumero === 1;

      // Objeto de la entidad de Gasto completa
      const entidadGasto = {
        userId: idUsuario,
        amount: montoNumerico,
        currency: 'GTQ',
        category: categoriaGasto,
        subcategory: subcategoriaGasto.trim() || null,
        account: cuentaOrigenGasto,
        paymentMethod: metodoPagoGasto,
        merchant: comercioGasto.trim() || null,
        status: estadoGasto,
        date: fecha,
        time: hora || obtenerHoraActual(),
        description: descripcion.trim() || categoriaGasto,
        tags: [],
        attachmentUrl: urlFinalComprobante,
        location: null,
        isRecurring: esRecurrenteGasto,
        recurrenceFrequency: esRecurrenteGasto ? frecuenciaGasto : null,
        dueDate: vencimientoGasto || null,
        creditCardDetails: esTarjetaCredito ? {
          cardName: tarjetaCreditoNombre,
          installments: cuotasNumero,
          closingDate: diaCorteGasto || null,
          paymentDueDate: diaPagoGasto || null
        } : null,
        affectsCashFlow: afectaFlujoEfectivo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 2. Operación por lotes (Batch) para optimizar lecturas/escrituras en Firestore
      const loteEscritura = firedb.batch();

      // a) Subcolección dedicada del usuario: users/{idUsuario}/expenses
      const referenciaGasto = firedb.collection('users').doc(idUsuario).collection('expenses').doc();
      loteEscritura.set(referenciaGasto, entidadGasto);

      // b) Agregación mensual desnormalizada: users/{idUsuario}/aggregatedStats/{claveMes}
      const referenciaEstadisticas = firedb.collection('users').doc(idUsuario).collection('aggregatedStats').doc(claveMes);
      const datosAgregados = {
        monthKey: claveMes,
        totalExpense: firebase.firestore.FieldValue.increment(montoNumerico),
        cashFlowExpense: afectaFlujoEfectivo
          ? firebase.firestore.FieldValue.increment(montoNumerico)
          : firebase.firestore.FieldValue.increment(0),
        [`expenseCategoryBreakdown.${categoriaGasto}`]: firebase.firestore.FieldValue.increment(montoNumerico),
        [`expenseAccountBreakdown.${cuentaOrigenGasto}`]: firebase.firestore.FieldValue.increment(montoNumerico),
        ultimaActualizacion: new Date().toISOString()
      };

      if (comercioGasto.trim()) {
        const claveComercio = comercioGasto.trim().replace(/[.#$[\]/]/g, '_');
        datosAgregados[`expenseMerchantBreakdown.${claveComercio}`] = firebase.firestore.FieldValue.increment(montoNumerico);
      }

      loteEscritura.set(referenciaEstadisticas, datosAgregados, { merge: true });

      // Ejecutar lote atómico
      await loteEscritura.commit();

      // c) Escritura en la colección 'caja-chica' para mantener compatibilidad total con Home.jsx
      await firedb.collection('caja-chica').add({
        cantidad: montoNumerico,
        fecha: fecha,
        hora: hora || obtenerHoraActual(),
        descripcion: descripcion.trim() || categoriaGasto,
        idUser: parseUserId(idUsuario),
        tipo: 1, // 1 = Egreso
        categoria: categoriaGasto,
        subcategoria: subcategoriaGasto.trim() || null,
        cuentaOrigen: cuentaOrigenGasto,
        metodoPago: metodoPagoGasto,
        comercio: comercioGasto.trim() || null,
        esRecurrente: esRecurrenteGasto,
        estado: estadoGasto,
        cuotas: esTarjetaCredito ? cuotasNumero : 1
      });

      // Recordar preferencias en el almacenamiento local para inteligencia de usuario
      localStorage.setItem('ultima_cuenta_gasto', cuentaOrigenGasto);
      localStorage.setItem('ultimo_metodo_pago_gasto', metodoPagoGasto);
      if (comercioGasto.trim()) {
        localStorage.setItem('ultimo_comercio_gasto', comercioGasto.trim());
      }

      _swal({
        title: '¡Gasto Registrado!',
        text: `Se registraron Q ${montoNumerico.toFixed(2)} en ${categoriaGasto}.`,
        icon: 'success',
        timer: 1300,
        buttons: false
      });

      historial.push('/home');
    } catch (error) {
      console.error('Error al registrar gasto en Firestore:', error);
      _swal({
        title: 'Error al registrar gasto',
        text: 'Ocurrió un error al guardar en la base de datos. Inténtalo de nuevo.',
        icon: 'error'
      });
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
          /* FORMULARIO DE EGRESO (GASTO) FINANZIA CON DIVULGACIÓN PROGRESIVA    */
          /* =================================================================== */
          <form onSubmit={guardarGasto}>
            
            {/* 1. CAJA DESTACADA DEL MONTO (Estilo Gasto Coral) */}
            <div className="caja-captura-monto gasto">
              <div className="etiqueta-monto-guia" style={{ color: '#F46F5F' }}>
                Monto del Gasto
              </div>
              <div className="fila-entrada-monto">
                <span className="prefijo-moneda-monto gasto">Q</span>
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

              {/* Píldoras de suma rápida para gastos */}
              <div className="pildoras-sumas-rapidas">
                {[10, 25, 50, 100, 500].map((cantidadRapida) => (
                  <button
                    type="button"
                    key={cantidadRapida}
                    className="boton-suma-rapida"
                    onClick={() => agregarMontoRapido(cantidadRapida)}
                  >
                    +Q{cantidadRapida}
                  </button>
                ))}
                {monto && (
                  <button
                    type="button"
                    className="boton-suma-rapida"
                    style={{ color: '#F46F5F', borderColor: '#FCDCD4' }}
                    onClick={() => setMonto('')}
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* 2. CAMPO DESCRIPCIÓN O CONCEPTO (Manual) */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="etiqueta-campo-finanzia mb-0">
                  <i className="fas fa-shopping-cart mr-1" style={{ color: '#F46F5F' }}></i> Concepto o Descripción
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
                  placeholder="Ej. Supermercado Walmart, Gasolina, Almuerzo..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </div>

            {/* 3. SELECCIÓN DE CATEGORÍA DE GASTO CON ICONOS */}
            <div className="mb-3">
              <div className="seccion-categorias-titulo">
                <span>Categoría de Gasto</span>
                <span style={{ fontSize: '0.74rem', color: '#8E92A4', fontWeight: 500 }}>
                  Seleccionada: <strong style={{ color: '#F46F5F' }}>{categoriaGasto}</strong>
                </span>
              </div>
              
              <div className="grilla-categorias-finanzia">
                {CATEGORIAS_EGRESOS.map((cat) => (
                  <div
                    key={cat.nombre}
                    className={`tarjeta-categoria-finanzia ${categoriaGasto === cat.nombre ? 'gasto activa' : ''}`}
                    onClick={() => {
                      setCategoriaGasto(cat.nombre);
                      if (cat.subcategorias && cat.subcategorias.length > 0 && !subcategoriaGasto) {
                        setSubcategoriaGasto(cat.subcategorias[0]);
                      }
                    }}
                  >
                    <div className="icono-categoria-finanzia">
                      <i className={cat.icono} style={{ color: categoriaGasto === cat.nombre ? (cat.color || '#F46F5F') : '#8E92A4' }}></i>
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

            {/* BOTÓN DESPLEGABLE PARA OPCIONES AVANZADAS (Siempre antes del botón guardar) */}
            <button
              type="button"
              className="boton-desplegar-avanzado my-3"
              onClick={() => setMostrarOpcionesAvanzadas(!mostrarOpcionesAvanzadas)}
            >
              <span>
                {mostrarOpcionesAvanzadas
                  ? '▲ Ocultar opciones avanzadas'
                  : '▼ Más detalles (opcional: cuenta, TC, cuotas, comercio)'}
              </span>
            </button>

            {/* =============================================================== */}
            {/* PANEL DE OPCIONES AVANZADAS DE EGRESOS (Progressive Disclosure) */}
            {/* =============================================================== */}
            {mostrarOpcionesAvanzadas && (
              <div className="panel-opciones-avanzadas mb-3">
                
                {/* BLOQUE A: CUENTA ORIGEN Y MÉTODO DE PAGO */}
                <div className="seccion-avanzada-bloque">
                  <div className="titulo-seccion-avanzada">
                    <i className="fas fa-wallet mr-1" style={{ color: '#F46F5F' }}></i> Cuenta y Método de Pago
                  </div>
                  
                  <div className="row g-2">
                    <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                      <label className="etiqueta-campo-finanzia">Cuenta origen (de dónde sale el dinero)</label>
                      <select
                        className="campo-formulario-finanzia"
                        value={cuentaOrigenGasto}
                        onChange={(e) => {
                          const nuevaCuenta = e.target.value;
                          setCuentaOrigenGasto(nuevaCuenta);
                          if (nuevaCuenta === 'Tarjeta de crédito') {
                            setMetodoPagoGasto('Tarjeta crédito');
                          }
                        }}
                      >
                        {CUENTAS_ORIGEN_EGRESOS.map(cuenta => (
                          <option key={cuenta} value={cuenta}>{cuenta}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="etiqueta-campo-finanzia">Método de pago</label>
                      <select
                        className="campo-formulario-finanzia"
                        value={metodoPagoGasto}
                        onChange={(e) => setMetodoPagoGasto(e.target.value)}
                      >
                        {METODOS_PAGO_EGRESOS.map(metodo => (
                          <option key={metodo} value={metodo}>{metodo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* BLOQUE B: MANEJO ESPECIAL DE TARJETA DE CRÉDITO Y CUOTAS */}
                {(cuentaOrigenGasto === 'Tarjeta de crédito' || metodoPagoGasto === 'Tarjeta crédito') && (
                  <div className="tarjeta-credito-especial-bloque">
                    <div className="cabecera-tarjeta-credito-especial">
                      <span className="titulo-tarjeta-credito-especial">
                        <i className="fas fa-credit-card"></i> Configuración de Tarjeta de Crédito
                      </span>
                      <span className="badge-finanzas-tc">Control de Deuda</span>
                    </div>

                    <div className="row g-2 mb-2">
                      <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                        <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>Tarjeta utilizada</label>
                        <input
                          type="text"
                          placeholder="Ej. BAC Credomatic Visa, BI Mastercard..."
                          className="campo-formulario-finanzia"
                          value={tarjetaCreditoNombre}
                          onChange={(e) => setTarjetaCreditoNombre(e.target.value)}
                        />
                      </div>

                      <div className="col-12 col-sm-6">
                        <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>Número de cuotas</label>
                        <select
                          className="campo-formulario-finanzia"
                          value={cuotasGasto}
                          onChange={(e) => setCuotasGasto(parseInt(e.target.value, 10))}
                        >
                          <option value={1}>1 pago al contado (sin cuotas)</option>
                          <option value={3}>3 cuotas</option>
                          <option value={6}>6 cuotas</option>
                          <option value={10}>10 cuotas</option>
                          <option value={12}>12 cuotas (1 año)</option>
                          <option value={18}>18 cuotas</option>
                          <option value={24}>24 cuotas (2 años)</option>
                          <option value={36}>36 cuotas (3 años)</option>
                        </select>
                      </div>
                    </div>

                    <div className="row g-2">
                      <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                        <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>Día de corte mensual</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Ej. 15"
                          className="campo-formulario-finanzia"
                          value={diaCorteGasto}
                          onChange={(e) => setDiaCorteGasto(e.target.value)}
                        />
                      </div>

                      <div className="col-12 col-sm-6">
                        <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>Día límite de pago</label>
                        <input
                          type="number"
                          min="1"
                          max="31"
                          placeholder="Ej. 05"
                          className="campo-formulario-finanzia"
                          value={diaPagoGasto}
                          onChange={(e) => setDiaPagoGasto(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="mt-2" style={{ fontSize: '0.74rem', color: '#4338CA' }}>
                      <i className="fas fa-info-circle mr-1"></i>
                      {cuotasGasto > 1
                        ? `Compra diferida: cada cuota mensual será de aprox. Q ${(parseFloat(monto || 0) / cuotasGasto).toFixed(2)}.`
                        : 'Pago al contado: el saldo impactará en tu estado de cuenta del mes en curso.'}
                    </div>
                  </div>
                )}

                {/* BLOQUE C: COMERCIO Y SUBCATEGORÍA */}
                <div className="seccion-avanzada-bloque">
                  <div className="titulo-seccion-avanzada">
                    <i className="fas fa-store mr-1" style={{ color: '#F46F5F' }}></i> Comercio y Clasificación
                  </div>

                  <div className="row g-2 mb-2">
                    <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                      <label className="etiqueta-campo-finanzia">Comercio o Beneficiario</label>
                      <input
                        type="text"
                        placeholder="Ej. Walmart, Shell, Amazon, Restaurante..."
                        className="campo-formulario-finanzia"
                        value={comercioGasto}
                        onChange={(e) => setComercioGasto(e.target.value)}
                      />
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="etiqueta-campo-finanzia">Subcategoría</label>
                      {(() => {
                        const catActiva = CATEGORIAS_EGRESOS.find(c => c.nombre === categoriaGasto);
                        const listaSub = catActiva ? catActiva.subcategorias : [];
                        return (
                          <div>
                            <select
                              className="campo-formulario-finanzia mb-1"
                              value={subcategoriaGasto}
                              onChange={(e) => setSubcategoriaGasto(e.target.value)}
                            >
                              <option value="">-- Seleccionar o escribir --</option>
                              {listaSub.map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                              <option value="__otra__">Otra (personalizada)...</option>
                            </select>
                            {subcategoriaGasto === '__otra__' && (
                              <input
                                type="text"
                                placeholder="Escribe subcategoría personalizada"
                                className="campo-formulario-finanzia mt-1"
                                onChange={(e) => setSubcategoriaGasto(e.target.value)}
                                autoFocus
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* BLOQUE D: ESTADO Y RECURRENCIA */}
                <div className="seccion-avanzada-bloque">
                  <div className="titulo-seccion-avanzada">
                    <i className="fas fa-sync-alt mr-1" style={{ color: '#F46F5F' }}></i> Seguimiento y Recurrencia
                  </div>

                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                      <label className="etiqueta-campo-finanzia">Estado del gasto</label>
                      <select
                        className="campo-formulario-finanzia"
                        value={estadoGasto}
                        onChange={(e) => setEstadoGasto(e.target.value)}
                      >
                        {ESTADOS_EGRESOS.map(est => (
                          <option key={est} value={est}>{est}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-sm-6">
                      <label className="etiqueta-campo-finanzia">¿Es un gasto recurrente?</label>
                      <div className="d-flex align-items-center gap-2 p-2 bg-white rounded border">
                        <input
                          type="checkbox"
                          id="checkGastoRecurrente"
                          checked={esRecurrenteGasto}
                          onChange={(e) => setEsRecurrenteGasto(e.target.checked)}
                          style={{ width: '18px', height: '18px', accentColor: '#F46F5F' }}
                        />
                        <label htmlFor="checkGastoRecurrente" className="mb-0" style={{ fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
                          Repetir gasto automáticamente
                        </label>
                      </div>
                    </div>
                  </div>

                  {esRecurrenteGasto && (
                    <div className="row g-2 mt-2">
                      <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                        <label className="etiqueta-campo-finanzia">Frecuencia de repetición</label>
                        <select
                          className="campo-formulario-finanzia"
                          value={frecuenciaGasto}
                          onChange={(e) => setFrecuenciaGasto(e.target.value)}
                        >
                          {FRECUENCIAS_RECURRENCIA.map(frec => (
                            <option key={frec} value={frec}>{frec}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-12 col-sm-6">
                        <label className="etiqueta-campo-finanzia">Fecha de próximo vencimiento</label>
                        <input
                          type="date"
                          className="campo-formulario-finanzia"
                          value={vencimientoGasto}
                          onChange={(e) => setVencimientoGasto(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* BLOQUE E: AUDITORÍA Y COMPROBANTE */}
                <div className="seccion-avanzada-bloque">
                  <div className="titulo-seccion-avanzada">
                    <i className="fas fa-file-invoice mr-1" style={{ color: '#F46F5F' }}></i> Auditoría y Comprobante
                  </div>

                  <div className="mb-2">
                    <label className="etiqueta-campo-finanzia">Notas internas adicionales</label>
                    <textarea
                      rows="2"
                      className="campo-formulario-finanzia"
                      placeholder="Escribe detalles o notas sobre este gasto..."
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                    ></textarea>
                  </div>

                  <div>
                    <label className="etiqueta-campo-finanzia">Adjuntar comprobante o ticket</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      className="campo-formulario-finanzia"
                      onChange={manejarCambioArchivoGasto}
                      style={{ padding: '6px 10px' }}
                    />
                    {archivoComprobanteGasto && (
                      <span style={{ fontSize: '0.74rem', color: '#10B981', fontWeight: 600 }}>
                        <i className="fas fa-check mr-1"></i> Archivo: {archivoComprobanteGasto.name}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* BOTÓN PRINCIPAL DE GUARDAR GASTO (Siempre al final, después de opciones avanzadas) */}
            <button
              type="submit"
              className="boton-guardar-gasto"
              disabled={guardando}
            >
              {guardando ? (
                <span><i className="fas fa-spinner fa-spin mr-2"></i> Guardando gasto...</span>
              ) : (
                <span>
                  <i className="fas fa-fire mr-1"></i>
                  Guardar Gasto {monto ? `(Q ${parseFloat(monto || 0).toFixed(2)})` : ''}
                </span>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
