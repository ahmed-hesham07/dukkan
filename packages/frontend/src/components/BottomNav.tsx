import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const tabs = [
  {
    path: '/',
    labelKey: 'nav.dashboard',
    exact: true,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <rect x="3" y="3" width="7" height="7" rx="2" fill={active ? '#7C3AED' : 'none'} stroke={active ? '#7C3AED' : '#9C94B8'} strokeWidth="1.8"/>
        <rect x="14" y="3" width="7" height="7" rx="2" fill={active ? '#7C3AED' : 'none'} stroke={active ? '#7C3AED' : '#9C94B8'} strokeWidth="1.8"/>
        <rect x="3" y="14" width="7" height="7" rx="2" fill={active ? '#7C3AED' : 'none'} stroke={active ? '#7C3AED' : '#9C94B8'} strokeWidth="1.8"/>
        <rect x="14" y="14" width="7" height="7" rx="2" fill={active ? '#7C3AED' : 'none'} stroke={active ? '#7C3AED' : '#9C94B8'} strokeWidth="1.8"/>
      </svg>
    ),
  },
  {
    path: '/orders',
    labelKey: 'nav.orders',
    exact: false,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          stroke={active ? '#7C3AED' : '#9C94B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        {active && <path d="M9 12h6M9 16h4" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round"/>}
      </svg>
    ),
  },
  {
    path: '/inventory',
    labelKey: 'nav.inventory',
    exact: false,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          stroke={active ? '#7C3AED' : '#9C94B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    path: '/customers',
    labelKey: 'nav.customers',
    exact: false,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 11a4 4 0 100-8 4 4 0 000 8z"
          stroke={active ? '#7C3AED' : '#9C94B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    path: '/settings',
    labelKey: 'nav.settings',
    exact: false,
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          stroke={active ? '#7C3AED' : '#9C94B8'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke={active ? '#7C3AED' : '#9C94B8'} strokeWidth="1.8"/>
      </svg>
    ),
  },
];

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2 no-print">
      <div
        className="grid grid-cols-5 rounded-2xl overflow-hidden"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8E6F5',
          boxShadow: '0 -2px 20px rgba(19,15,42,0.08), 0 4px 24px rgba(19,15,42,0.06)',
        }}
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.exact}
            className="relative flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200"
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    className="absolute inset-x-2 top-1 bottom-1 rounded-xl"
                    style={{ background: '#EDE9FE' }}
                  />
                )}
                <span className="relative z-10">{tab.icon(isActive)}</span>
                <span
                  className="relative z-10 text-xs font-semibold"
                  style={{ color: isActive ? '#7C3AED' : '#9C94B8' }}
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
