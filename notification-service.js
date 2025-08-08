// Email Notification Service for Gonah Homes
// This service handles sending email notifications to admin

class NotificationService {
  constructor() {
    this.db = firebase.firestore();
    this.adminEmail = "gonahhomes0@gmail.com";
    this.adminPhone = "+254799466723";
    this.setupNotificationListener();
  }

  setupNotificationListener() {
    // Listen for new notifications
    this.db.collection('notifications')
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.processNotification(change.doc);
          }
        });
      });
  }

  async processNotification(doc) {
    const notification = doc.data();
    const notificationId = doc.id;

    try {
      switch (notification.type) {
        case 'new_booking':
          await this.sendBookingNotification(notification.data);
          break;
        case 'new_message':
          await this.sendMessageNotification(notification.data);
          break;
        case 'new_review':
          await this.sendReviewNotification(notification.data);
          break;
      }

      // Mark notification as processed
      await this.db.collection('notifications').doc(notificationId).update({
        status: 'sent',
        sentAt: firebase.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('Error processing notification:', error);
      await this.db.collection('notifications').doc(notificationId).update({
        status: 'failed',
        error: error.message,
        failedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  async sendBookingNotification(bookingData) {
    const subject = `🏠 New Booking - ${bookingData.house}`;
    const body = `
      New booking received on Gonah Homes website!
      
      📋 Booking Details:
      • Guest: ${bookingData.name}
      • Property: ${bookingData.house}
      • Guests: ${bookingData.guests}
      • Check-in: ${bookingData.checkin}
      • Check-out: ${bookingData.checkout}
      • Email: ${bookingData.email}
      • Phone: ${bookingData.phone}
      
      ${bookingData.access ? `🦽 Accessibility Needs: ${bookingData.access}` : ''}
      ${bookingData.requests ? `📝 Special Requests: ${bookingData.requests}` : ''}
      
      💰 Action Required: Contact client to confirm booking and collect payment.
      
      Admin Panel: ${window.location.origin}/admin.html
    `;

    await this.sendEmail(subject, body, bookingData);
    await this.sendSMS(`New booking: ${bookingData.name} - ${bookingData.house}. Check admin panel for details.`);
  }

  async sendMessageNotification(messageData) {
    const subject = `📧 New Message from ${messageData.name}`;
    const body = `
      New message received on Gonah Homes website!
      
      👤 From: ${messageData.name}
      📧 Email: ${messageData.email}
      
      💬 Message:
      ${messageData.message}
      
      Reply directly to this email or use the admin panel.
      
      Admin Panel: ${window.location.origin}/admin.html
    `;

    await this.sendEmail(subject, body, messageData);
  }

  async sendReviewNotification(reviewData) {
    const subject = `⭐ New Review - ${reviewData.rating} stars`;
    const body = `
      New review submitted on Gonah Homes website!
      
      ⭐ Rating: ${reviewData.rating}/5 stars
      👤 From: ${reviewData.user.name}
      
      📝 Review:
      ${reviewData.review}
      
      Admin Panel: ${window.location.origin}/admin.html
    `;

    await this.sendEmail(subject, body, reviewData);
  }

  async sendEmail(subject, body, data) {
    try {
      // Send via EmailJS
      await emailjs.send("Gonah Homes", "template_p667wcm", {
        from_name: data?.name || data?.user?.name || "Guest",
        reply_to: data?.email || data?.user?.email || this.adminEmail,
        phone: data?.phone || "",
        house: data?.house || "",
        guests: data?.guests || "",
        checkin: data?.checkin || "",
        checkout: data?.checkout || "",
        requests: (data?.requests || "").substring(0, 100),
        access: (data?.access || "").substring(0, 100),
        admin_link: window.location.origin + "/admin.html",
        message: body // message body for template
      });

      // Log to Firestore (optional)
      await this.db.collection('email_logs').add({
        to: this.adminEmail,
        subject: subject,
        data: data,
        body: body,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      });

      console.log("✅ Email sent via EmailJS");

    } catch (error) {
      console.error("❌ EmailJS error:", error.message);

      await this.db.collection('email_logs').add({
        to: this.adminEmail,
        subject: subject,
        data: data,
        body: body,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'failed',
        error: error.message
      });
    }
  }

  async sendSMS(message) {
    // Using Africa's Talking or similar SMS service
    // For now, we'll log the SMS
    console.log('📱 SMS Notification:', message);

    await this.db.collection('sms_logs').add({
      to: this.adminPhone,
      message: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'logged'
    });
  }
}

// Initialize notification service when Firebase is ready
document.addEventListener('DOMContentLoaded', function() {
  if (typeof firebase !== 'undefined') {
    const notificationService = new NotificationService();
    window.notificationService = notificationService;
  }
});
