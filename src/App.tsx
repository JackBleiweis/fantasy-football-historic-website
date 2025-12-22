import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ManagerModalProvider } from './contexts/ManagerModalProvider';
import { ManagerModal } from './components/ManagerModal/ManagerModal';
import { Layout } from './components/Layout/Layout';
import { Home } from './pages/Home/Home';
import { LeagueHome } from './pages/LeagueHome/LeagueHome';
import { Drafts } from './pages/Drafts/Drafts';
import { Standings } from './pages/Standings/Standings';
import { Records } from './pages/Records/Records';
import { Season } from './pages/Season/Season';

function App() {
  return (
    <ManagerModalProvider>
      <BrowserRouter>
        <Routes>
          {/* Home - League Selector */}
          <Route path="/" element={<Home />} />

          {/* League Routes */}
          <Route path="/:leagueId" element={<Layout />}>
            <Route index element={<LeagueHome />} />
            <Route path="drafts" element={<Drafts />} />
            <Route path="drafts/:year" element={<Drafts />} />
            <Route path="standings" element={<Standings />} />
            <Route path="standings/:year" element={<Standings />} />
            <Route path="season" element={<Season />} />
            <Route path="season/:year" element={<Season />} />
            <Route path="records" element={<Records />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <ManagerModal />
    </ManagerModalProvider>
  );
}

export default App;
