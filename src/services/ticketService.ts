const API_URL = 'https://backend-express-c423b4135ed6.herokuapp.com/api';

export async function getTicketsByUserId(userId: string): Promise<TicketData | null> {
  return TicketService.getUserTickets(userId);
}

export interface TicketStats {
  total: number;
  pendientes: number;
  enProgreso: number;
  resueltos: number;
  avgResponseTime: string;
}

export interface Ticket {
  id: string;
  title: string;
  status: 'Pendiente' | 'En Progreso' | 'Resuelto';
  priority?: 'Alta' | 'Media' | 'Baja';
  category: string;
  service: string;
  description: string;
  created: string;
  lastUpdate: string;
  assignedTo: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  sender: string;
  type: 'client' | 'support' | 'system';
  message: string;
  timestamp: string;
  avatar: string;
  attachments: any[];
}

export interface TicketData {
  userName: string;
  userAvatar: string;
  stats: TicketStats;
  tickets: Ticket[];
}

export interface TicketCreate {
  empresa_id: string;
  categoria: string;
  asunto: string;
  descripcion: string;
  estado_id: string;
  contrato_id?: string;
  servicio_id?: string;
  contacto_id?: string;
  usuario_asignado?: string;
  archivos?: File[];
}

export interface TicketUpdate {
  estado_id: string;
  comentario?: string;
  usuario_id: string;
}

export class TicketService {
  static async getUserTickets(userId: string): Promise<TicketData | null> {
    try {
      console.log(`Iniciando solicitud a API: ${API_URL}/tickets-grouped/usuario/${userId}`);
      const startTime = Date.now();
      
      // Agregamos un timeout para evitar que la solicitud quede colgada
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
      
      const response = await fetch(`${API_URL}/tickets-grouped/usuario/${userId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      console.log(`Respuesta de API recibida en ${endTime - startTime}ms`);
      
      if (!response.ok) throw new Error('Error al obtener tickets');
      const result = await response.json();
      return result.data[`user${userId}`] || null;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('La solicitud ha excedido el tiempo de espera (10s)');
      } else {
        console.error('Error fetching user tickets:', error);
      }
      return null;
    }
  }

  static async getAllUsersTickets(): Promise<Record<string, TicketData>> {
    try {
      const response = await fetch(`${API_URL}/tickets-grouped/users`);
      if (!response.ok) throw new Error('Error al obtener tickets de usuarios');
      const result = await response.json();
      return result.data || {};
    } catch (error) {
      console.error('Error fetching all users tickets:', error);
      return {};
    }
  }

  static async getTicketById(userId: string, ticketId: string): Promise<Ticket | null> {
    try {
      const userTickets = await this.getUserTickets(userId);
      const ticket = userTickets?.tickets.find((t: Ticket) => t.id === ticketId) || null;
      
      if (ticket) {
        // Si no hay mensajes, añadimos mensajes de muestra para la demostración
        if (!ticket.messages) {
          // Simulamos mensajes para la demostración
          const currentDate = new Date();
          
          ticket.messages = [
            {
              id: "1",
              sender: "Cliente",
              type: "client",
              message: "Hola, tengo un problema con " + ticket.title,
              timestamp: new Date(currentDate.getTime() - 3600000).toISOString(),
              avatar: "CL",
              attachments: []
            },
            {
              id: "2",
              sender: ticket.assignedTo,
              type: "support",
              message: "¡Hola! Gracias por contactarnos. Estamos revisando tu caso sobre " + ticket.title,
              timestamp: new Date(currentDate.getTime() - 3000000).toISOString(),
              avatar: ticket.assignedTo.substring(0, 2).toUpperCase(),
              attachments: []
            },
            {
              id: "3",
              sender: "Sistema",
              type: "system",
              message: "El ticket ha sido asignado a " + ticket.assignedTo,
              timestamp: new Date(currentDate.getTime() - 2700000).toISOString(),
              avatar: "SI",
              attachments: []
            }
          ];
        }
      }
      
      return ticket;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      return null;
    }
  }

  static async createTicket(ticket: TicketCreate): Promise<{ success: boolean; message: string; data?: Ticket }> {
    try {
      const formData = new FormData();
      Object.entries(ticket).forEach(([key, value]) => {
        if (value !== undefined && key !== 'archivos') {
          formData.append(key, value);
        }
      });

      if (ticket.archivos) {
        ticket.archivos.forEach(file => {
          formData.append('archivos', file);
        });
      }

      const response = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al crear ticket');
      }

      return {
        success: true,
        message: 'Ticket creado exitosamente',
        data: result.data
      };
    } catch (error) {
      console.error('Error creating ticket:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async updateTicketStatus(
    ticketId: string,
    update: TicketUpdate
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(update)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al actualizar estado');
      }

      return {
        success: true,
        message: 'Estado actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error updating ticket status:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async sendMessage(
    ticketId: string,
    message: string,
    attachments: File[] = []
  ): Promise<{ success: boolean; message: string }> {
    try {
      const formData = new FormData();
      formData.append('message', message);
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch(`${API_URL}/tickets/${ticketId}/messages`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al enviar mensaje');
      }

      return {
        success: true,
        message: 'Mensaje enviado exitosamente'
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  static async deleteTicket(ticketId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al eliminar ticket');
      }

      return {
        success: true,
        message: 'Ticket eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
