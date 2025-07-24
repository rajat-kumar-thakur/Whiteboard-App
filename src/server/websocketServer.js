import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';

class CollaborativeDrawingServer {
  constructor() {
    this.server = http.createServer();
    this.wss = new WebSocketServer({ server: this.server });
    this.clients = new Map();
    this.elements = [];
    this.users = new Map();
    
    this.setupWebSocketHandlers();
  }

  setupWebSocketHandlers() {
    this.wss.on('connection', (ws, req) => {
      console.log('New client connected');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        // Find and remove user
        for (const [userId, client] of this.clients.entries()) {
          if (client.ws === ws) {
            this.clients.delete(userId);
            this.users.delete(userId);
            
            // Notify other clients
            this.broadcast({
              type: 'user_left',
              data: { userId },
              userId: 'server',
              timestamp: Date.now()
            }, ws);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  handleMessage(ws, message) {
    const { type, data, userId, timestamp } = message;

    switch (type) {
      case 'user_joined':
        this.clients.set(userId, { ws, lastSeen: Date.now() });
        this.users.set(userId, {
          id: userId,
          name: data.name,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`,
          joinedAt: Date.now()
        });

        // Send current state to new user
        ws.send(JSON.stringify({
          type: 'initial_state',
          data: {
            elements: this.elements,
            users: Array.from(this.users.values())
          },
          userId: 'server',
          timestamp: Date.now()
        }));

        // Notify other clients
        this.broadcast(message, ws);
        break;

      case 'element_added':
        this.elements.push(data);
        this.broadcast(message, ws);
        break;

      case 'element_updated':
        const elementIndex = this.elements.findIndex(el => el.id === data.id);
        if (elementIndex !== -1) {
          this.elements[elementIndex] = { ...this.elements[elementIndex], ...data };
        }
        this.broadcast(message, ws);
        break;

      case 'element_deleted':
        this.elements = this.elements.filter(el => el.id !== data.id);
        this.broadcast(message, ws);
        break;

      case 'cursor_moved':
        if (this.users.has(userId)) {
          const user = this.users.get(userId);
          user.cursor = data.position;
          this.users.set(userId, user);
        }
        this.broadcast(message, ws);
        break;

      case 'clear_canvas':
        this.elements = [];
        this.broadcast(message, ws);
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }

  broadcast(message, excludeWs = null) {
    const messageStr = JSON.stringify(message);
    
    for (const client of this.clients.values()) {
      if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(messageStr);
        } catch (error) {
          console.error('Error broadcasting message:', error);
        }
      }
    }
  }

  start(port = 3001) {
    this.server.listen(port, () => {
      console.log(`WebSocket server running on port ${port}`);
    });
  }
}

const server = new CollaborativeDrawingServer();
server.start();

export default CollaborativeDrawingServer;