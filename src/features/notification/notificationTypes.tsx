// notificationTypes.tsx

export interface INotification {
  _id: string;
  user: string; // ObjectId referenciando User (required)
  order?: string; // ObjectId referenciando Order (opcional)
  title: string; // required
  message: string; // required
  type:  'Pedido' | 'Entregue' | 'Cancelado' | 'Sistema' | 'Avaliação' | 'Aprovado' | 'Rejeitado' | 'Promoção' | 'Outro';
  isRead: boolean; // default: false
  isDelivered: boolean; // default: false
  createdAt: string; // Date
  readAt?: string; // Date (opcional)
}

export interface NotificationState {
  notifications: INotification[];
  selectedNotification: INotification | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface ICreateNotificationRequest {
  title: string; // required
  message: string; // required
  type: "Pedido" | "Entregue" | "Cancelado" | "Sistema" | "Avaliação" | "Aprovado" | "Rejeitado" | "Promoção" | "Outro"; // required
  user?: string; // ObjectId do usuário (será definido pelo backend se não fornecido)
  order?: string; // ObjectId do pedido (opcional)
}

export interface IUpdateNotificationRequest {
  id: string;
  data: Partial<{
    title: string;
    message: string;
    type: "Pedido" | "Reserva" | "Promoção" | "Sistema" | "Outro";
    isRead: boolean;
    isDelivered: boolean;
    readAt?: string;
  }>;
}

