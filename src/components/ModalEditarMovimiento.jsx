import React, { useState, useEffect, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import _swal from 'sweetalert';
import { firedb } from '../firebaseConfig';
import { subirACloudinary } from '../utils/cloudinary';
import VisorImagenModal from './VisorImagenModal';
import './styles.css';

/**
 * Normalización de ID de usuario (string o number)
 */
const parseUserId = (id) => {
  if (id === null || id === undefined) return '';
  const str = id.toString().trim();
  const num = parseInt(str, 10);
  return !isNaN(num) && num.toString() === str ? num : str;
};

/** Catálogos de categorías oficiales */
const CATEGORIAS_INGRESOS = [
  'Sueldo',
  'Bonificaciones',
  'Comisiones',
  'Freelance',
  'Negocio propio',
  'Alquileres',
  'Inversiones',
  'Intereses',
  'Reembolsos',
  'Préstamos recibidos',
  'Tarjeta de crédito',
  'Regalos',
  'Otros'
];

const CATEGORIAS_EGRESOS = [
  'Alimentación',
  'Transporte',
  'Vivienda',
  'Servicios',
  'Salud',
  'Educación',
  'Compras',
  'Entretenimiento',
  'Finanzas',
  'Mascotas',
  'Regalos',
  'Familia',
  'Suscripciones',
  'Inversiones',
  'Otros'
];

const CUENTAS_DISPONIBLES = [
  'Efectivo',
  'Cuenta bancaria',
  'Tarjeta de crédito',
  'Tarjeta débito',
  'Billetera digital',
  'Ahorro',
  'Inversión',
  'Otro'
];

const METODOS_EGRESO = [
  'Tarjeta débito',
  'Tarjeta crédito',
  'Efectivo',
  'Transferencia',
  'QR',
  'Cheque',
  'Otro'
];

const METODOS_INGRESO = [
  'Transferencia',
  'Efectivo',
  'Depósito',
  'Cheque',
  'Tarjeta',
  'Otro'
];

const ESTADOS_EGRESO = ['Pagado', 'Pendiente', 'Parcial'];
const ESTADOS_INGRESO = ['Confirmado', 'Pendiente', 'Cancelado'];
const FRECUENCIAS = ['Diaria', 'Semanal', 'Quincenal', 'Mensual', 'Anual'];

/**
 * Modal Completo de Edición de Movimientos Financieros
 * Permite editar todos los campos registrados: monto, concepto, categorías, fechas,
 * cuenta, método, comercio/fuente, familiar asignado, tarjeta de crédito, cuotas y foto/ticket.
 */
export default function ModalEditarMovimiento({ show, movimiento, onHide, onGuardado }) {
  // Estados del formulario
  const [tipo, setTipo] = useState(1); // 1 = Egreso, 2 = Ingreso
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [cuenta, setCuenta] = useState('Efectivo');
  const [metodo, setMetodo] = useState('Efectivo');
  const [comercioOFuente, setComercioOFuente] = useState('');
  const [proyecto, setProyecto] = useState('');
  const [estado, setEstado] = useState('Pagado');
  const [usuarioGasto, setUsuarioGasto] = useState('');

  // Detalles de Tarjeta y Cuotas
  const [tarjetaNombre, setTarjetaNombre] = useState('');
  const [cuotas, setCuotas] = useState(1);
  const [fechaCorte, setFechaCorte] = useState('');
  const [fechaPago, setFechaPago] = useState('');

  // Recurrencia
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [frecuenciaRecurrencia, setFrecuenciaRecurrencia] = useState('Mensual');
  const [vencimiento, setVencimiento] = useState('');

  // Comprobante / Ticket
  const [urlComprobanteActual, setUrlComprobanteActual] = useState(null);
  const [nuevoArchivoFoto, setNuevoArchivoFoto] = useState(null);
  const [vistaPreviaNuevaFoto, setVistaPreviaNuevaFoto] = useState(null);
  const [eliminarFotoExistente, setEliminarFotoExistente] = useState(false);
  const [progresoSubida, setProgresoSubida] = useState(0);
  const [textoEstadoSubida, setTextoEstadoSubida] = useState('');

  // Control de interfaz
  const [guardando, setGuardando] = useState(false);
  const [modalImagenGrande, setModalImagenGrande] = useState(null);
  const [tarjetasGuardadas, setTarjetasGuardadas] = useState([]);
  const [usuariosFrecuentes, setUsuariosFrecuentes] = useState(['Usuario 1', 'Usuario 2', 'Usuario 3']);

  const inputFotoRef = useRef(null);

  // Pre-cargar la información del movimiento seleccionado
  useEffect(() => {
    if (!movimiento || !show) return;

    const tipoDetectado = movimiento.tipo === 2 || movimiento.cuentaDestino ? 2 : 1;
    setTipo(tipoDetectado);

    const cantidadDetectada = movimiento.cantidad !== undefined ? movimiento.cantidad : (movimiento.amount || '');
    setMonto(cantidadDetectada ? String(cantidadDetectada) : '');

    setDescripcion(movimiento.descripcion || movimiento.description || '');
    setCategoria(movimiento.categoria || movimiento.category || (tipoDetectado === 2 ? 'Sueldo' : 'Alimentación'));
    setSubcategoria(movimiento.subcategoria || movimiento.subcategory || '');

    setFecha(movimiento.fecha || movimiento.date || '');
    setHora(movimiento.hora || movimiento.time || '');

    const cuentaDetectada = movimiento.cuentaOrigen || movimiento.cuentaDestino || movimiento.account || 'Efectivo';
    setCuenta(cuentaDetectada);

    const metodoDetectado = movimiento.metodoPago || movimiento.metodoIngreso || movimiento.paymentMethod || (tipoDetectado === 2 ? 'Transferencia' : 'Efectivo');
    setMetodo(metodoDetectado);

    const terceroDetectado = movimiento.comercio || movimiento.fuentePagador || movimiento.merchant || movimiento.source || '';
    setComercioOFuente(terceroDetectado);

    setProyecto(movimiento.proyecto || movimiento.project || '');

    const estadoDetectado = movimiento.estado || movimiento.status || (tipoDetectado === 2 ? 'Confirmado' : 'Pagado');
    setEstado(estadoDetectado);

    setUsuarioGasto(movimiento.usuarioGasto || '');

    // Tarjeta de crédito
    setTarjetaNombre(movimiento.tarjetaCreditoNombre || movimiento.tarjetaNombre || movimiento.creditCardDetails?.cardName || '');
    setCuotas(movimiento.cuotas || movimiento.creditCardDetails?.installments || 1);
    setFechaCorte(movimiento.fechaCorte || movimiento.creditCardDetails?.closingDate || '');
    setFechaPago(movimiento.fechaPago || movimiento.creditCardDetails?.paymentDueDate || '');

    // Recurrencia
    setEsRecurrente(Boolean(movimiento.esRecurrente || movimiento.isRecurring));
    setFrecuenciaRecurrencia(movimiento.frecuenciaGasto || movimiento.frecuenciaRecurrencia || movimiento.recurrenceFrequency || 'Mensual');
    setVencimiento(movimiento.vencimientoGasto || movimiento.dueDate || '');

    // Comprobante
    const urlFoto = movimiento.attachmentUrl || movimiento.urlComprobante || movimiento.comprobanteUrl || movimiento.ticketUrl || movimiento.imageUrl || null;
    setUrlComprobanteActual(urlFoto);
    setNuevoArchivoFoto(null);
    setVistaPreviaNuevaFoto(null);
    setEliminarFotoExistente(false);
    setProgresoSubida(0);
    setTextoEstadoSubida('');
    setGuardando(false);

    // Cargar tarjetas registradas del usuario para facilitar selección
    const idUsuario = localStorage.getItem('currentId');
    if (idUsuario) {
      const uidNormalizado = parseUserId(idUsuario);
      firedb.collection('tarjetas-credito')
        .where('idUser', '==', uidNormalizado)
        .get()
        .then(snap => {
          if (!snap.empty) {
            const listaTc = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setTarjetasGuardadas(listaTc);
            // Si la tarjeta tiene usuarios configurados, integrarlos
            const todosUsuarios = new Set(['Usuario 1', 'Usuario 2', 'Usuario 3']);
            listaTc.forEach(tc => {
              if (Array.isArray(tc.usuariosInvolucrados)) {
                tc.usuariosInvolucrados.forEach(u => todosUsuarios.add(u));
              }
            });
            if (movimiento.usuarioGasto) todosUsuarios.add(movimiento.usuarioGasto);
            setUsuariosFrecuentes(Array.from(todosUsuarios));
          }
        })
        .catch(err => console.warn('Aviso cargando tarjetas en modal de edición:', err));
    }
  }, [movimiento, show]);

  // Manejo de cambio de tipo de movimiento (Ingreso / Egreso)
  const cambiarTipoMovimiento = (nuevoTipo) => {
    if (nuevoTipo === tipo) return;
    setTipo(nuevoTipo);
    if (nuevoTipo === 2) {
      // Ingreso
      if (!CATEGORIAS_INGRESOS.includes(categoria)) {
        setCategoria(CATEGORIAS_INGRESOS[0]);
      }
      if (!METODOS_INGRESO.includes(metodo)) {
        setMetodo('Transferencia');
      }
      setEstado('Confirmado');
    } else {
      // Egreso
      if (!CATEGORIAS_EGRESOS.includes(categoria)) {
        setCategoria(CATEGORIAS_EGRESOS[0]);
      }
      if (!METODOS_EGRESO.includes(metodo)) {
        setMetodo('Efectivo');
      }
      setEstado('Pagado');
    }
  };

  // Manejo de selección de archivo de comprobante nuevo
  const manejarSeleccionFoto = (e) => {
    const archivo = e.target.files && e.target.files[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/') && archivo.type !== 'application/pdf') {
      _swal('Formato no compatible', 'Por favor selecciona una imagen (JPG, PNG, WEBP) o un documento PDF.', 'warning');
      return;
    }

    setNuevoArchivoFoto(archivo);
    setEliminarFotoExistente(false);

    // Crear vista previa local inmediata
    if (archivo.type.startsWith('image/')) {
      const urlPreview = URL.createObjectURL(archivo);
      setVistaPreviaNuevaFoto(urlPreview);
    } else {
      setVistaPreviaNuevaFoto(null);
    }
  };

  // Quitar comprobante
  const quitarComprobante = () => {
    setEliminarFotoExistente(true);
    setNuevoArchivoFoto(null);
    if (vistaPreviaNuevaFoto) {
      URL.revokeObjectURL(vistaPreviaNuevaFoto);
      setVistaPreviaNuevaFoto(null);
    }
    if (inputFotoRef.current) {
      inputFotoRef.current.value = '';
    }
  };

  // Deshacer eliminación de comprobante
  const restaurarComprobanteActual = () => {
    setEliminarFotoExistente(false);
    setNuevoArchivoFoto(null);
    if (vistaPreviaNuevaFoto) {
      URL.revokeObjectURL(vistaPreviaNuevaFoto);
      setVistaPreviaNuevaFoto(null);
    }
    if (inputFotoRef.current) {
      inputFotoRef.current.value = '';
    }
  };

  // Guardar Cambios en Firestore
  const guardarCambios = async (e) => {
    e.preventDefault();

    const montoNumerico = parseFloat(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      _swal('Monto inválido', 'Por favor ingresa un monto mayor a 0.', 'warning');
      return;
    }

    if (!descripcion.trim()) {
      _swal('Concepto requerido', 'Ingresa una descripción o concepto para este movimiento.', 'warning');
      return;
    }

    if (!fecha) {
      _swal('Fecha requerida', 'Selecciona una fecha válida.', 'warning');
      return;
    }

    setGuardando(true);
    setTextoEstadoSubida('Guardando cambios...');

    try {
      let urlFinalComprobante = urlComprobanteActual;

      // 1. Si el usuario subió una nueva foto, enviarla a Cloudinary
      if (nuevoArchivoFoto) {
        setTextoEstadoSubida('Optimizando y subiendo comprobante...');
        urlFinalComprobante = await subirACloudinary(
          nuevoArchivoFoto,
          (porcentaje) => setProgresoSubida(porcentaje),
          (estadoTexto) => setTextoEstadoSubida(estadoTexto)
        );
      } else if (eliminarFotoExistente) {
        urlFinalComprobante = null;
      }

      const idUsuario = localStorage.getItem('currentId');
      const uidNormalizado = parseUserId(idUsuario);
      const esTarjetaCredito = cuenta === 'Tarjeta de crédito' || metodo === 'Tarjeta crédito';

      // 2. Construir payload para la colección caja-chica
      const payloadActualizacion = {
        cantidad: montoNumerico,
        descripcion: descripcion.trim(),
        tipo: parseInt(tipo, 10),
        categoria: categoria || (tipo === 2 ? 'Otros' : 'Otros'),
        subcategoria: subcategoria.trim() || null,
        fecha: fecha,
        hora: hora || '12:00',
        estado: estado,
        proyecto: proyecto.trim() || null,
        esRecurrente: Boolean(esRecurrente),
        attachmentUrl: urlFinalComprobante || null,
        urlComprobante: urlFinalComprobante || null,
        actualizadoEn: new Date().toISOString()
      };

      if (tipo === 2) {
        // Ingreso
        payloadActualizacion.cuentaDestino = cuenta;
        payloadActualizacion.metodoIngreso = metodo;
        payloadActualizacion.fuentePagador = comercioOFuente.trim() || null;
        payloadActualizacion.frecuenciaRecurrencia = esRecurrente ? frecuenciaRecurrencia : null;
        // Limpiar atributos exclusivos de egreso
        payloadActualizacion.cuentaOrigen = null;
        payloadActualizacion.metodoPago = null;
        payloadActualizacion.comercio = null;
        payloadActualizacion.usuarioGasto = null;
        payloadActualizacion.cuotas = 1;
        payloadActualizacion.tarjetaCreditoNombre = null;
        payloadActualizacion.fechaCorte = null;
        payloadActualizacion.fechaPago = null;
      } else {
        // Egreso
        payloadActualizacion.cuentaOrigen = cuenta;
        payloadActualizacion.metodoPago = metodo;
        payloadActualizacion.comercio = comercioOFuente.trim() || null;
        payloadActualizacion.usuarioGasto = usuarioGasto.trim() || null;
        payloadActualizacion.cuotas = esTarjetaCredito ? (parseInt(cuotas, 10) || 1) : 1;
        payloadActualizacion.frecuenciaGasto = esRecurrente ? frecuenciaRecurrencia : null;
        payloadActualizacion.vencimientoGasto = vencimiento || null;

        if (esTarjetaCredito) {
          payloadActualizacion.tarjetaCreditoNombre = tarjetaNombre.trim() || null;
          payloadActualizacion.fechaCorte = fechaCorte || null;
          payloadActualizacion.fechaPago = fechaPago || null;
        } else {
          payloadActualizacion.tarjetaCreditoNombre = null;
          payloadActualizacion.fechaCorte = null;
          payloadActualizacion.fechaPago = null;
        }

        // Limpiar atributos exclusivos de ingreso
        payloadActualizacion.cuentaDestino = null;
        payloadActualizacion.metodoIngreso = null;
        payloadActualizacion.fuentePagador = null;
      }

      // 3. Actualizar en Firestore: colección 'caja-chica'
      await firedb.collection('caja-chica').doc(movimiento.id).update(payloadActualizacion);

      // 4. Sincronización secundaria en users/{idUsuario}/expenses o incomes si existe
      try {
        if (idUsuario) {
          const coleccionDestino = tipo === 2 ? 'incomes' : 'expenses';
          const subDocRef = firedb.collection('users').doc(uidNormalizado.toString()).collection(coleccionDestino);
          // Buscar registro que coincida por fecha y monto original
          const fechaBuscar = movimiento.fechaOriginal || movimiento.fecha;
          const montoBuscar = parseFloat(movimiento.cantidad) || 0;
          const subSnap = await subDocRef
            .where('date', '==', fechaBuscar)
            .where('amount', '==', montoBuscar)
            .limit(1)
            .get();

          if (!subSnap.empty) {
            await subDocRef.doc(subSnap.docs[0].id).update({
              amount: montoNumerico,
              description: descripcion.trim(),
              category: categoria,
              subcategory: subcategoria.trim() || null,
              date: fecha,
              time: hora || '12:00',
              account: cuenta,
              paymentMethod: metodo,
              attachmentUrl: urlFinalComprobante || null,
              status: estado,
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (errSub) {
        console.warn('Aviso sincronizando subcolección:', errSub);
      }

      // 5. Preparar objeto actualizado para notificar a la vista padre
      const partesFecha = fecha.split('-');
      const fechaLegible = partesFecha.length === 3 ? `${partesFecha[2]}/${partesFecha[1]}/${partesFecha[0]}` : fecha;

      const movimientoActualizado = {
        ...movimiento,
        ...payloadActualizacion,
        fechaOriginal: fecha,
        fechaLegible: fechaLegible
      };

      if (onGuardado) {
        onGuardado(movimientoActualizado);
      }

      _swal({
        title: '¡Movimiento Actualizado!',
        text: `Se guardaron los cambios para "${descripcion.trim()}".`,
        icon: 'success',
        timer: 1400,
        buttons: false
      });

      onHide();
    } catch (error) {
      console.error('Error al actualizar movimiento:', error);
      _swal('Error', 'No se pudieron guardar los cambios en la base de datos.', 'error');
    } finally {
      setGuardando(false);
      setProgresoSubida(0);
      setTextoEstadoSubida('');
    }
  };

  const listaCategoriasDisponibles = tipo === 2 ? CATEGORIAS_INGRESOS : CATEGORIAS_EGRESOS;
  const listaMetodosDisponibles = tipo === 2 ? METODOS_INGRESO : METODOS_EGRESO;
  const listaEstadosDisponibles = tipo === 2 ? ESTADOS_INGRESO : ESTADOS_EGRESO;
  const esTarjetaCredito = cuenta === 'Tarjeta de crédito' || metodo === 'Tarjeta crédito';

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        centered
        backdrop="static"
        dialogClassName="modal-editar-movimiento-dialog"
      >
        <div className="modal-editar-contenedor">

          {/* Encabezado fijo del Modal con Icono de Lápiz */}
          <div className="modal-editar-cabecera">
            <div className="d-flex align-items-center gap-2">
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4E44EB 0%, #6E62FF 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(78, 68, 235, 0.25)'
                }}
              >
                <i className="fas fa-pencil-alt"></i>
              </div>
              <div>
                <h5 className="mb-0 font-weight-bold" style={{ fontSize: '1.05rem', color: '#1E1F30' }}>
                  Editar Movimiento
                </h5>
                <span style={{ fontSize: '0.74rem', color: '#8E92A4' }}>
                  Modifica cualquier campo registrado
                </span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-light rounded-circle"
              onClick={onHide}
              disabled={guardando}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={guardarCambios} className="modal-editar-formulario">
            <div className="modal-editar-cuerpo">

            {/* Banner de Gasto Dividido (si aplica) */}
            {movimiento?.esGastoDividido && (
              <div className="alert alert-info py-2 px-3 mb-3 d-flex align-items-center justify-content-between" style={{ fontSize: '0.8rem', borderRadius: '12px' }}>
                <div>
                  <i className="fas fa-users mr-1"></i>
                  <strong>Gasto grupal compartido:</strong> Total de Q {(parseFloat(movimiento?.montoTotalGrupal) || 0).toFixed(2)} dividido entre {movimiento?.cantidadEnGrupo || movimiento?.usuariosEnGrupo?.length || 2} personas
                  {movimiento?.usuariosEnGrupo && (
                    <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                      Integrantes: {movimiento.usuariosEnGrupo.join(', ')}
                    </div>
                  )}
                </div>
                <span className="badge badge-primary">Q {(parseFloat(movimiento?.cantidad || movimiento?.amount) || 0).toFixed(2)}</span>
              </div>
            )}

            {/* 1. Selector de Tipo: Ingreso vs Egreso */}
            <div className="mb-3">
              <label className="etiqueta-campo-finanzia">Tipo de Transacción</label>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className={`btn flex-grow-1 py-2 font-weight-bold d-flex align-items-center justify-content-center gap-2 ${tipo === 2 ? 'btn-success' : 'btn-light text-muted'}`}
                  style={{
                    borderRadius: '12px',
                    fontSize: '0.86rem',
                    border: tipo === 2 ? 'none' : '1px solid #E5E7EB',
                    backgroundColor: tipo === 2 ? '#10B981' : '#F9FAFB',
                    boxShadow: tipo === 2 ? '0 4px 12px rgba(16, 185, 129, 0.25)' : 'none'
                  }}
                  onClick={() => cambiarTipoMovimiento(2)}
                >
                  <i className="fas fa-arrow-down"></i> Ingreso (+Q)
                </button>
                <button
                  type="button"
                  className={`btn flex-grow-1 py-2 font-weight-bold d-flex align-items-center justify-content-center gap-2 ${tipo === 1 ? 'btn-danger' : 'btn-light text-muted'}`}
                  style={{
                    borderRadius: '12px',
                    fontSize: '0.86rem',
                    border: tipo === 1 ? 'none' : '1px solid #E5E7EB',
                    backgroundColor: tipo === 1 ? '#F46F5F' : '#F9FAFB',
                    boxShadow: tipo === 1 ? '0 4px 12px rgba(244, 111, 95, 0.25)' : 'none'
                  }}
                  onClick={() => cambiarTipoMovimiento(1)}
                >
                  <i className="fas fa-arrow-up"></i> Egreso (-Q)
                </button>
              </div>
            </div>

            {/* 2. Monto con Símbolo de Moneda */}
            <div className="mb-3">
              <label className="etiqueta-campo-finanzia">
                Monto Registrado *
              </label>
              <div className="input-group">
                <div className="input-group-prepend">
                  <span
                    className="input-group-text bg-white font-weight-bold border-right-0"
                    style={{
                      borderRadius: '12px 0 0 12px',
                      color: tipo === 2 ? '#10B981' : '#F46F5F',
                      fontSize: '1.2rem',
                      borderColor: '#E5E7EB'
                    }}
                  >
                    Q
                  </span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control campo-formulario-finanzia font-weight-bold border-left-0"
                  style={{
                    fontSize: '1.25rem',
                    borderRadius: '0 12px 12px 0',
                    color: tipo === 2 ? '#10B981' : '#F46F5F'
                  }}
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 3. Concepto o Descripción */}
            <div className="mb-3">
              <label className="etiqueta-campo-finanzia">
                Concepto o Descripción *
              </label>
              <input
                type="text"
                className="campo-formulario-finanzia"
                placeholder="Ej. Comida Mac, Supermercado La Torre, Sueldo quincenal..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                required
              />
            </div>

            {/* 4. Categoría y Subcategoría */}
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                <label className="etiqueta-campo-finanzia">Categoría *</label>
                <select
                  className="campo-formulario-finanzia"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  required
                >
                  {/* Si la categoría actual no está en la lista oficial, mostrarla arriba */}
                  {!listaCategoriasDisponibles.includes(categoria) && categoria && (
                    <option value={categoria}>{categoria} (Personalizada)</option>
                  )}
                  {listaCategoriasDisponibles.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-sm-6">
                <label className="etiqueta-campo-finanzia">Subcategoría</label>
                <input
                  type="text"
                  className="campo-formulario-finanzia"
                  placeholder="Ej. Supermercado, Almuerzo, Uber..."
                  value={subcategoria}
                  onChange={(e) => setSubcategoria(e.target.value)}
                />
              </div>
            </div>

            {/* 5. Fecha y Hora */}
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                <label className="etiqueta-campo-finanzia">Fecha *</label>
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

            {/* 6. Cuenta y Método */}
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                <label className="etiqueta-campo-finanzia">
                  {tipo === 2 ? 'Cuenta de destino' : 'Cuenta de origen'}
                </label>
                <select
                  className="campo-formulario-finanzia"
                  value={cuenta}
                  onChange={(e) => {
                    const nuevaCuenta = e.target.value;
                    setCuenta(nuevaCuenta);
                    if (nuevaCuenta === 'Tarjeta de crédito') {
                      setMetodo('Tarjeta crédito');
                    }
                  }}
                >
                  {CUENTAS_DISPONIBLES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-sm-6">
                <label className="etiqueta-campo-finanzia">
                  {tipo === 2 ? 'Método de ingreso' : 'Método de pago'}
                </label>
                <select
                  className="campo-formulario-finanzia"
                  value={metodo}
                  onChange={(e) => setMetodo(e.target.value)}
                >
                  {listaMetodosDisponibles.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 7. Comercio / Fuente y Proyecto */}
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                <label className="etiqueta-campo-finanzia">
                  {tipo === 2 ? 'Fuente / Pagador' : 'Comercio / Beneficiario'}
                </label>
                <input
                  type="text"
                  className="campo-formulario-finanzia"
                  placeholder={tipo === 2 ? 'Ej. Empresa S.A., Cliente...' : 'Ej. McDonald’s, Walmart, Gasolinera...'}
                  value={comercioOFuente}
                  onChange={(e) => setComercioOFuente(e.target.value)}
                />
              </div>

              <div className="col-12 col-sm-6">
                <label className="etiqueta-campo-finanzia">Proyecto (opcional)</label>
                <input
                  type="text"
                  className="campo-formulario-finanzia"
                  placeholder="Ej. Casa, Vacaciones, Empresa..."
                  value={proyecto}
                  onChange={(e) => setProyecto(e.target.value)}
                />
              </div>
            </div>

            {/* 8. Estado y Familiar responsable (para egresos) */}
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                <label className="etiqueta-campo-finanzia">Estado</label>
                <select
                  className="campo-formulario-finanzia"
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                >
                  {listaEstadosDisponibles.map(est => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>

              {tipo === 1 ? (
                <div className="col-12 col-sm-6">
                  <label className="etiqueta-campo-finanzia">
                    <i className="fas fa-user-circle mr-1 text-primary"></i>
                    Familiar / Miembro que gastó
                  </label>
                  <input
                    type="text"
                    list="lista-sugerencias-usuarios"
                    className="campo-formulario-finanzia"
                    placeholder="Ej. Usuario 1, Usuario 2, Papá..."
                    value={usuarioGasto}
                    onChange={(e) => setUsuarioGasto(e.target.value)}
                  />
                  <datalist id="lista-sugerencias-usuarios">
                    {usuariosFrecuentes.map(u => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              ) : (
                <div className="col-12 col-sm-6 d-flex align-items-center pt-3">
                  <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                    <i className="fas fa-info-circle mr-1 text-primary"></i>
                    Los ingresos suman directamente a tu balance patrimonial.
                  </small>
                </div>
              )}
            </div>

            {/* 9. Bloque Especial de Tarjeta de Crédito y Cuotas (Si aplica) */}
            {esTarjetaCredito && (
              <div className="tarjeta-credito-especial-bloque mb-3 p-3 bg-light rounded border">
                <div className="cabecera-tarjeta-credito-especial mb-2">
                  <span className="titulo-tarjeta-credito-especial font-weight-bold" style={{ color: '#3730A3' }}>
                    <i className="fas fa-credit-card mr-1"></i> Detalles de Tarjeta de Crédito
                  </span>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                    <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                      Tarjeta utilizada
                    </label>
                    <input
                      type="text"
                      list="lista-tarjetas-edicion"
                      className="campo-formulario-finanzia"
                      placeholder="Ej. VISA Plata, BAC Credomatic..."
                      value={tarjetaNombre}
                      onChange={(e) => setTarjetaNombre(e.target.value)}
                    />
                    <datalist id="lista-tarjetas-edicion">
                      {tarjetasGuardadas.map(t => (
                        <option key={t.id} value={t.nombre} />
                      ))}
                    </datalist>
                  </div>

                  <div className="col-12 col-sm-6">
                    <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                      Número de cuotas
                    </label>
                    <select
                      className="campo-formulario-finanzia"
                      value={cuotas}
                      onChange={(e) => setCuotas(parseInt(e.target.value, 10))}
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
                  <div className="col-6">
                    <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                      Fecha de corte
                    </label>
                    <input
                      type="date"
                      className="campo-formulario-finanzia"
                      value={fechaCorte}
                      onChange={(e) => setFechaCorte(e.target.value)}
                    />
                  </div>
                  <div className="col-6">
                    <label className="etiqueta-campo-finanzia" style={{ color: '#3730A3' }}>
                      Fecha límite de pago
                    </label>
                    <input
                      type="date"
                      className="campo-formulario-finanzia"
                      value={fechaPago}
                      onChange={(e) => setFechaPago(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 10. Recurrencia (Checkbox opcional) */}
            <div className="mb-3 p-3 bg-light rounded border">
              <div className="custom-control custom-checkbox mb-2">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="chkEsRecurrenteEdicion"
                  checked={esRecurrente}
                  onChange={(e) => setEsRecurrente(e.target.checked)}
                />
                <label className="custom-control-label font-weight-bold" htmlFor="chkEsRecurrenteEdicion" style={{ fontSize: '0.85rem' }}>
                  Es una transacción recurrente
                </label>
              </div>

              {esRecurrente && (
                <div className="row g-2 mt-2 pt-2 border-top">
                  <div className="col-12 col-sm-6 mb-2 mb-sm-0">
                    <label className="etiqueta-campo-finanzia">Frecuencia</label>
                    <select
                      className="campo-formulario-finanzia"
                      value={frecuenciaRecurrencia}
                      onChange={(e) => setFrecuenciaRecurrencia(e.target.value)}
                    >
                      {FRECUENCIAS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="etiqueta-campo-finanzia">Próximo vencimiento</label>
                    <input
                      type="date"
                      className="campo-formulario-finanzia"
                      value={vencimiento}
                      onChange={(e) => setVencimiento(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 11. Sección de Comprobante / Ticket Adjunto */}
            <div className="mb-4 p-3 bg-light rounded-lg border">
              <label className="etiqueta-campo-finanzia d-flex justify-content-between align-items-center mb-2">
                <span>
                  <i className="fas fa-receipt mr-1 text-primary"></i>
                  Comprobante o Ticket Adjunto
                </span>
                {urlComprobanteActual && !eliminarFotoExistente && !nuevoArchivoFoto && (
                  <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Tiene foto</span>
                )}
                {nuevoArchivoFoto && (
                  <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>Nueva seleccionada</span>
                )}
              </label>

              {/* Si hay un comprobante actual y no se ha marcado para eliminar ni se eligió nuevo */}
              {urlComprobanteActual && !eliminarFotoExistente && !nuevoArchivoFoto && (
                <div className="d-flex align-items-center gap-3 p-2 bg-white rounded border mb-2">
                  <div
                    style={{ cursor: 'pointer', position: 'relative' }}
                    onClick={() => setModalImagenGrande(urlComprobanteActual)}
                    title="Toca para ver en grande"
                  >
                    <img
                      src={urlComprobanteActual}
                      alt="Ticket actual"
                      style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '10px' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '0.8rem'
                      }}
                    >
                      <i className="fas fa-search-plus"></i>
                    </div>
                  </div>

                  <div className="flex-grow-1">
                    <strong style={{ fontSize: '0.82rem', color: '#1E1F30', display: 'block' }}>
                      Comprobante actual
                    </strong>
                    <div className="d-flex gap-2 mt-1">
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-primary"
                        style={{ fontSize: '0.75rem', borderRadius: '8px' }}
                        onClick={() => setModalImagenGrande(urlComprobanteActual)}
                      >
                        <i className="fas fa-eye mr-1"></i> Ver grande
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-danger"
                        style={{ fontSize: '0.75rem', borderRadius: '8px' }}
                        onClick={quitarComprobante}
                      >
                        <i className="fas fa-trash-alt mr-1"></i> Quitar foto
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Vista previa si se seleccionó una NUEVA foto */}
              {vistaPreviaNuevaFoto && (
                <div className="d-flex align-items-center gap-3 p-2 bg-white rounded border mb-2">
                  <img
                    src={vistaPreviaNuevaFoto}
                    alt="Nueva vista previa"
                    style={{ width: '65px', height: '65px', objectFit: 'cover', borderRadius: '10px' }}
                  />
                  <div className="flex-grow-1">
                    <strong style={{ fontSize: '0.82rem', color: '#4E44EB', display: 'block' }}>
                      Nueva imagen seleccionada
                    </strong>
                    <span className="text-muted" style={{ fontSize: '0.72rem', display: 'block' }}>
                      {nuevoArchivoFoto?.name || 'Archivo listo para subir'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-xs btn-outline-secondary mt-1"
                      style={{ fontSize: '0.72rem', borderRadius: '8px' }}
                      onClick={urlComprobanteActual ? restaurarComprobanteActual : quitarComprobante}
                    >
                      Cancelar cambio
                    </button>
                  </div>
                </div>
              )}

              {/* Si se marcó para eliminar */}
              {eliminarFotoExistente && !nuevoArchivoFoto && (
                <div className="p-2 mb-2 bg-warning rounded d-flex justify-content-between align-items-center" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                  <span style={{ fontSize: '0.78rem' }}>
                    <i className="fas fa-exclamation-triangle mr-1"></i> Se eliminará el comprobante al guardar.
                  </span>
                  <button
                    type="button"
                    className="btn btn-xs btn-link font-weight-bold p-0"
                    style={{ fontSize: '0.75rem', color: '#92400E', textDecoration: 'underline' }}
                    onClick={restaurarComprobanteActual}
                  >
                    Deshacer
                  </button>
                </div>
              )}

              {/* Input y botones para subir / cambiar foto */}
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/*,application/pdf"
                className="d-none"
                onChange={manejarSeleccionFoto}
              />

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  style={{ borderRadius: '10px', fontSize: '0.82rem', fontWeight: 600 }}
                  onClick={() => inputFotoRef.current && inputFotoRef.current.click()}
                  disabled={guardando}
                >
                  <i className="fas fa-camera"></i>
                  {urlComprobanteActual && !eliminarFotoExistente ? 'Cambiar foto o ticket' : 'Tomar o subir foto / ticket'}
                </button>
              </div>

              {/* Barra de progreso de subida a Cloudinary */}
              {guardando && nuevoArchivoFoto && progresoSubida > 0 && (
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4E44EB' }}>
                      {textoEstadoSubida || 'Subiendo comprobante...'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#4E44EB' }}>
                      {progresoSubida}%
                    </span>
                  </div>
                  <div className="progress" style={{ height: '8px', borderRadius: '4px' }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated"
                      role="progressbar"
                      style={{ width: `${progresoSubida}%`, backgroundColor: '#4E44EB' }}
                      aria-valuenow={progresoSubida}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>
              )}
            </div>
            {/* Fin de la sección de Comprobante */}
          </div>
          {/* Fin de modal-editar-cuerpo con scroll */}

          {/* 12. Pie Fijo de Acciones del Formulario */}
            <div className="modal-editar-pie">
              <button
                type="button"
                className="btn btn-light flex-grow-1 py-2 font-weight-bold"
                style={{ borderRadius: '12px', fontSize: '0.9rem', color: '#6B7280' }}
                onClick={onHide}
                disabled={guardando}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-primary flex-grow-1 py-2 font-weight-bold d-flex align-items-center justify-content-center gap-2"
                style={{
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  background: 'linear-gradient(135deg, #4E44EB 0%, #6E62FF 100%)',
                  border: 'none',
                  boxShadow: '0 4px 14px rgba(78, 68, 235, 0.35)'
                }}
                disabled={guardando}
              >
                {guardando ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </Modal>

      {/* Visor de imagen en grande si el usuario toca la foto dentro del modal de edición */}
      <VisorImagenModal
        urlImagen={modalImagenGrande}
        alCerrar={() => setModalImagenGrande(null)}
        titulo="Vista Previa de Comprobante"
      />
    </>
  );
}

