import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiRequest } from './api';
import { Swiper, SwiperSlide } from 'swiper/react';
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectCoverflow,
  EffectFade,
} from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';
import 'swiper/css/effect-fade';

// ============================================================================
// CONSTANTS & DATA
// ============================================================================

const PACKAGE_TYPES = [
  'Hill Station',
  'Premium Beach',
  'Spiritual / Hill',
  'Nature Relax',
  'Lake City',
  'Other',
];

const FEATURES = [
  {
    title: 'Itineraries built around you',
    desc: 'Tell us your dates, group size and budget. We plan the trip to fit.',
  },
  {
    title: 'Clear pricing',
    desc: 'The price you see covers what is listed. No surprise charges later.',
  },
  {
    title: 'Support during your trip',
    desc: 'Reach us any time while you travel, day or night.',
  },
];

// Optional: put the agency's WhatsApp number here with country code, digits only
// (example: '919876543210'). If set, the inquiry form also opens WhatsApp.
const WHATSAPP_NUMBER = '';

// Optional: phone number with country code, digits only (example: '919876543210').
// Used by the Call button in the mobile contact bar.
const PHONE_NUMBER = '';

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

const inputCls =
  'w-full rounded-xl bg-slate-950 border border-white/15 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition';

// ============================================================================
// SMALL HELPERS
// ============================================================================

// Shows an image, or a fallback if the file is missing / fails to load.
function SafeImage({ src, alt, className, fallback, eager = false }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return fallback ?? null;
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  );
}

function getPackagePhoto(pkg) {
  return pkg.img?.startsWith('/images/') ? '' : pkg.img;
}

function scrollToInquiry() {
  setTimeout(() => {
    document
      .getElementById('inquiry-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  }, 0);
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState('');

  useEffect(() => {
    apiRequest('/api/packages')
      .then(setPackages)
      .catch((error) => setPackagesError(error.message))
      .finally(() => setPackagesLoading(false));
  }, []);

  const addPackage = async (newPkg) => {
    const body = new FormData();
    Object.entries(newPkg).forEach(([key, value]) => {
      if (value !== undefined && value !== null) body.append(key, value);
    });
    const created = await apiRequest('/api/packages', { method: 'POST', body });
    setPackages((prev) => [...prev, created]);
  };

  const updatePackage = async (id, updates) => {
    const body = new FormData();
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) body.append(key, value);
    });
    const updated = await apiRequest(`/api/packages/${id}`, { method: 'PUT', body });
    setPackages((prev) => prev.map((pkg) => (pkg.id === id ? updated : pkg)));
  };

  const deletePackage = async (id) => {
    await apiRequest(`/api/packages/${id}`, { method: 'DELETE' });
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <CustomerView
              packages={packages}
              packagesLoading={packagesLoading}
              packagesError={packagesError}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminPortal
              packages={packages}
              onAdd={addPackage}
              onUpdate={updatePackage}
              onDelete={deletePackage}
            />
          }
        />
      </Routes>
    </Router>
  );
}

// ============================================================================
// CUSTOMER VIEW
// ============================================================================

function CustomerView({ packages, packagesLoading, packagesError }) {
  const [search, setSearch] = useState('');
  const [maxBudget, setMaxBudget] = useState(null);
  const [selectedPkg, setSelectedPkg] = useState('');
  const budgetLimit = useMemo(
    () =>
      Math.max(
        25000,
        Math.ceil(
          packages.reduce((highest, pkg) => Math.max(highest, Number(pkg.budget) || 0), 0) /
            500
        ) * 500
      ),
    [packages]
  );
  const selectedMaxBudget = maxBudget ?? budgetLimit;

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages.filter((pkg) => {
      const matchesSearch =
        !q ||
        pkg.name.toLowerCase().includes(q) ||
        pkg.destination.toLowerCase().includes(q) ||
        pkg.type.toLowerCase().includes(q) ||
        pkg.highlights.toLowerCase().includes(q);
      return matchesSearch && pkg.budget <= selectedMaxBudget;
    });
  }, [search, selectedMaxBudget, packages]);

  const handleSelect = (name) => {
    setSelectedPkg(name);
    scrollToInquiry();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <Header />
      <HeroSection packages={packages} onSelectPackage={handleSelect} />
      <SearchFilters
        search={search}
        onSearchChange={setSearch}
        maxBudget={selectedMaxBudget}
        budgetLimit={budgetLimit}
        onBudgetChange={setMaxBudget}
      />
      {packagesError && (
        <p role="alert" className="px-6 text-center text-red-300">
          Could not load travel packages: {packagesError}
        </p>
      )}
      {packagesLoading && (
        <p role="status" className="px-6 text-center text-slate-400">
          Loading travel packages...
        </p>
      )}
      <PackageCarousel
        filteredPackages={filteredPackages}
        onSelectPackage={handleSelect}
      />
      <WhyChooseUs />
      <InquiryForm selectedPkg={selectedPkg} packages={packages} />
      <Footer />
      <MobileContactBar />
    </div>
  );
}

// ============================================================================
// HEADER
// ============================================================================

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <Link to="/" className="leading-tight flex items-center gap-3">
          <img src="/images/logo.png" alt="" className="h-10 w-10 object-contain" />
          <span className="block text-xl font-extrabold tracking-tight">
            Leekha Travels
          </span>
          <span className="block text-xs text-slate-400">
            Explore. Experience. Escape.
          </span>
        </Link>
        <Link
          to="/admin"
          className="text-sm font-semibold px-5 py-2 rounded-full border border-white/20 hover:bg-white/10 transition"
        >
          Admin
        </Link>
      </div>
    </header>
  );
}

// ============================================================================
// HERO CAROUSEL
// ============================================================================

function HeroSection({ packages, onSelectPackage }) {
  if (packages.length === 0) {
    return (
      <section className="min-h-[480px] h-[75svh] bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950 flex items-end">
        <div className="max-w-7xl mx-auto w-full px-6 pb-16 sm:pb-24">
          <p className="text-cyan-300 font-semibold mb-2">Leekha Travels</p>
          <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-4">
            Find your next getaway
          </h2>
          <a
            href="#packages"
            className="inline-block px-7 py-3 rounded-full border border-white/40 hover:bg-white/10 text-white font-semibold transition"
          >
            View packages
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination, Navigation]}
        effect="fade"
        loop={packages.length > 1}
        speed={1000}
        autoplay={packages.length > 1 ? { delay: 5500, disableOnInteraction: false } : false}
        pagination={{ clickable: true }}
        navigation
        className="h-[75svh] min-h-[480px]"
      >
        {packages.map((pkg, i) => (
          <SwiperSlide key={pkg.id}>
            <SafeImage
              src={getPackagePhoto(pkg)}
              alt={pkg.destination}
              eager={i === 0}
              className="absolute inset-0 w-full h-full object-cover"
              fallback={
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950" />
              }
            />
            {/* dark gradient keeps the text readable on any photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />

            <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-16 sm:pb-24">
              <p className="text-cyan-300 font-semibold mb-2">{pkg.type}</p>
              <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-4">
                {pkg.destination}
              </h2>
              <p className="text-slate-200 text-lg max-w-xl mb-8">
                {pkg.highlights || `${pkg.days} · ${pkg.name}`}
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onSelectPackage(pkg.name)}
                  className="px-7 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-white font-semibold shadow-lg shadow-orange-500/30 transition"
                >
                  Inquire now
                </button>
                <a
                  href="#packages"
                  className="px-7 py-3 rounded-full border border-white/40 hover:bg-white/10 text-white font-semibold transition"
                >
                  View packages
                </a>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

function SearchFilters({ search, onSearchChange, maxBudget, budgetLimit, onBudgetChange }) {
  return (
    <section className="px-6 -mt-10 relative z-20">
      <div className="max-w-6xl mx-auto bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Search destination
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="e.g. Shimla, lake, beach..."
            className={inputCls}
          />
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label
              htmlFor="budget"
              className="text-sm font-medium text-slate-300"
            >
              Maximum budget
            </label>
            <span className="text-orange-400 font-extrabold text-lg">
              {inr(maxBudget)}
            </span>
          </div>
          <input
            id="budget"
            type="range"
            min="3000"
            max={budgetLimit}
            step="500"
            value={maxBudget}
            onChange={(e) => onBudgetChange(Number(e.target.value))}
            className="w-full h-10 accent-cyan-400 cursor-pointer"
          />
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PACKAGE CAROUSEL
// ============================================================================

function PackageCarousel({ filteredPackages, onSelectPackage }) {
  return (
    <section id="packages" className="py-20 px-6 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
          Featured packages
        </h3>
        <p className="text-slate-400 mt-2 mb-8">
          Swipe through our most-booked trips.
        </p>

        {filteredPackages.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/15 rounded-2xl">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-semibold text-lg">No packages match</p>
            <p className="text-slate-400 text-sm mt-1">
              Try a higher budget or a different search.
            </p>
          </div>
        ) : (
          <Swiper
            // remount when the filtered list changes so centering stays correct
            key={filteredPackages.map((p) => p.id).join('-')}
            modules={[Navigation, Pagination, EffectCoverflow]}
            effect="coverflow"
            grabCursor
            centeredSlides
            slidesPerView="auto"
            pagination={{ clickable: true }}
            navigation
            coverflowEffect={{
              rotate: 25,
              stretch: 0,
              depth: 120,
              modifier: 1,
              slideShadows: false,
            }}
            className="pt-4 pb-14"
          >
            {filteredPackages.map((pkg) => (
              <SwiperSlide key={pkg.id} className="w-[85%]! sm:w-96! h-auto!">
                <PackageCard
                  package={pkg}
                  onInquire={() => onSelectPackage(pkg.name)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
}

// ============================================================================
// PACKAGE CARD
// ============================================================================

function PackageCard({ package: pkg, onInquire }) {
  return (
    <div className="h-full flex flex-col rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-xl">
      <div className="relative h-48 bg-slate-800">
        <SafeImage
          src={getPackagePhoto(pkg)}
          alt={pkg.name}
          className="w-full h-full object-cover"
          fallback={
            <div className="w-full h-full flex items-center justify-center text-7xl bg-gradient-to-br from-blue-900 to-slate-900">
              {pkg.image || '🧳'}
            </div>
          }
        />
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-xs font-semibold text-cyan-300">
          {pkg.type}
        </span>
        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-xs font-semibold text-yellow-300">
          ★ {pkg.rating}
        </span>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300 mb-2">
          {pkg.destination}
        </p>
        <p className="text-xs text-slate-400 mb-1">
          ⏱️ {pkg.days} · {pkg.reviews} reviews
        </p>
        <h4 className="text-xl font-bold mb-2">{pkg.name}</h4>
        <p className="text-sm text-slate-400 mb-6 flex-1">{pkg.highlights}</p>

        <div className="flex items-end justify-between pt-4 border-t border-white/10">
          <div>
            <p className="text-xs text-slate-500 font-medium">Starting from</p>
            <p className="text-2xl font-extrabold">{inr(pkg.budget)}</p>
          </div>
          <button
            onClick={onInquire}
            className="px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition"
          >
            Inquire
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WHY CHOOSE US
// ============================================================================

function WhyChooseUs() {
  return (
    <section className="py-20 px-6 bg-slate-900/60 border-y border-white/5">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-10">
          Why travel with us
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map((item) => (
            <div key={item.title} className="border-l-2 border-cyan-400 pl-5">
              <h4 className="font-bold text-lg mb-2">{item.title}</h4>
              <p className="text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// INQUIRY FORM
// ============================================================================

function InquiryForm({ selectedPkg, packages }) {
  const emptyForm = { name: '', phone: '', destination: '', requests: '' };
  const [formData, setFormData] = useState({
    ...emptyForm,
    destination: selectedPkg,
  });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [previousSelectedPkg, setPreviousSelectedPkg] = useState(selectedPkg);

  if (selectedPkg && selectedPkg !== previousSelectedPkg) {
    setPreviousSelectedPkg(selectedPkg);
    setFormData((prev) => ({ ...prev, destination: selectedPkg }));
    setSent(false);
    setSubmitError('');
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSent(false);
    try {
      await apiRequest('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setSent(true);
      setFormData(emptyForm);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="inquiry-section" className="py-20 px-6 scroll-mt-20">
      <div className="max-w-2xl mx-auto bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12">
        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-2">
          Plan your trip
        </h3>
        <p className="text-slate-400 text-center mb-10">
          Send your request and we will reply within 24 hours.
        </p>

        {sent && (
          <div
            role="status"
            className="mb-6 rounded-xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 px-4 py-3 text-sm"
          >
            Request emailed successfully. We will contact you within 24 hours.
          </div>
        )}
        {submitError && (
          <p role="alert" className="mb-6 rounded-xl bg-red-500/10 border border-red-400/30 text-red-300 px-4 py-3 text-sm">
            {submitError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Full name
            </label>
            <input
              id="name"
              autoComplete="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Phone
              </label>
              <input
                id="phone"
                autoComplete="tel"
                inputMode="tel"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9896XXXXXX"
                required
                className={inputCls}
              />
            </div>
            <div>
              <label
                htmlFor="destination"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Destination
              </label>
              <input
                id="destination"
                type="text"
                name="destination"
                list="package-names"
                value={formData.destination}
                onChange={handleChange}
                placeholder="e.g. Shimla, Goa"
                required
                className={inputCls}
              />
              <datalist id="package-names">
                {packages.map((p) => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label
              htmlFor="requests"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Special requests
            </label>
            <textarea
              id="requests"
              name="requests"
              value={formData.requests}
              onChange={handleChange}
              placeholder="Travel dates, group size, budget, activities..."
              rows="4"
              className={inputCls + ' resize-none'}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-lg shadow-lg shadow-orange-500/20 transition"
          >
            {submitting ? 'Sending request...' : 'Send request'}
          </button>
        </form>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================

function Footer() {
  return (
    <footer className="border-t border-white/10 pt-12 pb-28 sm:pb-12 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <h3 className="text-xl font-extrabold mb-2">
          ✈️ Leekha Domestic Tours & Travels
        </h3>
        <p className="text-slate-400 text-sm mb-1">
          Explore. Experience. Escape.
        </p>
        <p className="text-slate-500 text-sm">📍 Yamuna Nagar, Haryana</p>
      </div>
    </footer>
  );
}

// ============================================================================
// MOBILE CONTACT BAR (phones only, needs PHONE_NUMBER and/or WHATSAPP_NUMBER)
// ============================================================================

function MobileContactBar() {
  if (!PHONE_NUMBER && !WHATSAPP_NUMBER) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden flex gap-3 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-950/95 border-t border-white/10">
      {PHONE_NUMBER && (
        <a
          href={`tel:+${PHONE_NUMBER}`}
          className="flex-1 text-center py-3 rounded-xl border border-white/25 font-semibold"
        >
          📞 Call
        </a>
      )}
      {WHATSAPP_NUMBER && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 text-center py-3 rounded-xl bg-emerald-500 text-slate-950 font-bold"
        >
          WhatsApp
        </a>
      )}
    </div>
  );
}

// ============================================================================
// ADMIN PORTAL
// ============================================================================

function AdminPortal({ packages, onAdd, onUpdate, onDelete }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(() =>
    Boolean(sessionStorage.getItem('leekha_admin_token'))
  );

  useEffect(() => {
    if (!sessionStorage.getItem('leekha_admin_token')) return;
    apiRequest('/api/auth/session')
      .then(() => setIsAuthenticated(true))
      .catch(() => sessionStorage.removeItem('leekha_admin_token'))
      .finally(() => setCheckingSession(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {checkingSession ? (
        <div className="min-h-screen flex items-center justify-center text-slate-400">
          Checking admin session...
        </div>
      ) : !isAuthenticated ? (
        <LoginPage onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <AdminDashboard
          packages={packages}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onLogout={() => {
            sessionStorage.removeItem('leekha_admin_token');
            setIsAuthenticated(false);
          }}
        />
      )}
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      sessionStorage.setItem('leekha_admin_token', result.accessToken);
      onLogin();
    } catch (loginError) {
      setError(loginError.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold mb-2">Admin login</h2>
          <p className="text-slate-400 text-sm">Authorized access only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className={inputCls}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className={inputCls}
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition"
          >
            Log in
          </button>
        </form>

        <Link
          to="/"
          className="block mt-6 text-center text-slate-400 hover:text-cyan-300 text-sm"
        >
          ← Back to website
        </Link>
      </motion.div>
    </div>
  );
}

function AdminDashboard({ packages, onAdd, onUpdate, onDelete, onLogout }) {
  const [editingPackage, setEditingPackage] = useState(null);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-wrap gap-4 justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <img src="/images/logo.png" alt="" className="h-12 w-12 object-contain" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Admin dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Manage tour packages</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 font-semibold text-sm transition"
          >
            View website
          </Link>
          <button
            onClick={onLogout}
            className="px-5 py-2.5 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-semibold text-sm transition"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <AddPackageForm
          key={editingPackage?.id ?? 'new-package'}
          editingPackage={editingPackage}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onCancelEdit={() => setEditingPackage(null)}
        />
        <div className="lg:col-span-2">
          <PackagesList
            packages={packages}
            onDelete={onDelete}
            onEdit={setEditingPackage}
          />
        </div>
      </div>
    </div>
  );
}

function AddPackageForm({ editingPackage, onAdd, onUpdate, onCancelEdit }) {
  const emptyForm = {
    name: '',
    destination: '',
    budget: '',
    days: '',
    highlights: '',
    type: 'Hill Station',
    photo: null,
  };
  const [formData, setFormData] = useState(() => editingPackage
    ? {
      name: editingPackage.name,
      destination: editingPackage.destination,
      budget: String(editingPackage.budget),
      days: editingPackage.days,
      highlights: editingPackage.highlights ?? '',
      type: editingPackage.type,
      photo: null,
    }
    : emptyForm);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      if (editingPackage) {
        await onUpdate(editingPackage.id, formData);
        setMessage('Package updated.');
      } else {
        await onAdd(formData);
        setMessage('Package published.');
        setFormData(emptyForm);
      }
      setFileInputKey((key) => key + 1);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 h-fit">
      <h2 className="text-xl font-bold mb-6">
        {editingPackage ? 'Edit package' : 'Add package'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Package name"
          required
          className={inputCls}
        />
        <input
          type="text"
          name="destination"
          value={formData.destination}
          onChange={handleChange}
          placeholder="Destination, e.g. Shimla or Mussoorie"
          required
          className={inputCls}
        />
        <input
          type="number"
          name="budget"
          min="0"
          value={formData.budget}
          onChange={handleChange}
          placeholder="Price (₹)"
          required
          className={inputCls}
        />
        <input
          type="text"
          name="days"
          value={formData.days}
          onChange={handleChange}
          placeholder="Duration, e.g. 3 Days / 2 Nights"
          required
          className={inputCls}
        />
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={inputCls}
        >
          {PACKAGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="block text-sm text-slate-300">
          Destination photo
          <input
            key={fileInputKey}
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, photo: e.target.files?.[0] ?? null }))
            }
            className="mt-2 block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:font-semibold file:text-slate-950 hover:file:bg-cyan-400"
          />
          <span className="mt-1 block text-xs text-slate-500">
            {editingPackage ? 'Choose a new photo to replace the current one. Leave blank to keep it.' : 'JPEG, PNG or WebP, up to 8 MB'}
          </span>
        </label>
        <textarea
          name="highlights"
          value={formData.highlights}
          onChange={handleChange}
          placeholder="Highlights"
          rows="3"
          className={inputCls + ' resize-none'}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
        >
          {submitting ? (editingPackage ? 'Saving...' : 'Publishing...') : (editingPackage ? 'Save changes' : 'Publish package')}
        </button>
        {editingPackage && (
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={submitting}
            className="w-full py-3 rounded-xl border border-white/20 hover:bg-white/10 font-semibold transition"
          >
            Cancel
          </button>
        )}
        {message && (
          <p role="status" className={message === 'Package published.' || message === 'Package updated.' ? 'text-emerald-300 text-sm' : 'text-red-300 text-sm'}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

function PackagesList({ packages, onDelete, onEdit }) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
      <h2 className="text-xl font-bold mb-6">Packages ({packages.length})</h2>
      {packages.length === 0 ? (
        <p className="text-slate-400 text-center py-8">
          No packages yet. Add your first one.
        </p>
      ) : (
        <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="border border-white/10 bg-slate-950/60 rounded-xl p-4 flex justify-between items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{pkg.name}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {pkg.destination} · {inr(pkg.budget)} · {pkg.days} · {pkg.type}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(pkg)}
                  className="px-4 py-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-200 text-xs font-semibold transition"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    window.confirm(`Delete "${pkg.name}"?`) &&
                    onDelete(pkg.id).catch((error) => window.alert(error.message))
                  }
                  className="px-4 py-2.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}