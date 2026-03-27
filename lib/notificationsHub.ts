import * as signalR from '@microsoft/signalr';
import { API_BASE } from '@/lib/apiBase';

export function createNotificationsConnection() {
  return new signalR.HubConnectionBuilder()
    .withUrl(`${API_BASE}/hubs/notifications`, {
      skipNegotiation: true,
      transport: signalR.HttpTransportType.WebSockets,
      accessTokenFactory: () => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem('token') ?? '';
      },
    })
    .withAutomaticReconnect()
    .build();
}
