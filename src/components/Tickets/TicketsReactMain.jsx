import React, { useState, useEffect } from 'react';
import { TicketService } from '../../services/ticketService';

export default function TicketsReactMain({ ticketsData, userId }) {
  const [activeSection, setActiveSection] = useState("tickets");
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [refreshData, setRefreshData] = useState(false);
  const [localTicketsData, setLocalTicketsData] = useState(ticketsData);
  
  // Para depuración
  useEffect(() => {
    if (selectedTicket) {
      console.log("Ticket seleccionado:", selectedTicket);
    }
  }, [selectedTicket]);
  
  // Efecto para actualizar los datos del ticket cuando sea necesario
  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        if (refreshData) {
          const updatedTicketsData = await TicketService.getTicketsGroupedByUser(userId);
          if (updatedTicketsData) {
            setLocalTicketsData(updatedTicketsData);
            
            // Si hay un ticket seleccionado, actualizar sus datos
            if (selectedTicket) {
              const updatedTicket = updatedTicketsData.tickets.find(t => t.id === selectedTicket.id);
              if (updatedTicket) {
                const ticketWithMessages = await TicketService.getTicketById(userId, updatedTicket.id);
                setSelectedTicket(ticketWithMessages);
              }
            }
          }
          setRefreshData(false);
        }
      } catch (error) {
        console.error("Error al actualizar datos de tickets:", error);
      }
    };

    fetchTicketData();
  }, [refreshData, userId, selectedTicket]);
  
  // Agregar estilos CSS adicionales
  const styles = {
    lineClamp2: {
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    },
    ticketItem: {
      transition: 'transform 0.2s ease-in-out'
    },
    ticketItemHover: {
      transform: 'translateY(-1px)'
    },
    attachmentPreview: {
      maxWidth: '100px',
      maxHeight: '100px',
      objectFit: 'cover',
      borderRadius: '4px'
    }
  };

  // Función para manejar el envío de mensajes
  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedTicket) {
      try {
        setIsSending(true);
        
        // Para simular el envío local si la API falla
        const tempMessage = {
          id: `temp-${Date.now()}`,
          sender: "Usuario",
          senderName: "Usuario",
          type: "client",
          senderType: "Cliente",
          message: newMessage,
          content: newMessage,
          timestamp: new Date().toISOString(),
          avatar: "U"
        };
        
        // Añadir temporalmente el mensaje para mejor UX
        setSelectedTicket(prev => ({
          ...prev,
          messages: [...(prev.messages || []), tempMessage]
        }));
        
        // Intentar enviar a través de la API
        const success = await TicketService.sendMessage(selectedTicket.id, newMessage, attachedFiles);
        
        if (success) {
          setNewMessage('');
          setAttachedFiles([]);
          
          // Actualizar los mensajes obteniendo la versión más reciente del ticket
          const updatedTicket = await TicketService.getTicketById(userId, selectedTicket.id);
          if (updatedTicket) {
            setSelectedTicket(updatedTicket);
          }
          
          // Solicitar actualización general de tickets
          setRefreshData(true);
        } else {
          console.warn('La API no respondió correctamente, pero el mensaje se muestra en la interfaz');
        }
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
        alert("No se pudo enviar el mensaje al servidor. Por favor, inténtalo de nuevo.");
      } finally {
        setIsSending(false);
      }
    }
  };

  // Función para manejar el adjunto de archivos
  const handleFileAttachment = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      const isValidType = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    setAttachedFiles((prev) => [...prev, ...validFiles]);
  };

  // Función para eliminar archivos adjuntos
  const removeAttachment = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  
  // Función para crear un nuevo ticket
  const handleCreateTicket = async (event) => {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const ticketData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      service: formData.get('service'),
      userId: userId,
      priority: formData.get('priority') || 'Media'
    };
    
    try {
      const newTicket = await TicketService.createTicket(ticketData);
      
      if (newTicket) {
        setIsCreatingTicket(false);
        setRefreshData(true);
        form.reset();
        
        // Opcionalmente, seleccionar el ticket recién creado
        const fullTicket = await TicketService.getTicketById(userId, newTicket.id);
        if (fullTicket) {
          setSelectedTicket(fullTicket);
        }
      } else {
        throw new Error('Error al crear el ticket');
      }
    } catch (error) {
      console.error("Error al crear ticket:", error);
      alert("No se pudo crear el ticket. Por favor, inténtalo de nuevo.");
    }
  };

  // Función para obtener el color según el estado
  function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
      case 'en progreso':
        return 'bg-orange-100 text-orange-800';
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  // Función para obtener el color del borde según el estado
  function getStatusBorderClass(status) {
    switch (status.toLowerCase()) {
      case 'en progreso':
        return 'border-l-orange-500';
      case 'resuelto':
        return 'border-l-green-500';
      default:
        return 'border-l-yellow-500';
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mis Tickets de Soporte</h2>
            <p className="text-gray-600">Gestiona tus solicitudes de soporte técnico</p>
          </div>
          <button 
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={() => setIsCreatingTicket(true)}
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Crear Nuevo Ticket
          </button>
        </div>
      </div>

      {/* Informational Note */}
      <div className="mb-6">
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-medium">ℹ</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800">
                <strong>Horario de Atención:</strong> Recuerde que el horario de oficina es de Lunes - Viernes
                de 9 a 6 de la tarde. El tiempo de respuesta varía según el plan contratado y disponibilidad de
                los agentes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{localTicketsData.ticketsStats.activos}</div>
          <div className="text-sm text-gray-600">Tickets Activos</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{localTicketsData.ticketsStats.resueltos}</div>
          <div className="text-sm text-gray-600">Resueltos</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{localTicketsData.ticketsStats.enProgreso}</div>
          <div className="text-sm text-gray-600">En Progreso</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center">
          <div className="text-sm text-gray-600">Tiempo de Respuesta</div>
          <div className="text-2xl font-bold text-purple-600">{localTicketsData.ticketsStats.tiempoRespuesta || "N/A"}</div>
        </div>
      </div>

      {/* Create Ticket Modal/Form */}
      {isCreatingTicket && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Ticket</h3>
              </div>
              <button
                onClick={() => setIsCreatingTicket(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Asunto *</label>
                <input
                  type="text"
                  name="title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe brevemente el problema"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Categoría *</label>
                <select 
                  name="category" 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Soporte Técnico">Soporte Técnico</option>
                  <option value="Sitio Web">Sitio Web</option>
                  <option value="Correo Electrónico">Correo Electrónico</option>
                  <option value="Hosting/Dominio">Hosting/Dominio</option>
                  <option value="Facturación">Facturación</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Servicio Relacionado</label>
                <select 
                  name="service"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccionar servicio</option>
                  <option value="Paquete Esencial">Paquete Esencial</option>
                  <option value="Mantenimiento Web Premium">Mantenimiento Web Premium</option>
                  <option value="Desarrollo Web">Desarrollo Web</option>
                  <option value="Hosting Corporativo">Hosting Corporativo</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Prioridad</label>
                <select 
                  name="priority"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media" selected>Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Descripción Detallada *</label>
              <textarea
                name="description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el problema con el mayor detalle posible. Incluye pasos para reproducir el error, mensajes de error, capturas de pantalla, etc."
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Archivos Adjuntos</label>
              <input
                type="file"
                name="attachments"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Máximo 10MB por archivo. Formatos: jpg, png, pdf, txt, doc
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-4">
              <button 
                type="button"
                onClick={() => setIsCreatingTicket(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Crear Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket Detail View */}
      {selectedTicket && (
        <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    console.log("Cerrando vista de detalle");
                    setSelectedTicket(null);
                  }}
                  className="flex items-center text-sm text-gray-600 hover:text-blue-600"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Volver a Tickets</span>
                </button>
              </div>
              <button
                onClick={() => {
                  console.log("Cerrando vista de detalle");
                  setSelectedTicket(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center space-x-3 mb-2 mt-3">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(selectedTicket.status)}`}>
                {selectedTicket.status}
              </span>
              <span className="text-sm text-gray-500">#{selectedTicket.id}</span>
            </div>
            
            <h2 className="text-xl font-bold">{selectedTicket.title}</h2>
            <p className="text-gray-600 mt-2">{selectedTicket.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Categoría:</span>
                <p className="text-gray-600">{selectedTicket.category}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Servicio:</span>
                <p className="text-gray-600">{selectedTicket.service || 'No especificado'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Asignado a:</span>
                <p className="text-gray-600">{selectedTicket.assignedTo || 'Sin asignar'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Creado:</span>
                <p className="text-gray-600">{selectedTicket.created ? new Date(selectedTicket.created).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="p-4 h-96 overflow-y-auto bg-gray-50">
            <div className="space-y-4">
              {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex ${(message.type === 'client' || message.senderType === 'Cliente') ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-3 max-w-[70%] ${(message.type === 'client' || message.senderType === 'Cliente') ? 'flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium">{message.avatar || message.senderAvatar || (message.sender ? message.sender.substring(0, 2) : 'U')}</span>
                      </div>
                      <div
                        className={`rounded-lg p-3 ${
                          (message.type === 'client' || message.senderType === 'Cliente') ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span
                            className={`text-sm font-medium ${
                              (message.type === 'client' || message.senderType === 'Cliente') ? 'text-blue-100' : 'text-gray-700'
                            }`}
                          >
                            {message.sender || message.senderName || 'Usuario'}
                          </span>
                          <span
                            className={`text-xs ${(message.type === 'client' || message.senderType === 'Cliente') ? 'text-blue-200' : 'text-gray-500'}`}
                          >
                            {new Date(message.timestamp || message.created || new Date()).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.message || message.content || message.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay mensajes en este ticket.</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-4">
            {selectedTicket.status !== 'Resuelto' ? (
              <>
                {/* Archivos adjuntos */}
                {attachedFiles.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {attachedFiles.map((file, index) => (
                        <div key={index} className="flex items-center bg-gray-100 rounded-lg px-3 py-2 text-sm">
                          <svg className="h-4 w-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-700 truncate max-w-32">{file.name}</span>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe tu mensaje aquí..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>

                  {/* Botones de adjuntar y enviar */}
                  <div className="flex flex-col space-y-2">
                    <input
                      type="file"
                      id="ticket-file-upload"
                      multiple
                      accept="image/*,.pdf,.txt"
                      onChange={handleFileAttachment}
                      className="hidden"
                    />
                    <button
                      onClick={() => document.getElementById("ticket-file-upload").click()}
                      className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
                      title="Adjuntar archivo"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>

                    {/* Botón de enviar */}
                    <button
                      onClick={handleSendMessage}
                      disabled={(!newMessage.trim() && attachedFiles.length === 0) || isSending}
                      className={`p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50`}
                      title="Enviar mensaje"
                    >
                      {isSending ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-500">
                    Presiona Enter para enviar, Shift + Enter para nueva línea
                  </p>
                  <p className="text-xs text-gray-500">
                    Máximo 5MB por archivo • Formatos: JPG, PNG, GIF, PDF, TXT
                  </p>
                </div>
              </>
            ) : (
              /* Mensaje para tickets resueltos */
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">✓</span>
                  </div>
                  <p className="text-sm text-green-800 font-medium">Este ticket ha sido resuelto</p>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Ya no es posible enviar mensajes. Si necesitas ayuda adicional, crea un nuevo ticket.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tickets List - Solo se muestra si no hay ticket seleccionado */}
      {!selectedTicket && (
        <div className="space-y-4">
          {localTicketsData.tickets.length > 0 ? (
            localTicketsData.tickets.map((ticket) => (
              <div key={ticket.id} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 ${getStatusBorderClass(ticket.status)}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className="text-sm text-gray-500">#{ticket.id}</span>
                    </div>
                    <span className="text-sm text-gray-500">{new Date(ticket.created).toLocaleString()}</span>
                  </div>

                  <h3 className="mt-2 text-lg font-semibold text-gray-900">{ticket.title}</h3>
                  <p className="mt-2 text-gray-600" style={styles.lineClamp2}>{ticket.description}</p>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Categoría:</span>
                      <p className="text-gray-600">{ticket.category}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Servicio:</span>
                      <p className="text-gray-600">{ticket.service}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Asignado a:</span>
                      <p className="text-gray-600">{ticket.assignedTo}</p>
                    </div>
                  </div>

                  {ticket.messages && ticket.messages.length > 0 && (
                    <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">{ticket.messages[ticket.messages.length - 1].avatar}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium">{ticket.messages[ticket.messages.length - 1].sender}</span>
                            <span className="text-xs text-gray-500">{new Date(ticket.messages[ticket.messages.length - 1].timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-700" style={styles.lineClamp2}>{ticket.messages[ticket.messages.length - 1].message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${ticket.status === 'Resuelto' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      <span className="text-sm text-gray-600">
                        {ticket.status === 'Resuelto' ? 'Resuelto satisfactoriamente' : `Última actualización: ${new Date(ticket.lastUpdate).toLocaleString()}`}
                      </span>
                    </div>
                    <a
                      href={`/tickets/${userId}/${ticket.id}`}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      onClick={(e) => {
                        console.log("Navegando al ticket:", ticket.id);
                        console.log(`URL de navegación: /tickets/${userId}/${ticket.id}`);
                      }}
                    >
                      Ver Detalles
                    </a>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tickets</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando un nuevo ticket.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
