
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, MapPin, BarChart3, Info } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl group-hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              P
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              UK Padel Finder
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link 
              to="/clubs" 
              className={`hover:text-indigo-600 transition-colors ${location.pathname === '/clubs' ? 'text-indigo-600' : ''}`}
            >
              Browse Clubs
            </Link>
            <Link 
              to="/admin" 
              className={`hover:text-indigo-600 transition-colors ${location.pathname === '/admin' ? 'text-indigo-600' : ''}`}
            >
              Analytics
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              to="/clubs"
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            >
              Find a Court
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 text-white mb-6">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">P</div>
              <span className="font-bold text-lg">UK Padel Finder</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              The #1 directory for Padel enthusiasts in the UK. Discover, book, and play the fastest growing sport in the world.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6">Explore</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/clubs" className="hover:text-white transition-colors">All Clubs</Link></li>
              <li><Link to="/city/london" className="hover:text-white transition-colors">London Padel</Link></li>
              <li><Link to="/city/manchester" className="hover:text-white transition-colors">Manchester Padel</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Club Owners Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-xs text-center">
          &copy; {new Date().getFullYear()} UK Padel Finder. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
