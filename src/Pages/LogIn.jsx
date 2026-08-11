import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LogIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogIn = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    
    const registeredUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');

    const user = registeredUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      setError('Invalid email or password. Please try again or Sign Up.');
      return;
    }

    
    localStorage.setItem('current_user', JSON.stringify(user));


    navigate('/');
  };

  return (
    <div className='min-h-screen justify-center items-center flex bg-gray-900 p-4'>
      <div className='flex flex-col bg-gray-800 rounded-2xl shadow-2xl w-full max-w-[400px] p-8 gap-4 text-white'>
        <div className='text-center mb-2'>
          <h1 className='text-4xl font-extrabold mb-2 text-white'>
            Flick<span className='text-yellow-400'>Picker</span>
          </h1>
          <h2 className='text-2xl font-bold text-gray-300'>Welcome Back</h2>
          <p className='text-gray-400 text-sm mt-1'>Log in to pick up where you left off.</p>
        </div>

        {error && (
          <div className='w-full bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-xl text-xs text-center'>
            {error}
          </div>
        )}

        <form onSubmit={handleLogIn} className='flex flex-col gap-4'>
          <input 
            type='email' 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='Email address' 
            className='bg-gray-700 text-white outline-none border border-gray-600 focus:border-yellow-400 px-4 py-3 rounded-xl w-full transition-colors'
          />
          <input 
            type='password' 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='Password' 
            className='bg-gray-700 text-white outline-none border border-gray-600 focus:border-yellow-400 px-4 py-3 rounded-xl w-full transition-colors'
          />

          <div className='flex justify-end'>
            <button type='button' className='text-sm text-gray-400 hover:text-yellow-400 transition-colors'>
              Forgot Password?
            </button>
          </div>

          <button 
            type='submit'
            className='bg-yellow-400 font-bold text-black px-4 py-3 mt-2 rounded-xl w-full hover:bg-yellow-500 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer'
          >
            Log In
          </button>
        </form>

        <p className='text-center text-gray-400 text-sm mt-2'>
          New to FlickPicker?{' '}
          <Link to="/signup" className='text-white hover:text-yellow-400 font-semibold transition-colors'>
            Sign up now.
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LogIn;