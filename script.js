// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyABTVp797tNu353FBVLzsOp90aIX2mNF74",
  authDomain: "my-website-project2797.firebaseapp.com",
  projectId: "my-website-project2797",
  storageBucket: "my-website-project2797.appspot.com",
  messagingSenderId: "406226552922",
  appId: "1:406226552922:web:ffdf2ccf6f77a57964b063"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();
let currentUser = null;
const adminEmail = "salimtuva0@gmail.com";

// EmailJS Initialization
(function () {
  emailjs.init("m0UJnizGPuMyIeNwi");
})();

// Utility Functions
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Mobile Navigation
function initMobileNav() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      navMenu.classList.toggle('active');
      hamburger.classList.toggle('active');
    });
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
      });
    });
    document.addEventListener('click', (e) => {
      if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
      }
    });
  }
}

// Booking Modal Functions
function openBookingModal(house) {
  const modal = document.getElementById('booking-modal-bg');
  const form = document.getElementById('booking-form');
  const confirmDiv = document.getElementById('booking-confirm');
  if (modal && form && confirmDiv) {
    modal.classList.add('active');
    document.getElementById('booking-house').value = house;
    form.style.display = 'block';
    confirmDiv.style.display = 'none';
    form.reset();

    // Set minimum dates to today
    const today = new Date().toISOString().split('T')[0];
    const checkinInput = document.getElementById('booking-checkin');
    const checkoutInput = document.getElementById('booking-checkout');
    checkinInput.min = today;
    checkoutInput.min = today;
    checkinInput.addEventListener('change', function() {
      const checkinDate = new Date(this.value);
      checkinDate.setDate(checkinDate.getDate() + 1);
      checkoutInput.min = checkinDate.toISOString().split('T')[0];
      if (checkoutInput.value && new Date(checkoutInput.value) <= new Date(this.value)) {
        checkoutInput.value = '';
      }
    });
  }
}
function closeBookingModal() {
  const modal = document.getElementById('booking-modal-bg');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Review System Functions
function showUserInfo(email) {
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');
  const userEmail = document.getElementById('user-email');
  const emailForm = document.getElementById('email-form');
  const reviewForm = document.getElementById('review-form');
  if (userInfo && userName && userEmail && emailForm && reviewForm) {
    userInfo.style.display = 'block';
    userName.textContent = email.split('@')[0];
    userEmail.textContent = email;
    reviewForm.style.display = 'block';
    emailForm.style.display = 'none';
  }
}
function hideUserInfo() {
  const userInfo = document.getElementById('user-info');
  const emailForm = document.getElementById('email-form');
  const reviewForm = document.getElementById('review-form');
  if (userInfo && emailForm && reviewForm) {
    userInfo.style.display = 'none';
    emailForm.style.display = 'block';
    reviewForm.style.display = 'none';
  }
}

function renderTestimonials(reviews) {
  const testimonialsGrid = document.getElementById('testimonials-grid');
  if (!testimonialsGrid) return;
  if (!reviews || reviews.length === 0) {
    testimonialsGrid.innerHTML = `
      <div class="testimonial-card">
        <div class="testimonial-rating">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
        </div>
        <p class="testimonial-text">"Amazing experience! The apartment was spotless, beautifully furnished, and the location was perfect. Will definitely book again!"</p>
        <div class="testimonial-author">
          <img src="https://images.unsplash.com/photo-1494790108755-2616b612b577?w=100&h=100&fit=crop&crop=face" alt="Sarah Johnson" class="author-avatar">
          <div class="author-info">
            <h4>Sarah Johnson</h4>
            <span>Verified Guest</span>
          </div>
        </div>
      </div>
      <div class="testimonial-card">
        <div class="testimonial-rating">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
        </div>
        <p class="testimonial-text">"Gonah Homes exceeded our expectations. The maisonette was luxurious and the customer service was outstanding. Highly recommended!"</p>
        <div class="testimonial-author">
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="Michael Chen" class="author-avatar">
          <div class="author-info">
            <h4>Michael Chen</h4>
            <span>Verified Guest</span>
          </div>
        </div>
      </div>
      <div class="testimonial-card">
        <div class="testimonial-rating">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i>
        </div>
        <p class="testimonial-text">"Perfect for our family vacation. The kids loved the space and we appreciated the modern amenities. Thank you Gonah Homes!"</p>
        <div class="testimonial-author">
          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" alt="Emily Rodriguez" class="author-avatar">
          <div class="author-info">
            <h4>Emily Rodriguez</h4>
            <span>Verified Guest</span>
          </div>
        </div>
      </div>
    `;
    return;
  }
  let html = '';
  reviews.slice(0, 6).forEach(review => {
    const rating = '★'.repeat(Number(review.rating || 5));
    const reviewDate = review.timestamp ? new Date(review.timestamp.toDate()).toLocaleDateString() : '';
    const userName = review.user?.name || review.user?.email?.split('@')[0] || 'Anonymous';
    const userAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=100&background=800000&color=fff`;
    html += `
      <div class="testimonial-card">
        <div class="testimonial-rating">
          ${rating.split('').map(() => '<i class="fas fa-star"></i>').join('')}
        </div>
        <p class="testimonial-text">"${review.review}"</p>
        <div class="testimonial-author">
          <img src="${userAvatar}" alt="${userName}" class="author-avatar">
          <div class="author-info">
            <h4>${userName}</h4>
            <span>Verified Guest ${reviewDate ? '• ' + reviewDate : ''}</span>
          </div>
        </div>
        ${review.adminReply ? `
          <div class="admin-reply" style="margin-top: 1rem; padding: 1rem; background: var(--bg-light); border-radius: var(--border-radius); border-left: 4px solid var(--primary-color);">
            <strong>Management Response:</strong><br>
            ${review.adminReply}
          </div>
        ` : ''}
      </div>
    `;
  });
  testimonialsGrid.innerHTML = html;
}

function loadReviews() {
  db.collection("reviews").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
    const reviews = [];
    snapshot.forEach((doc) => {
      reviews.push({ id: doc.id, ...doc.data() });
    });
    renderTestimonials(reviews);
  }, (error) => {
    console.error("Error loading reviews: ", error);
    renderTestimonials([]);
  });
}

// ALERT UTILITY FOR EMAILJS
function showAlert(type, message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `custom-alert alert-${type}`;
  alertDiv.innerHTML = `
    <div class="alert-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'times-circle'}"></i>
      <span>${message}</span>
      <button class="alert-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
  `;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 5000);
}

// Form Handlers
function initFormHandlers() {
  // Email form for reviews
  const emailForm = document.getElementById('email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email-input').value.trim();
      if (email && email.includes('@')) {
        currentUser = { email: email };
        showUserInfo(email);
      } else {
        showAlert("error", "Please enter a valid email address");
      }
    });
  }
  // Sign out button
  const signOutBtn = document.getElementById('signout-btn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      currentUser = null;
      hideUserInfo();
      document.getElementById('email-input').value = '';
    });
  }
  // Review form
  const reviewForm = document.getElementById('review-form');
  if (reviewForm) {
    reviewForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentUser) {
        showAlert("error", "Please enter your email to leave a review.");
        return;
      }
      const rating = document.querySelector('input[name="rating"]:checked')?.value || 0;
      const reviewText = document.getElementById('review-text').value.trim();
      if (!reviewText) {
        showAlert("error", "Please write a review!");
        return;
      }
      if (!rating) {
        showAlert("error", "Please select a rating!");
        return;
      }
      // Show loading state
      const submitBtn = reviewForm.querySelector('[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      submitBtn.disabled = true;
      const reviewData = {
        review: reviewText,
        rating: rating,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        user: {
          name: currentUser.email.split('@')[0],
          email: currentUser.email
        },
        adminReply: null
      };
      // EmailJS Send
      emailjs.send('Gonah Homes', 'template_p667wcm', {
        from_name: reviewData.user.name,
        from_email: reviewData.user.email,
        message: `Rating: ${rating}\nReview: ${reviewText}`,
        form_type: "Review"
      }, 'm0UJnizGPuMyIeNwi')
        .then(() => {
          showAlert('success', 'Thank you for your review! Email sent successfully.');
        }, (error) => {
          showAlert('error', 'Failed to send your review email.');
        });
      db.collection("reviews").add(reviewData).then(() => {
        document.getElementById('review-text').value = '';
        document.querySelectorAll('input[name="rating"]').forEach(input => input.checked = false);
        showAlert('success', "Thank you for your review! It has been submitted successfully.");
        // Send notification to admin
        return db.collection("notifications").add({
          type: 'new_review',
          data: {
            ...reviewData,
            user: {
              name: currentUser.email.split('@')[0],
              email: currentUser.email
            }
          },
          status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).catch((error) => {
        console.error("Error adding review: ", error);
        showAlert('error', "Error submitting review. Please try again.");
      }).finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
    });
  }

  // Booking form
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(bookingForm);
      const bookingData = Object.fromEntries(formData.entries());
      // Validation
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkinDate = new Date(bookingData.checkin);
      const checkoutDate = new Date(bookingData.checkout);
      if (!bookingData.name || !bookingData.guests || !bookingData.checkin || 
          !bookingData.checkout || !bookingData.phone || !bookingData.email) {
        showAlert("error", "Please fill all required booking fields.");
        return;
      }
      if (checkinDate < today) {
        showAlert("error", "Check-in date cannot be in the past.");
        return;
      }
      if (checkoutDate <= checkinDate) {
        showAlert("error", "Check-out date must be after check-in date.");
        return;
      }
      // Ensure at least one night stay
      const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (daysDiff < 1) {
        showAlert("error", "Minimum stay is one night.");
        return;
      }
      // Show loading state
      const submitBtn = bookingForm.querySelector('[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
      submitBtn.disabled = true;
      // EmailJS Send
      emailjs.send('Gonah Homes', 'template_p667wcm', {
        from_name: bookingData.name,
        from_email: bookingData.email,
        message: `
          Booking for: ${bookingData.house}
          Name: ${bookingData.name}
          Email: ${bookingData.email}
          Phone: ${bookingData.phone}
          Guests: ${bookingData.guests}
          Check-in: ${bookingData.checkin}
          Check-out: ${bookingData.checkout}
          Accessibility: ${bookingData.access}
          Special Requests: ${bookingData.requests}
        `,
        form_type: "Booking"
      }, 'm0UJnizGPuMyIeNwi')
        .then(() => {
          showAlert('success', 'Your booking request email was sent successfully!');
        }, (error) => {
          showAlert('error', 'Failed to send booking request email.');
        });
      // Save booking to database
      db.collection("bookings").add({
        ...bookingData,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
      }).then(() => {
        showBookingConfirmation(bookingData);
        // Send notification to admin
        return db.collection("notifications").add({
          type: 'new_booking',
          data: bookingData,
          status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).catch((error) => {
        console.error("Error saving booking: ", error);
        showAlert('error', "Error processing booking. Please try again.");
      }).finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
    });
  }

  // Contact form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      if (!name || !email || !message) {
        showAlert("error", "Please fill all required fields.");
        return;
      }
      // Show loading state
      const submitBtn = contactForm.querySelector('[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      submitBtn.disabled = true;
      // EmailJS Send
      emailjs.send('Gonah Homes', 'template_p667wcm', {
        from_name: name,
        from_email: email,
        message: message,
        form_type: "Contact"
      }, 'm0UJnizGPuMyIeNwi')
        .then(() => {
          showAlert('success', 'Your message was sent successfully!');
        }, (error) => {
          showAlert('error', 'Failed to send your message.');
        });
      // Save message to database
      db.collection("messages").add({
        name: name,
        email: email,
        message: message,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'new'
      }).then(() => {
        showAlert('success', "Thank you for your message! We will get back to you soon.");
        contactForm.reset();
        // Send notification to admin
        return db.collection("notifications").add({
          type: 'new_message',
          data: {
            name: name,
            email: email,
            message: message
          },
          status: 'pending',
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).catch((error) => {
        console.error("Error sending message: ", error);
        showAlert('error', "Error sending message. Please try again.");
      }).finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      });
    });
  }
}

function showBookingConfirmation(bookingData) {
  const form = document.getElementById('booking-form');
  const confirmDiv = document.getElementById('booking-confirm');
  const detailsDiv = document.getElementById('booking-details');
  if (form && confirmDiv && detailsDiv) {
    form.style.display = 'none';
    confirmDiv.style.display = 'block';
    detailsDiv.innerHTML = `
      <p><strong>Accommodation:</strong> ${bookingData.house}</p>
      <p><strong>Guest Name:</strong> ${bookingData.name}</p>
      <p><strong>Email:</strong> ${bookingData.email}</p>
      <p><strong>Phone:</strong> ${bookingData.phone}</p>
      <p><strong>Number of Guests:</strong> ${bookingData.guests}</p>
      <p><strong>Check-in:</strong> ${formatDate(bookingData.checkin)}</p>
      <p><strong>Check-out:</strong> ${formatDate(bookingData.checkout)}</p>
      ${bookingData.access ? `<p><strong>Accessibility Needs:</strong> ${bookingData.access}</p>` : ''}
      ${bookingData.requests ? `<p><strong>Special Requests:</strong> ${bookingData.requests}</p>` : ''}
    `;
  }
}

// Smooth Scrolling for Navigation
function initSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Intersection Observer for Animations
function initAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in');
      }
    });
  }, observerOptions);
  document.querySelectorAll('.accommodation-card, .feature-card, .testimonial-card, .quick-link-card').forEach(el => {
    observer.observe(el);
  });
}

// Close modal when clicking outside
function initModalHandlers() {
  const modal = document.getElementById('booking-modal-bg');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeBookingModal();
      }
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeBookingModal();
    }
  });
}

// Navbar scroll effect
function initNavbarScroll() {
  const navbar = document.querySelector('.main-header');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
      } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
      }
    });
  }
}

// Make functions globally available
window.openBookingModal = openBookingModal;
window.closeBookingModal = closeBookingModal;
window.scrollToSection = scrollToSection;

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initFormHandlers();
  initSmoothScrolling();
  initAnimations();
  initModalHandlers();
  initNavbarScroll();
  loadReviews();
  hideUserInfo();
  console.log('Gonah Homes website initialized successfully!');
});

// Custom Alert Function
function showCustomAlert(message, type = "success") {
  const existingAlert = document.querySelector('.custom-alert');
  if (existingAlert) {
    existingAlert.remove();
  }
  const alertBox = document.createElement('div');
  alertBox.classList.add('custom-alert');
  alertBox.classList.add(type);
  const messageBox = document.createElement('p');
  messageBox.textContent = message;
  const closeBtn = document.createElement('span');
  closeBtn.classList.add('alert-close-btn');
  closeBtn.innerHTML = '&times;';
  alertBox.appendChild(messageBox);
  alertBox.appendChild(closeBtn);
  document.body.appendChild(alertBox);
  closeBtn.addEventListener('click', () => {
    alertBox.remove();
  });
  setTimeout(() => {
    alertBox.remove();
  }, 5000);
}
