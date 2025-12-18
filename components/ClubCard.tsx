
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, ExternalLink, Calendar } from 'lucide-react';
import { Club } from '../types';
import { store } from '../services/store';

const ClubCard: React.FC<{ club: Club }> = ({ club }) => {
  const handleBookingClick = () => {
    store.trackEvent(club.id, 'booking_click');
  };

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img 
          src={club.image_url || 'https://picsum.photos/400/300?grayscale'} 
          alt={club.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {club.is_featured && (
          <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
            Featured
          </div>
        )}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-bold text-slate-800">{club.rating || 'N/A'}</span>
          <span className="text-[10px] text-slate-500">({club.rating_count || 0})</span>
        </div>
      </div>
      
      <div className="p-5 flex-grow flex flex-col">
        <div className="flex-grow">
          <div className="text-[10px] font-semibold text-indigo-600 uppercase tracking-widest mb-1">
            {club.categories[0] || 'Club'}
          </div>
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-2">
            <Link to={`/clubs/${club.slug}`}>{club.name}</Link>
          </h3>
          <div className="flex items-start gap-1.5 text-slate-500 text-xs mb-4">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{club.city}, {club.postcode}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-auto">
          <Link 
            to={`/clubs/${club.slug}`}
            className="flex-grow bg-slate-100 text-slate-900 text-center py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors"
          >
            Details
          </Link>
          {club.booking_url ? (
            <a 
              href={club.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleBookingClick}
              className="flex-grow bg-indigo-600 text-white text-center py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Book
            </a>
          ) : (
            <Link 
              to={`/clubs/${club.slug}`}
              className="flex-grow border border-slate-200 text-slate-500 text-center py-2.5 rounded-xl font-semibold text-sm hover:border-slate-300 transition-colors"
            >
              Enquire
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubCard;
