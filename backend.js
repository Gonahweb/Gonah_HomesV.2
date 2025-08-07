// Backend functionality for Gonah Homes Admin System
// This script handles data collection, storage, and management

class GonahHomesBackend {
  constructor() {
    this.db = firebase.firestore();
    this.auth = firebase.auth();
    this.initializeCollections();
    this.setupTrafficTracking();
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

      // Send confirmation email
      await this.sendBookingConfirmation(booking);

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

      // Send notification to admin
      await this.notifyAdmin('new_message', message);

      return { success: true, messageId: docRef.id };
    } catch (error) {
      console.error('Error saving message:', error);
      return { success: false, error: error.message };
    }
  }

  async replyToMessage(messageId, replyText, adminEmail) {
    try {
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

      return { success: true };
    } catch (error) {
      console.error('Error replying to message:', error);
      return { success: false, error: error.message };
    }
  }

  // Email Management
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

  // Notification System
  async notifyAdmin(type, data) {
    // Implement notification logic (email, SMS, etc.)
    console.log(`Admin notification: ${type}`, data);
  }

  // Email Confirmation
  async sendBookingConfirmation(booking) {
    try {
      const emailData = {
        to: booking.email,
        subject: 'Booking Confirmation - Gonah Homes',
        body: `
          Dear ${booking.name},

          Thank you for booking with Gonah Homes!

          Booking Details:
          - Property: ${booking.house}
          - Check-in: ${booking.checkin}
          - Check-out: ${booking.checkout}
          - Guests: ${booking.guests}

          To confirm your booking, please pay the booking fee to:
          M-Pesa: 0799466723

          We will contact you shortly for confirmation.

          Best regards,
          Gonah Homes Team
        `,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      };

      await this.saveEmail(emailData);
      return { success: true };
    } catch (error) {
      console.error('Error sending booking confirmation:', error);
      return { success: false, error: error.message };
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
              <span style="font-size:1.2em;color:#800000;font-weight:700;">0799466723</span>
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
const adminEmail = "salimtuva0@gmail.com";
