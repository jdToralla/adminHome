/**
 * Utilidades para Compresión y Subida de Comprobantes a Cloudinary
 * Variables, métodos y comentarios en español para fácil mantenimiento.
 */

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 's1m0k1wk';
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'finanzia_tickets';

/**
 * Comprime una imagen en el navegador del usuario utilizando HTML5 Canvas.
 * Reduce el peso en más del 90% (de ~8-12 MB a ~150-250 KB) sin perder legibilidad del ticket.
 *
 * @param {File} archivoOriginal - Archivo seleccionado o fotografiado
 * @param {number} maxAncho - Ancho máximo permitido (por defecto 1280px)
 * @param {number} calidad - Calidad de compresión JPEG (0.1 a 1.0, por defecto 0.75)
 * @returns {Promise<File>} Archivo comprimido listo para subida rápida
 */
export const comprimirImagen = (archivoOriginal, maxAncho = 1280, calidad = 0.75) => {
  return new Promise((resolve) => {
    // Si es un archivo PDF, no se procesa en canvas
    if (!archivoOriginal || archivoOriginal.type === 'application/pdf') {
      return resolve(archivoOriginal);
    }

    // Si no es una imagen válida, retornar tal cual
    if (!archivoOriginal.type.startsWith('image/')) {
      return resolve(archivoOriginal);
    }

    const lector = new FileReader();
    lector.readAsDataURL(archivoOriginal);

    lector.onload = (evento) => {
      const imagen = new Image();
      imagen.src = evento.target.result;

      imagen.onload = () => {
        let ancho = imagen.width;
        let alto = imagen.height;

        // Redimensionar proporcionalmente solo si supera el ancho máximo
        if (ancho > maxAncho) {
          alto = Math.round((alto * maxAncho) / ancho);
          ancho = maxAncho;
        }

        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;

        const contexto = canvas.getContext('2d');
        // Dibujo de imagen suavizada
        contexto.drawImage(imagen, 0, 0, ancho, alto);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const archivoComprimido = new File(
                [blob],
                archivoOriginal.name.replace(/\.[^/.]+$/, '') + '.jpg',
                { type: 'image/jpeg' }
              );
              resolve(archivoComprimido);
            } else {
              resolve(archivoOriginal);
            }
          },
          'image/jpeg',
          calidad
        );
      };

      imagen.onerror = () => {
        // En caso de fallo al leer la imagen, devolver el archivo original como fallback
        resolve(archivoOriginal);
      };
    };

    lector.onerror = () => {
      resolve(archivoOriginal);
    };
  });
};

/**
 * Sube un archivo de comprobante/ticket a Cloudinary con reporte de progreso en tiempo real.
 * Utiliza XMLHttpRequest para calcular el porcentaje real de subida (0 a 100%).
 *
 * @param {File} archivo - Archivo de imagen o PDF a subir
 * @param {Function} [onProgreso] - Callback para reportar porcentaje de progreso (0-100)
 * @param {Function} [onEstado] - Callback para reportar texto informativo del estado
 * @returns {Promise<string>} URL segura HTTPS del comprobante alojado en Cloudinary
 */
export const subirACloudinary = async (archivo, onProgreso = null, onEstado = null) => {
  if (!archivo) {
    throw new Error('No se proporcionó ningún archivo para subir.');
  }

  // 1. Fase de compresión previa
  if (onEstado) onEstado('Optimizando y comprimiendo imagen...');
  if (onProgreso) onProgreso(5);

  let archivoAProcesar = archivo;
  try {
    archivoAProcesar = await comprimirImagen(archivo, 1280, 0.75);
  } catch (errorCompresion) {
    console.warn('Fallo compresión local, subiendo archivo original:', errorCompresion);
  }

  if (onProgreso) onProgreso(15);
  if (onEstado) onEstado('Conectando con Cloudinary...');

  // 2. Preparar FormData para Unsigned Upload
  const datosFormulario = new FormData();
  datosFormulario.append('file', archivoAProcesar);
  datosFormulario.append('upload_preset', UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const solicitud = new XMLHttpRequest();
    const urlDestino = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    solicitud.open('POST', urlDestino, true);

    // Monitoreo de progreso en tiempo real de subida
    solicitud.upload.onprogress = (evento) => {
      if (evento.lengthComputable) {
        // Mapeamos el progreso de subida entre 15% y 95%
        const porcentajeReal = Math.round((evento.loaded / evento.total) * 100);
        const porcentajeAjustado = Math.round(15 + (porcentajeReal * 0.8));
        if (onProgreso) onProgreso(porcentajeAjustado);
        if (onEstado) onEstado(`Subiendo comprobante: ${porcentajeReal}%`);
      }
    };

    solicitud.onload = () => {
      if (solicitud.status >= 200 && solicitud.status < 300) {
        try {
          const respuesta = JSON.parse(solicitud.responseText);
          if (respuesta.secure_url) {
            if (onProgreso) onProgreso(100);
            if (onEstado) onEstado('¡Comprobante subido exitosamente!');
            resolve(respuesta.secure_url);
          } else {
            reject(new Error('Cloudinary no devolvió una URL segura para el archivo.'));
          }
        } catch (errorParseo) {
          reject(new Error('Respuesta inválida recibida de Cloudinary.'));
        }
      } else {
        try {
          const respuestaError = JSON.parse(solicitud.responseText);
          const mensaje = respuestaError.error?.message || `Error HTTP ${solicitud.status}`;
          reject(new Error(`Error de Cloudinary: ${mensaje}`));
        } catch (e) {
          reject(new Error(`Fallo en la subida a Cloudinary (Código ${solicitud.status}).`));
        }
      }
    };

    solicitud.onerror = () => {
      reject(new Error('Error de red al intentar conectar con los servidores de Cloudinary.'));
    };

    solicitud.ontimeout = () => {
      reject(new Error('Tiempo de espera agotado al subir el comprobante.'));
    };

    // Timeout de 45 segundos para conexiones móviles lentas
    solicitud.timeout = 45000;

    solicitud.send(datosFormulario);
  });
};

