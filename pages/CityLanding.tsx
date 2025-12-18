
import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Award } from 'lucide-react';
import { store } from '../services/store';
import ClubCard from '../components/ClubCard';

const CityLanding: React.FC = () => {
  const { citySlug } = useParams<{ citySlug: string }>();
  
  const cityInfo = useMemo(() => {
    return store.getCities().find(c => c.slug === citySlug);
  }, [citySlug]);

  const clubs = useMemo(() => {
    if (!cityInfo) return [];
    return store.getClubsByCity(cityInfo.name).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [cityInfo]);

  if (!cityInfo) return <div className="p-24 text-center">City not found</div>;

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="mb-8 inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors text-sm font-medium">
            <ChevronLeft className="w-4 h-4" /> All Cities
          </Link>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">
                <MapPin className="w-4 h-4" />
                United Kingdom
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4 tracking-tight">
                Padel in <span className="text-indigo-600">{cityInfo.name}</span>
              </h1>
              <p className="text-xl text-slate-500 max-w-2xl leading-relaxed">
                Discover the top-rated padel courts and clubs in {cityInfo.name}. 
                We've found {clubs.length} premier locations for your next match.
              </p>
            </div>
            <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100 text-center">
              <Award className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <div className="text-3xl font-black text-indigo-900">{clubs.length}</div>
              <div className="text-indigo-600 font-bold text-xs uppercase tracking-wider">Top Venues</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {clubs.map(club => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CityLanding;
