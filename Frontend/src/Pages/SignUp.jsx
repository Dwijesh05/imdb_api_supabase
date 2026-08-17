import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import axios from 'axios';

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      // 1. Send the data to your FastAPI backend
      const response = await axios.post('http://localhost:8000/register', {
        username: formData.name,
        email: formData.email,
        password: formData.password
      });

      // 2. If successful, redirect to the login page
      console.log("Registration successful!", response.data);
      navigate('/login');

    } catch (err) {
      // 3. Catch errors from the backend (like "Email already registered")
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className='min-h-screen flex justify-center items-center bg-gray-900 p-4'>
      <div className='flex flex-col items-center bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[400px] p-8 gap-4 text-white'>
        <div className='flex items-center gap-2'>
          <Clapperboard size={30} className="text-yellow-400" />
          <h1 className='text-4xl font-extrabold'>
            Flick<span className='text-yellow-400'>Picker</span>
          </h1>
        </div>

        <div className='text-center'>
          <h2 className='text-2xl font-bold'>Create an Account</h2>
          <p className='text-sm text-gray-400 mt-1'>Sign up to start saving your preferences.</p>
        </div>

        {error && (
          <div className='w-full bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-xl text-xs text-center'>
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className='flex flex-col gap-4 w-full'>
          <input 
            type='text' 
            name='name'
            value={formData.name}
            onChange={handleChange}
            placeholder='User Name' 
            className='bg-gray-700 text-white outline-none border border-gray-600 focus:border-yellow-400 px-4 py-3 rounded-xl w-full transition-colors'
          />
          <input 
            type='email' 
            name='email'
            value={formData.email}
            onChange={handleChange}
            placeholder='Email address' 
            className='bg-gray-700 text-white outline-none border border-gray-600 focus:border-yellow-400 px-4 py-3 rounded-xl w-full transition-colors'
          />
          <input 
            type='password' 
            name='password'
            value={formData.password}
            onChange={handleChange}
            placeholder='Password' 
            className='bg-gray-700 text-white outline-none border border-gray-600 focus:border-yellow-400 px-4 py-3 rounded-xl w-full transition-colors'
          />
          <input 
            type='password' 
            name='confirmPassword'
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder='Confirm Password' 
            className='bg-gray-700 text-white outline-none border border-gray-600 focus:border-yellow-400 px-4 py-3 rounded-xl w-full transition-colors'
          />

          <button 
            type='submit'
            className='bg-yellow-400 font-bold text-black px-4 py-3 mt-2 rounded-xl w-full hover:bg-yellow-500 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer'
          >
            Sign Up
          </button>
        </form>

        <p className='text-center text-gray-400 text-sm mt-2'>
          Already have an account?{' '}
          <Link to="/login" className='text-white hover:text-yellow-400 font-semibold transition-colors'>
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;