# SoloAthletics

Plataforma para que un entrenador programe el trabajo físico de sus atletas y ellos lo sigan desde el móvil.

Tiene dos interfaces conectadas entre sí:

- **Entrenador (ordenador):** crea ejercicios con vídeo demostrativo, monta programas por fases, semanas y sesiones, los asigna y hace el seguimiento.
- **Atleta (móvil):** ve su programa activo y las sesiones pendientes, registra lo que hace y valora el esfuerzo.

> **Estado: prototipo para entorno universitario controlado.** Funciona en el navegador, sin servidor. Cada email (Gmail u otro) tiene su cuenta y sus datos se guardan en ese navegador: al volver a entrar se recuerdan programas, miembros, plantillas, ejercicios y perfil. Los datos no viajan entre dispositivos.

## Funcionalidades

### Entrenador

- **Inicio:** miembros, programas, actividad reciente y cuestionarios.
- **Miembros:** alta con enlace de invitación, edición de nombre y email, desactivar, y ficha con sesiones hechas, pendientes y comentarios.
- **Programas:** fases, semanas y sesiones; asignar a un miembro; marcar como completado.
- **Visibilidad por semana:** una semana oculta se sigue programando pero el atleta no la ve.
- **Editor de semanas:** una columna por día, días renombrables, y vista de progresión de cargas (el mismo día de todas las semanas, en paralelo).
- **Copiar y borrar:** menú ⋯ en fases, semanas y sesiones para copiarlas a otra fase o a otro programa; borrar semanas.
- **Plantillas:** guardar un programa o una fase con nombre y usarla al crear programas o fases nuevas.
- **COSITAS (biblioteca):** programas, fases, plantillas y ejercicios, con buscador, filtros por estado y por etiquetas propias, y miniatura del vídeo.
- **Ejercicios:** nombre, indicaciones, 21 parámetros (reps, peso, tiempo, RPE, RIR, tempo…), material, etiquetas, imágenes y vídeo (enlace de YouTube o Vimeo, o archivo subido).
- **Cuestionarios:** texto libre, escala 1-10, opción múltiple y sí/no.

### Atleta

- **Programas:** calendario, programa activo y *tarea pendiente* con las próximas sesiones.
- **Entreno:** vista previa, ejercicios con tick, vídeo e indicaciones, edición de reps y kg reales, y comentarios con adjuntos.
- **Valoración final:** esfuerzo percibido (RPE) y duración; el entrenador lo ve en Actividad.
- **Chats y perfil:** mensajes, datos personales y contadores de entrenos completados y semanas seguidas.
- **Cuentas:** registro e inicio de sesión con email y contraseña; la sesión y los datos se recuerdan al cerrar y volver a abrir la web.

## Cómo probarlo

No necesita instalación. Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python3 -m http.server 8080
# y entra en http://localhost:8080
```

Al abrir la web se pide iniciar sesión o crear una cuenta (entrenador o atleta). Un entrenador nuevo empieza **sin programas ni miembros**, con la biblioteca COSITAS ya cargada. El selector de la barra superior alterna entre **Entrenador · ordenador** y **Atleta · móvil** (vista previa), y **Salir** cierra la sesión.

Prueba rápida de todas las pantallas (requiere Node.js):

```bash
node tests/smoke.js
```

## Estructura

```
index.html          Página principal
css/styles.css      Estilos (tema oscuro, acento #FF83D6)
js/seed-data.js     Biblioteca COSITAS: 430 ejercicios, 198 con vídeo de YouTube
js/app.js           Lógica y pantallas de la aplicación
js/auth.js          Cuentas y memoria (localStorage e IndexedDB)
docs/videos_pendientes.csv  Ejercicios cuyo vídeo hay que subir a mano
assets/logo.png     Logo
tests/smoke.js      Prueba que pinta todas las pantallas
```

## Datos y memoria

La biblioteca incluye los 430 ejercicios del entrenador, 198 con enlace de YouTube. Los otros 227 vídeos eran archivos propios que no están en el repositorio: se listan en `docs/videos_pendientes.csv` para subirlos desde *Editar ejercicio → sube un vídeo desde tu ordenador* (se guardan en IndexedDB del navegador). No hay programas ni miembros de ejemplo. Las contraseñas se guardan con un hash simple en `localStorage`: válido para pruebas en clase, no para producción.

## Siguientes pasos

1. **Cuentas y datos reales:** autenticación para entrenador y atletas y base de datos (por ejemplo Supabase, con permisos por fila para que cada atleta solo vea lo suyo).
2. **Vídeos:** almacenamiento propio (los subidos ahora quedan solo en el navegador donde se subieron).
3. **Invitaciones por email** y unión automática del atleta a su programa al registrarse.
4. **Pendiente de completar en la interfaz:** historial del atleta por ejercicio, chat bidireccional, recogida de respuestas de los cuestionarios y que el tipo de peso y de reps se refleje en la vista del atleta.
5. **Publicación:** alojamiento web (Vercel, Netlify o GitHub Pages) con dominio propio.
