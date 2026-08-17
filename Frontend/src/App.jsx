import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './Pages/Home';
import LogIn from './Pages/LogIn';
import SignUp from './Pages/SignUp';
import Search from './Pages/Search';
import Results from './Pages/Results';
import MovieDetails from './Components/MovieDetails';

const ProtectedRoute = ({ children }) => 
  localStorage.getItem('access_token') ? children : <Navigate to="/login" replace />;

const App = () => (
  <Routes>
    <Route path="/login" element={<LogIn />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
    <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
    <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
    <Route path="/movie-details" element={<ProtectedRoute><MovieDetails /></ProtectedRoute>} />
    <Route path="*" element={<ProtectedRoute><Home /></ProtectedRoute>} />
  </Routes>
);

export default App;