import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchState {
  // Search criteria
  location: string;
  checkInDate: Date | null;
  checkOutDate: Date | null;
  guests: {
    adults: number;
    children: number;
    infants: number;
    pets: number;
  };
  
  // Reservation details
  guestMessage: string;
  
  // Actions
  setSearchCriteria: (criteria: {
    location?: string;
    checkInDate?: Date;
    checkOutDate?: Date;
    guests?: SearchState['guests'];
  }) => void;
  
  setReservationDetails: (details: {
    guestMessage?: string;
  }) => void;
  
  setCheckInDate: (date: Date | null) => void;
  setCheckOutDate: (date: Date | null) => void;
  setGuests: (guests: SearchState['guests']) => void;
  
  clearSearch: () => void;
  reset: () => void;
}

const initialState = {
  location: '',
  checkInDate: null,
  checkOutDate: null,
  guests: {
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
  },
  guestMessage: '',
};

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSearchCriteria: (criteria) =>
        set((state) => {
          const updates: any = {};
          if (criteria.location !== undefined) updates.location = criteria.location;
          if (criteria.checkInDate !== undefined) updates.checkInDate = criteria.checkInDate;
          if (criteria.checkOutDate !== undefined) updates.checkOutDate = criteria.checkOutDate;
          if (criteria.guests !== undefined) updates.guests = criteria.guests;
          return { ...state, ...updates };
        }),
      
      setReservationDetails: (details) =>
        set((state) => ({
          guestMessage: details.guestMessage !== undefined ? details.guestMessage : state.guestMessage,
        })),
      
      setCheckInDate: (date) => set({ checkInDate: date }),
      setCheckOutDate: (date) => set({ checkOutDate: date }),
      setGuests: (guests) => set({ guests }),
      
      clearSearch: () =>
        set({
          location: '',
          checkInDate: null,
          checkOutDate: null,
          guests: { adults: 1, children: 0, infants: 0, pets: 0 },
        }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'airlite-search',
      partialize: (state) => ({
        location: state.location,
        checkInDate: state.checkInDate,
        checkOutDate: state.checkOutDate,
        guests: state.guests,
        guestMessage: state.guestMessage,
      }),
    }
  )
);
