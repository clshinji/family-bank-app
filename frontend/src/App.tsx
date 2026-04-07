import { Routes, Route, Navigate } from 'react-router-dom';
import { KidHome } from './pages/KidHome';
import { KidHistory } from './pages/KidHistory';
import { ParentDashboard } from './pages/ParentDashboard';
import { ParentOperate } from './pages/ParentOperate';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/parent" replace />} />
      <Route path="/kids/:childId" element={<KidHome />} />
      <Route path="/kids/:childId/history" element={<KidHistory />} />
      <Route path="/parent" element={<ParentDashboard />} />
      <Route path="/parent/:childId" element={<ParentOperate />} />
    </Routes>
  );
}
