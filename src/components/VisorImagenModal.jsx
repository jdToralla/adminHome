import React, { useEffect } from 'react';

/**
 * Componente modal lightbox reutilizable para visualizar comprobantes y tickets en tamaño grande.
 * Variables, funciones y comentarios en español para mantenimiento óptimo.
 * 
 * @param {string} urlImagen - URL de la imagen en Cloudinary o blob local
 * @param {Function} alCerrar - Función callback para cerrar el visor
 * @param {string} titulo - Título descriptivo del comprobante
 */
export default function VisorImagenModal({ urlImagen, alCerrar, titulo = 'Comprobante / Ticket' }) {
  useEffect(() => {
    const manejarTecla = (e) => {
      if (e.key === 'Escape' && alCerrar) {
        alCerrar();
      }
    };

    if (urlImagen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', manejarTecla);
    }

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', manejarTecla);
    };
  }, [urlImagen, alCerrar]);

  if (!urlImagen) return null;

  return (
    <div
      className="modal-lightbox-backdrop"
      onClick={alCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-lightbox-contenido"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior con título y botón de cierre */}
        <div className="d-flex justify-content-between align-items-center w-100 mb-2 px-1 text-white">
          <span style={{ fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.2px' }}>
            <i className="fas fa-receipt mr-2" style={{ color: '#818CF8' }}></i>
            {titulo}
          </span>
          <button
            type="button"
            className="modal-lightbox-cerrar-btn"
            onClick={alCerrar}
            aria-label="Cerrar visor"
            title="Cerrar visor (Esc)"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Contenedor de la imagen con escala adaptativa */}
        <div className="modal-lightbox-img-wrapper text-center">
          <img
            src={urlImagen}
            alt="Comprobante en tamaño completo"
            className="modal-lightbox-imagen"
          />
        </div>

        {/* Acciones inferiores */}
        <div className="modal-lightbox-acciones">
          <a
            href={urlImagen}
            target="_blank"
            rel="noopener noreferrer"
            className="modal-lightbox-btn"
            title="Abrir URL original en pestaña nueva"
          >
            <i className="fas fa-external-link-alt"></i>
            <span>Abrir original</span>
          </a>
          <button
            type="button"
            className="modal-lightbox-btn modal-lightbox-btn-primario"
            onClick={alCerrar}
          >
            <i className="fas fa-check"></i>
            <span>Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

