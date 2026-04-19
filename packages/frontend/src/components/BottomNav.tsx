import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const tabs = [
  {
    path: '/',
    labelKey: 'nav.orders',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          stroke={active ? 'url(#g1)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#a855f7"/><stop offset="1" stopColor="#06b6d4"/>
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    path: '/inventory',
    labelKey: 'nav.inventory',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          stroke={active ? 'url(#g2)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#a855f7"/><stop offset="1" stopColor="#06b6d4"/>
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    path: '/customers',
    labelKey: 'nav.customers',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z"
          stroke={active ? 'url(#g3)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#a855f7"/><stop offset="1" stopColor="#06b6d4"/>
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          stroke={active ? 'url(#g4)' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke={active ? 'url(#g4a)' : 'currentColor'} strokeWidth="2"/>
        <defs>
          <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#a855f7"/><stop offset="1" stopColor="#06b6d4"/>
          </linearGradient>
          <linearGradient id="g4a" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#a855f7"/><stop offset="1" stopColor="#06b6d4"/>
          </linearGradient>
        </defs>
      </svg>
    ),
  },
];

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-0"
      style={{ background: 'transparent' }}
    >
      <div
        className="grid grid-cols-4 rounded-3xl overflow-hidden"
        style={{
          background: 'rgba(14,14,30,0.88)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)',
        }}
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold
               transition-all duration-200
               ${isActive ? 'text-transparent bg-clip-text' : 'text-white/40 hover:text-white/70'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-3xl opacity-100"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(6,182,212,0.08) 100%)',
                    }}
                  />
                )}
                {isActive && (
                  <div
                    className="absolute top-0 inset-x-4 h-0.5 rounded-full"
                    style={{ background: 'linear-gradient(90deg, #7c3aed, #06b6d4)' }}
                  />
                )}
                <span className="relative z-10">{tab.icon(isActive)}</span>
                <span
                  className="relative z-10 text-xs font-semibold"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  } : {}}
                >
                  {t(tab.labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
