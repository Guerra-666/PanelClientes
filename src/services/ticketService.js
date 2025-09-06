/**
 * Servicio para gestionar las operaciones de tickets
 */
export class TicketService {
  static API_BASE_URL = 'https://backend-express-c423b4135ed6.herokuapp.com/api';
  
  /**
   * Obtiene todos los tickets de un usuario agrupados
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>} - Datos de tickets agrupados
   */
  static async getTicketsGroupedByUser(userId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/tickets-grouped/usuario/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener tickets: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data[`user${userId}`]) {
        const userData = data.data[`user${userId}`];
        
        return {
          userName: userData.userName,
          userAvatar: userData.userAvatar,
          ticketsStats: {
            activos: userData.stats.openTickets,
            resueltos: userData.stats.resolvedTickets,
            enProgreso: userData.stats.totalTickets - userData.stats.openTickets - userData.stats.resolvedTickets,
            total: userData.stats.totalTickets,
            tiempoRespuesta: userData.stats.avgResponseTime
          },
          tickets: userData.tickets.map((ticket) => ({
            id: ticket.id.toString(),
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            service: ticket.service,
            priority: ticket.priority || "Media",
            status: ticket.status,
            created: ticket.created,
            lastUpdate: ticket.lastUpdate,
            assignedTo: ticket.assignedTo,
            assignedToAvatar: ticket.assignedToAvatar,
            messages: ticket.messages || []
          }))
        };
      } else {
        throw new Error('No se encontraron datos de tickets para el usuario');
      }
    } catch (error) {
      console.error("Error en getTicketsGroupedByUser:", error);
      return null;
    }
  }
  
  /**
   * Obtiene un ticket específico por su ID
   * @param {string} userId - ID del usuario
   * @param {string} ticketId - ID del ticket
   * @returns {Promise<Object|null>} - Datos del ticket o null si hay error
   */
  static async getTicketById(userId, ticketId) {
    try {
      console.log(`Obteniendo ticket ${ticketId} para el usuario ${userId}`);
      
      // Primero intentamos obtener el ticket directamente desde el endpoint específico
      try {
        const response = await fetch(`${this.API_BASE_URL}/tickets/${ticketId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            console.log("Ticket obtenido directamente de la API");
            
            // Obtener los mensajes del ticket
            const messages = await this.getTicketMessages(ticketId);
            
            // Formatear y devolver el ticket con sus mensajes
            return {
              id: data.data.id.toString(),
              title: data.data.title,
              description: data.data.description,
              category: data.data.category,
              service: data.data.service,
              priority: data.data.priority || "Media",
              status: data.data.status,
              created: data.data.created,
              lastUpdate: data.data.lastUpdate,
              assignedTo: data.data.assignedTo,
              assignedToAvatar: data.data.assignedToAvatar,
              userId: userId,
              messages: messages || []
            };
          }
        }
      } catch (directError) {
        console.warn("Error al obtener ticket directo, intentando método alternativo:", directError);
      }
      
      // Si falla el método directo, usamos el método alternativo
      console.log("Usando método alternativo para obtener ticket");
      
      // Obtenemos los tickets del usuario para encontrar el que buscamos
      const userTickets = await this.getTicketsGroupedByUser(userId);
      
      if (!userTickets || !userTickets.tickets) {
        throw new Error('No se encontraron tickets para el usuario');
      }
      
      // Buscamos el ticket específico
      const ticket = userTickets.tickets.find(t => t.id === ticketId);
      
      if (!ticket) {
        throw new Error(`No se encontró el ticket con ID: ${ticketId}`);
      }
      
      // Obtenemos los mensajes del ticket
      const messages = await this.getTicketMessages(ticketId);
      
      // Combinamos la información
      return {
        ...ticket,
        userId: userId, // Aseguramos que el userId esté presente
        messages: messages || []
      };
    } catch (error) {
      console.error("Error en getTicketById:", error);
      return null;
    }
  }
  
  /**
   * Obtiene los mensajes de un ticket específico
   * @param {string} ticketId - ID del ticket
   * @returns {Promise<Array|null>} - Array de mensajes o null si hay error
   */
  static async getTicketMessages(ticketId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/tickets/${ticketId}/messages`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener mensajes: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(message => ({
          id: message.id,
          type: message.type || (message.senderType === 'Cliente' ? 'client' : 'support'),
          sender: message.senderName,
          avatar: message.senderAvatar,
          timestamp: message.timestamp || message.created,
          message: message.content || message.text,
          attachments: message.attachments || []
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error en getTicketMessages:", error);
      return [];
    }
  }
  
  /**
   * Obtiene el historial completo de un ticket
   * @param {string} ticketId - ID del ticket
   * @returns {Promise<Object|null>} - Historial del ticket o null si hay error
   */
  static async getTicketHistory(ticketId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/tickets/${ticketId}/history`);
      
      if (!response.ok) {
        throw new Error(`Error al obtener historial: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error en getTicketHistory:", error);
      return null;
    }
  }
  
  /**
   * Envía un mensaje a un ticket
   * @param {string} ticketId - ID del ticket
   * @param {string} message - Contenido del mensaje
   * @param {Array} files - Archivos adjuntos (opcional)
   * @returns {Promise<boolean>} - true si se envió correctamente
   */
  static async sendMessage(ticketId, message, files = []) {
    try {
      // Determinar el tipo de remitente (cliente o soporte)
      const senderType = 'Cliente'; // O "Soporte" si fuera un agente
      
      const messageData = {
        content: message,
        senderType,
        timestamp: new Date().toISOString()
      };
      
      // Si hay archivos, procesarlos
      if (files && files.length > 0) {
        // Aquí iría la lógica para subir archivos
        messageData.attachments = files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size
        }));
      }
      
      const response = await fetch(`${this.API_BASE_URL}/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        throw new Error(`Error al enviar mensaje: ${response.status}`);
      }
      
      const data = await response.json();
      return data.success;
      
    } catch (error) {
      console.error("Error en sendMessage:", error);
      return false;
    }
  }
  
  /**
   * Crea un nuevo ticket
   * @param {Object} ticketData - Datos del nuevo ticket
   * @returns {Promise<Object|null>} - Ticket creado o null si hay error
   */
  static async createTicket(ticketData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) {
        throw new Error(`Error al crear ticket: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        return data.data;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error en createTicket:", error);
      return null;
    }
  }
}
