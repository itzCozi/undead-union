const Gamedig = require('gamedig');

interface PZServerInfo {
  online: boolean;
  playerCount: number;
  maxPlayers: number;
  ping: number;
  version: string;
  serverName: string;
  modded: boolean;
  steamId?: string;
}

export async function queryProjectZomboidServer(
  host: string, 
  port: number,
  timeout: number = 10000
): Promise<PZServerInfo> {
  try {
    const state = await Gamedig.query({
      type: 'projectzomboid',
      host: host,
      port: port,
      socketTimeout: timeout,
      attemptTimeout: timeout
    });
    
    return {
      online: true,
      playerCount: state.players ? state.players.length : 0,
      maxPlayers: state.maxplayers || 0,
      ping: state.ping || 0,
      version: state.version || 'Unknown',
      serverName: state.name || 'Undead Union',
      modded: state.password !== undefined || false
    };
    
  } catch (error) {
    console.error('Server query failed:', error);

    try {
      const pingStart = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      await fetch(`http://${host}:${port}`, {
        signal: controller.signal,
        mode: 'no-cors',
        method: 'HEAD'
      }).catch(() => null);
      
      clearTimeout(timeoutId);
      const ping = Date.now() - pingStart;
      
      if (ping < 5000) {
        return {
          online: true,
          playerCount: 0,
          maxPlayers: 8,
          ping: Math.min(ping, 999),
          version: "Unknown",
          serverName: "Undead Union",
          modded: true
        };
      }
    } catch (fallbackError) {
      console.error('Fallback connectivity test failed:', fallbackError);
    }
    
    return {
      online: false,
      playerCount: 0,
      maxPlayers: 8,
      ping: -1,
      version: "Unknown",
      serverName: "Undead Union",
      modded: true
    };
  }
}
