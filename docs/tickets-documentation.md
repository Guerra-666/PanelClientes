# Sistema de Tickets - Documentación

## Descripción General

El sistema de tickets es una sección completa de soporte técnico que permite a los usuarios:
- Ver todos sus tickets de soporte
- Crear nuevos tickets 
- Chatear en tiempo real con el equipo de soporte
- Adjuntar archivos
- Seguir el progreso de sus solicitudes
- Calificar la atención recibida

## Estructura de Archivos

```
src/
├── pages/
│   ├── tickets.astro                    # Redirección a versión dinámica
│   └── tickets/
│       └── [userId].astro               # Página principal de tickets
├── components/
│   └── Tickets/
│       └── TicketsMain.astro            # Componente principal
└── docs/
    ├── tickets-api-schema.json          # Esquema del API
    └── tickets-documentation.md         # Esta documentación
```

## Rutas Dinámicas

El sistema implementa rutas dinámicas siguiendo el mismo patrón que Dashboard, Perfil y Servicios:

- **Estática (redirige)**: `/tickets` → `/tickets/19`
- **Dinámica**: `/tickets/{userId}` → `/tickets/19`, `/tickets/1`, etc.

## Funcionalidades Implementadas

### ✅ Vista Principal de Tickets
- Lista paginada de todos los tickets del usuario
- Estadísticas resumidas (activos, resueltos, en progreso)
- Filtros por estado, prioridad, categoría
- Vista previa del último mensaje
- Botones de acción para cada ticket

### ✅ Modal de Chat Interactivo
- Vista completa del historial de mensajes
- Interfaz de chat en tiempo real
- Diferenciación visual entre mensajes del cliente y soporte
- Sistema de avatares
- Timestamps legibles
- Estados del ticket (en progreso vs resuelto)

### ✅ Creación de Nuevos Tickets
- Formulario completo con validaciones
- Categorización por tipo de problema
- Selección de prioridad
- Asociación con servicios contratados
- Carga de archivos adjuntos

### ✅ Manejo de Archivos
- Drag & drop de archivos
- Validación de tipos y tamaños
- Vista previa de archivos adjuntos
- Límites de seguridad

### ✅ Estados y Flujo de Trabajo
- **Abierto**: Ticket recién creado
- **En Progreso**: Ticket siendo atendido
- **Pendiente Cliente**: Esperando respuesta del cliente
- **Resuelto**: Problema solucionado
- **Cerrado**: Ticket finalizado

### ✅ Sistema de Prioridades
- **Baja**: Consultas generales, mejoras
- **Media**: Problemas que no afectan operación crítica
- **Alta**: Problemas que afectan funcionalidad importante
- **Crítica**: Problemas que detienen operaciones

## Integración con APIs

### Endpoint Principal
```javascript
GET https://backend-express-c423b4135ed6.herokuapp.com/api/tickets/usuario/{userId}
```

### Endpoints Adicionales
```javascript
// Crear ticket
POST https://backend-express-c423b4135ed6.herokuapp.com/api/tickets/usuario/{userId}

// Enviar mensaje
POST https://backend-express-c423b4135ed6.herokuapp.com/api/tickets/{ticketId}/messages

// Cerrar ticket
PATCH https://backend-express-c423b4135ed6.herokuapp.com/api/tickets/{ticketId}/close

// Subir archivo
POST https://backend-express-c423b4135ed6.herokuapp.com/api/tickets/{ticketId}/upload
```

## Estructura de Datos

### Estadísticas de Tickets
```typescript
interface TicketsStats {
  activos: number;
  resueltos: number;
  enProgreso: number;
  pendientes: number;
  total: number;
  promedioRespuesta: string;
  satisfaccionPromedio: number;
}
```

### Ticket Individual
```typescript
interface Ticket {
  id: string;
  numero: number;
  title: string;
  description: string;
  status: 'Abierto' | 'En Progreso' | 'Pendiente Cliente' | 'Resuelto' | 'Cerrado';
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  category: string;
  subcategory?: string;
  service: string;
  serviceId: string;
  assignedTo: string;
  assignedToId: string;
  assignedToAvatar: string;
  created: string;
  createdTimestamp: string;
  lastUpdate: string;
  lastUpdateTimestamp: string;
  estimatedResolution?: string;
  tags: string[];
  clientRating?: number;
  clientFeedback?: string;
  messages: Message[];
  timeline: TimelineEvent[];
  attachments: Attachment[];
}
```

### Mensaje del Chat
```typescript
interface Message {
  id: number;
  sender: string;
  senderId: string;
  type: 'client' | 'support' | 'system';
  message: string;
  timestamp: string;
  timestampISO: string;
  avatar: string;
  attachments: string[];
  isRead: boolean;
  isPrivate: boolean;
  actionTaken?: string;
}
```

## Características de UX/UI

### ✅ Responsive Design
- Mobile-first approach
- Adaptación completa para tablet y desktop
- Modal de chat responsive
- Formularios optimizados para touch

### ✅ Accesibilidad
- Navegación por teclado
- Estados de focus visibles
- Contraste adecuado de colores
- Textos alternativos en iconos

### ✅ Interactividad
- Estados hover y focus
- Transiciones suaves
- Feedback visual inmediato
- Loading states

### ✅ Consistencia Visual
- Sigue el mismo design system que Dashboard, Perfil y Servicios
- Colores y tipografía unificados
- Espaciado y grid system consistente
- Iconografía coherente

## Funciones JavaScript

### Gestión de Modales
```javascript
// Abrir modal de chat
function openChatModal(ticketId) { ... }

// Cerrar modal
function closeChatModal() { ... }

// Crear contenido del modal dinámicamente
function createChatModal(ticket) { ... }
```

### Formulario de Creación
```javascript
// Mostrar/ocultar formulario
function toggleCreateForm() { ... }

// Validar campos requeridos
function validateForm() { ... }

// Manejar archivos adjuntos
function handleFileAttachment(files) { ... }
```

### Chat en Tiempo Real
```javascript
// Enviar mensaje
function sendMessage(ticketId, message) { ... }

// Manejar enter para enviar
function handleKeyPress(event) { ... }

// Auto-scroll a mensajes nuevos
function scrollToBottom() { ... }
```

## Configuración del Sistema

### Límites de Archivos
- Tamaño máximo: **5MB por archivo**
- Tipos permitidos: **JPG, PNG, GIF, PDF, TXT, DOC, DOCX**
- Máximo archivos por mensaje: **5**

### Límites de Mensajes
- Longitud máxima: **5,000 caracteres**
- Auto-refresh: **30 segundos**
- Timeout de "escribiendo": **3 segundos**

### Horario de Atención
- **Lunes a Viernes**: 9:00 AM - 6:00 PM
- **Tiempo de respuesta**: Varía según plan contratado
- **Soporte urgente**: Disponible para planes premium

## Navegación y Routing

### Integración con SideBar
El sistema está completamente integrado con la navegación principal:

```typescript
// SideBar actualizado con ruta dinámica
{
  name: 'Tickets',
  icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2...',
  href: `/tickets/${userId}`,
  id: 'tickets'
}
```

### Redirección Automática
```javascript
// tickets.astro redirige a la versión dinámica
return Astro.redirect('/tickets/19');
```

## Casos de Uso Principales

### 1. Usuario Consulta sus Tickets
1. Navega a `/tickets/{userId}`
2. Ve estadísticas y lista de tickets
3. Puede filtrar por estado/prioridad
4. Hace clic en "Ver Detalles" para abrir chat

### 2. Usuario Crea Nuevo Ticket
1. Hace clic en "Crear Nuevo Ticket"
2. Llena formulario con problema
3. Selecciona categoría y prioridad
4. Adjunta archivos si es necesario
5. Envía ticket y recibe confirmación

### 3. Usuario Chatear con Soporte
1. Abre ticket existente desde la lista
2. Ve historial completo de mensajes
3. Escribe respuesta en tiempo real
4. Adjunta archivos adicionales
5. Recibe notificaciones de respuestas

### 4. Ticket se Resuelve
1. Soporte marca ticket como resuelto
2. Usuario ve mensaje de confirmación
3. Chat se bloquea para nuevos mensajes
4. Usuario puede calificar la atención

## Próximas Mejoras Sugeridas

### 🔄 Funcionalidades Pendientes
- [ ] Notificaciones push en tiempo real
- [ ] Sistema de calificaciones y feedback
- [ ] Búsqueda avanzada de tickets
- [ ] Exportar historial a PDF
- [ ] Integración con calendario para citas
- [ ] Chat de video para soporte avanzado
- [ ] Base de conocimientos integrada
- [ ] Tickets colaborativos (múltiples usuarios)

### 🔄 Mejoras Técnicas
- [ ] WebSocket para chat en tiempo real
- [ ] Service Worker para notificaciones offline
- [ ] Cache de tickets para rendimiento
- [ ] Lazy loading de mensajes antiguos
- [ ] Compresión automática de imágenes
- [ ] OCR para archivos de imagen con texto
- [ ] Integración con sistemas de monitoreo

## Estructura del Código

### TypeScript Interfaces
Todas las interfaces están tipadas para máxima seguridad:

```typescript
// Props del componente principal
interface Props {
  ticketsData: TicketsData;
  userId: string;
}

// Datos completos del sistema
interface TicketsData {
  ticketsStats: TicketsStats;
  tickets: Ticket[];
}
```

### Componentes Modulares
- **TicketsMain.astro**: Componente principal con toda la lógica
- **Layout.astro**: Layout compartido con navegación
- **SideBar.astro**: Navegación actualizada con ruta de tickets

### Scripts Organizados
- Event listeners organizados por funcionalidad
- Funciones puras para manipulación de DOM
- Manejo de errores y edge cases
- Compatibilidad cross-browser

## Conclusión

El sistema de tickets está completamente implementado siguiendo las mejores prácticas establecidas en el proyecto. Mantiene consistencia visual y funcional con Dashboard, Perfil y Servicios, mientras proporciona una experiencia completa de soporte técnico con chat en tiempo real, gestión de archivos y workflow avanzado.

La implementación es escalable, mantenible y lista para integración con APIs reales, proporcionando una base sólida para el crecimiento futuro del sistema de soporte.
