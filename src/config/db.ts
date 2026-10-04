import mongoose, { Connection, ClientSession } from 'mongoose';
import { env } from './env';

let cachedConnection: Connection | null = null;

export async function connectDB(): Promise<Connection> {
  if (cachedConnection && cachedConnection.readyState === 1) {
    return cachedConnection;
  }
  
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cachedConnection = conn.connection;
    
    conn.connection.on('connected', () => {
      console.log('✅ MongoDB conectado');
    });
    
    conn.connection.on('error', (err) => {
      console.error('❌ Error MongoDB:', err);
    });
    
    conn.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB desconectado');
      cachedConnection = null;
    });
    
    return cachedConnection;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

export async function withTransaction<T>(
  callback: (session: ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export function getConnection(): Connection | null {
  return cachedConnection;
}
