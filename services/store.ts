
import { Club, AnalyticsEvent, Lead, AnalyticsEventType } from '../types';
import { INITIAL_CLUBS } from './mockData';

class Store {
  private clubs: Club[] = [...INITIAL_CLUBS];
  private events: AnalyticsEvent[] = [];
  private leads: Lead[] = [];

  getClubs() {
    return this.clubs;
  }

  getClubBySlug(slug: string) {
    return this.clubs.find(c => c.slug === slug);
  }

  getClubsByCity(city: string) {
    return this.clubs.filter(c => c.city.toLowerCase() === city.toLowerCase());
  }

  trackEvent(clubId: string, type: AnalyticsEventType) {
    const event: AnalyticsEvent = {
      id: Math.random().toString(36).substr(2, 9),
      club_id: clubId,
      type,
      created_at: Date.now()
    };
    this.events.push(event);
    console.log(`[Analytics] Tracked ${type} for club ${clubId}`);
  }

  submitLead(clubId: string, data: { name: string; email: string; message: string }) {
    const lead: Lead = {
      id: Math.random().toString(36).substr(2, 9),
      club_id: clubId,
      ...data,
      created_at: Date.now()
    };
    this.leads.push(lead);
    this.trackEvent(clubId, 'lead_submitted');
    return lead;
  }

  getAnalytics() {
    const report: Record<string, { views: number; bookings: number; leads: number }> = {};
    
    this.clubs.forEach(club => {
      const clubEvents = this.events.filter(e => e.club_id === club.id);
      report[club.id] = {
        views: clubEvents.filter(e => e.type === 'view').length,
        bookings: clubEvents.filter(e => e.type === 'booking_click').length,
        leads: clubEvents.filter(e => e.type === 'lead_submitted').length,
      };
    });

    return report;
  }

  getCities() {
    const citiesMap = new Map<string, number>();
    this.clubs.forEach(c => {
      citiesMap.set(c.city, (citiesMap.get(c.city) || 0) + 1);
    });
    return Array.from(citiesMap.entries()).map(([name, count]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      count
    }));
  }
}

export const store = new Store();
