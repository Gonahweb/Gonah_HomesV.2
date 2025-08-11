// Notification Service for Gonah Homes
// Handles admin/client emails & updates, listens to bookings/messages/reviews

class NotificationService {
  constructor() {
    this.db = firebase.firestore();
    this.adminEmail = "salimtuva0@gmail.com";
    this.adminPhone = "+254799466723";
    // EmailJS keys
    this.serviceId = "service_sf7nruj";
    this.adminTemplate = "template_p667wcm";
    this.clientTemplate = "template_68fd8qu";
    this.listenBookings();
    this.listenMessages();
    this.listenReviews();
  }

  // Listen for new bookings
  listenBookings() {
    this.db.collection('bookings')
      .where('status', '==', 'pending')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            this.processBooking(change.doc);
          }
        });
      });
  }

  // Listen for new messages
  listenMessages() {
    this.db.collection('messages')
      .where('status', '==', 'pending')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            this.processMessage(change.doc);
          }
        });
      });
  }

  // Listen for new reviews
  listenReviews() {
    this.db.collection('reviews')
      .where('status', '==', 'pending')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            this.processReview(change.doc);
          }
        });
      });
  }

  // --- PROCESSORS ---

  async processBooking(doc) {
    const booking = doc.data();
    const bookingId = doc.id;
    try {
      // Send admin notification
      await this.sendAdminBookingEmail(booking);
      // Send booking confirmation to client
      await this.sendBookingConfirmationEmail(booking);
      // Optionally: send SMS to admin
      await this.sendSMS(`New booking: ${booking.name} - ${booking.house}. Check admin panel for details.`);
      // Mark as sent
      await this.db.collection('bookings').doc(bookingId).update({
        status: 'sent',
        sentAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      await this.db.collection('bookings').doc(bookingId).update({
        status: 'failed',
        error: error.message,
        failedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  async processMessage(doc) {
    const message = doc.data();
    const messageId = doc.id;
    try {
      await this.sendAdminMessageEmail(message);
      await this.db.collection('messages').doc(messageId).update({
        status: 'sent',
        sentAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      await this.db.collection('messages').doc(messageId).update({
        status: 'failed',
        error: error.message,
        failedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  async processReview(doc) {
    const review = doc.data();
    const reviewId = doc.id;
    try {
      await this.sendAdminReviewEmail(review);
      await this.db.collection('reviews').doc(reviewId).update({
        status: 'sent',
        sentAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      await this.db.collection('reviews').doc(reviewId).update({
        status: 'failed',
        error: error.message,
        failedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  // --- EMAILJS SENDERS ---

  async sendAdminBookingEmail(booking) {
    // Admin notification for booking
    return emailjs.send(this.serviceId, this.adminTemplate, {
      from_name: booking.name,
      reply_to: booking.email,
      phone: booking.phone,
      house: booking.house,
      guests: booking.guests,
      checkin: booking.checkin,
      checkin_time: booking.checkin_time || "",
      checkout: booking.checkout,
      requests: booking.requests || "",
      access: booking.access || "",
      admin_link: window.location.origin + "/admin.html"
    });
  }

  async sendBookingConfirmationEmail(booking) {
    // Email to client
    return emailjs.send(this.serviceId, this.clientTemplate, {
      to_name: booking.name,
      email: booking.email,
      house: booking.house,
      checkin: booking.checkin,
      checkin_time: booking.checkin_time || "",
      checkout: booking.checkout,
      guests: booking.guests,
      requests: booking.requests || "",
      access: booking.access || ""
    });
  }

  async sendAdminMessageEmail(message) {
    return emailjs.send(this.serviceId, this.adminTemplate, {
      from_name: message.name,
      reply_to: message.email,
      phone: message.phone || "",
      house: message.house || "",
      guests: "",
      checkin: "",
      checkin_time: "",
      checkout: "",
      requests: "",
      access: "",
      admin_link: window.location.origin + "/admin.html",
      message: message.message
    });
  }

  async sendAdminReviewEmail(review) {
    return emailjs.send(this.serviceId, this.adminTemplate, {
      from_name: review.user?.name || "(anonymous)",
      reply_to: review.user?.email || this.adminEmail,
      phone: "",
      house: "",
      guests: "",
      checkin: "",
      checkin_time: "",
      checkout: "",
      requests: "",
      access: "",
      admin_link: window.location.origin + "/admin.html",
      message: review.review,
      rating: review.rating
    });
  }

  async sendSMS(message) {
    // Integrate with SMS API here; for now, just log
    console.log("SMS to admin:", message);
    // Optionally log to Firestore
    await this.db.collection('sms_logs').add({
      to: this.adminPhone,
      message: message,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'logged'
    });
  }

  // --- ADMIN PANEL ACTIONS ---

  // Admin: Confirm booking (updates status, sends confirmation email)
  async confirmBooking(bookingId) {
    // Get booking data
    const doc = await this.db.collection('bookings').doc(bookingId).get();
    const booking = doc.data();
    // Mark as confirmed
    await this.db.collection('bookings').doc(bookingId).update({
      status: 'confirmed',
      confirmedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    // Send confirmation email to client
    return this.sendBookingConfirmationEmail(booking);
  }

  // Admin: Reply to message (sends a custom message to client)
  async replyToMessage(messageId, replyText) {
    const doc = await this.db.collection('messages').doc(messageId).get();
    const message = doc.data();
    return emailjs.send(this.serviceId, this.clientTemplate, {
      to_name: message.name,
      email: message.email,
      subject: "Reply from Gonah Homes",
      message: replyText
    });
  }

  // Admin: Reply to review (if review has email)
  async replyToReview(reviewId, replyText) {
    const doc = await this.db.collection('reviews').doc(reviewId).get();
    const review = doc.data();
    if (review?.user?.email) {
      return emailjs.send(this.serviceId, this.clientTemplate, {
        to_name: review.user.name || "Guest",
        email: review.user.email,
        subject: "Reply to your review - Gonah Homes",
        message: replyText
      });
    }
    return Promise.reject("No client email provided with review.");
  }

  // Admin: Mark booking email as confirmed
  async markEmailConfirmed(bookingId) {
    await this.db.collection('bookings').doc(bookingId).update({
      emailConfirmed: true
    });
  }

  // Utility: Get all unique booking emails (for admin panel)
  async getUniqueBookingEmails() {
    const snapshot = await this.db.collection('bookings').get();
    const emails = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.email) emails.add(data.email);
    });
    return Array.from(emails);
  }
}

// Initialize Notification Service if Firebase and EmailJS are ready
document.addEventListener('DOMContentLoaded', function() {
  if (typeof firebase !== 'undefined' && typeof emailjs !== 'undefined') {
    window.notificationService = new NotificationService();
  }
});
