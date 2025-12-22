// src/pages/CheckoutLayout.jsx

  import { Outlet, useLocation, matchPath } from 'react-router-dom';
  import "@/app/styles/checkoutPage.css";

  const STEPS = [
    { path: '/checkout', label: 'Address' },
    { path: '/checkout/summary', label: 'Summary' },
    { path: '/checkout/payment', label: 'Payment' },
  ];

  export default function CheckoutLayout() {
    const { pathname } = useLocation();
    const currentIndex = STEPS.findIndex(s =>
      matchPath({ path: s.path, end: true }, pathname)
    );
    const step = currentIndex === -1 ? 0 : currentIndex;
    const progress = `${(step / (STEPS.length - 1)) * 100}%`;

    return (
      <>
        <div className="step-tracker-wrapper">
          <div className="step-tracker">
            <div className="progress-line" style={{ width: progress }} />
            {STEPS.map((s, i) => (
              <div
                key={s.label}
                className={`step ${i < step ? 'done' : i === step ? 'active' : ''}`}
              >
                <div className="circle">
                  {i < step ? <i className="bi bi-check-lg" /> : i + 1}
                </div>
                <div className="label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="container step-content">
          <Outlet />
        </div>
      </>
    );
  }
