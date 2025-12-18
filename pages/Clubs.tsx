
import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Star, CalendarCheck } from 'lucide-react';
import { store } from '../services/store';
import ClubCard from '../components/ClubCard';

const Clubs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [mustHaveBooking, setMustHaveBooking] = useState(false);

  const allClubs = store.getClubs();
  const cities = store.getCities();

  const filteredClubs = useMemo(() => {
    return allClubs.filter(club => {
      const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            club.postcode?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCity = cityFilter === '' || club.city.toLowerCase() === cityFilter.toLowerCase();
      const matchesRating = (club.rating || 0) >= minRating;
      const matchesBooking = !mustHaveBooking || !!club.booking_url;
      
      return matchesSearch && matchesCity && matchesRating && matchesBooking;
    });
  }, [allClubs, searchTerm, cityFilter, minRating, mustHaveBooking]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Browse Clubs</h1>
          <p className="text-slate-500 max-w-xl">
            Showing {filteredClubs.length} padel clubs across the United Kingdom.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="relative">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Club name or postcode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">City</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city.slug} value={city.name}>{city.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Min Rating</label>
            <div className="flex items-center gap-1">
              {[3.5, 4.0, 4.5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                  className={`flex-grow py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${
                    minRating === rating 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {rating}+
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setMustHaveBooking(!mustHaveBooking)}
              className={`w-full py-2.5 px-4 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                mustHaveBooking 
                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              Online Booking
            </button>
          </div>
        </div>

        {/* Results */}
        {filteredClubs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClubs.map(club => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No clubs found</h3>
            <p className="text-slate-500">Try adjusting your filters or search terms.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setCityFilter('');
                setMinRating(0);
                setMustHaveBooking(false);
              }}
              className="mt-6 text-indigo-600 font-bold underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clubs;
