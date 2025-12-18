
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Phone, Globe, Calendar, Star, 
  ExternalLink, Clock, ChevronLeft, ShieldCheck, Mail, Send
} from 'lucide-react';
import { store } from '../services/store';
import { Club } from '../types';

const ClubDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (slug) {
      const found = store.getClubBySlug(slug);
      if (found) {
        setClub(found);
        store.trackEvent(found.id, 'view');
      }
    }
  }, [slug]);

  if (!club) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Club not found</h2>
        <button 
          onClick={() => navigate('/clubs')}
          className="text-indigo-600 font-bold flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Directory
        </button>
      </div>
    );
  }

  const handleLeadSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;

    setTimeout(() => {
      store.submitLead(club.id, { name, email, message });
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  const handleBookingClick = () => {
    store.trackEvent(club.id, 'booking_click');
  };

  return (
    <div className="bg-slate-50 pb-24">
      {/* Hero Header */}
      <div className="relative h-[300px] md:h-[450px]">
        <img 
          src={club.image_url || 'https://picsum.photos/1200/600'} 
          alt={club.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-12 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <button 
              onClick={() => navigate(-1)}
              className="mb-8 flex items-center gap-1.5 text-white/80 hover:text-white transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {club.categories.map(cat => (
                    <span key={cat} className="px-3 py-1 rounded-full bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 text-indigo-100 text-[10px] font-bold uppercase tracking-widest">
                      {cat}
                    </span>
                  ))}
                  {club.status === 'claimed' && (
                    <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-100 text-[10px] font-bold uppercase tracking-widest">
                      <ShieldCheck className="w-3 h-3" /> Claimed
                    </span>
                  )}
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
                  {club.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-white/90 text-sm">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    {club.city}, {club.postcode}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-bold">{club.rating}</span>
                    <span className="opacity-70">({club.rating_count} reviews)</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {club.booking_url ? (
                  <a 
                    href={club.booking_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={handleBookingClick}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Book Now
                  </a>
                ) : (
                  <a 
                    href="#contact"
                    className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all shadow-xl shadow-white/10"
                  >
                    Contact Club
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* About */}
          <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">About the Club</h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              Experience padel at its finest at {club.name}. Located in the heart of {club.city}, 
              this venue offers state-of-the-art facilities for players of all levels. 
              Whether you're looking for a competitive match or a social game with friends, 
              our courts provide the perfect environment.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Address</p>
                  <p className="text-sm font-semibold text-slate-900">{club.full_address}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Opening Hours</p>
                  <p className="text-sm font-semibold text-slate-900">{club.opening_hours_raw || 'Mon-Sun: 7am - 10pm'}</p>
                </div>
              </div>

              {club.phone && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-semibold text-slate-900">{club.phone}</p>
                  </div>
                </div>
              )}

              {club.website && (
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Website</p>
                    <a href={club.website} target="_blank" rel="noopener" className="text-sm font-semibold text-indigo-600 hover:underline">
                      Visit Official Site
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Contact Form */}
          <section id="contact" className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Enquire Now</h2>
                <p className="text-slate-500">Have a question? Send a message to the club manager.</p>
              </div>
              <Mail className="w-8 h-8 text-indigo-200" />
            </div>

            {submitted ? (
              <div className="py-12 text-center bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-sm">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-slate-600 px-8">Thanks for your interest. The club will get back to you shortly via email.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-indigo-600 font-bold hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Your Name</label>
                    <input 
                      required
                      name="name"
                      type="text" 
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Email Address</label>
                    <input 
                      required
                      name="email"
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Message</label>
                  <textarea 
                    required
                    name="message"
                    rows={4}
                    placeholder="Tell us what you're looking for..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Send Inquiry'}
                  {!isSubmitting && <Send className="w-4 h-4" />}
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Claim Club */}
          {club.status === 'unclaimed' && (
            <div className="p-6 rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Are you the owner?
              </h3>
              <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
                Claim this club to update details, reply to reviews, and see booking analytics.
              </p>
              <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all">
                Claim this Listing
              </button>
            </div>
          )}

          {/* Map Link */}
          {club.maps_url && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Location</h3>
              <div className="aspect-square bg-slate-100 rounded-2xl mb-4 relative overflow-hidden group">
                 <img 
                    src={`https://picsum.photos/seed/${club.slug}map/400/400`} 
                    alt="Map"
                    className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                 />
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-red-500 rounded-full border-4 border-white shadow-lg animate-bounce"></div>
                 </div>
              </div>
              <a 
                href={club.maps_url} 
                target="_blank" 
                rel="noopener"
                className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl font-bold text-slate-900 hover:bg-slate-50 transition-all text-sm"
              >
                Open in Google Maps
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;
