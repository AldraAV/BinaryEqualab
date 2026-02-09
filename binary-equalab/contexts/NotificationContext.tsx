import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: string;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (title: string, message: string, icon?: string) => void;
    markAllAsRead: () => void;
    unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: 1, title: 'Bienvenido a Binary EquaLab', message: 'Sistema listo para cálculos.', time: 'Ahora', read: false, icon: '🚀' }
    ]);

    const addNotification = useCallback((title: string, message: string, icon: string = 'ℹ️') => {
        const newNotif: Notification = {
            id: Date.now(),
            title,
            message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            icon
        };
        setNotifications(prev => [newNotif, ...prev]);
    }, []);

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, markAllAsRead, unreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
