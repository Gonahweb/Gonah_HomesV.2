// Email Notification Service for Gonah Homes
// Handles admin notifications AND sends booking confirmation/replies to client

class NotificationService {
  constructor() {
    this.db = firebase.firestore();
    this.adminEmail = "salimtuva0@gmail.com";
    this.adminPhone = "+254799466723";
    this.setupNotificationListener();
    this.setupAdminReplyListener();
  }

  setupNotificationListener() {
    // Listen for new notifications (booking/message/review)
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
      // Only send ONE admin notification per booking/message/review
      switch (notification.type) {
        case 'new_booking':
          await this.sendAdminBookingNotification(notification.data);
          break;
        case 'new_message':
          await this.sendAdminMessageNotification(notification.data);
          break;
        case 'new_review':
          await this.sendAdminReviewNotification(notification.data);
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

  // Send booking notification to admin only (template_p667wcm)
  async sendAdminBookingNotification(bookingData) {
    await emailjs.send("Gonah Homes", "template_p667wcm", {
      from_name: bookingData.name,
      reply_to: bookingData.email,
      phone: bookingData.phone,
      house: bookingData.house,
      guests: bookingData.guests,
      checkin: bookingData.checkin,
      checkout: bookingData.checkout,
      requests: bookingData.requests || "",
      access: bookingData.access || "",
      message: `New booking received for ${bookingData.house}.\nGuest: ${bookingData.name}\nGuests: ${bookingData.guests}\nDates: ${bookingData.checkin} to ${bookingData.checkout}\nRequests: ${bookingData.requests || ''}\nAccess: ${bookingData.access || ''}`,
      admin_link: window.location.origin + "/admin.html"
    });
    // Log to Firestore
    await this.db.collection('email_logs').add({
      to: this.adminEmail,
      subject: "New Booking Notification",
      data: bookingData,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'sent'
    });
  }

  // Send new message notification to admin (template_p667wcm)
  async sendAdminMessageNotification(messageData) {
    await emailjs.send("Gonah Homes", "template_p667wcm", {
      from_name: messageData.name,
      reply_to: messageData.email,
      message: messageData.message,
      admin_link: window.location.origin + "/admin.html"
    });
    await this.db.collection('email_logs').add({
      to: this.adminEmail,
      subject: "New Contact Message",
      data: messageData,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'sent'
    });
  }

  // Send review notification to admin template_p667wcm)
  async sendAdminReviewNotification(reviewData) {
    await emailjs.send("Gonah Homes", "template_p667wcm", {
      from_name: reviewData.user.name,
      reply_to: reviewData.user.email,
      rating: reviewData.rating,
      review: reviewData.review,
      admin_link: window.location.origin + "/admin.html"
    });
    await this.db.collection('email_logs').add({
      to: this.adminEmail,
      subject: "New Review Notification",
      data: reviewData,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'sent'
    });
  }

  // Listen for admin replies/booking confirmations in Firestore
  setupAdminReplyListener() {
    // Listen for replies/confirmations on bookings/messages/reviews
    this.db.collection('admin_replies')
      .where('status', '==', 'pending')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            this.processAdminReply(change.doc);
          }
        });
      });
  }

  async processAdminReply(doc) {
    const reply = doc.data();
    const replyId = doc.id;
    try {
      // Send reply to client (template_68fd8qu)
      await emailjs.send("Gonah Homes", "template_68fd8qu", {
        to_email: reply.client_email,
        from_name: "Gonah Homes Admin",
        reply_message: reply.message,
        booking_details: reply.booking_details || "",
        admin_name: reply.admin_name || "Admin",
        subject: reply.subject || "Reply from Gonah Homes",
      });
      // Mark reply as sent
      await this.db.collection('admin_replies').doc(replyId).update({
        status: 'sent',
        sentAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      // Log to Firestore
      await this.db.collection('email_logs').add({
        to: reply.client_email,
        subject: "Admin Reply/Booking Confirmation",
        data: reply,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      });
    } catch (error) {
      console.error("Error sending admin reply:", error);
      await this.db.collection('admin_replies').doc(replyId).update({
        status: 'failed',
        error: error.message,
        failedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }
}

// Initialize notification service when Firebase is ready
document.addEventListener('DOMContentLoaded', function() {
  if (typeof firebase !== 'undefined') {
    const notificationService = new NotificationService();
    window.notificationService = notificationService;
  }
});
