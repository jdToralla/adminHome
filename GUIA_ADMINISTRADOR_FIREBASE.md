# 📘 Guía de Administrador - Firebase Authentication

Esta guía te muestra paso a paso cómo configurar los proveedores de autenticación, solucionar el error `CONFIGURATION_NOT_FOUND`, agregar usuarios manualmente y gestionar el restablecimiento de contraseñas por correo.

---

## 1. 🚨 Solución rápida al error `CONFIGURATION_NOT_FOUND`

El error `CONFIGURATION_NOT_FOUND` ocurre porque el proveedor **Google** todavía no ha sido activado en tu consola de Firebase.

### Pasos para habilitarlo (toma 1 minuto):

1. Ingresa a la consola de tu proyecto en Firebase:
   👉 **[Consola Firebase de AdminHome](https://console.firebase.google.com/project/adminhome-36c6e/authentication/providers)**
2. En el menú lateral izquierdo, haz clic en **Compilación (Build)** > **Authentication**.
   *(Si es la primera vez que entras, haz clic en el botón azul **Comenzar** o **Get Started**).*
3. Ve a la pestaña superior **Sign-in method** (Método de acceso).
4. En la lista de proveedores, haz clic en **Google**:
   - Activa el interruptor **Habilitar** (Enable).
   - En **Nombre público del proyecto**, déjalo como `AdminHome`.
   - En **Correo electrónico de asistencia del proyecto**, selecciona tu correo personal de Google (es obligatorio por políticas de Google).
   - Haz clic en el botón azul **Guardar** (Save).
5. En la misma lista de proveedores, haz clic en **Correo electrónico/contraseña** (Email/Password):
   - Activa el interruptor **Habilitar** para la primera opción (*Permite que los usuarios se registren...*).
   - Haz clic en **Guardar**.

> ✅ **¡Listo!** Ahora vuelve a tu aplicación en el navegador y haz clic en **Continuar con Google**; se abrirá la ventana emergente oficial de Google y podrás ingresar inmediatamente.

---

## 2. 👤 Cómo agregar un usuario manualmente (Como Administrador)

Dado que actualmente no hay una pantalla pública de registro para clientes nuevos, tú como administrador puedes crear todas las cuentas que necesites directamente desde la consola:

1. Ve a la pestaña **Users** (Usuarios) en:
   👉 **[Firebase Authentication - Usuarios](https://console.firebase.google.com/project/adminhome-36c6e/authentication/users)**
2. En la esquina superior derecha de la tabla, haz clic en el botón **Add user** (Agregar usuario).
3. En la ventana emergente:
   - **Email** (Correo electrónico): Escribe el correo del usuario (ejemplo: `usuario@gmail.com`).
   - **Password** (Contraseña): Asígnale una contraseña inicial (mínimo 6 caracteres).
4. Haz clic en **Add user**.

### ¿Qué sucede después?
- El usuario ya tiene su cuenta creada y activa.
- Le proporcionas sus credenciales para que ingrese desde el formulario de la aplicación.
- Si el usuario olvida su contraseña más adelante, puede usar el botón **"¿Olvidaste tu contraseña?"** en el Login para cambiarla él mismo por correo sin que tú tengas que intervenir.

---

## 3. ✉️ Recuperación de contraseña por correo

Firebase incluye este servicio **100% gratis** sin necesidad de configurar servidores SMTP externos.

### Flujo del usuario:
1. En la pantalla de Login de tu app, el usuario hace clic en **"¿Olvidaste tu contraseña?"**.
2. Ingresa su correo electrónico registrado y presiona **Enviar correo**.
3. Firebase le envía de inmediato un correo oficial con un enlace seguro de un solo uso.
4. El usuario abre el enlace en su bandeja de entrada, escribe su nueva contraseña y queda actualizada al instante.

### Cómo personalizar el correo que reciben los usuarios:
1. En la consola de Firebase, ve a **Authentication** > pestaña **Templates** (Plantillas).
2. Haz clic en **Restablecimiento de contraseña** (Password reset).
3. Aquí puedes:
   - Cambiar el **Nombre del remitente** (ej. `AdminHome Finanzas`).
   - Cambiar la dirección de respuesta.
   - Modificar el **Asunto del correo** (ej. *Restablece tu contraseña de AdminHome*).
   - Personalizar el mensaje en español.
4. Haz clic en **Guardar**.

---

## 4. 🌐 Dominios Autorizados (para GitHub Pages y Producción)

Para que el inicio de sesión con Google funcione tanto en tu computadora local como cuando publiques la app en GitHub Pages:

1. En la consola de Firebase, ve a **Authentication** > pestaña **Settings** (Ajustes).
2. Selecciona **Authorized domains** (Dominios autorizados).
3. Verifica que estén en la lista:
   - `localhost` *(ya viene por defecto)*
   - `adminhome-36c6e.firebaseapp.com` *(ya viene por defecto)*
4. Si vas a usar GitHub Pages, asegúrate de que esté agregado:
   - Haz clic en **Agregar dominio** (Add domain).
   - Escribe: `jdToralla.github.io`
   - Haz clic en **Agregar**.

---

## 5. 💡 Resumen de inicio de sesión soportado en la app

Tu aplicación ahora soporta 3 modalidades simultáneas:

| Método | Cómo funciona |
| :--- | :--- |
| **Continuar con Google** | El usuario presiona el botón de Google, autoriza con su cuenta y entra al instante (se registra automáticamente si es su primera vez). |
| **Correo y Contraseña (Firebase Auth)** | Para cuentas creadas por el admin en la consola o registradas con Firebase Authentication. Cuenta con recuperación por correo. |
| **Cuentas Legacy (Firestore)** | Las cuentas anteriores guardadas en la base de datos (como `norma77` / `toralla12`) continúan funcionando como respaldo sin problemas. |

