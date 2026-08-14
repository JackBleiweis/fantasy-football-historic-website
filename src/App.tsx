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
import { Playoffs } from './pages/Playoffs/Playoffs';
import { Champions } from './pages/Champions/Champions';
import { ManagerProfile } from './pages/ManagerProfile/ManagerProfile';
import { Managers } from './pages/Managers/Managers';
import { MatchupDetail } from './pages/MatchupDetail/MatchupDetail';

function App() {
  return (
    <ManagerModalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/:leagueId" element={<Layout />}>
            <Route index element={<LeagueHome />} />
            <Route path="drafts" element={<Drafts />} />
            <Route path="drafts/:year" element={<Drafts />} />
            <Route path="standings" element={<Standings />} />
            <Route path="standings/:year" element={<Standings />} />
            <Route path="season" element={<Season />} />
            <Route path="season/:year" element={<Season />} />
            <Route
              path="season/:year/matchup/:week/:team1Id"
              element={<MatchupDetail />}
            />
            <Route path="playoffs" element={<Playoffs />} />
            <Route path="playoffs/:year" element={<Playoffs />} />
            <Route path="champions" element={<Champions />} />
            <Route path="records" element={<Records />} />
            <Route path="managers" element={<Managers />} />
            <Route path="managers/:managerId" element={<ManagerProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ManagerModal />
      </BrowserRouter>
    </ManagerModalProvider>
  );
}

export default App;
