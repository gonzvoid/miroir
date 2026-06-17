const E = typeof window !== 'undefined' && window.lumen;

export const googleCalendar = {
  isConnected:    ()           => E ? window.lumen.googleIsConnected()              : Promise.resolve(false),
  getAccounts:    ()           => E ? window.lumen.googleAccounts()                 : Promise.resolve([]),
  connect:        ()           => E ? window.lumen.googleConnect()                  : Promise.resolve({ success: false }),
  disconnect:     (email)      => E ? window.lumen.googleDisconnect(email)          : Promise.resolve(),
  setDisplayName: (email, name)=> E ? window.lumen.googleSetDisplayName(email, name): Promise.resolve(),
  listEvents:     (p)          => E ? window.lumen.googleEvents(p)                  : Promise.resolve({ events: [] }),
};
