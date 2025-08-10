// Backend functionality for Gonah Homes Admin System
// This script handles data collection, storage, management, and email notifications using EmailJS

class GonahHomesBackend {
  constructor() {
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    this.emailjsPublicKey = "kdP1XJxSxgjWRWYvW"; // <-- Use your correct key here!
    this.emailjsServiceId = "Gonah Homes";
    this.adminTemplateId = "template_p667wcm";
    this.bookingConfirmationTemplateId = "template_68fd8qu";
    this.adminEmail = "salimtuva0@gmail.com";
    this.mpesaNumber = "0799466723";
    this.initializeCollections();
    this.setupTrafficTracking();
    this.initEmailJS();
  }

  // Initialize EmailJS
  initEmailJS() {
    if (typeof emailjs !== "undefined") {
      emailjs.init(this.emailjsPublicKey);
    }
  }

  // Initialize Firebase collections
  initializeCollections() {
    this.collections = {
      bookings: this.db.collection('bookings'),
      reviews: this.db.collection('reviews'),
      messages: this.db.collection('messages'),
      traffic: this.db.collection('traffic'),
      offers: this.db.collection('offers'),
      clients: this.db.collection('clients'),
      emails: this.db.collection('emails'),
      settings: this.db.collection('settings')
    };
  }

  // Booking Management
  async saveBooking(bookingData) {
    try {
      const booking = {
        ...bookingData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        id: this.generateBookingId()
      };

      const docRef = await this.collections.bookings.add(booking);

      // Also save client data
      await this.saveClient(bookingData);

      // Send notification email to admin
      await this.sendAdminBookingNotification(booking);

      // Send confirmation email to client
      await this.sendBookingConfirmationEmail(booking);

      return { success: true, bookingId: docRef.id };
    } catch (error) {
      console.error('Error saving booking:', error);
      return { success: false, error: error.message };
    }
  }

  async updateBookingStatus(bookingId, status) {
    try {
      await this.collections.bookings.doc(bookingId).update({
        status: status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: error.message };
    }
  }

  // Client Management
  async saveClient(clientData) {
    try {
      const clientId = this.generateClientId(clientData.email);
      const client = {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        totalBookings: firebase.firestore.FieldValue.increment(1),
        lastVisit: firebase.firestore.FieldValue.serverTimestamp(),
        firstVisit: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.collections.clients.doc(clientId).set(client, { merge: true });
      return { success: true };
    } catch (error) {
      console.error('Error saving client:', error);
      return { success: false, error: error.message };
    }
  }

  // Message Management
  async saveMessage(messageData) {
    try {
      const message = {
        ...messageData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'unread',
        replies: []
      };

      const docRef = await this.collections.messages.add(message);

      // Send notification email to admin
      await this.sendAdminMessageNotification(message);

      return { success: true, messageId: docRef.id };
    } catch (error) {
      console.error('Error saving message:', error);
      return { success: false, error: error.message };
    }
  }

  async replyToMessage(messageId, replyText, adminEmail) {
    try {
      const messageDoc = await this.collections.messages.doc(messageId).get();
      if (!messageDoc.exists) throw new Error("Original message not found");
      const message = messageDoc.data();

      const reply = {
        text: replyText,
        from: adminEmail,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.collections.messages.doc(messageId).update({
        replies: firebase.firestore.FieldValue.arrayUnion(reply),
        status: 'replied',
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      // Send email reply to client using EmailJS booking confirmation template (for consistency)
      await this.sendAdminReplyEmail(message.email, replyText, message);

      return { success: true };
    } catch (error) {
      console.error('Error replying to message:', error);
      return { success: false, error: error.message };
    }
  }

  // Review Management
  async saveReview(reviewData) {
    try {
      const review = {
        ...reviewData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
      };

      const docRef = await this.collections.reviews.add(review);

      // Send notification email to admin
      await this.sendAdminReviewNotification(review);

      return { success: true, reviewId: docRef.id };
    } catch (error) {
      console.error('Error saving review:', error);
      return { success: false, error: error.message };
    }
  }

  // EmailJS Email Sending Functions

  // Booking notification to admin
  async sendAdminBookingNotification(booking) {
    try {
      await emailjs.send(this.emailjsServiceId, this.adminTemplateId, {
        from_name: booking.name,
        reply_to: booking.email,
        phone: booking.phone,
        house: booking.house,
        guests: booking.guests,
        checkin: booking.checkin,
        checkout: booking.checkout,
        requests: booking.requests || "",
        access: booking.access || "",
        message: `New booking for ${booking.house}.\nGuest: ${booking.name}\nDates: ${booking.checkin} to ${booking.checkout}\nGuests: ${booking.guests}\nRequests: ${booking.requests || ''}\nAccess: ${booking.access || ''}`,
        admin_link: window.location.origin + "/admin.html"
      });
    } catch (error) {
      console.error("Error sending admin booking notification:", error);
    }
  }

  // Booking confirmation to client
  async sendBookingConfirmationEmail(booking) {
    try {
      await emailjs.send(this.emailjsServiceId, this.bookingConfirmationTemplateId, {
        to_email: booking.email,
        from_name: "Gonah Homes",
        booking_details: `
          Property: ${booking.house}
          Check-in: ${booking.checkin}
          Check-out: ${booking.checkout}
          Guests: ${booking.guests}
        `,
        message: `Dear ${booking.name},

Thank you for booking with Gonah Homes!

To confirm your booking, please pay the booking fee to:
M-Pesa: ${this.mpesaNumber}

We will contact you shortly for confirmation.

Best regards,
Gonah Homes Team
        `,
        subject: "Booking Confirmation - Gonah Homes"
      });
    } catch (error) {
      console.error("Error sending booking confirmation email:", error);
    }
  }

  // New message notification to admin
  async sendAdminMessageNotification(message) {
    try {
      await emailjs.send(this.emailjsServiceId, this.adminTemplateId, {
        from_name: message.name,
        reply_to: message.email,
        message: message.message,
        admin_link: window.location.origin + "/admin.html"
      });
    } catch (error) {
      console.error("Error sending admin message notification:", error);
    }
  }

  // Admin reply to client
  async sendAdminReplyEmail(clientEmail, replyText, originalMessage) {
    try {
      await emailjs.send(this.emailjsServiceId, this.bookingConfirmationTemplateId, {
        to_email: clientEmail,
        from_name: "Gonah Homes Admin",
        reply_message: replyText,
        booking_details: originalMessage.house ? `
          Property: ${originalMessage.house}
          Check-in: ${originalMessage.checkin || ""}
          Check-out: ${originalMessage.checkout || ""}
          Guests: ${originalMessage.guests || ""}
        ` : "",
        subject: "Reply from Gonah Homes"
      });
    } catch (error) {
      console.error("Error sending admin reply email:", error);
    }
  }

  // Review notification to admin
  async sendAdminReviewNotification(review) {
    try {
      await emailjs.send(this.emailjsServiceId, this.adminTemplateId, {
        from_name: review.user?.name || review.name || "Guest",
        reply_to: review.user?.email || review.email || this.adminEmail,
        rating: review.rating,
        review: review.review,
        admin_link: window.location.origin + "/admin.html"
      });
    } catch (error) {
      console.error("Error sending admin review notification:", error);
    }
  }

  // Email Management (saves a record, does NOT send email!)
  async saveEmail(emailData) {
    try {
      const email = {
        ...emailData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      };

      await this.collections.emails.add(email);
      return { success: true };
    } catch (error) {
      console.error('Error saving email:', error);
      return { success: false, error: error.message };
    }
  }

  // Traffic Analytics
  setupTrafficTracking() {
    // Track page views
    this.trackPageView();

    // Track user interactions
    this.setupInteractionTracking();
  }

  async trackPageView() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const pageView = {
        page: window.location.pathname,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        date: today
      };

      await this.collections.traffic.add(pageView);

      // Update daily stats
      await this.updateDailyStats(today);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  async updateDailyStats(date) {
    try {
      const statsDoc = this.collections.traffic.doc(`stats_${date}`);
      await statsDoc.set({
        date: date,
        pageViews: firebase.firestore.FieldValue.increment(1),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating daily stats:', error);
    }
  }

  setupInteractionTracking() {
    // Track button clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.book-btn, .tile-vert, .accomm-tile')) {
        this.trackInteraction('click', e.target.textContent.trim());
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'booking-form') {
        this.trackInteraction('booking_submission', 'booking_form');
      } else if (e.target.id === 'review-form') {
        this.trackInteraction('review_submission', 'review_form');
      }
    });
  }

  async trackInteraction(type, element) {
    try {
      const interaction = {
        type: type,
        element: element,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        page: window.location.pathname
      };

      await this.collections.traffic.add(interaction);
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  // Offer Management
  async createOffer(offerData) {
    try {
      const offer = {
        ...offerData,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'active',
        views: 0,
        clicks: 0
      };

      const docRef = await this.collections.offers.add(offer);
      return { success: true, offerId: docRef.id };
    } catch (error) {
      console.error('Error creating offer:', error);
      return { success: false, error: error.message };
    }
  }

  // Analytics and Reporting
  async getDashboardStats() {
    try {
      const stats = {};

      // Get booking stats
      const bookings = await this.collections.bookings.get();
      stats.totalBookings = bookings.size;

      // Get revenue (placeholder - implement based on your pricing)
      stats.monthlyRevenue = bookings.size * 5000; // Example calculation

      // Get review stats
      const reviews = await this.collections.reviews.get();
      stats.totalReviews = reviews.size;

      // Get message stats
      const messages = await this.collections.messages.where('status', '==', 'unread').get();
      stats.unreadMessages = messages.size;

      // Get traffic stats
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await this.collections.traffic.doc(`stats_${today}`).get();
      stats.todayPageViews = todayStats.exists ? todayStats.data().pageViews : 0;

      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {};
    }
  }

  // Utility functions
  generateBookingId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 5);
    return `GH${timestamp.slice(-6)}${random.toUpperCase()}`;
  }

  generateClientId(email) {
    return email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }

  // Integration with existing booking form
  integrateWithBookingForm() {
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
      bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(bookingForm);
        const bookingData = {
          name: formData.get('name'),
          house: formData.get('house'),
          guests: formData.get('guests'),
          phone: formData.get('phone'),
          email: formData.get('email'),
          checkin: formData.get('checkin'),
          checkout: formData.get('checkout'),
          access: formData.get('access'),
          requests: formData.get('requests')
        };

        const result = await this.saveBooking(bookingData);

        if (result.success) {
          // Show success message with booking ID
          document.getElementById('booking-confirm').innerHTML = `
            <div class="booking-confirm-header">
              <button class="close-modal" onclick="closeBookingModal()" aria-label="Close">&times;</button>
            </div>
            <h3>Booking Complete!</h3>
            <p><strong>Booking ID:</strong> ${result.bookingId}</p>
            <p>House: <b>${bookingData.house}</b></p>
            <p>Name: <b>${bookingData.name}</b></p>
            <p>Phone/WhatsApp: <b>${bookingData.phone}</b></p>
            <p>Email: <b>${bookingData.email}</b></p>
            <p>Guests: <b>${bookingData.guests}</b></p>
            <p>Dates: <b>${bookingData.checkin} to ${bookingData.checkout}</b></p>
            ${bookingData.access ? `<p><b>Accessibility/Disability:</b> ${bookingData.access}</p>` : ""}
            ${bookingData.requests ? `<p><b>Special Requests:</b> ${bookingData.requests}</p>` : ""}
            <div style="margin:1.1em 0;">
              <b>To confirm, kindly pay booking fee to Mpesa number:</b><br>
              <span style="font-size:1.2em;color:#800000;font-weight:700;">${this.mpesaNumber}</span>
            </div>
            <p>After payment, you will be contacted for confirmation. Thank you!</p>
          `;
          bookingForm.style.display = "none";
        } else {
          alert('Error processing booking: ' + result.error);
        }
      });
    }
  }
}

// Initialize backend system
document.addEventListener('DOMContentLoaded', function() {
  if (typeof firebase !== 'undefined') {
    const backend = new GonahHomesBackend();
    backend.integrateWithBookingForm();

    // Make backend available globally for admin functions
    window.gonahBackend = backend;
  }
});
