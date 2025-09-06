import React, { useState, useEffect } from 'react';
import { TicketService } from '../../services/ticketService';

// Componente para mostrar los detalles de un ticket en formato chat
export default function TicketDetail({ ticket, userId, onClose }) {
  const [newMessage, setNewMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(ticket);

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      try {
        setIsSending(true);
        
        // Usar el servicio para enviar el mensaje
        const success = await TicketService.sendMessage(ticket.id, newMessage, attachedFiles);
        
        if (success) {
          // Actualizar los mensajes del ticket actual
          const updatedTicket = await TicketService.getTicketById(
            userId || ticket.userId || window.currentUserId, 
            ticket.id
          );
          
          if (updatedTicket) {
            setSelectedTicket(updatedTicket);
          }
          
          setNewMessage('');
          setAttachedFiles([]);
        } else {
          throw new Error("Error al enviar el mensaje");
        }
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
        alert("No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.");
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleFileAttachment = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      const isValidType = ["image/jpeg", "image/png", "image/gif", "application/pdf", "text/plain"].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    setAttachedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Efecto para cargar el ticket y sus mensajes
  useEffect(() => {
    const loadTicketData = async () => {
      setIsLoading(true);
      
      try {
        // Obtener la información actualizada del ticket
        const userIdToUse = userId || ticket.userId || window.currentUserId;
        console.log("Cargando datos con userId:", userIdToUse);
        const refreshedTicket = await TicketService.getTicketById(userIdToUse, ticket.id);
        
        if (refreshedTicket) {
          setSelectedTicket(refreshedTicket);
        }
      } catch (error) {
        console.error("Error al cargar datos del ticket:", error);
      } finally {
        // Terminar la carga después de un breve periodo
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    };
    
    loadTicketData();
    
    // Configurar una actualización periódica (cada 30 segundos)
    const refreshInterval = setInterval(() => {
      loadTicketData();
    }, 30000);
    
    return () => clearInterval(refreshInterval);
  }, [ticket.id]);

  // Definir estilos inline para consistencia
  const styles = {
    lineClamp2: {
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden'
    }
  };
  
  // Usar el ticket seleccionado para mostrar datos actualizados
  const activeTicket = selectedTicket || ticket;
  
  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border-2 border-blue-200">
      {/* Pantalla de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-blue-600 font-medium">Cargando ticket...</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            activeTicket.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
            activeTicket.status === 'En Progreso' ? 'bg-orange-100 text-orange-800' :
            'bg-green-100 text-green-800'
          }`}>
            {activeTicket.status}
          </span>
          <span className="text-sm text-gray-500">#{activeTicket.id}</span>
        </div>
        
        <h2 className="text-xl font-bold mt-2">{activeTicket.title}</h2>
        <p className="text-gray-600 mt-1">{activeTicket.description}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Categoría:</span>
            <p className="text-gray-600">{activeTicket.category}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Servicio:</span>
            <p className="text-gray-600">{activeTicket.service}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Asignado a:</span>
            <p className="text-gray-600">{activeTicket.assignedTo}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Creado:</span>
            <p className="text-gray-600">{new Date(activeTicket.created).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="p-4 h-96 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {activeTicket.messages && activeTicket.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'client' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start space-x-3 max-w-[70%] ${message.type === 'client' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-medium">{message.avatar || message.sender.substring(0, 2)}</span>
                </div>
                <div
                  className={`rounded-lg p-3 ${
                    message.type === 'client' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`text-sm font-medium ${
                        message.type === 'client' ? 'text-blue-100' : 'text-gray-700'
                      }`}
                    >
                      {message.sender}
                    </span>
                    <span
                      className={`text-xs ${message.type === 'client' ? 'text-blue-200' : 'text-gray-500'}`}
                    >
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.message}</p>
                </div>
              </div>
            </div>
          ))}
          
          {(!activeTicket.messages || activeTicket.messages.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <p>No hay mensajes en este ticket.</p>
            </div>
          )}
        </div>
      </div>

          {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        {activeTicket.status !== 'Resuelto' ? (
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
            )}            <div className="flex items-end space-x-3">
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

              {/* Botón de adjuntar archivos */}
              <div className="flex flex-col space-y-2">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,.pdf,.txt"
                  onChange={handleFileAttachment}
                  className="hidden"
                />
                <button
                  onClick={() => document.getElementById("file-upload").click()}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>

                {/* Botón de enviar */}
                <button
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && attachedFiles.length === 0) || isSending}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
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
  );
}
