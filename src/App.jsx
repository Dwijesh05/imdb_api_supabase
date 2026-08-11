import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './Pages/Home';
import LogIn from './Pages/LogIn';
import SignUp from './Pages/SignUp';
import Search from './Pages/Search';
import Results from './Pages/Results';
import MovieDetails from './Components/MovieDetails';
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} /> 
      
      <Route path="/login" element={<LogIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path='/search' element={<Search/>}/>
      <Route path='/results' element={<Results/>}/>
      <Route path='/movie-details' element={<MovieDetails/>}/>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}

export default App;