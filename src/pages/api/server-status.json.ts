import type { APIRoute } from 'astro';
import { queryServerStatus } from '../../utils/serverQuery';

const SERVER_CONFIG = {
  host: '51.222.82.124',
  port: 28135,
  queryPort: 16261, // Default PZ query port (usually port + 1)
};

interface ServerStatus {
  online: boolean;
  playerCount: number;
  maxPlayers: number;
  ping: number;
  version: string;
  modded: boolean;
  region: string;
  serverName: string;
}

async function pingServer(host: string, port: number): Promise<number> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch(`http://${host}:${port}`, {
      signal: controller.signal,
      mode: 'no-cors'
    }).catch(() => {
      // Ignore fetch errors
    });
    
    clearTimeout(timeoutId);
    return Date.now() - start;
  } catch (error) {
    return -1;
  }
}

async function queryProjectZomboidServer(): Promise<ServerStatus> {
  try {
    const serverInfo = await queryServerStatus(SERVER_CONFIG.host, SERVER_CONFIG.port);
    
    return {
      online: serverInfo.online,
      playerCount: serverInfo.playerCount,
      maxPlayers: serverInfo.maxPlayers,
      ping: serverInfo.ping,
      version: serverInfo.version,
      modded: serverInfo.modded,
      region: "NA-East",
      serverName: serverInfo.serverName
    };
  } catch (error) {
    console.error('Failed to query server:', error);
    return {
      online: false,
      playerCount: 0,
      maxPlayers: 8,
      ping: -1,
      version: "Unknown",
      modded: true,
      region: "NA-East",
      serverName: "Undead Union"
    };
  }
}

export const GET: APIRoute = async () => {
  try {
    const status = await queryProjectZomboidServer();
    
    return new Response(JSON.stringify({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=30' // Cache for 30 seconds
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to fetch server status',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
