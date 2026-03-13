import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MeetingPage from './pages/MeetingPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/meeting" element={<MeetingPage />} />
      </Routes>
    </Router>
  );
}

export default App;