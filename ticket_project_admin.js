/* =====================================================
   TICKETHUB - CUSTOMER WEBSITE + ADMIN DASHBOARD
   Frontend demo only. Data is stored in localStorage.
===================================================== */

/* ================= SETTINGS ================= */

const EVENTS_KEY = "ticketHubEvents";
const BOOKINGS_KEY = "ticketHubBookings";
const USERS_KEY = "ticketHubUsers";
const SESSION_KEY = "ticketHubSession";

// Demo admin login (a real website must check this on a secure server)
const ADMIN_EMAIL = "admin@tickethub.com";
const ADMIN_PASSWORD = "admin123";

const SEATS_PER_ROW = 8;
const MAX_SEATS_PER_BOOKING = 10;

const ICONS = { Movies: "🎬", Concerts: "🎵", Sports: "🏏", Theatre: "🎭" };

// Original event pictures (also used if a picture fails to load)
const DEFAULT_IMAGES = {
    Movies: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba",
    Concerts: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
    Sports: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e",
    Theatre: "https://images.unsplash.com/photo-1503095396549-807759245b35"
};

// The four events from the original website
function seedEvents() {
    return [
        {
            id: "ev1", name: "Galaxy Warriors", category: "Movies",
            date: "2026-11-25", time: "18:30", venue: "INOX Cinemas, Vijayawada",
            price: 250, totalSeats: 120, bookedSeats: [], rating: 4.5, discount: 0,
            image: DEFAULT_IMAGES.Movies,
            description: "An exciting science-fiction movie with amazing visual effects."
        },
        {
            id: "ev2", name: "Live Music Festival", category: "Concerts",
            date: "2026-11-28", time: "19:00", venue: "Music Arena, Hyderabad",
            price: 500, totalSeats: 250, bookedSeats: [], rating: 4.8, discount: 0,
            image: DEFAULT_IMAGES.Concerts,
            description: "Enjoy an unforgettable night of live music and entertainment."
        },
        {
            id: "ev3", name: "India vs Australia", category: "Sports",
            date: "2026-11-30", time: "19:30", venue: "Cricket Stadium, Hyderabad",
            price: 750, totalSeats: 500, bookedSeats: [], rating: 4.9, discount: 0,
            image: DEFAULT_IMAGES.Sports,
            description: "Watch an exciting cricket match live from the stadium."
        },
        {
            id: "ev4", name: "Drama Night", category: "Theatre",
            date: "2026-12-02", time: "18:00", venue: "City Theatre, Guntur",
            price: 350, totalSeats: 100, bookedSeats: [], rating: 4.6, discount: 0,
            image: DEFAULT_IMAGES.Theatre,
            description: "Experience a wonderful live drama performance."
        }
    ];
}


/* ================= STATE ================= */

let events = [];
let bookings = [];
let loginRole = "customer";
let currentUser = null;
let customerCategory = "All";
let customerSearch = "";
let adminCategory = "All";
let bookingState = null;
let editingId = null;


/* ================= STORAGE HELPERS ================= */

function readData(key, fallback) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return value === null || value === undefined ? fallback : value;
    } catch (error) {
        return fallback;
    }
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function loadAll() {
    events = readData(EVENTS_KEY, null);
    if (!events) {
        events = seedEvents();
        saveData(EVENTS_KEY, events);
    }
    bookings = readData(BOOKINGS_KEY, []);
}


/* ================= SMALL HELPERS ================= */

// Makes text safe to place inside HTML
function esc(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function money(amount) {
    return "₹" + Number(amount).toLocaleString("en-IN");
}

function finalPrice(ev) {
    return Math.round(ev.price * (100 - (ev.discount || 0)) / 100);
}

function availableSeats(ev) {
    return ev.totalSeats - ev.bookedSeats.length;
}

function findEvent(id) {
    return events.find(function (ev) { return ev.id === id; });
}

function formatDate(isoDate) {
    const d = new Date(isoDate + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatTime(time24) {
    const parts = time24.split(":");
    let hour = parseInt(parts[0], 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return hour + ":" + parts[1] + " " + suffix;
}

function rowName(row) {
    let name = "";
    row = row + 1;
    while (row > 0) {
        row = row - 1;
        name = String.fromCharCode(65 + (row % 26)) + name;
        row = Math.floor(row / 26);
    }
    return name;
}

function seatLabel(index) {
    return rowName(Math.floor(index / SEATS_PER_ROW)) + ((index % SEATS_PER_ROW) + 1);
}

function openModal(id) {
    document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

function markActiveCategory(barId, category) {
    document.querySelectorAll("#" + barId + " button").forEach(function (button) {
        button.classList.toggle("active", button.dataset.cat === category);
    });
}

function scrollToId(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: "smooth" });
    }
}

function showInfo(message) {
    alert(message);
}


/* ================= PAGE SWITCHING ================= */

function showOnly(pageId) {
    ["registerPage", "loginPage", "mainPage", "adminPage"].forEach(function (id) {
        document.getElementById(id).style.display = "none";
    });
    const isWebsite = pageId === "mainPage" || pageId === "adminPage";
    document.getElementById(pageId).style.display = isWebsite ? "block" : "flex";
    window.scrollTo(0, 0);
}


/* ================= LOGIN / REGISTRATION ================= */

function setLoginRole(role) {
    loginRole = role;
    const isAdmin = role === "admin";

    document.getElementById("customerTab").classList.toggle("active", !isAdmin);
    document.getElementById("adminTab").classList.toggle("active", isAdmin);
    document.getElementById("loginTitle").textContent = isAdmin ? "ADMIN LOGIN" : "CUSTOMER LOGIN";
    document.getElementById("adminHint").style.display = isAdmin ? "block" : "none";
    document.getElementById("registerBtn").style.display = isAdmin ? "none" : "block";
    document.getElementById("forgotLink").style.display = isAdmin ? "none" : "inline";
}

function showRegisterPage() {
    showOnly("registerPage");
    document.getElementById("registerEmail").value = "";
    document.getElementById("registerPassword").value = "";
    document.getElementById("confirmPassword").value = "";
}

function showLoginPage() {
    showOnly("loginPage");
    document.getElementById("loginEmail").value = "";
    document.getElementById("loginPassword").value = "";
    setLoginRole("customer");
}

function signUp() {
    showRegisterPage();
}

function registerUser(event) {
    event.preventDefault();

    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!email || !password || !confirmPassword) {
        alert("Please fill all registration fields.");
        return;
    }

    if (password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Password and Confirm Password do not match.");
        return;
    }

    if (email === ADMIN_EMAIL) {
        alert("This email cannot be used for a customer account.");
        return;
    }

    const users = readData(USERS_KEY, []);

    if (users.some(function (u) { return u.email === email; })) {
        alert("This email already has an account. Please login.");
        showLoginPage();
        return;
    }

    // Demo only: a real website must never store plain passwords
    users.push({ email: email, password: password });
    saveData(USERS_KEY, users);

    alert("Registration successful! Please login.");
    showLoginPage();
}

function loginUser(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const keep = document.getElementById("keepSignedIn").checked;

    if (loginRole === "admin") {
        if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
            alert("Incorrect admin email or password.");
            return;
        }
        saveSession("admin", email, keep);
        openAdmin();
        return;
    }

    const users = readData(USERS_KEY, []);

    if (users.length === 0) {
        alert("No account found. New customers must register first.");
        showRegisterPage();
        return;
    }

    const user = users.find(function (u) { return u.email === email && u.password === password; });

    if (!user) {
        alert("Incorrect email or password.");
        return;
    }

    saveSession("customer", email, keep);
    openCustomer(email);
}

function forgotPassword() {
    if (readData(USERS_KEY, []).length === 0) {
        alert("No account found. Please register first.");
        showRegisterPage();
        return;
    }
    alert("Please use the password you created during registration. (A real website would send a reset email.)");
}

function saveSession(role, email, keep) {
    const store = keep ? localStorage : sessionStorage;
    store.setItem(SESSION_KEY, JSON.stringify({ role: role, email: email }));
}

function getSession() {
    return readSession(sessionStorage) || readSession(localStorage);
}

function readSession(store) {
    try {
        return JSON.parse(store.getItem(SESSION_KEY));
    } catch (error) {
        return null;
    }
}

function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    currentUser = null;
    showLoginPage();
}


/* ================= CUSTOMER WEBSITE ================= */

function openCustomer(email) {
    currentUser = email;
    customerCategory = "All";
    customerSearch = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("welcomeText").textContent = "Welcome, " + email + ". Book your favourite events quickly and securely.";
    showOnly("mainPage");
    goHome();
}

function goHome() {
    document.getElementById("bookingsView").style.display = "none";
    document.getElementById("homeView").style.display = "block";
    renderCustomer();
    window.scrollTo(0, 0);
}

function scrollToEvents() {
    document.getElementById("homeView").style.display = "block";
    document.getElementById("bookingsView").style.display = "none";
    scrollToId("events");
}

function filterEvents(category) {
    customerCategory = category;
    customerSearch = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("bookingsView").style.display = "none";
    document.getElementById("homeView").style.display = "block";
    renderCustomer();
    scrollToId("events");
}

function searchEvents() {
    customerSearch = document.getElementById("searchInput").value.trim().toLowerCase();
    customerCategory = "All";
    document.getElementById("bookingsView").style.display = "none";
    document.getElementById("homeView").style.display = "block";
    renderCustomer();
    scrollToId("events");
}

function getCustomerEvents() {
    return events.filter(function (ev) {
        if (customerCategory !== "All" && ev.category !== customerCategory) {
            return false;
        }
        if (!customerSearch) {
            return true;
        }
        const text = (ev.name + " " + ev.category + " " + ev.venue + " " + ev.description).toLowerCase();
        return text.includes(customerSearch);
    });
}

function priceHtml(ev) {
    if (ev.discount > 0) {
        return "<strong>" + money(finalPrice(ev)) + "</strong>" +
            "<span class='old-price'>" + money(ev.price) + "</span>" +
            "<span class='offer-tag'>" + ev.discount + "% OFF</span>";
    }
    return "<strong>" + money(ev.price) + "</strong>";
}

function eventCardHtml(ev) {
    const left = availableSeats(ev);
    const soldOut = left <= 0;
    const rating = ev.rating ? "⭐ " + ev.rating : "⭐ New";
    const fallback = DEFAULT_IMAGES[ev.category] || DEFAULT_IMAGES.Movies;

    return "<div class='event-card' data-category='" + esc(ev.category) + "'>" +
        "<img src='" + esc(ev.image) + "' alt='" + esc(ev.name) + "' onerror=\"this.onerror=null;this.src='" + fallback + "'\">" +
        "<div class='event-content'>" +
        "<span class='category-name'>" + ICONS[ev.category] + " " + esc(ev.category) + "</span>" +
        "<h3>" + esc(ev.name) + "</h3>" +
        "<p>📅 " + formatDate(ev.date) + "</p>" +
        "<p>⏰ " + formatTime(ev.time) + "</p>" +
        "<p>📍 " + esc(ev.venue) + "</p>" +
        "<p>💺 " + (soldOut ? "Sold Out" : left + " Seats Available") + "</p>" +
        "<div class='price-rating'><div>" + priceHtml(ev) + "</div><span>" + rating + "</span></div>" +
        "<p>" + esc(ev.description) + "</p>" +
        "<button class='details-btn' onclick=\"viewDetails('" + ev.id + "')\">View Details</button>" +
        "<button class='book-btn' onclick=\"openBooking('" + ev.id + "')\"" + (soldOut ? " disabled" : "") + ">" +
        (soldOut ? "Sold Out" : "Book Now") + "</button>" +
        "</div></div>";
}

function renderCustomer() {
    markActiveCategory("customerCategoryBar", customerCategory);

    const list = getCustomerEvents();
    document.getElementById("eventContainer").innerHTML = list.map(eventCardHtml).join("");
    document.getElementById("noEvents").style.display = list.length === 0 ? "block" : "none";

    let heading = "Upcoming Events";
    if (customerSearch) {
        heading = "Search Results";
    } else if (customerCategory !== "All") {
        heading = customerCategory;
    }
    document.getElementById("eventsHeading").textContent = heading;

    renderPopular();

    if (document.getElementById("bookingsView").style.display !== "none") {
        renderMyBookings();
    }
}

// Popular events = most seats booked, then highest rating
function renderPopular() {
    const top = events.slice().sort(function (a, b) {
        return (b.bookedSeats.length - a.bookedSeats.length) || ((b.rating || 0) - (a.rating || 0));
    }).slice(0, 3);

    document.getElementById("popularContainer").innerHTML = top.map(function (ev) {
        return "<div class='popular-card'>" +
            "<h3>" + ICONS[ev.category] + " " + esc(ev.name) + "</h3>" +
            "<p>" + (ev.rating ? "⭐ " + ev.rating + " Rating" : "⭐ New Event") + "</p>" +
            "<p>Starting from " + money(finalPrice(ev)) + "</p>" +
            "</div>";
    }).join("");
}

function viewDetails(id) {
    const ev = findEvent(id);
    if (!ev) {
        return;
    }

    document.getElementById("detailName").textContent = ev.name;
    document.getElementById("detailCategory").textContent = ev.category;
    document.getElementById("detailDate").textContent = formatDate(ev.date);
    document.getElementById("detailTime").textContent = formatTime(ev.time);
    document.getElementById("detailVenue").textContent = ev.venue;
    document.getElementById("detailPrice").innerHTML = priceHtml(ev);
    document.getElementById("detailSeats").textContent = availableSeats(ev);
    document.getElementById("detailDescription").textContent = ev.description;

    const bookBtn = document.getElementById("detailBookBtn");
    bookBtn.disabled = availableSeats(ev) <= 0;
    bookBtn.onclick = function () {
        closeDetails();
        openBooking(id);
    };

    openModal("detailsModal");
}

function closeDetails() {
    closeModal("detailsModal");
}


/* ================= BOOKING: SEATS ================= */

function openBooking(id) {
    const ev = findEvent(id);
    if (!ev) {
        alert("This event is no longer available.");
        return;
    }
    if (availableSeats(ev) <= 0) {
        alert("Sorry, this event is sold out.");
        return;
    }

    bookingState = { eventId: id, seats: [] };

    document.getElementById("bookingEvent").textContent = ev.name;
    document.getElementById("bookingPrice").textContent = money(ev.price);
    document.getElementById("bookingFinalPrice").textContent = money(finalPrice(ev)) + " (" + ev.discount + "% OFF)";
    document.getElementById("discountRow").style.display = ev.discount > 0 ? "flex" : "none";

    let seatsHtml = "";
    for (let i = 0; i < ev.totalSeats; i++) {
        const label = seatLabel(i);
        const isBooked = ev.bookedSeats.includes(label);
        seatsHtml += "<button type='button' class='seat" + (isBooked ? " booked" : "") +
            "' data-seat='" + label + "'" + (isBooked ? " disabled" : "") + ">" + label + "</button>";
    }
    document.getElementById("seatMap").innerHTML = seatsHtml;

    updateBookingSummary();
    openModal("bookingModal");
}

function selectSeat(button) {
    if (!bookingState || button.classList.contains("booked")) {
        return;
    }

    const seat = button.dataset.seat;
    const index = bookingState.seats.indexOf(seat);

    if (index >= 0) {
        bookingState.seats.splice(index, 1);
        button.classList.remove("selected");
    } else {
        if (bookingState.seats.length >= MAX_SEATS_PER_BOOKING) {
            alert("You can select up to " + MAX_SEATS_PER_BOOKING + " seats per booking.");
            return;
        }
        bookingState.seats.push(seat);
        button.classList.add("selected");
    }

    updateBookingSummary();
}

function updateBookingSummary() {
    const ev = findEvent(bookingState.eventId);
    const count = bookingState.seats.length;

    document.getElementById("selectedSeats").textContent = count ? bookingState.seats.join(", ") : "None";
    document.getElementById("seatCount").textContent = count;
    document.getElementById("totalAmount").textContent = (count * finalPrice(ev)).toLocaleString("en-IN");
}

function closeBooking() {
    closeModal("bookingModal");
}


/* ================= CHECKOUT AND PAYMENT ================= */

function showPayment() {
    if (!bookingState || bookingState.seats.length === 0) {
        alert("Please select at least one seat.");
        return;
    }

    const ev = findEvent(bookingState.eventId);
    const count = bookingState.seats.length;
    const originalTotal = count * ev.price;
    const finalTotal = count * finalPrice(ev);

    let html = "<p><span>Event</span><span>" + esc(ev.name) + "</span></p>" +
        "<p><span>Seats</span><span>" + bookingState.seats.join(", ") + "</span></p>" +
        "<p><span>Tickets</span><span>" + count + " × " + money(ev.price) + "</span></p>";

    if (ev.discount > 0) {
        html += "<p><span>Original Total</span><span>" + money(originalTotal) + "</span></p>" +
            "<p><span>Promotion (" + ev.discount + "% OFF)</span><span>- " + money(originalTotal - finalTotal) + "</span></p>";
    }

    html += "<p class='total-line'><span>Final Payable Amount</span><span>" + money(finalTotal) + "</span></p>";

    document.getElementById("checkoutSummary").innerHTML = html;
    closeBooking();
    openModal("paymentModal");
}

function closePayment() {
    closeModal("paymentModal");
}

function newBookingId() {
    let id;
    do {
        id = "TH" + Date.now().toString(36).toUpperCase() +
            Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0");
    } while (bookings.some(function (b) { return b.id === id; }));
    return id;
}

function makePayment() {
    if (!bookingState || bookingState.seats.length === 0) {
        return;
    }

    // Reload the latest saved data, in case seats changed in another tab
    events = readData(EVENTS_KEY, events);
    bookings = readData(BOOKINGS_KEY, bookings);

    const ev = findEvent(bookingState.eventId);

    if (!ev) {
        alert("Sorry, this event is no longer available.");
        closePayment();
        renderCustomer();
        return;
    }

    const clash = bookingState.seats.filter(function (seat) { return ev.bookedSeats.includes(seat); });

    if (clash.length > 0) {
        alert("Seat(s) " + clash.join(", ") + " were just booked. Please choose different seats.");
        closePayment();
        openBooking(ev.id);
        return;
    }

    const seats = bookingState.seats.slice();
    const unit = finalPrice(ev);

    const booking = {
        id: newBookingId(),
        email: currentUser,
        eventId: ev.id,
        eventName: ev.name,
        category: ev.category,
        date: ev.date,
        time: ev.time,
        venue: ev.venue,
        seats: seats,
        quantity: seats.length,
        originalPrice: ev.price,
        discount: ev.discount || 0,
        unitPrice: unit,
        amount: unit * seats.length,
        paymentMethod: document.getElementById("paymentMethod").value,
        status: "Confirmed",
        bookedOn: new Date().toISOString()
    };

    ev.bookedSeats = ev.bookedSeats.concat(seats);
    bookings.push(booking);
    saveData(EVENTS_KEY, events);
    saveData(BOOKINGS_KEY, bookings);

    bookingState = null;
    closePayment();
    renderCustomer();
    showTicket(booking.id);
}


/* ================= DIGITAL TICKET / MY BOOKINGS ================= */

function showTicket(bookingId) {
    const b = bookings.find(function (item) { return item.id === bookingId; });
    if (!b) {
        return;
    }

    document.getElementById("ticketEvent").textContent = b.eventName;
    document.getElementById("ticketWhen").textContent = "📅 " + formatDate(b.date) + "   ⏰ " + formatTime(b.time);
    document.getElementById("ticketVenue").textContent = "📍 " + b.venue;
    document.getElementById("bookingId").textContent = b.id;
    document.getElementById("ticketSeats").textContent = b.seats.join(", ");
    document.getElementById("ticketAmount").textContent = b.amount.toLocaleString("en-IN");

    openModal("ticketModal");
}

function closeTicket() {
    closeModal("ticketModal");
}

function printTicket() {
    window.print();
}

function printBooking(bookingId) {
    showTicket(bookingId);
    setTimeout(printTicket, 200);
}

function showBookings() {
    document.getElementById("homeView").style.display = "none";
    document.getElementById("bookingsView").style.display = "block";
    renderMyBookings();
    window.scrollTo(0, 0);
}

function renderMyBookings() {
    const mine = bookings.filter(function (b) { return b.email === currentUser; }).reverse();

    document.getElementById("myBookingsBody").innerHTML = mine.map(function (b) {
        return "<tr>" +
            "<td>" + b.id + "</td>" +
            "<td>" + esc(b.eventName) + "</td>" +
            "<td>" + formatDate(b.date) + "<br>" + formatTime(b.time) + "</td>" +
            "<td>" + b.seats.join(", ") + "</td>" +
            "<td>" + money(b.amount) + "</td>" +
            "<td><span class='status'>" + b.status + "</span></td>" +
            "<td>" +
            "<button class='small-btn light' onclick=\"showTicket('" + b.id + "')\">View Ticket</button>" +
            "<button class='small-btn' onclick=\"printBooking('" + b.id + "')\">Print</button>" +
            "</td></tr>";
    }).join("");

    document.getElementById("noMyBookings").style.display = mine.length === 0 ? "block" : "none";
}


/* ================= ADMIN DASHBOARD ================= */

function openAdmin() {
    adminCategory = "All";
    showOnly("adminPage");
    renderAdmin();
}

function adminFilter(category) {
    adminCategory = category;
    renderAdmin();
    scrollToId("adminEvents");
}

function renderAdmin() {
    markActiveCategory("adminCategoryBar", adminCategory);
    renderAdminStats();
    renderAdminEvents();
    renderAdminBookings();
    renderAdminSales();
    renderAdminCollections();
}

function matchesAdminCategory(category) {
    return adminCategory === "All" || category === adminCategory;
}

function sumOf(list, field) {
    return list.reduce(function (total, item) { return total + item[field]; }, 0);
}

function renderAdminStats() {
    document.getElementById("statEvents").textContent = events.length;
    document.getElementById("statBookings").textContent = bookings.length;
    document.getElementById("statTickets").textContent = sumOf(bookings, "quantity");
    document.getElementById("statAmount").textContent = money(sumOf(bookings, "amount"));
}

function renderAdminEvents() {
    const list = events.filter(function (ev) { return matchesAdminCategory(ev.category); });

    document.getElementById("adminFilterNote").textContent =
        "Showing: " + adminCategory + " (" + list.length + " event" + (list.length === 1 ? "" : "s") + ")";

    let html = list.map(function (ev) {
        const fallback = DEFAULT_IMAGES[ev.category];
        return "<tr>" +
            "<td><img class='thumb' src='" + esc(ev.image) + "' alt='' onerror=\"this.onerror=null;this.src='" + fallback + "'\"></td>" +
            "<td>" + esc(ev.name) + "</td>" +
            "<td>" + ICONS[ev.category] + " " + esc(ev.category) + "</td>" +
            "<td>" + formatDate(ev.date) + "<br>" + formatTime(ev.time) + "</td>" +
            "<td>" + esc(ev.venue) + "</td>" +
            "<td>" + priceHtml(ev) + "</td>" +
            "<td>" + availableSeats(ev) + " / " + ev.totalSeats + "</td>" +
            "<td>" +
            "<button class='small-btn light' onclick=\"openEventForm('" + ev.id + "')\">Edit</button>" +
            "<button class='small-btn danger' onclick=\"deleteEvent('" + ev.id + "')\">Delete</button>" +
            "</td></tr>";
    }).join("");

    if (list.length === 0) {
        html = "<tr><td colspan='8'>No events in this category.</td></tr>";
    }
    document.getElementById("adminEventsBody").innerHTML = html;
}

function renderAdminBookings() {
    const list = bookings.filter(function (b) { return matchesAdminCategory(b.category); }).reverse();

    let html = list.map(function (b) {
        return "<tr>" +
            "<td>" + b.id + "</td>" +
            "<td>" + esc(b.email) + "</td>" +
            "<td>" + esc(b.eventName) + "</td>" +
            "<td>" + b.seats.join(", ") + "</td>" +
            "<td>" + b.quantity + "</td>" +
            "<td>" + money(b.amount) + "</td>" +
            "<td><span class='status'>" + b.status + "</span><br><small>Payment not verified</small></td>" +
            "<td>" + new Date(b.bookedOn).toLocaleString("en-IN") + "</td>" +
            "</tr>";
    }).join("");

    if (list.length === 0) {
        html = "<tr><td colspan='8'>No bookings yet.</td></tr>";
    }
    document.getElementById("adminBookingsBody").innerHTML = html;
}

function renderAdminSales() {
    const list = events.filter(function (ev) { return matchesAdminCategory(ev.category); });

    let html = list.map(function (ev) {
        const eventBookings = bookings.filter(function (b) { return b.eventId === ev.id; });
        return "<tr>" +
            "<td>" + esc(ev.name) + "</td>" +
            "<td>" + esc(ev.category) + "</td>" +
            "<td>" + ev.totalSeats + "</td>" +
            "<td>" + ev.bookedSeats.length + "</td>" +
            "<td>" + availableSeats(ev) + "</td>" +
            "<td>" + money(sumOf(eventBookings, "amount")) + "</td>" +
            "</tr>";
    }).join("");

    if (list.length === 0) {
        html = "<tr><td colspan='6'>No events in this category.</td></tr>";
    }
    document.getElementById("adminSalesBody").innerHTML = html;
}

function renderAdminCollections() {
    let html = "";

    Object.keys(ICONS).forEach(function (category) {
        const list = bookings.filter(function (b) { return b.category === category; });
        html += "<tr><td>" + ICONS[category] + " " + category + "</td>" +
            "<td>" + list.length + "</td>" +
            "<td>" + sumOf(list, "quantity") + "</td>" +
            "<td>" + money(sumOf(list, "amount")) + "</td></tr>";
    });

    html += "<tr><td><strong>Total</strong></td>" +
        "<td><strong>" + bookings.length + "</strong></td>" +
        "<td><strong>" + sumOf(bookings, "quantity") + "</strong></td>" +
        "<td><strong>" + money(sumOf(bookings, "amount")) + "</strong></td></tr>";

    document.getElementById("adminCollectionBody").innerHTML = html;
}


/* ================= ADMIN: ADD / EDIT / DELETE EVENTS ================= */

function openEventForm(id) {
    editingId = id || null;
    const ev = id ? findEvent(id) : null;

    document.getElementById("formTitle").textContent = ev ? "Edit Event" : "Add New Event";
    document.getElementById("eventName").value = ev ? ev.name : "";
    document.getElementById("eventCategory").value = ev ? ev.category : "";
    document.getElementById("eventDate").value = ev ? ev.date : "";
    document.getElementById("eventTime").value = ev ? ev.time : "";
    document.getElementById("eventVenue").value = ev ? ev.venue : "";
    document.getElementById("eventPrice").value = ev ? ev.price : "";
    document.getElementById("eventSeats").value = ev ? ev.totalSeats : "";
    document.getElementById("eventImage").value = ev ? ev.image : "";
    document.getElementById("eventDescription").value = ev ? ev.description : "";
    document.getElementById("eventDiscount").value = ev ? ev.discount : 0;

    showFormError("");
    openModal("eventFormModal");
}

function closeEventForm() {
    closeModal("eventFormModal");
    editingId = null;
}

function showFormError(message) {
    const box = document.getElementById("formError");
    box.textContent = message;
    box.style.display = message ? "block" : "none";
}

function isValidUrl(text) {
    try {
        const url = new URL(text);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (error) {
        return false;
    }
}

function saveEvent(event) {
    event.preventDefault();

    const name = document.getElementById("eventName").value.trim();
    const category = document.getElementById("eventCategory").value;
    const date = document.getElementById("eventDate").value;
    const time = document.getElementById("eventTime").value;
    const venue = document.getElementById("eventVenue").value.trim();
    const price = Number(document.getElementById("eventPrice").value);
    const seats = Number(document.getElementById("eventSeats").value);
    const image = document.getElementById("eventImage").value.trim();
    const description = document.getElementById("eventDescription").value.trim();
    const discountText = document.getElementById("eventDiscount").value.trim();
    const discount = discountText === "" ? 0 : Number(discountText);

    const existing = editingId ? findEvent(editingId) : null;
    const alreadyBooked = existing ? existing.bookedSeats.length : 0;

    if (name.length < 2) { return showFormError("Please enter the event name."); }
    if (!ICONS[category]) { return showFormError("Please select an event category."); }
    if (!date) { return showFormError("Please select the event date."); }
    if (!time) { return showFormError("Please select the event time."); }
    if (venue.length < 2) { return showFormError("Please enter the venue."); }
    if (!(price > 0)) { return showFormError("Ticket price must be more than 0."); }
    if (!Number.isInteger(seats) || seats < 1 || seats > 2000) { return showFormError("Seats must be a whole number from 1 to 2000."); }
    if (seats < alreadyBooked) { return showFormError("This event already has " + alreadyBooked + " booked seats. Seats cannot be fewer than that."); }
    if (!isValidUrl(image)) { return showFormError("Please enter a valid image URL starting with http:// or https://"); }
    if (description.length < 5) { return showFormError("Please enter the event description."); }
    if (!Number.isInteger(discount) || discount < 0 || discount > 90) { return showFormError("Discount must be a whole number from 0 to 90."); }

    if (existing) {
        existing.name = name;
        existing.category = category;
        existing.date = date;
        existing.time = time;
        existing.venue = venue;
        existing.price = price;
        existing.totalSeats = seats;
        existing.image = image;
        existing.description = description;
        existing.discount = discount;
    } else {
        events.push({
            id: "ev" + Date.now() + Math.floor(Math.random() * 1000),
            name: name, category: category, date: date, time: time, venue: venue,
            price: price, totalSeats: seats, bookedSeats: [], rating: 0,
            discount: discount, image: image, description: description
        });
    }

    saveData(EVENTS_KEY, events);
    closeEventForm();
    renderAdmin();
}

function deleteEvent(id) {
    const ev = findEvent(id);
    if (!ev) {
        return;
    }

    const count = bookings.filter(function (b) { return b.eventId === id; }).length;
    let message = "Delete \"" + ev.name + "\"? It will disappear from the customer website.";
    if (count > 0) {
        message += "\n\nIt has " + count + " booking(s). Those booking records will be kept.";
    }

    if (!confirm(message)) {
        return;
    }

    events = events.filter(function (item) { return item.id !== id; });
    saveData(EVENTS_KEY, events);
    renderAdmin();
}

function resetDemoData() {
    if (!confirm("Reset all events and bookings to the original demo data? Customer accounts are kept.")) {
        return;
    }
    localStorage.removeItem(EVENTS_KEY);
    localStorage.removeItem(BOOKINGS_KEY);
    loadAll();
    renderAdmin();
}


/* ================= START UP ================= */

// Seat clicks (one listener for the whole seat map)
document.getElementById("seatMap").addEventListener("click", function (e) {
    const button = e.target.closest(".seat");
    if (button) {
        selectSeat(button);
    }
});

// Press Enter in the search box
document.getElementById("searchInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        searchEvents();
    }
});

// If another browser tab changes the data, refresh this page (real-time availability in the demo)
window.addEventListener("storage", function (e) {
    if (e.key !== EVENTS_KEY && e.key !== BOOKINGS_KEY) {
        return;
    }
    loadAll();
    const session = getSession();
    if (session && session.role === "admin") {
        renderAdmin();
    } else if (session && session.role === "customer") {
        renderCustomer();
    }
});

loadAll();

(function restoreSession() {
    const session = getSession();
    if (session && session.role === "admin") {
        openAdmin();
    } else if (session && session.role === "customer") {
        openCustomer(session.email);
    } else {
        showLoginPage();
    }
})();
