
import React from 'react';
import { BarChart3, TrendingUp, Users, MousePointer2, MessageSquare, ExternalLink } from 'lucide-react';
import { store } from '../services/store';
import { Link } from 'react-router-dom';

const Admin: React.FC = () => {
  const analytics = store.getAnalytics();
  const clubs = store.getClubs();

  const totalViews = Object.values(analytics).reduce((sum, a) => sum + a.views, 0);
  const totalBookings = Object.values(analytics).reduce((sum, a) => sum + a.bookings, 0);
  const totalLeads = Object.values(analytics).reduce((sum, a) => sum + a.leads, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Club Analytics</h1>
          <p className="text-slate-500">Overview of performance across all UK clubs.</p>
        </div>
        <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border border-amber-200">
          Admin Preview
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
            <BarChart3 className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">Total Profile Views</p>
          <div className="text-4xl font-black text-slate-900">{totalViews}</div>
          <div className="mt-4 flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <TrendingUp className="w-3 h-3" />
            +12% this week
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
            <MousePointer2 className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">Booking Clicks</p>
          <div className="text-4xl font-black text-slate-900">{totalBookings}</div>
          <div className="mt-4 flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <TrendingUp className="w-3 h-3" />
            +5% this week
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-slate-500 text-sm font-medium mb-1">Total Enquiries</p>
          <div className="text-4xl font-black text-slate-900">{totalLeads}</div>
          <div className="mt-4 flex items-center gap-1 text-emerald-600 text-xs font-bold">
            <TrendingUp className="w-3 h-3" />
            +18% this week
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Performance by Club</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Club Name</th>
                <th className="px-8 py-4 text-center">Views</th>
                <th className="px-8 py-4 text-center">Booking Clicks</th>
                <th className="px-8 py-4 text-center">Leads</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clubs.map(club => {
                const stats = analytics[club.id] || { views: 0, bookings: 0, leads: 0 };
                return (
                  <tr key={club.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden">
                           <img src={club.image_url!} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{club.name}</div>
                          <div className="text-xs text-slate-500">{club.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-slate-700">{stats.views}</td>
                    <td className="px-8 py-5 text-center font-bold text-slate-700">{stats.bookings}</td>
                    <td className="px-8 py-5 text-center font-bold text-slate-700">{stats.leads}</td>
                    <td className="px-8 py-5 text-right">
                      <Link 
                        to={`/clubs/${club.slug}`}
                        className="text-indigo-600 hover:text-indigo-700 font-bold text-sm inline-flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
