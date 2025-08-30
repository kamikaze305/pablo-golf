import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { JoinRoomPage } from './pages/JoinRoomPage';

import { Layout } from './components/Layout';
import { MusicProvider } from './contexts/MusicContext';

function App() {
  return (
    <MusicProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/game/:roomId" element={<GamePage />} />
          <Route path="/join/:roomKey" element={<JoinRoomPage />} />
  
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </MusicProvider>
  );
}

export default App;

