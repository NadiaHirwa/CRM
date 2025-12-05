/**
 * Notification Service
 * Provides hooks and infrastructure for sending notifications
 * Currently logs to console, but can be extended for email/SMS integration
 */

export interface NotificationPayload {
  type: 'low_stock' | 'long_pending_complaint' | 'order_status_change' | 'complaint_assigned';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  recipients?: string[]; // Email addresses or phone numbers for future use
}

/**
 * Notification hooks - can be extended to integrate with email/SMS providers
 */
export class NotificationService {
  private static hooks: Array<(notification: NotificationPayload) => Promise<void>> = [];

  /**
   * Register a notification hook (e.g., email, SMS, Slack, etc.)
   */
  static registerHook(hook: (notification: NotificationPayload) => Promise<void>): void {
    this.hooks.push(hook);
  }

  /**
   * Send a notification through all registered hooks
   */
  static async send(notification: NotificationPayload): Promise<void> {
    // Always log to console for debugging
    console.log(`[NOTIFICATION] [${notification.severity.toUpperCase()}] ${notification.title}: ${notification.message}`);
    if (notification.metadata) {
      console.log('Metadata:', notification.metadata);
    }

    // Call all registered hooks
    await Promise.allSettled(
      this.hooks.map(hook => hook(notification).catch(err => {
        console.error(`[NOTIFICATION] Hook error:`, err);
      }))
    );
  }

  /**
   * Send low stock notification
   */
  static async notifyLowStock(product: {
    id: number;
    name: string;
    sku?: string;
    stockQuantity: number;
    threshold: number;
  }): Promise<void> {
    const severity = product.stockQuantity === 0 ? 'critical' : 
                    product.stockQuantity <= product.threshold * 0.5 ? 'high' : 'medium';

    await this.send({
      type: 'low_stock',
      severity,
      title: `Low Stock Alert: ${product.name}`,
      message: `Product "${product.name}"${product.sku ? ` (${product.sku})` : ''} has only ${product.stockQuantity} units remaining (threshold: ${product.threshold})`,
      metadata: {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        stockQuantity: product.stockQuantity,
        threshold: product.threshold,
      },
    });
  }

  /**
   * Send long-pending complaint notification
   */
  static async notifyLongPendingComplaint(complaint: {
    id: number;
    subject: string;
    hoursOpen: number;
    warningHours: number;
    status: string;
    assignedToUserId?: number | null;
  }): Promise<void> {
    const severity = complaint.hoursOpen >= complaint.warningHours * 2 ? 'critical' :
                    complaint.hoursOpen >= complaint.warningHours * 1.5 ? 'high' : 'medium';

    await this.send({
      type: 'long_pending_complaint',
      severity,
      title: `Long-Pending Complaint: ${complaint.subject}`,
      message: `Complaint #${complaint.id} has been ${complaint.status.toLowerCase()} for ${complaint.hoursOpen.toFixed(1)} hours (warning threshold: ${complaint.warningHours} hours)`,
      metadata: {
        complaintId: complaint.id,
        subject: complaint.subject,
        hoursOpen: complaint.hoursOpen,
        status: complaint.status,
        assignedToUserId: complaint.assignedToUserId,
      },
    });
  }
}

/**
 * Example: Register email hook (placeholder for future implementation)
 * 
 * NotificationService.registerHook(async (notification) => {
 *   // Integration with email service (e.g., SendGrid, AWS SES, etc.)
 *   if (notification.severity === 'critical' || notification.severity === 'high') {
 *     await emailService.send({
 *       to: notification.recipients || ['admin@example.com'],
 *       subject: notification.title,
 *       body: notification.message,
 *     });
 *   }
 * });
 * 
 * Example: Register SMS hook (placeholder for future implementation)
 * 
 * NotificationService.registerHook(async (notification) => {
 *   if (notification.severity === 'critical') {
 *     await smsService.send({
 *       to: notification.recipients || ['+1234567890'],
 *       message: `${notification.title}: ${notification.message}`,
 *     });
 *   }
 * });
 */

