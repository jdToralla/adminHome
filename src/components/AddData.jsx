import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import _swal from 'sweetalert';
import { auth, firedb, firebase } from '../firebaseConfig';
import { subirACloudinary } from '../utils/cloudinary';
import {
  formatearAFechaInput,
  formatearAFechaVisual,
  determinarCicloGasto
} from '../utils/tarjetasCredito';
import VisorImagenModal from './VisorImagenModal';
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
  const [urlVistaPrevia, setUrlVistaPrevia] = useState(null);
  const [modalImagenGrande, setModalImagenGrande] = useState(null);
  const [impactoPatrimonial, setImpactoPatrimonial] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Estados de progreso de subida a Cloudinary
  const [progresoSubida, setProgresoSubida] = useState(0);
  const [estadoSubidaTexto, setEstadoSubidaTexto] = useState('');

  // Referencias a los inputs de archivo para Ingresos (Cámara y Galería)
  const refInputCamaraIngreso = useRef(null);
  const refInputGaleriaIngreso = useRef(null);

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
  const [cuotasGasto, setCuotasGasto] = useState(1);
  const [archivoComprobanteGasto, setArchivoComprobanteGasto] = useState(null);
  const [urlVistaPreviaGasto, setUrlVistaPreviaGasto] = useState(null);

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // 4. ESTADOS PARA TARJETAS DE CRÉDITO (PERSONAL O FAMILIAR)
  // ---------------------------------------------------------------------------
  const [tarjetasDisponibles, setTarjetasDisponibles] = useState([]);
  const [tarjetaSeleccionadaId, setTarjetaSeleccionadaId] = useState('');

  // En Egresos: ¿Quién realizó el gasto?
  const [usuarioGasto, setUsuarioGasto] = useState(() => {
    return localStorage.getItem('ultimo_usuario_gasto') || 'Usuario 1';
  });
  const [mostrarInputNuevoUsuario, setMostrarInputNuevoUsuario] = useState(false);
  const [nuevoUsuarioInline, setNuevoUsuarioInline] = useState('');

  // En Egresos: Modo Dividir Cuenta entre varios familiares
  const [modoDividirCuenta, setModoDividirCuenta] = useState(false);
  const [usuariosDivididos, setUsuariosDivididos] = useState([]);

  // En Ingresos: Configuración de Tarjeta de Crédito (Personal o Familiar)
  const [tcIngresoHabilitarTarjeta, setTcIngresoHabilitarTarjeta] = useState(true);
  const [tcIngresoEsFamiliar, setTcIngresoEsFamiliar] = useState(false);
  const [tcIngresoNombre, setTcIngresoNombre] = useState('VISA Plata');
  const [tcIngresoCuotas, setTcIngresoCuotas] = useState(1);
  const [tcIngresoFechaCorte, setTcIngresoFechaCorte] = useState('2026-11-06');
  const [tcIngresoFechaPago, setTcIngresoFechaPago] = useState('2026-12-01');
  const [tcIngresoUsuarios, setTcIngresoUsuarios] = useState(['Usuario 1', 'Usuario 2']);
  const [tcIngresoNuevoUsuario, setTcIngresoNuevoUsuario] = useState('');

  // Cargar tarjetas de crédito del usuario
  useEffect(() => {
    const idUsuario = localStorage.getItem('currentId');
    if (!idUsuario) {
      setTarjetasDisponibles([]);
      return;
    }
    const uidNormalizado = parseUserId(idUsuario);

    const cargarTarjetas = async () => {
      try {
        const snap = await firedb
          .collection('tarjetas-credito')
          .where('idUser', '==', uidNormalizado)
          .get();

        if (!snap.empty) {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTarjetasDisponibles(list);
          const primera = list[0];
          setTarjetaSeleccionadaId(primera.id);
          setTcIngresoNombre(primera.nombre || 'VISA Plata');
          setTcIngresoHabilitarTarjeta(primera.habilitarTarjeta !== false && primera.activa !== false);
          setTcIngresoEsFamiliar(primera.esFamiliar === true);
          if (primera.cuotasPredeterminadas) setTcIngresoCuotas(primera.cuotasPredeterminadas);
          if (primera.fechaCorte) setTcIngresoFechaCorte(formatearAFechaInput(primera.fechaCorte));
          if (primera.fechaPago) setTcIngresoFechaPago(formatearAFechaInput(primera.fechaPago));
          if (primera.usuariosInvolucrados && primera.usuariosInvolucrados.length > 0) {
            setTcIngresoUsuarios(primera.usuariosInvolucrados);
          }
        } else {
          setTarjetasDisponibles([]);
          setTarjetaSeleccionadaId('');
          setTcIngresoHabilitarTarjeta(false);
          setTcIngresoEsFamiliar(false);
        }
      } catch (err) {
        console.warn('Aviso cargando tarjetas en AddData:', err);
      }
    };

    cargarTarjetas();
  }, []);

  // Tarjeta activa seleccionada
  const tarjetaActualSeleccionada = useMemo(() => {
    if (!tarjetasDisponibles || tarjetasDisponibles.length === 0) return null;
    return tarjetasDisponibles.find(t => t.id === tarjetaSeleccionadaId) || tarjetasDisponibles[0] || null;
  }, [tarjetasDisponibles, tarjetaSeleccionadaId]);

  // Si la tarjeta está habilitada y si es familiar
  const tcHabilitada = Boolean(
    tarjetaActualSeleccionada &&
    tarjetaActualSeleccionada.habilitarTarjeta !== false &&
    tarjetaActualSeleccionada.activa !== false
  );
  const tcEsFamiliar = Boolean(
    (tcHabilitada && tarjetaActualSeleccionada?.esFamiliar === true) ||
    tarjetasDisponibles.some(t => t.esFamiliar === true && t.habilitarTarjeta !== false)
  );

  // Lista de usuarios disponibles para asociar al gasto (solo relevante si es familiar)
  const listaUsuariosDisponibles = useMemo(() => {
    const tarjetaFamiliarEncontrada = tarjetaActualSeleccionada?.esFamiliar
      ? tarjetaActualSeleccionada
      : tarjetasDisponibles.find(t => t.esFamiliar === true && t.habilitarTarjeta !== false);

    const usuariosTc = tarjetaFamiliarEncontrada?.usuariosInvolucrados || tarjetaActualSeleccionada?.usuariosInvolucrados || [];
    const base = usuariosTc.length > 0 ? usuariosTc : ['Usuario 1', 'Usuario 2'];
    if (usuarioGasto && !base.includes(usuarioGasto)) {
      return [...base, usuarioGasto];
    }
    return base;
  }, [tarjetaActualSeleccionada, tarjetasDisponibles, usuarioGasto]);

  // Alternar modo dividir cuenta entre varios familiares
  const alternarModoDividirCuenta = () => {
    const nuevoModo = !modoDividirCuenta;
    setModoDividirCuenta(nuevoModo);
    if (nuevoModo) {
      if (usuariosDivididos.length === 0) {
        if (listaUsuariosDisponibles.length >= 2) {
          setUsuariosDivididos([...listaUsuariosDisponibles]);
        } else {
          setUsuariosDivididos(listaUsuariosDisponibles.length > 0 ? [listaUsuariosDisponibles[0]] : ['Usuario 1']);
        }
      }
    }
  };

  // Alternar selección de un usuario en el modo división
  const toggleUsuarioDividido = (nombre) => {
    if (usuariosDivididos.includes(nombre)) {
      setUsuariosDivididos(usuariosDivididos.filter(u => u !== nombre));
    } else {
      setUsuariosDivididos([...usuariosDivididos, nombre]);
    }
  };

  const seleccionarTodosLosFamiliares = () => {
    setUsuariosDivididos([...listaUsuariosDisponibles]);
  };

  const deseleccionarTodosLosFamiliares = () => {
    setUsuariosDivididos([]);
  };

  // Ciclo calculado para el gasto según la fecha seleccionada y la tarjeta
  const cicloGastoCalculado = useMemo(() => {
    return determinarCicloGasto(fecha, tarjetaActualSeleccionada);
  }, [fecha, tarjetaActualSeleccionada]);

  // Referencias a los inputs de archivo para Egresos (Cámara y Galería)
  const refInputCamaraGasto = useRef(null);
  const refInputGaleriaGasto = useRef(null);

  // Utilidad para formatear el tamaño en KB / MB
  const formatearTamanioArchivo = (bytes) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    if (bytes < k) return `${bytes} B`;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${['B', 'KB', 'MB'][i]}`;
  };

  // Manejador para seleccionar o fotografiar comprobante
  const manejarSeleccionComprobante = (e, esGasto = false) => {
    if (e.target.files && e.target.files[0]) {
      const archivo = e.target.files[0];
      const urlBlob = URL.createObjectURL(archivo);
      if (esGasto) {
        if (urlVistaPreviaGasto) URL.revokeObjectURL(urlVistaPreviaGasto);
        setArchivoComprobanteGasto(archivo);
        setUrlVistaPreviaGasto(urlBlob);
      } else {
        if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
        setArchivoComprobante(archivo);
        setUrlVistaPrevia(urlBlob);
      }
    }
  };

  // Manejador para quitar o descartar comprobante seleccionado
  const quitarComprobante = (esGasto = false) => {
    if (esGasto) {
      if (urlVistaPreviaGasto) URL.revokeObjectURL(urlVistaPreviaGasto);
      setArchivoComprobanteGasto(null);
      setUrlVistaPreviaGasto(null);
      if (refInputCamaraGasto.current) refInputCamaraGasto.current.value = '';
      if (refInputGaleriaGasto.current) refInputGaleriaGasto.current.value = '';
    } else {
      if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
      setArchivoComprobante(null);
      setUrlVistaPrevia(null);
      if (refInputCamaraIngreso.current) refInputCamaraIngreso.current.value = '';
      if (refInputGaleriaIngreso.current) refInputGaleriaIngreso.current.value = '';
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
      // 1. Subir comprobante a Cloudinary si se adjuntó un archivo
      let urlFinalComprobante = null;
      if (archivoComprobante) {
        try {
          urlFinalComprobante = await subirACloudinary(
            archivoComprobante,
            (porcentaje) => setProgresoSubida(porcentaje),
            (texto) => setEstadoSubidaTexto(texto)
          );
        } catch (errorCloudinary) {
          console.warn('Error al subir comprobante a Cloudinary, guardando sin comprobante:', errorCloudinary);
          _swal({
            title: 'Aviso de comprobante',
            text: 'No se pudo subir la foto del comprobante, pero tu ingreso se guardará correctamente.',
            icon: 'warning',
            button: 'Continuar'
          });
        }
      }

      // Clave del mes actual en formato "YYYY-MM" para estadísticas agregadas
      const claveMes = fecha.substring(0, 7);

      // Manejo de Configuración de Tarjeta de Crédito si aplica
      const esTcIngreso = categoriaSeleccionada === 'Tarjeta de crédito' || cuentaDestino === 'Tarjeta de crédito';
      let idTarjetaFinal = tarjetaSeleccionadaId;
      if (esTcIngreso) {
        idTarjetaFinal = tarjetaSeleccionadaId || `tc_${Date.now()}`;
        try {
          await firedb.collection('tarjetas-credito').doc(idTarjetaFinal).set({
            idUser: parseUserId(idUsuario),
            habilitarTarjeta: tcIngresoHabilitarTarjeta,
            esFamiliar: tcIngresoEsFamiliar,
            activa: tcIngresoHabilitarTarjeta,
            nombre: tcIngresoNombre.trim() || 'Tarjeta de Crédito',
            cuotasPredeterminadas: parseInt(tcIngresoCuotas, 10) || 1,
            fechaCorte: tcIngresoFechaCorte,
            fechaPago: tcIngresoFechaPago,
            usuariosInvolucrados: tcIngresoEsFamiliar ? tcIngresoUsuarios : [],
            actualizadoEn: new Date().toISOString()
          }, { merge: true });
        } catch (eCard) {
          console.warn('Error guardando tarjeta en Firestore:', eCard);
        }
      }

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
        creditCardConfig: esTcIngreso ? {
          cardName: tcIngresoNombre.trim(),
          cardId: idTarjetaFinal,
          habilitarTarjeta: tcIngresoHabilitarTarjeta,
          esFamiliar: tcIngresoEsFamiliar,
          installments: parseInt(tcIngresoCuotas, 10) || 1,
          closingDate: tcIngresoFechaCorte,
          paymentDueDate: tcIngresoFechaPago,
          involvedUsers: tcIngresoEsFamiliar ? tcIngresoUsuarios : []
        } : null,
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
        estado: estadoTransaccion,
        attachmentUrl: urlFinalComprobante || null,
        urlComprobante: urlFinalComprobante || null,
        tarjetaCreditoNombre: esTcIngreso ? tcIngresoNombre.trim() : null,
        tarjetaCreditoId: esTcIngreso ? idTarjetaFinal : null,
        fechaCorte: esTcIngreso ? tcIngresoFechaCorte : null,
        fechaPago: esTcIngreso ? tcIngresoFechaPago : null,
        usuariosInvolucrados: esTcIngreso ? tcIngresoUsuarios : null
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
      setProgresoSubida(0);
      setEstadoSubidaTexto('');
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

    // Validación de división de cuenta entre familiares
    if (tcEsFamiliar && modoDividirCuenta) {
      if (usuariosDivididos.length < 2) {
        _swal({
          title: 'Familiares insuficientes',
          text: 'Para dividir la cuenta debes seleccionar al menos 2 familiares.',
          icon: 'warning'
        });
        return;
      }
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
      // 1. Subir comprobante a Cloudinary si se adjuntó un archivo
      let urlFinalComprobante = null;
      if (archivoComprobanteGasto) {
        try {
          urlFinalComprobante = await subirACloudinary(
            archivoComprobanteGasto,
            (porcentaje) => setProgresoSubida(porcentaje),
            (texto) => setEstadoSubidaTexto(texto)
          );
        } catch (errorCloudinary) {
          console.warn('Error al subir comprobante de gasto a Cloudinary:', errorCloudinary);
          _swal({
            title: 'Aviso de comprobante',
            text: 'No se pudo subir la foto del comprobante, pero tu gasto se guardará correctamente.',
            icon: 'warning',
            button: 'Continuar'
          });
        }
      }

      // Clave del mes actual en formato "YYYY-MM" para estadísticas agregadas
      const claveMes = fecha.substring(0, 7);

      // Regla de Flujo de Efectivo y Ciclo de Tarjeta de Crédito:
      const esTarjetaCredito = cuentaOrigenGasto === 'Tarjeta de crédito' || metodoPagoGasto === 'Tarjeta crédito';
      const cuotasNumero = parseInt(cuotasGasto, 10) || 1;
      const afectaFlujoEfectivo = !esTarjetaCredito || cuotasNumero === 1;

      // Calcular ciclo de facturación (fecha de corte y pago)
      const cicloAsignado = esTarjetaCredito
        ? determinarCicloGasto(fecha, tarjetaActualSeleccionada)
        : null;

      // Objeto base de la entidad de Gasto
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
        usuarioGasto: tcEsFamiliar ? (usuarioGasto || 'Usuario 1') : null,
        creditCardDetails: esTarjetaCredito ? {
          cardName: tarjetaActualSeleccionada?.nombre || 'Tarjeta de Crédito',
          cardId: tarjetaActualSeleccionada?.id || null,
          esFamiliar: tcEsFamiliar,
          installments: cuotasNumero,
          closingDate: cicloAsignado?.fechaCorte || null,
          paymentDueDate: cicloAsignado?.fechaPago || null,
          cycleKey: cicloAsignado?.claveCiclo || null
        } : null,
        affectsCashFlow: afectaFlujoEfectivo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 2. Operación por lotes (Batch) para optimizar lecturas/escrituras en Firestore
      const loteEscritura = firedb.batch();

      const esDivision = Boolean(tcEsFamiliar && modoDividirCuenta && usuariosDivididos.length >= 2);
      const N = esDivision ? usuariosDivididos.length : 1;
      const individualBase = esDivision ? Math.floor((montoNumerico / N) * 100) / 100 : montoNumerico;
      const centavosRestantes = esDivision ? Math.round((montoNumerico - (individualBase * N)) * 100) : 0;
      const grupoDivisionId = esDivision ? `split_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` : null;

      if (esDivision) {
        for (let i = 0; i < usuariosDivididos.length; i++) {
          const persona = usuariosDivididos[i];
          const montoPersona = i === 0 ? Number((individualBase + (centavosRestantes / 100)).toFixed(2)) : individualBase;
          const refGastoIndiv = firedb.collection('users').doc(idUsuario).collection('expenses').doc();
          loteEscritura.set(refGastoIndiv, {
            ...entidadGasto,
            amount: montoPersona,
            usuarioGasto: persona,
            esGastoDividido: true,
            grupoDivisionId: grupoDivisionId,
            montoTotalGrupal: montoNumerico,
            montoIndividual: montoPersona,
            usuariosEnGrupo: usuariosDivididos,
            cantidadEnGrupo: N
          });
        }
      } else {
        // Subcolección dedicada del usuario: users/{idUsuario}/expenses
        const referenciaGasto = firedb.collection('users').doc(idUsuario).collection('expenses').doc();
        loteEscritura.set(referenciaGasto, entidadGasto);
      }

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

      // c) Escritura en la colección 'caja-chica' para mantener compatibilidad total con Home y Tarjeta Familiar
      if (esDivision) {
        for (let i = 0; i < usuariosDivididos.length; i++) {
          const persona = usuariosDivididos[i];
          const montoPersona = i === 0 ? Number((individualBase + (centavosRestantes / 100)).toFixed(2)) : individualBase;

          await firedb.collection('caja-chica').add({
            cantidad: montoPersona,
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
            cuotas: esTarjetaCredito ? cuotasNumero : 1,
            attachmentUrl: urlFinalComprobante || null,
            urlComprobante: urlFinalComprobante || null,
            usuarioGasto: persona,
            tarjetaCreditoNombre: esTarjetaCredito ? (tarjetaActualSeleccionada?.nombre || null) : null,
            tarjetaCreditoId: esTarjetaCredito ? (tarjetaActualSeleccionada?.id || null) : null,
            tarjetaEsFamiliar: true,
            fechaCorte: cicloAsignado ? cicloAsignado.fechaCorte : null,
            fechaPago: cicloAsignado ? cicloAsignado.fechaPago : null,
            claveCiclo: cicloAsignado ? cicloAsignado.claveCiclo : null,
            esGastoDividido: true,
            grupoDivisionId: grupoDivisionId,
            montoTotalGrupal: montoNumerico,
            montoIndividual: montoPersona,
            usuariosEnGrupo: usuariosDivididos,
            cantidadEnGrupo: N
          });
        }
      } else {
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
          cuotas: esTarjetaCredito ? cuotasNumero : 1,
          attachmentUrl: urlFinalComprobante || null,
          urlComprobante: urlFinalComprobante || null,
          usuarioGasto: tcEsFamiliar ? (usuarioGasto || 'Usuario 1') : null,
          tarjetaCreditoNombre: esTarjetaCredito ? (tarjetaActualSeleccionada?.nombre || null) : null,
          tarjetaCreditoId: esTarjetaCredito ? (tarjetaActualSeleccionada?.id || null) : null,
          tarjetaEsFamiliar: esTarjetaCredito ? tcEsFamiliar : false,
          fechaCorte: cicloAsignado ? cicloAsignado.fechaCorte : null,
          fechaPago: cicloAsignado ? cicloAsignado.fechaPago : null,
          claveCiclo: cicloAsignado ? cicloAsignado.claveCiclo : null
        });
      }

      // Recordar preferencias en el almacenamiento local para inteligencia de usuario
      localStorage.setItem('ultimo_usuario_gasto', usuarioGasto);
      localStorage.setItem('ultima_cuenta_gasto', cuentaOrigenGasto);
      localStorage.setItem('ultimo_metodo_pago_gasto', metodoPagoGasto);
      if (comercioGasto.trim()) {
        localStorage.setItem('ultimo_comercio_gasto', comercioGasto.trim());
      }

      if (esDivision) {
        _swal({
          title: '¡Gasto Dividido Registrado!',
          text: `Se registraron Q ${montoNumerico.toFixed(2)} divididos entre ${N} personas (Q ${(montoNumerico / N).toFixed(2)} c/u).`,
          icon: 'success',
          timer: 1600,
          buttons: false
        });
      } else {
        _swal({
          title: '¡Gasto Registrado!',
          text: `Se registraron Q ${montoNumerico.toFixed(2)} en ${categoriaGasto}.`,
          icon: 'success',
          timer: 1300,
          buttons: false
        });
      }

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
      setProgresoSubida(0);
      setEstadoSubidaTexto('');
    }
  };

  const esModoIngreso = tipoMovimiento === 2;

  return (
    <div className="container" style={{ paddingTop: '16px', paddingBottom: '90px', maxWidth: '640px' }}>

      {/* =============================================================== */}
      {/* ENCABEZADO SUPERIOR ESTANDARIZADO                               */}
      {/* =============================================================== */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '38px', height: '38px' }}
            onClick={() => historial.push('/home')}
            title="Volver a Inicio"
          >
            <i className="fas fa-arrow-left text-dark"></i>
          </button>
          <div>
            <h4 className="mb-0 font-weight-bold" style={{ fontSize: '1.25rem', color: '#1E1F30' }}>
              {esModoIngreso ? 'Nuevo Ingreso' : 'Nuevo Egreso'}
            </h4>
            <span style={{ fontSize: '0.74rem', color: '#8E92A4', fontWeight: 600 }}>
              {esModoIngreso ? 'Registro rápido de entrada' : 'Registro rápido de gasto'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-light shadow-sm rounded-circle d-flex align-items-center justify-content-center"
          style={{ width: '38px', height: '38px' }}
          onClick={() => {
            setMonto('');
            setDescripcion('');
          }}
          title="Reiniciar formulario"
        >
          <i className="fas fa-redo-alt" style={{ color: '#4E44EB' }}></i>
        </button>
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

            {/* CONFIGURACIÓN DE TARJETA DE CRÉDITO (En Ingresos) */}
            {(categoriaSeleccionada === 'Tarjeta de crédito' || cuentaDestino === 'Tarjeta de crédito') && (
              <div className="tarjeta-credito-especial-bloque mb-3">
                <div className="cabecera-tarjeta-credito-especial">
                  <span className="titulo-tarjeta-credito-especial">
                    <i className="fas fa-credit-card mr-1"></i> Configuración de Tarjeta de Crédito
                  </span>
                  <span className="badge-finanzas-tc">
                    {tcIngresoHabilitarTarjeta ? (tcIngresoEsFamiliar ? 'Familiar' : 'Personal') : 'Inactiva'}
                  </span>
                </div>

                {/* SWITCH 1: Habilitar Tarjeta */}
                <div className="bloque-switch-finanzia mb-2 p-2 bg-white rounded border d-flex justify-content-between align-items-center">
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#1E1F30' }}>Habilitar seguimiento de Tarjeta</strong>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.73rem' }}>
                      Activa alertas de pago, fechas de corte y cálculo de cuotas.
                    </p>
                  </div>
                  <div className="custom-control custom-switch">
                    <input
                      type="checkbox"
                      className="custom-control-input"
                      id="switchHabilitarTcIngreso"
                      checked={tcIngresoHabilitarTarjeta}
                      onChange={(e) => setTcIngresoHabilitarTarjeta(e.target.checked)}
                    />
                    <label className="custom-control-label" htmlFor="switchHabilitarTcIngreso"></label>
                  </div>
                </div>

                {/* SWITCH 2: ¿Es Familiar / Compartida? (Solo si el Switch 1 está activo) */}
                {tcIngresoHabilitarTarjeta && (
                  <div className="bloque-switch-finanzia mb-3 p-2 bg-white rounded border d-flex justify-content-between align-items-center">
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#1E1F30' }}>¿Es Tarjeta Familiar / Compartida?</strong>
                      <p className="mb-0 text-muted" style={{ fontSize: '0.73rem' }}>
                        Permite asignar gastos a diferentes familiares y ver cuánto debe pagar cada uno.
                      </p>
                    </div>
                    <div className="custom-control custom-switch">
                      <input
                        type="checkbox"
                        className="custom-control-input"
                        id="switchFamiliarTcIngreso"
                        checked={tcIngresoEsFamiliar}
                        onChange={(e) => setTcIngresoEsFamiliar(e.target.checked)}
                      />
                      <label className="custom-control-label" htmlFor="switchFamiliarTcIngreso"></label>
                    </div>
                  </div>
                )}

                {tcIngresoHabilitarTarjeta && (
                  <>
                    {/* Nombre de la tarjeta utilizada */}
                    <div className="mb-2">
                      <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                        Nombre de la tarjeta utilizada
                      </label>
                      <input
                        type="text"
                        className="campo-formulario-finanzia"
                        placeholder="Ej. VISA Plata, BAC Credomatic Visa..."
                        value={tcIngresoNombre}
                        onChange={(e) => setTcIngresoNombre(e.target.value)}
                        required
                      />
                    </div>

                    {/* Número de cuotas, Fecha de corte y Fecha de pago */}
                    <div className="row g-2 mb-2">
                      <div className="col-12 col-sm-4 mb-2 mb-sm-0">
                        <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                          Número de cuotas
                        </label>
                        <select
                          className="campo-formulario-finanzia"
                          value={tcIngresoCuotas}
                          onChange={(e) => setTcIngresoCuotas(parseInt(e.target.value, 10))}
                        >
                          <option value={1}>1 pago al contado</option>
                          <option value={3}>3 cuotas</option>
                          <option value={6}>6 cuotas</option>
                          <option value={10}>10 cuotas</option>
                          <option value={12}>12 cuotas (1 año)</option>
                        </select>
                      </div>

                      <div className="col-6 col-sm-4">
                        <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                          Día de corte (fecha)
                        </label>
                        <input
                          type="date"
                          className="campo-formulario-finanzia"
                          value={tcIngresoFechaCorte}
                          onChange={(e) => setTcIngresoFechaCorte(e.target.value)}
                          required
                        />
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          Ej. {formatearAFechaVisual(tcIngresoFechaCorte)}
                        </small>
                      </div>

                      <div className="col-6 col-sm-4">
                        <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                          Fecha de pago
                        </label>
                        <input
                          type="date"
                          className="campo-formulario-finanzia"
                          value={tcIngresoFechaPago}
                          onChange={(e) => setTcIngresoFechaPago(e.target.value)}
                          required
                        />
                        <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                          Ej. {formatearAFechaVisual(tcIngresoFechaPago)}
                        </small>
                      </div>
                    </div>

                    {/* Usuarios involucrados: SOLO si tcIngresoEsFamiliar es true */}
                    {tcIngresoEsFamiliar ? (
                      <div className="mb-2">
                        <label className="etiqueta-campo-finanzia d-flex justify-content-between align-items-center" style={{ color: '#3730A3' }}>
                          <span>Usuarios involucrados (aparecerán en la lista desplegable)</span>
                          <span className="badge badge-light" style={{ fontSize: '0.72rem' }}>
                            {tcIngresoUsuarios.length} miembros
                          </span>
                        </label>

                        {/* Chips de usuarios */}
                        <div className="d-flex flex-wrap gap-2 mb-2 p-2 bg-white rounded border">
                          {tcIngresoUsuarios.map((u) => (
                            <span key={u} className="badge-chip-usuario-tc">
                              <i className="fas fa-user mr-1 text-primary"></i>
                              {u}
                              <button
                                type="button"
                                className="btn-quitar-chip-usuario"
                                onClick={() => {
                                  if (tcIngresoUsuarios.length <= 1) {
                                    _swal('Mínimo 1 usuario', 'Debes dejar al menos un usuario asignado a la tarjeta.', 'info');
                                    return;
                                  }
                                  setTcIngresoUsuarios(tcIngresoUsuarios.filter(item => item !== u));
                                }}
                                title={`Quitar a ${u}`}
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Input para agregar usuario */}
                        <div className="d-flex gap-2">
                          <input
                            type="text"
                            className="campo-formulario-finanzia"
                            placeholder="Escribe nuevo usuario (ej. Usuario 1, Usuario 2)..."
                            value={tcIngresoNuevoUsuario}
                            onChange={(e) => setTcIngresoNuevoUsuario(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const u = tcIngresoNuevoUsuario.trim();
                                if (u && !tcIngresoUsuarios.includes(u)) {
                                  setTcIngresoUsuarios([...tcIngresoUsuarios, u]);
                                  setTcIngresoNuevoUsuario('');
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="btn btn-sm btn-primary"
                            style={{ background: '#4E44EB', borderColor: '#4E44EB', borderRadius: '12px', whiteSpace: 'nowrap' }}
                            onClick={() => {
                              const u = tcIngresoNuevoUsuario.trim();
                              if (!u) return;
                              if (tcIngresoUsuarios.includes(u)) {
                                _swal('Usuario existente', 'Ese usuario ya está agregado.', 'warning');
                                return;
                              }
                              setTcIngresoUsuarios([...tcIngresoUsuarios, u]);
                              setTcIngresoNuevoUsuario('');
                            }}
                          >
                            <i className="fas fa-plus mr-1"></i> Agregar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 mb-2 bg-light rounded text-muted" style={{ fontSize: '0.78rem' }}>
                        <i className="fas fa-info-circle mr-1 text-primary"></i>
                        Tarjeta configurada como <strong>personal</strong>. No se requiere lista de familiares.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

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

                  <div className={`contenedor-adjunto-comprobante ${archivoComprobante ? 'con-archivo' : ''}`}>
                    <label className="etiqueta-campo-finanzia d-flex justify-content-between align-items-center mb-1">
                      <span>
                        <i className="fas fa-receipt mr-1" style={{ color: '#4E44EB' }}></i>
                        Adjuntar comprobante o voucher
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#8E92A4', fontWeight: 600 }}>Opcional</span>
                    </label>

                    {/* Inputs de archivo ocultos (Cámara directa vs Galería) */}
                    <input
                      type="file"
                      ref={refInputCamaraIngreso}
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={(e) => manejarSeleccionComprobante(e, false)}
                    />
                    <input
                      type="file"
                      ref={refInputGaleriaIngreso}
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => manejarSeleccionComprobante(e, false)}
                    />

                    {!archivoComprobante ? (
                      <div>
                        <div className="botones-seleccion-comprobante">
                          <button
                            type="button"
                            className="boton-opcion-foto"
                            onClick={() => refInputCamaraIngreso.current && refInputCamaraIngreso.current.click()}
                          >
                            <i className="fas fa-camera" style={{ color: '#4E44EB' }}></i>
                            <span>Tomar foto</span>
                          </button>
                          <button
                            type="button"
                            className="boton-opcion-foto"
                            onClick={() => refInputGaleriaIngreso.current && refInputGaleriaIngreso.current.click()}
                          >
                            <i className="fas fa-images" style={{ color: '#10B981' }}></i>
                            <span>Elegir galería</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="tarjeta-preview-ticket">
                          {urlVistaPrevia && (
                            <img
                              src={urlVistaPrevia}
                              alt="Vista previa ticket"
                              className="miniatura-preview-ticket"
                              onClick={() => setModalImagenGrande(urlVistaPrevia)}
                              title="Toca para ver en grande"
                            />
                          )}
                          <div
                            className="info-preview-ticket"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setModalImagenGrande(urlVistaPrevia)}
                          >
                            <span className="nombre-preview-ticket">{archivoComprobante.name}</span>
                            <span className="badge-peso-ticket">
                              <i className="fas fa-search-plus mr-1"></i>
                              Ver en grande ({formatearTamanioArchivo(archivoComprobante.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            className="boton-quitar-ticket"
                            onClick={() => quitarComprobante(false)}
                            title="Quitar foto seleccionada"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Barra de progreso de subida activa */}
                    {guardando && progresoSubida > 0 && (
                      <div className="contenedor-progreso-subida">
                        <div className="cabecera-progreso-subida">
                          <span>{estadoSubidaTexto || 'Subiendo comprobante...'}</span>
                          <span>{progresoSubida}%</span>
                        </div>
                        <div className="barra-fondo-progreso">
                          <div
                            className="barra-relleno-progreso"
                            style={{ width: `${progresoSubida}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* BLOQUE E: INTELIGENCIA PATRIMONIAL */}
                {/* <div className={`tarjeta-inteligencia-patrimonial ${impactoPatrimonial ? 'positivo' : 'neutral'}`}>
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
                </div> */}

              </div>
            )}

            {/* BOTÓN PRINCIPAL DE GUARDAR INGRESO (Siempre al final, después de opciones avanzadas) */}
            <button
              type="submit"
              className="boton-guardar-principal"
              disabled={guardando}
            >
              {guardando ? (
                <span>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {progresoSubida > 0 ? `Subiendo comprobante (${progresoSubida}%)...` : 'Guardando ingreso...'}
                </span>
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

            {/* SECCIÓN DE USUARIOS: ¿QUIÉN REALIZÓ ESTE GASTO? (Solo si es Tarjeta Familiar) */}
            {tcEsFamiliar && (
              <div className="bloque-asignacion-usuario-gasto mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="etiqueta-campo-finanzia mb-0">
                    <i className="fas fa-user-tag mr-1" style={{ color: '#4E44EB' }}></i>
                    {modoDividirCuenta ? 'Dividir gasto entre familiares' : '¿Quién realizó este gasto? (Familiar)'}
                  </label>
                  <div className="d-flex align-items-center gap-2">
                    {/* Botón con Icono de Dividir Cuenta */}
                    <button
                      type="button"
                      className={`btn btn-xs ${modoDividirCuenta ? 'btn-success text-white shadow-sm' : 'btn-outline-primary'}`}
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        borderRadius: '20px',
                        padding: '3px 10px',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={alternarModoDividirCuenta}
                      title={modoDividirCuenta ? 'Volver a asignación individual' : 'Dividir la cuenta entre varios familiares'}
                    >
                      <i className={`fas ${modoDividirCuenta ? 'fa-check' : 'fa-users'} mr-1`}></i>
                      {modoDividirCuenta ? 'Modo Dividido Activo' : 'Dividir cuenta'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-xs btn-link p-0"
                      style={{ fontSize: '0.75rem', color: '#4E44EB', fontWeight: 700, textDecoration: 'none' }}
                      onClick={() => setMostrarInputNuevoUsuario(!mostrarInputNuevoUsuario)}
                    >
                      {mostrarInputNuevoUsuario ? '✕ Cancelar' : '+ Agregar familiar'}
                    </button>
                  </div>
                </div>

                {/* MODO A: ASIGNACIÓN INDIVIDUAL NORMAL (Default) */}
                {!modoDividirCuenta ? (
                  <div className="d-flex flex-wrap gap-2 mb-1">
                    {listaUsuariosDisponibles.map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={`pildora-usuario-selector ${usuarioGasto === u ? 'activa' : ''}`}
                        onClick={() => setUsuarioGasto(u)}
                      >
                        <i className="fas fa-user-circle mr-1"></i>
                        {u}
                      </button>
                    ))}
                  </div>
                ) : (
                  /* MODO B: DIVISIÓN DE CUENTA MULTI-USUARIO */
                  <div className="p-3 rounded border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#166534' }}>
                        <i className="fas fa-users-cog mr-1"></i> Selecciona los familiares que compartirán este gasto:
                      </span>
                      <div className="d-flex gap-2 align-items-center">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-success font-weight-bold"
                          style={{ fontSize: '0.72rem', textDecoration: 'none' }}
                          onClick={seleccionarTodosLosFamiliares}
                        >
                          Seleccionar todos
                        </button>
                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>•</span>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-danger font-weight-bold"
                          style={{ fontSize: '0.72rem', textDecoration: 'none' }}
                          onClick={deseleccionarTodosLosFamiliares}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>

                    {/* Píldoras de selección múltiple */}
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {listaUsuariosDisponibles.map((u) => {
                        const seleccionado = usuariosDivididos.includes(u);
                        return (
                          <button
                            key={u}
                            type="button"
                            className={`pildora-usuario-selector ${seleccionado ? 'activa' : ''}`}
                            style={seleccionado ? { backgroundColor: '#10B981', borderColor: '#10B981', color: '#FFFFFF' } : {}}
                            onClick={() => toggleUsuarioDividido(u)}
                          >
                            <i className={`fas ${seleccionado ? 'fa-check-circle' : 'fa-circle'} mr-1`}></i>
                            {u}
                          </button>
                        );
                      })}
                    </div>

                    {/* Resumen del cálculo en vivo */}
                    {usuariosDivididos.length >= 2 ? (
                      <div className="p-2 bg-white rounded border" style={{ borderColor: '#BBF7D0' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <span style={{ fontSize: '0.82rem', color: '#1E1F30' }}>
                            <strong className="text-success" style={{ fontSize: '0.95rem' }}>
                              Q {(parseFloat(monto) > 0 ? (parseFloat(monto) / usuariosDivididos.length).toFixed(2) : '0.00')}
                            </strong> c/u
                            <span className="text-muted ml-1">({usuariosDivididos.length} personas)</span>
                          </span>
                          <span className="text-muted" style={{ fontSize: '0.76rem' }}>
                            Total a dividir: <strong>Q {parseFloat(monto) > 0 ? parseFloat(monto).toFixed(2) : '0.00'}</strong>
                          </span>
                        </div>
                        <div className="d-flex flex-wrap gap-1 mt-2 pt-1 border-top">
                          {usuariosDivididos.map(u => (
                            <span key={u} className="badge badge-light border" style={{ fontSize: '0.72rem', color: '#166534', backgroundColor: '#DCFCE7' }}>
                              <i className="fas fa-user-check mr-1 text-success"></i>{u}: Q {parseFloat(monto) > 0 ? (parseFloat(monto) / usuariosDivididos.length).toFixed(2) : '0.00'}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-warning mt-1" style={{ fontSize: '0.76rem', fontWeight: 600 }}>
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        Selecciona al menos 2 familiares para calcular la división equitativa.
                      </div>
                    )}
                  </div>
                )}

                {/* Formulario rápido para agregar familiar */}
                {mostrarInputNuevoUsuario && (
                  <div className="d-flex gap-2 mt-2 p-2 bg-light rounded">
                    <input
                      type="text"
                      className="campo-formulario-finanzia"
                      placeholder="Nombre del familiar (ej. Usuario 4, Papá)..."
                      value={nuevoUsuarioInline}
                      onChange={(e) => setNuevoUsuarioInline(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const n = nuevoUsuarioInline.trim();
                          if (n) {
                            setUsuarioGasto(n);
                            if (modoDividirCuenta) {
                              setUsuariosDivididos(prev => [...prev, n]);
                            }
                            setNuevoUsuarioInline('');
                            setMostrarInputNuevoUsuario(false);
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      style={{ background: '#4E44EB', borderColor: '#4E44EB', borderRadius: '10px', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        const n = nuevoUsuarioInline.trim();
                        if (n) {
                          setUsuarioGasto(n);
                          if (modoDividirCuenta) {
                            setUsuariosDivididos(prev => [...prev, n]);
                          }
                          setNuevoUsuarioInline('');
                          setMostrarInputNuevoUsuario(false);
                        }
                      }}
                    >
                      Asignar
                    </button>
                  </div>
                )}
              </div>
            )}

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
                        <i className="fas fa-credit-card"></i> {tcEsFamiliar ? 'Tarjeta de Crédito Familiar' : 'Tarjeta de Crédito'}
                      </span>
                      <span className="badge-finanzas-tc">{tcEsFamiliar ? 'Compartida' : 'Personal'}</span>
                    </div>

                    {tarjetasDisponibles.length === 0 ? (
                      <div className="p-3 bg-white rounded border text-center my-2">
                        <i className="fas fa-credit-card fa-2x mb-2" style={{ color: '#8E92A4' }}></i>
                        <h6 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E1F30' }}>
                          Aún no has configurado una tarjeta de crédito
                        </h6>
                        <p className="mb-2 text-muted" style={{ fontSize: '0.78rem' }}>
                          Puedes configurar las fechas de corte, pago y cuotas en la sección de Tarjeta de Crédito.
                        </p>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          style={{ borderRadius: '10px', fontSize: '0.78rem' }}
                          onClick={() => historial.push('/tarjeta-familiar')}
                        >
                          <i className="fas fa-cog mr-1"></i> Configurar Tarjeta
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="row g-2 mb-2">
                          <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                            <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>Tarjeta utilizada</label>
                            <select
                              className="campo-formulario-finanzia"
                              value={tarjetaSeleccionadaId}
                              onChange={(e) => setTarjetaSeleccionadaId(e.target.value)}
                            >
                              {tarjetasDisponibles.map(t => (
                                <option key={t.id} value={t.id}>
                                  💳 {t.nombre} {t.esFamiliar ? '(Familiar)' : '(Personal)'}
                                </option>
                              ))}
                            </select>
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
                            <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                              Fecha de corte aplicada
                            </label>
                            <div className="p-2 bg-white rounded border" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E1F30' }}>
                              📅 {cicloGastoCalculado.corteVisual}
                            </div>
                          </div>

                          <div className="col-12 col-sm-6">
                            <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                              Fecha de pago asignada
                            </label>
                            <div className="p-2 bg-white rounded border" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4E44EB' }}>
                              💳 {cicloGastoCalculado.pagoVisual}
                            </div>
                          </div>
                        </div>

                        {/* Alerta de traslado al siguiente ciclo si el gasto es posterior a la fecha de corte */}
                        {cicloGastoCalculado.esSiguienteCiclo ? (
                          <div className="alerta-rollover-corte-tc mt-2">
                            <i className="fas fa-info-circle mr-1"></i>
                            <strong>Aviso de corte:</strong> Este gasto ({formatearAFechaVisual(fecha)}) se realizó después de la fecha de corte configurada. Se asignó automáticamente al próximo ciclo con <strong>pago el {cicloGastoCalculado.pagoVisual}</strong>.
                          </div>
                        ) : (
                          <div className="mt-2" style={{ fontSize: '0.74rem', color: '#4338CA' }}>
                            <i className="fas fa-check-circle mr-1"></i>
                            Este gasto entra en el ciclo actual con límite de pago el <strong>{cicloGastoCalculado.pagoVisual}</strong>.
                          </div>
                        )}
                      </>
                    )}
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

                  <div className={`contenedor-adjunto-comprobante ${archivoComprobanteGasto ? 'con-archivo' : ''}`}>
                    <label className="etiqueta-campo-finanzia d-flex justify-content-between align-items-center mb-1">
                      <span>
                        <i className="fas fa-file-invoice mr-1" style={{ color: '#F46F5F' }}></i>
                        Adjuntar comprobante o ticket
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#8E92A4', fontWeight: 600 }}>Opcional</span>
                    </label>

                    {/* Inputs de archivo ocultos (Cámara directa vs Galería para Egresos) */}
                    <input
                      type="file"
                      ref={refInputCamaraGasto}
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={(e) => manejarSeleccionComprobante(e, true)}
                    />
                    <input
                      type="file"
                      ref={refInputGaleriaGasto}
                      accept="image/*,.pdf"
                      style={{ display: 'none' }}
                      onChange={(e) => manejarSeleccionComprobante(e, true)}
                    />

                    {!archivoComprobanteGasto ? (
                      <div>
                        <div className="botones-seleccion-comprobante">
                          <button
                            type="button"
                            className="boton-opcion-foto"
                            onClick={() => refInputCamaraGasto.current && refInputCamaraGasto.current.click()}
                          >
                            <i className="fas fa-camera" style={{ color: '#F46F5F' }}></i>
                            <span>Tomar foto</span>
                          </button>
                          <button
                            type="button"
                            className="boton-opcion-foto"
                            onClick={() => refInputGaleriaGasto.current && refInputGaleriaGasto.current.click()}
                          >
                            <i className="fas fa-images" style={{ color: '#4E44EB' }}></i>
                            <span>Elegir galería</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="tarjeta-preview-ticket">
                          {urlVistaPreviaGasto && (
                            <img
                              src={urlVistaPreviaGasto}
                              alt="Vista previa ticket gasto"
                              className="miniatura-preview-ticket"
                              onClick={() => setModalImagenGrande(urlVistaPreviaGasto)}
                              title="Toca para ver en grande"
                            />
                          )}
                          <div
                            className="info-preview-ticket"
                            style={{ cursor: 'pointer' }}
                            onClick={() => setModalImagenGrande(urlVistaPreviaGasto)}
                          >
                            <span className="nombre-preview-ticket">{archivoComprobanteGasto.name}</span>
                            <span className="badge-peso-ticket" style={{ color: '#F46F5F', background: '#FFF1F2' }}>
                              <i className="fas fa-search-plus mr-1"></i>
                              Ver en grande ({formatearTamanioArchivo(archivoComprobanteGasto.size)})
                            </span>
                          </div>
                          <button
                            type="button"
                            className="boton-quitar-ticket"
                            onClick={() => quitarComprobante(true)}
                            title="Quitar foto seleccionada"
                          >
                            <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Barra de progreso de subida activa */}
                    {guardando && progresoSubida > 0 && (
                      <div className="contenedor-progreso-subida">
                        <div className="cabecera-progreso-subida">
                          <span>{estadoSubidaTexto || 'Subiendo comprobante...'}</span>
                          <span>{progresoSubida}%</span>
                        </div>
                        <div className="barra-fondo-progreso">
                          <div
                            className="barra-relleno-progreso"
                            style={{ width: `${progresoSubida}%`, background: 'linear-gradient(90deg, #FF6584 0%, #F46F5F 100%)' }}
                          ></div>
                        </div>
                      </div>
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
                <span>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  {progresoSubida > 0 ? `Subiendo comprobante (${progresoSubida}%)...` : 'Guardando gasto...'}
                </span>
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

      {/* Modal Visor de Comprobante en Grande */}
      <VisorImagenModal
        urlImagen={modalImagenGrande}
        alCerrar={() => setModalImagenGrande(null)}
        titulo="Vista previa de comprobante"
      />
    </div>
  );
}
