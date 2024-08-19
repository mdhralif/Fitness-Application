import { Box } from '@mui/material';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import './App.css';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ExerciseDetail from './pages/ExerciseDetail';
import Home from './pages/Home';
import StartPushUp from './pages/StartPushUps';
import StartSitUps from './pages/StartSitUp';

const App = () => (
  <Box width="400px" sx={{ width: { xl: '1488px' } }} m="auto">
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/exercise/:id" element={<ExerciseDetail />} />
      <Route path="/exercise/:id/0001/start" element={ <StartSitUps/>} />
      <Route path="/exercise/:id/0975/start" element={<StartPushUp/>} />
    </Routes>
    <Footer />
  </Box>
);

export default App;
