/* ═══════════════════════════════════════════
   TENNISPRO ACADEMY — script.js (FINAL & FIREBASE)
   ═══════════════════════════════════════════ */

/* ════════════════════════════════
   STATE & ARRAYS
════════════════════════════════ */
let booking = {
  date: null,
  time: null,
  coach: null,
  court: null,
  payment: null,
};

let isLoggedIn = false; 
let myBookings = []; 

let calYear  = 2026;
let calMonth = 4; // Mei (0-indexed)

const monthNames = [
  'JANUARI','FEBRUARI','MARET','APRIL','MEI','JUNI',
  'JULI','AGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DESEMBER'
];
const dayLabels = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

/* ════════════════════════════════
   SMOOTH SCROLL
════════════════════════════════ */
function scrollToSection(id) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section.style.transition = 'box-shadow 0.5s ease';
    section.style.boxShadow = '0 0 40px rgba(232, 25, 46, 0.2)';
    setTimeout(() => { section.style.boxShadow = 'none'; }, 1500);
  }
}

/* ════════════════════════════════
   DYNAMIC NAVBAR & AUTHENTICATION
════════════════════════════════ */
function updateNavbar() {
  const navAuth = document.getElementById('navAuth');
  if (!navAuth) return;

  if (isLoggedIn) {
    navAuth.innerHTML = `<button class="btn-logout" onclick="handleLogout()">Keluar</button>`;
  } else {
    navAuth.innerHTML = `
      <button class="btn-ghost" onclick="openModal('login')">Masuk</button>
      <button class="btn-red"   onclick="openModal('register')">Daftar</button>
    `;
  }
}

function handleLogin() {
  isLoggedIn = true;
  updateNavbar();
  closeModal();
  showToast('🎾 Selamat Datang Kembali!', 'Login berhasil. Silakan lakukan booking latihan!');
  
  // Tarik data dari Firebase saat berhasil login
  fetchMyBookingsFromCloud();
}

function handleRegister() {
  isLoggedIn = true;
  updateNavbar();
  closeModal();
  showToast('✅ Akun Berhasil Dibuat!', 'Selamat bergabung! Kamu otomatis masuk ke sistem.');
  
  // Tarik data dari Firebase saat berhasil daftar
  fetchMyBookingsFromCloud();
}

function handleLogout() {
  isLoggedIn = false;
  updateNavbar();
  
  booking = { date: null, time: null, coach: null, court: null, payment: null };
  updateSummary();
  
  // Kosongkan layar jadwal saat logout biar aman
  myBookings = [];
  renderMyBookings();
  
  document.querySelectorAll('.cal-day.selected, .time-slot.selected, .court-opt.selected, .pay-btn.selected')
          .forEach(e => e.classList.remove('selected'));

  showToast('🔒 Sesi Berakhir', 'Kamu telah keluar. Silakan login kembali untuk booking.');
  setTimeout(() => { openModal('login'); }, 1000);
}

/* ════════════════════════════════
   FIREBASE: DATA FETCHING & RENDERING
════════════════════════════════ */
function renderMyBookings() {
  const container = document.getElementById('schedulesContainer');
  if (!container) return;

  if (myBookings.length === 0) {
    container.innerHTML = `
      <div class="no-booking-card">
        <p>Belum ada jadwal latihan aktif. Silakan lakukan pengisian formulir booking di atas.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = myBookings.map(b => `
    <div class="schedule-card">
      <div class="schedule-header">
        <span class="schedule-id">${b.id}</span>
        <span class="schedule-status status-pending">${b.status}</span>
      </div>
      <div class="schedule-body">
        <div class="schedule-item">
          <span class="schedule-label">Tanggal:</span>
          <span class="schedule-value">${b.date}</span>
        </div>
        <div class="schedule-item">
          <span class="schedule-label">Sesi Waktu:</span>
          <span class="schedule-value highlight">${b.time} WIB</span>
        </div>
        <div class="schedule-item">
          <span class="schedule-label">Coach:</span>
          <span class="schedule-value">${b.coach}</span>
        </div>
        <div class="schedule-item">
          <span class="schedule-label">Lapangan:</span>
          <span class="schedule-value">${b.court}</span>
        </div>
        <div class="schedule-item">
          <span class="schedule-label">Metode Pembayaran:</span>
          <span class="schedule-value" style="color:var(--gold); font-size:0.85rem">${b.payment}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function fetchMyBookingsFromCloud() {
  // Cek apakah script Firebase dari HTML sudah terbaca
  if (!window.db) {
    console.warn("Firebase belum terkoneksi. Jadwal hanya akan tersimpan lokal.");
    return;
  }
  
  const container = document.getElementById('schedulesContainer');
  const q = window.query(window.collection(window.db, "bookings"), window.orderBy("timestamp", "desc"));
  
  // onSnapshot: Otomatis memantau database, kalau ada data baru layar langsung ke-update
  window.onSnapshot(q, (snapshot) => {
    myBookings = [];
    snapshot.forEach((doc) => {
      myBookings.push(doc.data());
    });
    renderMyBookings();
  });
}

/* ════════════════════════════════
   CALENDAR WORKFLOW
════════════════════════════════ */
function renderCalendar() {
  const grid = document.getElementById('calGrid');
  if (!grid) return;
  document.getElementById('calMonth').textContent = monthNames[calMonth] + ' ' + calYear;
  grid.innerHTML = '';

  dayLabels.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-label';
    el.textContent = d;
    grid.appendChild(el);
  });

  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const totalDays      = new Date(calYear, calMonth + 1, 0).getDate();
  const today          = new Date();

  for (let i = 0; i < firstDayOfWeek; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= totalDays; d++) {
    const el   = document.createElement('div');
    const date = new Date(calYear, calMonth, d);
    const dow  = date.getDay();

    const isWeekend = dow === 0 || dow === 6;
    const isPast    = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday   = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();

    el.textContent = d;
    el.className   = 'cal-day ' +
      (isWeekend ? (isPast ? 'weekend past' : 'weekend') : 'weekday') +
      (isToday ? ' today' : '');

    if (isWeekend && !isPast) {
      el.onclick = () => {
        if (!isLoggedIn) {
          showToast('🔒 Akses Ditolak', 'Harap login terlebih dahulu sebelum memilih jadwal.');
          openModal('login');
          return;
        }
        selectDate(el, calYear, calMonth, d, dow);
      };
    }
    grid.appendChild(el);
  }
}

function prevMonth() { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); }
function nextMonth() { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); }

/* ════════════════════════════════
   SELECTORS & SUMMARY
════════════════════════════════ */
function selectDate(el, y, m, d, dow) {
  document.querySelectorAll('.cal-day.selected').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  const dayName = dow === 6 ? 'Sabtu' : 'Minggu';
  booking.date  = `${dayName}, ${d} ${monthNames[m]} ${y}`;
  updateSummary();
}

function selectTime(el, time) {
  if (!isLoggedIn) { openModal('login'); return; }
  document.querySelectorAll('.time-slot.selected').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  booking.time = time;
  updateSummary();
}

function selectCoach(el, name) {
  if (!isLoggedIn) { openModal('login'); return; }
  el.closest('.court-select').querySelectorAll('.court-opt.selected').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  booking.coach = name;
  updateSummary();
}

function selectCourt(el, name) {
  if (!isLoggedIn) { openModal('login'); return; }
  el.closest('.court-select').querySelectorAll('.court-opt.selected').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  booking.court = name;
  updateSummary();
}

function selectPay(el, name) {
  if (!isLoggedIn) { openModal('login'); return; }
  document.querySelectorAll('.pay-btn.selected').forEach(e => e.classList.remove('selected'));
  el.classList.add('selected');
  booking.payment = name;
  updateSummary();
}

function updateSummary() {
  document.getElementById('sumDate').textContent  = booking.date    || '—';
  document.getElementById('sumTime').textContent  = booking.time    ? booking.time + ' WIB' : '—';
  document.getElementById('sumCoach').textContent = booking.coach   || '—';
  document.getElementById('sumCourt').textContent = booking.court   || '—';
  document.getElementById('sumPay').textContent   = booking.payment || '—';
}

function confirmBooking() {
  if (!isLoggedIn) { openModal('login'); return; }
  if (!booking.date) return showToast('⚠️ Pilih Tanggal', 'Silakan pilih tanggal weekend terlebih dahulu.');
  if (!booking.time) return showToast('⚠️ Pilih Waktu', 'Silakan pilih slot waktu.');
  if (!booking.coach) return showToast('⚠️ Pilih Coach', 'Silakan pilih coach kamu.');
  if (!booking.court) return showToast('⚠️ Pilih Lapangan', 'Silakan pilih lapangan.');
  if (!booking.payment) return showToast('⚠️ Pilih Pembayaran', 'Silakan pilih metode pembayaran.');

  openPaymentModal();
}

function openBookingFor(coach) {
  if (!isLoggedIn) { openModal('login'); return; }
  scrollToSection('booking');
  setTimeout(() => {
    document.querySelectorAll('.court-opt').forEach(el => {
      if (el.textContent.includes(coach)) selectCoach(el, coach);
    });
  }, 800);
}

/* ════════════════════════════════
   AUTH WINDOW CORE
════════════════════════════════ */
function openModal(tab) {
  document.getElementById('authModal').classList.add('open');
  switchTab(tab);
}

function closeModal() {
  if (!isLoggedIn) {
    showToast('⚠️ Wajib Login', 'Anda harus masuk akun terlebih dahulu untuk melihat isi website.');
    return; 
  }
  document.getElementById('authModal').classList.remove('open');
}

function switchTab(tab) {
  document.getElementById('formLogin').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('formRegister').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tabLogin').classList.toggle('active',    tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('modalTitle').textContent = tab === 'login' ? 'Masuk' : 'Buat Akun';
}

document.getElementById('authModal').addEventListener('click', e => {
  if (e.target === e.currentTarget && isLoggedIn) closeModal();
});

/* ════════════════════════════════
   TOAST NOTIFICATION
════════════════════════════════ */
function showToast(title, sub) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastSub').textContent   = sub;
  toast.classList.add('show');
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ════════════════════════════════
   PAYMENT WORKFLOW (FINAL)
════════════════════════════════ */
function openPaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.classList.add('open');
    document.getElementById('payMethodName').textContent = booking.payment || 'QRIS';
  }
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) modal.classList.remove('open');
}

// FUNGSI INI AKAN MENGIRIM DATA LANGSUNG KE FIREBASE
async function finishPayment() {
  const proof = document.getElementById('paymentProof');
  if (!proof || proof.files.length === 0) {
    showToast('⚠️ Upload Bukti', 'Silakan upload bukti pembayaran terlebih dahulu.');
    return;
  }

  showToast('⏳ Memproses', 'Sedang mengirim data ke server...');
  const bookingId = 'TP-2026' + Math.floor(1000 + Math.random() * 9000);
  
  try {
    if (window.db) {
      // 1. Jika terhubung Firebase, tembak data ke Firestore
      await window.addDoc(window.collection(window.db, "bookings"), {
        id: bookingId,
        date: booking.date,
        time: booking.time,
        coach: booking.coach,
        court: booking.court,
        payment: booking.payment,
        status: 'Menunggu Verifikasi',
        timestamp: new Date()
      });
    } else {
      // 2. Jika Firebase gagal diload, simpan ke memori lokal sementara (fallback)
      myBookings.push({
        id: bookingId, date: booking.date, time: booking.time, coach: booking.coach, court: booking.court, payment: booking.payment, status: 'Menunggu Verifikasi'
      });
      renderMyBookings();
    }

    closePaymentModal();
    showToast('✅ Pembayaran Berhasil', 'Data booking sukses masuk ke database!');
    
    // Reset Form Inputan
    proof.value = '';
    document.getElementById('proofPreview').style.display = 'none';

    booking = { date: null, time: null, coach: null, court: null, payment: null };
    updateSummary();

    // Hapus tanda aktif merah di kalender dan tombol
    document.querySelectorAll('.cal-day.selected, .time-slot.selected, .court-opt.selected, .pay-btn.selected')
            .forEach(e => e.classList.remove('selected'));

    // Otomatis scroll ke bagian Jadwal Saya
    setTimeout(() => {
      scrollToSection('my-schedules');
    }, 400);

  } catch (error) {
    console.error("Error nambah dokumen: ", error);
    showToast('❌ Gagal', 'Terjadi kesalahan jaringan saat mengirim data. Coba lagi.');
  }
}

// Tutup modal bayar saat klik luar area hitam
if (document.getElementById('paymentModal')) {
  document.getElementById('paymentModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closePaymentModal();
  });
}

// Preview gambar QRIS setelah diupload
const paymentProofInput = document.getElementById('paymentProof');
if (paymentProofInput) {
  paymentProofInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const imageURL = URL.createObjectURL(file);
    const proofImage = document.getElementById('proofImage');
    const proofPreview = document.getElementById('proofPreview');
    if (proofImage && proofPreview) {
      proofImage.src = imageURL;
      proofPreview.style.display = 'block';
    }
  });
}

// Scroll reveal observer
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ════════════════════════════════
   INITIALIZATION ON LOAD
════════════════════════════════ */
renderCalendar();
updateNavbar();
renderMyBookings();

// Pemasangan sistem Force Login di awal
window.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn) openModal('login');
});