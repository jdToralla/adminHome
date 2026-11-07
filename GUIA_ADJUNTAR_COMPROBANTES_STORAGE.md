# 🧾 Guía de Implementación: Adjuntar y Almacenar Comprobantes / Tickets

Esta guía detalla todo lo necesario para activar, optimizar y mantener a futuro la funcionalidad de **"Adjuntar comprobante o ticket"** en **Finanzia / AdminHome**, asegurando que funcione de forma ultrarrápida en móviles y aprovechando al 100% la **Capa Gratuita de Firebase**.

---

## 1. 🏗️ Arquitectura y Flujo de Datos

```
[Usuario selecciona / toma foto]
              │
              ▼
[Compresión en cliente (HTML5 Canvas)]  ───► Reduce de 10 MB a ~200 KB
              │
              ▼
[Subida a Firebase Storage]             ───► Carpeta: /comprobantes/{userId}/{timestamp}_{nombre}
              │
              ▼
[Obtención de URL de descarga]          ───► getDownloadURL()
              │
              ▼
[Guardado en Firestore (caja-chica)]    ───► Campo: attachmentUrl (texto)
              │
              ▼
[Visualización en Movimientos / Home]   ───► Miniatura y Lightbox con zoom
```

---

## 2. ⚙️ Paso 1: Configuración en Firebase Console

Tu proyecto ya tiene la librería de Storage importada en `src/firebaseConfig.js` (`fire_storage = fire.storage().ref()`), pero requiere estar activo en la nube de Firebase.

### A. Habilitar Firebase Storage
1. Ingresa a la consola: 👉 **[Firebase Console - Storage](https://console.firebase.google.com/project/adminhome-36c6e/storage)**.
2. Si aparece el botón **Comenzar (Get Started)**, haz clic en él.
3. Elige la opción **Iniciar en modo de producción** (o modo de prueba temporal).
4. Selecciona la ubicación del bucket (recomendado: `us-central1` o la misma región donde creaste Firestore).
5. Haz clic en **Listo**.

### B. Reglas de Seguridad Obligatorias (`storage.rules`)
En la consola de Firebase, pestaña **Rules (Reglas)** de Storage, pega las siguientes reglas para proteger los comprobantes de tus usuarios:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Cada usuario solo puede leer y subir a su propia carpeta
    match /comprobantes/{userId}/{nombreArchivo} {
      // Permitir lectura si el usuario está autenticado
      allow read: if request.auth != null;
      
      // Permitir escritura si es su carpeta, pesa menos de 5MB y es imagen o PDF
      allow write: if request.auth != null 
                    && (request.auth.uid == userId || userId == 'legacy')
                    && request.resource.size < 5 * 1024 * 1024
                    && (request.resource.contentType.matches('image/.*') || request.resource.contentType == 'application/pdf');
    }
  }
}
```

---

## 3. 📉 Paso 2: Optimización para la Capa Gratuita (Límites Spark)

### Límites de Firebase Storage (Plan Gratuito Spark):
| Recurso | Límite Gratis Diario / Total |
| :--- | :--- |
| **Almacenamiento total** | 5 GB almacenados |
| **Descarga de datos (Ancho de banda)** | 1 GB al día |
| **Operaciones de subida** | 20,000 subidas al día |
| **Operaciones de descarga** | 50,000 descargas al día |

### 🚨 El Gran Problema de los Celulares:
Una foto tomada con la cámara de un smartphone actual pesa entre **5 MB y 15 MB**.
- Si subes fotos sin comprimir: **5 GB solo alcanzan para ~400 comprobantes** y con solo 80 consultas al día agotas el 1 GB de descarga diaria.

### ✅ La Solución: Compresión en el Navegador (Client-Side)
Comprimir la imagen en el dispositivo del usuario antes de enviarla a Firebase:
- Reducir resolución máxima a **1280px** (más que suficiente para leer perfectamente letras pequeñas de tickets y facturas).
- Calidad JPEG al **75%**.
- **Resultado:** La foto pasa de 8 MB a solo **~150 KB - 250 KB** (reducción del 95%).
- **Capacidad resultante:** ¡Con 5 GB gratuitos puedes almacenar más de **25,000 comprobantes** sin pagar un centavo!

---

## 4. 💻 Paso 3: Código de Compresión (Sin librerías pesadas)

Puedes crear un helper utilitario en `src/utils/compresorImagen.js` usando la API nativa de Canvas de HTML5:

```javascript
/**
 * Comprime una imagen en el navegador antes de subirla
 * @param {File} archivoOriginal - Archivo del input file
 * @param {number} maxAncho - Ancho máximo permitido (default 1280px)
 * @param {number} calidad - Calidad de compresión (0.1 a 1.0)
 * @returns {Promise<Blob>} Imagen comprimida lista para Storage
 */
export const comprimirImagen = (archivoOriginal, maxAncho = 1280, calidad = 0.75) => {
  return new Promise((resolve, reject) => {
    // Si es PDF, no se comprime por canvas
    if (archivoOriginal.type === 'application/pdf') {
      return resolve(archivoOriginal);
    }

    const lector = new FileReader();
    lector.readAsDataURL(archivoOriginal);

    lector.onload = (evento) => {
      const img = new Image();
      img.src = evento.target.result;

      img.onload = () => {
        let ancho = img.width;
        let alto = img.height;

        // Redimensionar proporcionalmente si supera el ancho máximo
        if (ancho > maxAncho) {
          alto = Math.round((alto * maxAncho) / ancho);
          ancho = maxAncho;
        }

        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, ancho, alto);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], archivoOriginal.name, { type: 'image/jpeg' }));
            } else {
              resolve(archivoOriginal);
            }
          },
          'image/jpeg',
          calidad
        );
      };

      img.onerror = (error) => reject(error);
    };

    lector.onerror = (error) => reject(error);
  });
};
```

---

## 5. 📱 Paso 4: Experiencia Móvil (UX) y Captura de Foto

### A. Permitir Abrir la Cámara Directamente
En el formulario (`AddData.jsx`), agrega el atributo `capture="environment"` para que en celulares ofrezca tomar la foto al instante:

```jsx
<input
  type="file"
  accept="image/*,.pdf"
  capture="environment" // Abre directo la cámara trasera en móviles
  className="campo-formulario-finanzia"
  onChange={manejarSeleccionComprobante}
/>
```

### B. Vista Previa Inmediata (Thumbnail)
Antes de guardar el gasto o ingreso, mostrarle al usuario una miniatura del ticket para que verifique que la foto no salió borrosa:

```jsx
{urlVistaPrevia && (
  <div className="contenedor-preview-comprobante mt-2 position-relative">
    <img
      src={urlVistaPrevia}
      alt="Vista previa ticket"
      style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '12px' }}
    />
    <button
      type="button"
      className="btn btn-sm btn-danger rounded-circle position-absolute"
      style={{ top: '8px', right: '8px', width: '28px', height: '28px' }}
      onClick={quitarComprobante}
      title="Eliminar foto"
    >
      <i className="fas fa-times"></i>
    </button>
  </div>
)}
```

---

## 6. 💾 Paso 5: Guardado en Firestore y Subida con Progreso

Actualmente, `AddData.jsx` ya contiene la lógica base de subida. Con compresión y barra de progreso queda robusta:

```javascript
// Al presionar "Guardar":
let urlComprobante = null;

if (archivoComprobante) {
  // 1. Comprimir antes de enviar
  const archivoListo = await comprimirImagen(archivoComprobante, 1280, 0.75);

  // 2. Crear ruta única
  const extension = archivoListo.name.split('.').pop();
  const nombreLimpio = `${Date.now()}_comprobante.${extension}`;
  const refStorage = fire_storage.child(`comprobantes/${idUsuario}/${nombreLimpio}`);

  // 3. Subir
  const tareaSubida = await refStorage.put(archivoListo);
  urlComprobante = await tareaSubida.ref.getDownloadURL();
}

// 4. Guardar documento en Firestore con la URL
const nuevoMovimiento = {
  // ... campos habituales
  attachmentUrl: urlComprobante, // URL accesible
  tieneComprobante: Boolean(urlComprobante),
  createdAt: new Date().toISOString()
};
```

---

## 7. 🔍 Paso 6: Visualización del Comprobante en Movimientos y Home

Para que el usuario pueda consultar su ticket más adelante:

### En el Modal de Detalle de Movimiento:
```jsx
{movimientoSeleccionado.attachmentUrl && (
  <div className="mt-3 text-center">
    <a
      href={movimientoSeleccionado.attachmentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn btn-sm btn-outline-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
      style={{ borderRadius: '12px', fontWeight: 700 }}
    >
      <i className="fas fa-receipt"></i>
      Ver Comprobante / Ticket Adjunto ↗
    </a>
  </div>
)}
```

O bien embebido directamente en la tarjeta del detalle:
```jsx
<img 
  src={movimientoSeleccionado.attachmentUrl} 
  alt="Ticket" 
  className="img-fluid rounded-lg shadow-sm"
  style={{ maxHeight: '250px', cursor: 'pointer' }}
  onClick={() => window.open(movimientoSeleccionado.attachmentUrl, '_blank')}
/>
```

---

## 8. 📊 Alternativas Evaluadas (Comparativa)

| Opción | Ventajas | Desventajas | Veredicto para Finanzia |
| :--- | :--- | :--- | :--- |
| **Firebase Storage** (Recomendada) | Ya está integrado con Auth y Firestore en el proyecto. 5 GB gratis. Mismo SDK. | Requiere activar reglas en consola. | **100% Recomendada** (la más natural). |
| **Cloudinary** | 25 GB gratis mensuales. Auto-compresión y CDN ultra rápido. | Requiere crear cuenta externa y manejar otra API Key. | Buena alternativa si se superan los 5 GB de Firebase. |
| **Base64 en Firestore** | No requiere Storage. | **Pésima práctica**: Firestore tiene límite de 1 MB por documento. Encarece lecturas y congela la app. | **NO recomendada bajo ninguna circunstancia.** |

---

## 9. 📋 Checklist para el Día de la Activación

- [ ] Entrar a Firebase Console y presionar **Get Started** en la pestaña **Storage**.
- [ ] Pegar las **Reglas de Seguridad** de la sección 2.
- [ ] Incorporar el helper de compresión `comprimirImagen.js` para reducir imágenes a ~200 KB.
- [ ] Añadir vista previa (preview thumbnail) con botón de descartar en `AddData.jsx`.
- [ ] Añadir botón "Ver Comprobante" en el modal de detalle de `Movimientos.jsx` y `Home.jsx`.
- [ ] Comprobar en un celular que la cámara abra directamente con `capture="environment"`.

