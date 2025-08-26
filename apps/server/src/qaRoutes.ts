import { Express, Request, Response } from 'express';
import { QAManager } from './qaManager';
import { GameManager } from './gameManager';

// Extend Request interface to include QA session
declare global {
  namespace Express {
    interface Request {
      qaSessionId?: string;
    }
  }
}

export function setupQARoutes(app: Express, qaManager: QAManager, gameManager: GameManager): void {
  // QA Authentication middleware
  const qaAuth = (req: Request, res: Response, next: Function) => {
    const sessionId = req.qaSessionId;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!sessionId || !qaManager.validateSession(sessionId, clientIP)) {
      return res.status(401).json({ error: 'QA authentication required' });
    }
    
    next();
  };

  // QA Login
  app.post('/qa/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const sessionId = qaManager.authenticate(username, password, clientIP);
    
    if (!sessionId) {
      return res.status(401).json({ error: 'Invalid credentials or IP not allowed' });
    }
    
    res.json({ sessionId, message: 'QA login successful' });
  });

  // QA Logout
  app.post('/qa/logout', qaAuth, (req: Request, res: Response) => {
    qaManager.logout(req.qaSessionId!);
    res.json({ message: 'QA logout successful' });
  });

  // QA Actions - all require authentication
  app.get('/qa/rooms', qaAuth, (req: Request, res: Response) => {
    const rooms = gameManager.getAllRoomsForQA();
    res.json(rooms);
  });

  app.get('/qa/room/:roomId', qaAuth, (req: Request, res: Response) => {
    const { roomId } = req.params;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json(room);
  });

  app.post('/qa/reveal/:roomId/:playerId', qaAuth, (req: Request, res: Response) => {
    const { roomId, playerId } = req.params;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    try {
      const result = qaManager.revealPlayerCards(room.engine, playerId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/qa/hide/:roomId/:playerId', qaAuth, (req: Request, res: Response) => {
    const { roomId, playerId } = req.params;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    try {
      const result = qaManager.hidePlayerCards(room.engine, playerId);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/qa/inject/:roomId', qaAuth, (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { where, card } = req.body;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (!where || !card) {
      return res.status(400).json({ error: 'Where and card required' });
    }
    
    try {
      const newState = qaManager.injectCard(room.engine, where, card);
      res.json(newState);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/qa/seed/:roomId', qaAuth, (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { seed } = req.body;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    if (typeof seed !== 'number') {
      return res.status(400).json({ error: 'Seed must be a number' });
    }
    
    try {
      const newState = qaManager.setSeed(room.engine, seed);
      res.json(newState);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post('/qa/force-turn/:roomId/:playerId', qaAuth, (req: Request, res: Response) => {
    const { roomId, playerId } = req.params;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    try {
      const newState = qaManager.forceTurn(room.engine, playerId);
      res.json(newState);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/qa/snapshot/:roomId', qaAuth, (req: Request, res: Response) => {
    const { roomId } = req.params;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    try {
      const snapshot = qaManager.snapshotRoom(room.engine);
      res.json(snapshot);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/qa/export/:roomId', qaAuth, (req: Request, res: Response) => {
    const { roomId } = req.params;
    const room = gameManager.getRoom(roomId);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    try {
      const exportData = qaManager.exportRoomState(room.engine);
      res.json(exportData);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get('/qa/sessions', qaAuth, (req: Request, res: Response) => {
    const activeSessions = qaManager.getActiveSessions();
    res.json(activeSessions);
  });
}
