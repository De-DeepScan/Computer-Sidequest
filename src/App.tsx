import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LockScreen from './components/LockScreen/LockScreen';
import Home from './components/Home/Home';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LockScreen />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
