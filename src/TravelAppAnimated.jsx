import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

// Put your photos in: public/images/  (see file names below).
// If a photo is missing, the emoji fallback is shown instead, so nothing breaks.
const INITIAL_PACKAGES = [
  {
    id: 1,
    name: 'Shimla Family Getaway',
    budget: 8500,
    days: '4 Days / 3 Nights',
    highlights: 'The Ridge, Mall Road, Kufri sightseeing, Comfort Family Stay',
    type: 'Hill Station',
    image: '🏔️',
    img: '/images/shimla.jpg',
    rating: 4.8,
    reviews: 234,
  },
  {
    id: 2,
    name: 'Goa Beach Celebration',
    budget: 22000,
    days: '6 Days / 5 Nights',
    highlights: 'Flights from Delhi, Calangute Beach, South Goa Heritage Tour',
    type: 'Premium Beach',
    image: '🏖️',
    img: '/images/goa.jpg',
    rating: 4.9,
    reviews: 567,
  },
  {
    id: 3,
    name: 'Kasauli Weekend Escape',
    budget: 4500,
    days: '2 Days / 1 Night',
    highlights: 'Gilbert Trail, Sunset Point, Heritage Markets tour',
    type: 'Hill Station',
    image: '⛰️',
    img: '/images/kasauli.jpg',
    rating: 4.7,
    reviews: 189,
  },
  {
    id: 4,
    name: 'Haripurdhar Hill Expedition',
    budget: 5500,
    days: '3 Days / 2 Nights',
    highlights: 'Mata Bhangayani Temple tour, Hidden green valleys trek',
    type: 'Spiritual / Hill',
    image: '🙏',
    img: '/images/haripurdhar.jpg',
    rating: 4.6,
    reviews: 145,
  },
  {
    id: 5,
    name: 'Jamtah Mountain Retreat',
    budget: 3500,
    days: '2 Days / 1 Night',
    highlights: 'Peaceful views, Renuka Lake nearby, Pine Forests walk',
    type: 'Nature Relax',
    image: '🌲',
    img: '/images/jamtah.jpg',
    rating: 4.5,
    reviews: 98,
  },
  {
    id: 6,
    name: 'Nainital Lake Experience',
    budget: 9500,
    days: '4 Days / 3 Nights',
    highlights: 'Naini Lake Boating, Bhimtal, Mall Road evening strolls',
    type: 'Lake City',
    image: '🏞️',
    img: '/images/nainital.jpg',
    rating: 4.8,
    reviews: 412,
  },
];

// Hero slides. "pkg" must match a package name exactly (it pre-fills the inquiry form).
const HERO_SLIDES = [
  {
    img: '/images/shimla.jpg',
    place: 'Shimla',
    tagline: 'The Queen of Hills',
    desc: 'Evening walks on The Ridge, colonial charm and cool mountain air.',
    pkg: 'Shimla Family Getaway',
  },
  {
    img: '/images/nainital.jpg',
    place: 'Nainital',
    tagline: 'City of Lakes',
    desc: 'Boating on Naini Lake and slow evenings on Mall Road.',
    pkg: 'Nainital Lake Experience',
  },
  {
    img: '/images/kasauli.jpg',
    place: 'Kasauli',
    tagline: 'Your quick weekend escape',
    desc: 'Pine forests, quiet trails and sunsets, just a short drive away.',
    pkg: 'Kasauli Weekend Escape',
  },
];

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

// NOTE: credentials in front-end code are visible to anyone. This is fine for a
// demo, but move login to a backend before you go live.
const ADMIN_CREDENTIALS = {
  email: 'leekhatravels@gmail.com',
  password: 'admin123',
};

// Optional: put the agency's WhatsApp number here with country code, digits only
// (example: '919876543210'). If set, the inquiry form also opens WhatsApp.
const WHATSAPP_NUMBER = '';

// Optional: phone number with country code, digits only (example: '919876543210').
// Used by the Call button in the mobile contact bar.
const PHONE_NUMBER = '';

const STORAGE_KEY = 'leekha_packages_v1';

const inr = (n) => '₹' + Number(n).toLocaleString('en-IN');

const inputCls =
  'w-full rounded-xl bg-slate-950 border border-white/15 px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition';

function loadPackages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_PACKAGES;
  } catch {
    return INITIAL_PACKAGES;
  }
}

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
  const [packages, setPackages] = useState(loadPackages);

  // Keep admin changes after a page refresh (stored in this browser only).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packages));
    } catch {
      /* storage full or blocked: ignore */
    }
  }, [packages]);

  const addPackage = (newPkg) => {
    setPackages((prev) => [...prev, { id: Date.now(), ...newPkg }]);
  };

  const deletePackage = (id) => {
    setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerView packages={packages} />} />
        <Route
          path="/admin"
          element={
            <AdminPortal
              packages={packages}
              onAdd={addPackage}
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

function CustomerView({ packages }) {
  const [search, setSearch] = useState('');
  const [maxBudget, setMaxBudget] = useState(25000);
  const [selectedPkg, setSelectedPkg] = useState('');

  const filteredPackages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return packages.filter((pkg) => {
      const matchesSearch =
        !q ||
        pkg.name.toLowerCase().includes(q) ||
        pkg.type.toLowerCase().includes(q) ||
        pkg.highlights.toLowerCase().includes(q);
      return matchesSearch && pkg.budget <= maxBudget;
    });
  }, [search, maxBudget, packages]);

  const handleSelect = (name) => {
    setSelectedPkg(name);
    scrollToInquiry();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      <Header />
      <HeroSection onSelectPackage={handleSelect} />
      <SearchFilters
        search={search}
        onSearchChange={setSearch}
        maxBudget={maxBudget}
        onBudgetChange={setMaxBudget}
      />
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
        <Link to="/" className="leading-tight">
          <span className="block text-xl font-extrabold tracking-tight">
            ✈️ Leekha Travels
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

function HeroSection({ onSelectPackage }) {
  return (
    <section className="relative">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination, Navigation]}
        effect="fade"
        loop
        speed={1000}
        autoplay={{ delay: 5500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        className="h-[75svh] min-h-[480px]"
      >
        {HERO_SLIDES.map((s, i) => (
          <SwiperSlide key={s.place}>
            <SafeImage
              src={s.img}
              alt={s.place}
              eager={i === 0}
              className="absolute inset-0 w-full h-full object-cover"
              fallback={
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-slate-900 to-slate-950" />
              }
            />
            {/* dark gradient keeps the text readable on any photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/20" />

            <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-16 sm:pb-24">
              <p className="text-cyan-300 font-semibold mb-2">{s.tagline}</p>
              <h2 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-4">
                {s.place}
              </h2>
              <p className="text-slate-200 text-lg max-w-xl mb-8">{s.desc}</p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onSelectPackage(s.pkg)}
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

function SearchFilters({ search, onSearchChange, maxBudget, onBudgetChange }) {
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
            max="25000"
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
          src={pkg.img}
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

  // When someone clicks "Inquire" on a package, fill the destination.
  useEffect(() => {
    if (selectedPkg) {
      setFormData((prev) => ({ ...prev, destination: selectedPkg }));
      setSent(false);
    }
  }, [selectedPkg]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (WHATSAPP_NUMBER) {
      const text = encodeURIComponent(
        `Hi Leekha Travels, I'd like to plan a trip.\n` +
          `Name: ${formData.name}\n` +
          `Phone: ${formData.phone}\n` +
          `Destination: ${formData.destination}\n` +
          `Notes: ${formData.requests || '-'}`
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, '_blank');
    }

    // TODO: send formData to your backend / email service here.
    setSent(true);
    setFormData(emptyForm);
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
            Request sent. We will contact you within 24 hours.
          </div>
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
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold text-lg shadow-lg shadow-orange-500/20 transition"
          >
            Send request
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

function AdminPortal({ packages, onAdd, onDelete }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {!isAuthenticated ? (
        <LoginPage onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <AdminDashboard
          packages={packages}
          onAdd={onAdd}
          onDelete={onDelete}
          onLogout={() => setIsAuthenticated(false)}
        />
      )}
    </div>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (
      email === ADMIN_CREDENTIALS.email &&
      password === ADMIN_CREDENTIALS.password
    ) {
      onLogin();
    } else {
      setError('Wrong email or password. Please try again.');
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

function AdminDashboard({ packages, onAdd, onDelete, onLogout }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <header className="bg-slate-900 border border-white/10 rounded-2xl p-6 flex flex-wrap gap-4 justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Admin dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage tour packages</p>
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
        <AddPackageForm onAdd={onAdd} />
        <div className="lg:col-span-2">
          <PackagesList packages={packages} onDelete={onDelete} />
        </div>
      </div>
    </div>
  );
}

function AddPackageForm({ onAdd }) {
  const emptyForm = {
    name: '',
    budget: '',
    days: '',
    highlights: '',
    type: 'Hill Station',
    img: '',
  };
  const [formData, setFormData] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      budget: Number(formData.budget),
      image: '🧳',
      rating: 4.5,
      reviews: 0,
    });
    setFormData(emptyForm);
    setMessage('Package published.');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 h-fit">
      <h2 className="text-xl font-bold mb-6">Add package</h2>
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
        <input
          type="text"
          name="img"
          value={formData.img}
          onChange={handleChange}
          placeholder="Photo path, e.g. /images/manali.jpg (optional)"
          className={inputCls}
        />
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
          className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition"
        >
          Publish package
        </button>
        {message && (
          <p role="status" className="text-emerald-300 text-sm">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

function PackagesList({ packages, onDelete }) {
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
                  {inr(pkg.budget)} · {pkg.days} · {pkg.type}
                </p>
              </div>
              <button
                onClick={() =>
                  window.confirm(`Delete "${pkg.name}"?`) && onDelete(pkg.id)
                }
                className="px-4 py-2.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}