import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  mobileView: 'list' | 'chat' | 'empty';
  commandOpen: boolean;
  searchOpen: boolean;
  callOverlay: { open: boolean; type: 'audio' | 'video'; peerName: string; peerPhoto: string | null; state: 'outgoing' | 'connected' | 'ended'; incoming: boolean } | null;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
  setMobileView: (view: 'list' | 'chat' | 'empty') => void;
  setCommandOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  openCall: (opts: { type: 'audio' | 'video'; peerName: string; peerPhoto: string | null; incoming?: boolean }) => void;
  closeCall: () => void;
  setCallState: (state: 'outgoing' | 'connected' | 'ended') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  mobileView: 'list',
  commandOpen: false,
  searchOpen: false,
  callOverlay: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar: (open) => set({ sidebarOpen: open }),
  setMobileView: (view) => set({ mobileView: view }),
  setCommandOpen: (open) => set({ commandOpen: open }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  openCall: (opts) =>
    set({
      callOverlay: {
        open: true,
        type: opts.type,
        peerName: opts.peerName,
        peerPhoto: opts.peerPhoto,
        state: opts.incoming ? 'outgoing' : 'outgoing',
        incoming: opts.incoming ?? false,
      },
    }),
  closeCall: () => set({ callOverlay: null }),
  setCallState: (state) =>
    set((s) => (s.callOverlay ? { callOverlay: { ...s.callOverlay, state } } : s)),
}));
