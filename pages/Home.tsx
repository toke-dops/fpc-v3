
import React from 'react';
import { Link } from 'react-router-dom';
// Fix: Added missing Star and Calendar icon imports
import { Search, MapPin, Trophy, Users, Zap, ArrowRight, Star, Calendar } from 'lucide-react';
import { store } from '../services/store';
import ClubCard from '../components/ClubCard';

const Home: React.FC = () => {
  const featuredClubs = store.getClubs().filter(c => c.is_featured).slice(0, 3);
  const cities = store.getCities();

  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-slate-50 -z-10">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-100/50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-violet-100/50 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-semibold mb-8 animate-fade-in">
            <Zap className="w-4 h-4" />
            The Fastest Growing Sport in the UK
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6">
            Find Your Next <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              Padel Match
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            The ultimate UK directory for padel clubs. Search by city, compare ratings, and book your court in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/clubs" 
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
            >
              Explore All Clubs
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#how-it-works" 
              className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              How it Works
            </a>
          </div>
        </div>
      </section>

      {/* Featured Clubs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Clubs</h2>
            <p className="text-slate-500">Hand-picked venues with premium facilities</p>
          </div>
          <Link to="/clubs" className="text-indigo-600 font-bold flex items-center gap-1 hover:gap-2 transition-all">
            See All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredClubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      </section>

      {/* Cities Grid */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Padel in Your City</h2>
            <p className="text-slate-400">Discover the best courts in major UK hubs</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cities.map(city => (
              <Link 
                key={city.slug} 
                to={`/city/${city.slug}`}
                className="group relative h-48 rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 hover:border-indigo-500 transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80 z-10"></div>
                <img 
                  src={`https://picsum.photos/seed/${city.slug}/600/400`} 
                  alt={city.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute bottom-6 left-6 z-20">
                  <h3 className="text-xl font-bold">{city.name}</h3>
                  <p className="text-slate-400 text-sm">{city.count} {city.count === 1 ? 'Club' : 'Clubs'}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Easy Search</h3>
            <p className="text-slate-500 leading-relaxed">
              Find clubs near you by postcode, city or name. Use our smart filters to find exactly what you need.
            </p>
          </div>
          
          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              {/* Fix: Added Star icon from lucide-react */}
              <Star className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Verified Reviews</h3>
            <p className="text-slate-500 leading-relaxed">
              Real ratings from the padel community. Compare venues based on court quality and atmosphere.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-sm">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              {/* Fix: Added Calendar icon from lucide-react */}
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Direct Booking</h3>
            <p className="text-slate-500 leading-relaxed">
              Connect directly with booking platforms like Playtomic or matchi. No middleman, no fees.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
