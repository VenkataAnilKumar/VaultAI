import { create } from 'zustand';

const useToastStore = create((set) => ({
  toasts: [],
  add: (msg, type = 'info', duration = 3200) => {
    const id = Date.now() + Math.random();
    set(s => ({ toasts: [...s.toasts, { id, msg, type, exiting: false }] }));
    // Start exit animation then remove
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.map(t => t.id === id ? { ...t, exiting: true } : t) }));
      setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 320);
    }, duration);
    return id;
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export function useToast() {
  const { add } = useToastStore();
  return {
    toast:   (msg, type, dur) => add(msg, type, dur),
    success: (msg, dur)       => add(msg, 'success', dur),
    error:   (msg, dur)       => add(msg, 'error',   dur),
    info:    (msg, dur)       => add(msg, 'info',    dur),
    warn:    (msg, dur)       => add(msg, 'warn',    dur),
  };
}

export default useToastStore;
