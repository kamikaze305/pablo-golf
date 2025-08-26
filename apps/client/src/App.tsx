import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { QAPage } from './pages/QAPage';
import { Layout } from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
        <Route path="/join/:roomKey" element={<JoinRoomPage />} />
        <Route path="/qa" element={<QAPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  );
}

export default App;

