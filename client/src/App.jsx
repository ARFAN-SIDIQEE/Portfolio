import Admin from './components/admin/Admin.jsx';
import Portfolio from './components/Portfolio.jsx';

export default function App() {
  return window.location.pathname.replace(/\/+$/, '') === '/admin' ? <Admin /> : <Portfolio />;
}
