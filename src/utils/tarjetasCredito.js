/**
 * Utilidades para el manejo de Tarjetas de Crédito Familiares,
 * Fechas de Corte, Fechas de Pago y Asignación de Ciclos de Facturación.
 *
 * Todas las funciones y variables están escritas en español.
 */

/**
 * Convierte un string de fecha (YYYY-MM-DD o DD/MM/YYYY) a un objeto Date local a medianoche.
 * Evita desfases por zona horaria de UTC.
 */
export const parseFechaLocal = (fechaStr) => {
  if (!fechaStr) return new Date();
  if (fechaStr instanceof Date) return fechaStr;

  const str = fechaStr.trim();
  // Formato YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [anio, mes, dia] = str.split('-').map(num => parseInt(num, 10));
    return new Date(anio, mes - 1, dia, 0, 0, 0, 0);
  }
  // Formato DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [dia, mes, anio] = str.split('/').map(num => parseInt(num, 10));
    return new Date(anio, mes - 1, dia, 0, 0, 0, 0);
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Convierte un objeto Date o string a formato YYYY-MM-DD (para inputs type="date")
 */
export const formatearAFechaInput = (fecha) => {
  const d = parseFechaLocal(fecha);
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

/**
 * Convierte un objeto Date o string a formato visual legible DD/MM/YYYY (ej. 06/11/2026)
 */
export const formatearAFechaVisual = (fecha) => {
  const d = parseFechaLocal(fecha);
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${dia}/${mes}/${anio}`;
};

/**
 * Suma un mes exacto manteniendo el día del mes de forma segura
 */
export const avanzarUnMes = (fechaStr) => {
  const d = parseFechaLocal(fechaStr);
  const diaOriginal = d.getDate();
  d.setDate(1); // Mover al primer día para evitar desbordamiento de meses cortos
  d.setMonth(d.getMonth() + 1);
  const ultimoDiaMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(diaOriginal, ultimoDiaMes));
  return formatearAFechaInput(d);
};

/**
 * Resta un mes exacto manteniendo el día del mes de forma segura
 */
export const retrocederUnMes = (fechaStr) => {
  const d = parseFechaLocal(fechaStr);
  const diaOriginal = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  const ultimoDiaMes = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(diaOriginal, ultimoDiaMes));
  return formatearAFechaInput(d);
};

/**
 * Determina el ciclo de facturación (Fecha de Corte y Fecha de Pago) para un gasto:
 * Si la fecha del gasto es POSTERIOR a la fecha de corte, el monto se traslada
 * automáticamente al siguiente ciclo de corte y pago.
 *
 * @param {string} fechaGasto YYYY-MM-DD
 * @param {object} tarjeta Objeto con { fechaCorte, fechaPago, ... }
 * @returns {object} { fechaCorte, fechaPago, corteVisual, pagoVisual, esSiguienteCiclo, claveCiclo }
 */
export const determinarCicloGasto = (fechaGasto, tarjeta) => {
  const gastoIso = formatearAFechaInput(fechaGasto || new Date());
  let corteIso = tarjeta?.fechaCorte ? formatearAFechaInput(tarjeta.fechaCorte) : gastoIso;
  let pagoIso = tarjeta?.fechaPago ? formatearAFechaInput(tarjeta.fechaPago) : avanzarUnMes(corteIso);

  let esSiguienteCiclo = false;

  // Si el gasto ocurrió DESPUÉS de la fecha de corte configurada:
  // Se avanza de ciclo hasta que la fecha del gasto sea menor o igual a la fecha de corte
  while (gastoIso > corteIso) {
    esSiguienteCiclo = true;
    corteIso = avanzarUnMes(corteIso);
    pagoIso = avanzarUnMes(pagoIso);
  }

  return {
    fechaCorte: corteIso,
    fechaPago: pagoIso,
    corteVisual: formatearAFechaVisual(corteIso),
    pagoVisual: formatearAFechaVisual(pagoIso),
    esSiguienteCiclo,
    claveCiclo: `${corteIso}__${pagoIso}`
  };
};

/**
 * Genera una lista de ciclos ordenados cronológicamente alrededor del ciclo base
 * para mostrarlos en selectores desplegables de filtros.
 */
export const generarCiclosSugeridos = (fechaCorteBase, fechaPagoBase) => {
  if (!fechaCorteBase || !fechaPagoBase) return [];

  const corteActual = formatearAFechaInput(fechaCorteBase);
  const pagoActual = formatearAFechaInput(fechaPagoBase);

  // Ciclo anterior (-1 mes)
  const corteAnt = retrocederUnMes(corteActual);
  const pagoAnt = retrocederUnMes(pagoActual);

  // Ciclo siguiente (+1 mes)
  const corteSig = avanzarUnMes(corteActual);
  const pagoSig = avanzarUnMes(pagoActual);

  // Ciclo subsiguiente (+2 meses)
  const corteSig2 = avanzarUnMes(corteSig);
  const pagoSig2 = avanzarUnMes(pagoSig);

  return [
    {
      clave: `${corteAnt}__${pagoAnt}`,
      fechaCorte: corteAnt,
      fechaPago: pagoAnt,
      corteVisual: formatearAFechaVisual(corteAnt),
      pagoVisual: formatearAFechaVisual(pagoAnt),
      etiqueta: `Corte ${formatearAFechaVisual(corteAnt)} ➔ Pago ${formatearAFechaVisual(pagoAnt)} (Ciclo anterior)`,
      tipo: 'anterior'
    },
    {
      clave: `${corteActual}__${pagoActual}`,
      fechaCorte: corteActual,
      fechaPago: pagoActual,
      corteVisual: formatearAFechaVisual(corteActual),
      pagoVisual: formatearAFechaVisual(pagoActual),
      etiqueta: `Corte ${formatearAFechaVisual(corteActual)} ➔ Pago ${formatearAFechaVisual(pagoActual)} (Ciclo activo)`,
      tipo: 'actual'
    },
    {
      clave: `${corteSig}__${pagoSig}`,
      fechaCorte: corteSig,
      fechaPago: pagoSig,
      corteVisual: formatearAFechaVisual(corteSig),
      pagoVisual: formatearAFechaVisual(pagoSig),
      etiqueta: `Corte ${formatearAFechaVisual(corteSig)} ➔ Pago ${formatearAFechaVisual(pagoSig)} (Próximo ciclo)`,
      tipo: 'siguiente'
    },
    {
      clave: `${corteSig2}__${pagoSig2}`,
      fechaCorte: corteSig2,
      fechaPago: pagoSig2,
      corteVisual: formatearAFechaVisual(corteSig2),
      pagoVisual: formatearAFechaVisual(pagoSig2),
      etiqueta: `Corte ${formatearAFechaVisual(corteSig2)} ➔ Pago ${formatearAFechaVisual(pagoSig2)} (En 2 meses)`,
      tipo: 'futuro'
    }
  ];
};

/**
 * Calcula la diferencia en días naturales entre hoy y la fecha objetivo de pago.
 * - Mayor a 0: Faltan X días para pagar.
 * - Igual a 0: ¡Hoy es la fecha de pago!
 * - Menor a 0: El pago venció hace X días.
 */
export const calcularDiasHastaPago = (fechaPago) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const pago = parseFechaLocal(fechaPago);
  pago.setHours(0, 0, 0, 0);

  const diferenciaMs = pago.getTime() - hoy.getTime();
  return Math.round(diferenciaMs / (1000 * 60 * 60 * 24));
};

/**
 * Retorna el estado y color de alerta según la proximidad de la fecha de pago
 */
export const evaluarEstadoPago = (fechaPago) => {
  const dias = calcularDiasHastaPago(fechaPago);

  if (dias < 0) {
    return {
      estado: 'vencido',
      dias: Math.abs(dias),
      titulo: 'Pago Vencido',
      mensaje: `La fecha de pago fue hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}.`,
      color: '#DC2626',
      icono: 'fas fa-exclamation-triangle',
      badgeClass: 'badge-danger'
    };
  }
  if (dias === 0) {
    return {
      estado: 'hoy',
      dias: 0,
      titulo: '¡Hoy es la Fecha de Pago!',
      mensaje: 'Hoy vence el saldo de tu tarjeta. Revisa la liquidación por persona.',
      color: '#EA580C',
      icono: 'fas fa-bell',
      badgeClass: 'badge-warning'
    };
  }
  if (dias <= 5) {
    return {
      estado: 'proximo',
      dias: dias,
      titulo: `Pago próximo (${dias} ${dias === 1 ? 'día' : 'días'})`,
      mensaje: `La fecha límite de pago es el ${formatearAFechaVisual(fechaPago)}.`,
      color: '#4E44EB',
      icono: 'fas fa-calendar-check',
      badgeClass: 'badge-primary'
    };
  }
  return {
    estado: 'a_tiempo',
    dias: dias,
    titulo: `Al día (${dias} días restantes)`,
    mensaje: `Próximo pago: ${formatearAFechaVisual(fechaPago)}.`,
    color: '#10B981',
    icono: 'fas fa-check-circle',
    badgeClass: 'badge-success'
  };
};

/**
 * Lista de colores vibrantes para asignar a cada usuario en gráficas y avatares
 */
export const COLORES_USUARIOS = [
  '#4E44EB', // Azul índigo Finanzia
  '#F46F5F', // Coral
  '#10B981', // Verde esmeralda
  '#F59E0B', // Ámbar
  '#8B5CF6', // Púrpura
  '#EC4899', // Rosa
  '#06B6D4', // Cian
  '#3B82F6', // Azul cielo
  '#14B8A6', // Turquesa
  '#6366F1'  // Índigo suave
];

