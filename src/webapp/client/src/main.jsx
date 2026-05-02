import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import LandingPage from './LandingPage.jsx';
import './index.css';

function Root() {
  const [view, setView] = React.useState(
    window.location.hash === '#app' ? 'app' : 'landing'
  );

  React.useEffect(() => {
    const handler = () => setView(window.location.hash === '#app' ? 'app' : 'landing');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  if (view === 'app') return <App />;
  return <LandingPage onEnter={() => { window.location.hash = '#app'; }} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
