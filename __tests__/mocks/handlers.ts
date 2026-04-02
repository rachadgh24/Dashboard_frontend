import { http, HttpResponse } from 'msw';

/** Matches .NET NotificationModel JSON shape (camelCase). */
export type NotificationDto = {
  id: number;
  message: string;
  createdAt: string;
};

/** Default handlers; override per test with server.use(...). */
export const handlers = [
  http.get('http://api.test/Customers', () => HttpResponse.json({ data: [] })),
  http.get('http://api.test/Customers/search', () => HttpResponse.json({ data: [] })),
  http.get('http://api.test/Users', () => HttpResponse.json({ data: [] })),
  http.get('http://api.test/Roles', () => HttpResponse.json({ data: [] })),
  http.get('http://api.test/notifications', () => HttpResponse.json({ data: [] as NotificationDto[] })),
];
