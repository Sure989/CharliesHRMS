import { toast } from '@/hooks/use-toast';
import { apiClient, ApiResponse } from './apiClient';
import { config } from '@/config/environment';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  module: string;
  userId?: string;
}

class NotificationService {
  private notifications: Notification[] = []; 
  private listeners: Array<(notifications: Notification[]) => void> = [];

  /**
   * Add a new notification
   */
  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Promise<void> {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.notifyListeners();

    // Show toast notification
    this.showToast(newNotification);

    // Auto-remove info notifications after 5 seconds
    if (notification.type === 'info') {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, 5000);
    }
  }

  /**
   * Show toast notification
   */
  private showToast(notification: Notification): void {
    const variant = notification.type === 'error' ? 'destructive' : 'default';
    
    toast({
      title: notification.title,
      description: notification.message,
      variant,
      duration: notification.type === 'error' ? 0 : 5000, // Errors stay until dismissed
    });
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  /**
   * Remove notification
   */
  removeNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    this.notifications = [];
    this.notifyListeners();
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Subscribe to notification changes
   */
  subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Show success notification
   */
  success(title: string, message: string, options?: Partial<Notification>): void {
    this.addNotification({
      type: 'success',
      title,
      message,
      module: options?.module || 'system',
      ...options
    });
  }

  async fetchNotifications(): Promise<void> {
    if ((this as any).loading) return;
    (this as any).loading = true;
    try {
      const res: ApiResponse<Notification[] | any> = await apiClient.get('/notifications');
      if (res.status === 'success' && Array.isArray(res.data)) {
        // Convert timestamp strings to Date objects
        this.notifications = res.data.map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
        this.notifyListeners();
      } else {
        // If not an array, treat as error or empty
        this.notifications = [];
        this.notifyListeners();
      }
    } catch (err) {
      // On error, clear notifications and notify listeners
      this.notifications = [];
      this.notifyListeners();
    } finally {
      (this as any).loading = false;
    }
  }

  /**
   * Show error notification
   */
  error(title: string, message: string, options?: Partial<Notification>): void {
    this.addNotification({
      type: 'error',
      title,
      message,
      module: options?.module || 'system',
      ...options
    });
  }

  /**
   * Show warning notification
   */
  warning(title: string, message: string, options?: Partial<Notification>): void {
    this.addNotification({
      type: 'warning',
      title,
      message,
      module: options?.module || 'system',
      ...options
    });
  }

  /**
   * Show info notification
   */
  info(title: string, message: string, options?: Partial<Notification>): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      module: options?.module || 'system',
      ...options
    });
  }

  /**
   * Show payroll notification
   */
  payrollNotification(title: string, message: string, actionUrl?: string): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      module: 'payroll',
      actionUrl,
      actionLabel: 'View Details'
    });
  }

  /**
   * Show leave notification
   */
  leaveNotification(title: string, message: string, actionUrl?: string): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      module: 'leave',
      actionUrl,
      actionLabel: 'Review Request'
    });
  }

  /**
   * Show salary advance notification
   */
  salaryAdvanceNotification(title: string, message: string, actionUrl?: string): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      module: 'salary_advance',
      actionUrl,
      actionLabel: 'Review Request'
    });
  }

  /**
   * Show employee notification
   */
  employeeNotification(title: string, message: string, actionUrl?: string): void {
    this.addNotification({
      type: 'info',
      title,
      message,
      module: 'employee',
      actionUrl,
      actionLabel: 'View Profile'
    });
  }

  /**
   * Show system alert
   */
  systemAlert(title: string, message: string, severity: 'warning' | 'error' = 'warning'): void {
    this.addNotification({
      type: severity,
      title,
      message,
      module: 'system'
    });
  }

  /**
   * Show approval notification
   */
  approvalNotification(type: 'leave' | 'salary_advance' | 'expense', employeeName: string, actionUrl?: string): void {
    const titles = {
      leave: 'Leave Request Pending',
      salary_advance: 'Salary Advance Request Pending',
      expense: 'Expense Report Pending'
    };

    this.addNotification({
      type: 'warning',
      title: titles[type],
      message: `${employeeName} has submitted a ${type.replace('_', ' ')} request that requires your approval.`,
      module: type,
      actionUrl,
      actionLabel: 'Review & Approve'
    });
  }

  /**
   * Show deadline notification
   */
  deadlineNotification(task: string, deadline: Date, module: string): void {
    const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    let message: string;
    let type: 'warning' | 'error';
    
    if (daysUntil <= 0) {
      message = `${task} deadline has passed!`;
      type = 'error';
    } else if (daysUntil <= 3) {
      message = `${task} is due in ${daysUntil} day(s).`;
      type = 'error';
    } else if (daysUntil <= 7) {
      message = `${task} is due in ${daysUntil} days.`;
      type = 'warning';
    } else {
      return; // Don't notify for deadlines more than a week away
    }

    this.addNotification({
      type,
      title: 'Deadline Reminder',
      message,
      module
    });
  }

  /**
   * Show compliance notification
   */
  complianceNotification(title: string, message: string, severity: 'warning' | 'error' = 'warning'): void {
    this.addNotification({
      type: severity,
      title,
      message,
      module: 'compliance'
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export hook for React components
export const useNotifications = () => {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);

  React.useEffect(() => {
    // Initial load
    setNotifications(notificationService.getNotifications());

    // Subscribe to changes
    const unsubscribe = notificationService.subscribe(setNotifications);

    return unsubscribe;
  }, []);


  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    // Fetch from backend on mount
    notificationService.fetchNotifications();
    setNotifications(notificationService.getNotifications());
    setUnreadCount(notificationService.getUnreadCount());
    // Subscribe to changes
    const unsubscribe = notificationService.subscribe((notifs) => {
      setNotifications(notifs);
      setUnreadCount(notificationService.getUnreadCount());
    });
    return unsubscribe;
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead: notificationService.markAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    removeNotification: notificationService.removeNotification.bind(notificationService),
    clearAll: notificationService.clearAll.bind(notificationService)
  };
};

// React import for the hook
import React from 'react';
