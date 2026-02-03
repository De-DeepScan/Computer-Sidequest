import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GamemasterProvider } from './context/GamemasterContext';
import LockScreen from './components/LockScreen/LockScreen';
import Home from './components/Home/Home';
import './App.css';

function App() {
  return (
    <GamemasterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LockScreen />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </GamemasterProvider>
  );
}

export default App;
