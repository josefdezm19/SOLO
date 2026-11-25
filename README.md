# SoloAthletics

Plataforma para que un entrenador programe el trabajo físico de sus atletas y ellos lo sigan desde el móvil.

Tiene dos interfaces conectadas entre sí:

- **Entrenador (ordenador):** crea ejercicios con vídeo demostrativo, monta programas por fases, semanas y sesiones, los asigna y hace el seguimiento.
- **Atleta (móvil):** ve su programa activo y las sesiones pendientes, registra lo que hace y valora el esfuerzo.

> **Estado: prototipo navegable.** Todo funciona en el navegador con datos de ejemplo ficticios y se pierde al recargar la página. Todavía no hay cuentas reales, base de datos ni servidor (ver [Siguientes pasos](#siguientes-pasos)).

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
- **Registro:** flujo de alta para entrenador y para atleta (con código de invitación).

## Cómo probarlo

No necesita instalación. Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python3 -m http.server 8080
# y entra en http://localhost:8080
```

El selector de la barra superior alterna entre **Entrenador · ordenador**, **Atleta · móvil** y **Registro**.

Prueba rápida de todas las pantallas (requiere Node.js):

```bash
node tests/smoke.js
```

## Estructura

```
index.html          Página principal
css/styles.css      Estilos (tema oscuro, acento #FF83D6)
js/seed-data.js     Biblioteca de ejercicios de ejemplo
js/app.js           Lógica y pantallas de la aplicación
assets/logo.png     Logo
tests/smoke.js      Prueba que pinta todas las pantallas
```

## Datos de ejemplo

Los atletas, correos, programas y ejercicios son ficticios. La biblioteca de ejemplo (`js/seed-data.js`) no incluye vídeos. Este repositorio es público: no subas aquí datos personales de atletas ni vídeos o contenido que no quieras publicar.

## Siguientes pasos

1. **Cuentas y datos reales:** autenticación para entrenador y atletas y base de datos (por ejemplo Supabase, con permisos por fila para que cada atleta solo vea lo suyo).
2. **Vídeos:** almacenamiento propio para los vídeos subidos (ahora solo duran la sesión del navegador).
3. **Invitaciones por email** y unión automática del atleta a su programa al registrarse.
4. **Pendiente de completar en la interfaz:** historial del atleta por ejercicio, chat bidireccional, recogida de respuestas de los cuestionarios y que el tipo de peso y de reps se refleje en la vista del atleta.
5. **Publicación:** alojamiento web (Vercel, Netlify o GitHub Pages) con dominio propio.
