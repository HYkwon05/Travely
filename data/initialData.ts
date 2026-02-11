import { Trip, SavedPlace, BlockType } from '../types';

export const MOCK_SAVED_PLACES: SavedPlace[] = [
    { 
        id: 'p1', 
        name: 'Giolitti', 
        category: 'GELATO', 
        rating: 4.8, 
        reviewCount: 9000, 
        description: 'Famous historic gelateria', 
        imageUrl: 'https://images.unsplash.com/photo-1579954115563-e72bf1381629?w=500', 
        isSaved: true, 
        lat: 41.9008, 
        lng: 12.4787,
        bookingStatus: 'NONE',
        googleMapLink: 'https://goo.gl/maps/example1'
    },
    { 
        id: 'p2', 
        name: 'Salimbocca', 
        category: 'RESTAURANT', 
        rating: 4.5, 
        reviewCount: 1848, 
        description: 'Classic Italian dishes', 
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500', 
        isSaved: true, 
        lat: 41.9054, 
        lng: 12.4823,
        bookingStatus: 'BOOKED',
        googleMapLink: 'https://goo.gl/maps/example2'
    }
];

export const INITIAL_TRIP: Trip = {
  id: 'trip-1',
  title: 'Roma Holiday',
  startDate: '2025-05-29',
  endDate: '2025-06-07',
  currency: 'EUR',
  budget: 7000000, 
  members: ['Me'],
  savedPlaces: MOCK_SAVED_PLACES,
  scraps: [],
  manualExpenses: [
      { id: 'me1', title: 'Incheon -> Rome Tway', amount: 1104400, currency: 'KRW', category: 'FLIGHT', isPaid: true },
      { id: 'me2', title: 'Munich -> Incheon Qatar', amount: 1439942, currency: 'KRW', category: 'FLIGHT', isPaid: true },
      { id: 'me3', title: 'Rome 2 Nights (Pinocchio Minbak)', amount: 341000, currency: 'KRW', category: 'ACCOMMODATION', isPaid: true },
  ],
  checklists: [
      {
          id: 'cg1',
          title: 'Pre-Trip Tasks',
          items: [
            { id: 'c1', text: 'Renew Passport', checked: true },
            { id: 'c2', text: 'Exchange Currency', checked: false },
          ]
      },
      {
          id: 'cg2',
          title: 'Packing List',
          items: [
            { id: 'p1', text: 'Power Adapter', checked: false },
            { id: 'p2', text: 'Sunscreen', checked: false },
          ]
      }
  ],
  documents: [],
  days: [
    {
      id: 'day-1',
      date: '2025-05-29',
      location: 'Arrival',
      blocks: [
        { 
            id: 'b1', 
            type: BlockType.LOCATION, 
            content: 'Fiumicino Airport', 
            meta: { status: 'BOOKED', lat: 41.7999, lng: 12.2462 },
            children: [
                { id: 'c1', type: BlockType.TEXT, content: 'T\'way TW405 / 19:15 Arrival' },
                { id: 'c2', type: BlockType.IMAGE, content: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&q=80' }
            ] 
        },
        { id: 't1', type: BlockType.TRANSPORT, content: '', meta: { mode: 'TRAIN', color: '#3b82f6', duration: '30m' } },
        { 
            id: 'b2', 
            type: BlockType.LOCATION, 
            content: 'Roma Termini Station',
            meta: { status: 'NONE', lat: 41.9014, lng: 12.5005 },
            children: [
                { id: 'c3', type: BlockType.EXPENSE, content: 'Express Train Ticket', meta: { amount: 14, currency: 'EUR', category: 'TRANSPORT', isPaid: false } }
            ] 
        },
      ]
    }
  ]
};