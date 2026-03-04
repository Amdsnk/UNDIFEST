// Endpoint untuk cek IP outbound server
// Tambahkan ke routes.ts untuk cek IP yang dilihat oleh DOKU

import fetch from 'node-fetch';

export async function getServerOutboundIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json() as { ip: string };
    return data.ip;
  } catch (error) {
    console.error('Error getting outbound IP:', error);
    throw error;
  }
}

