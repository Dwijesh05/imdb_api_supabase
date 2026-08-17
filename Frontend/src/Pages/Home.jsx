import React from 'react'
import Navbar from '../Components/Navbar'
import Footer from '../Components/Footer'
import BodyContent from '../Components/BodyContent'

const Home = () => {
  return (
    <div className='h-screen flex flex-col bg-gray-900 text-white overflow-hidden'>
        <div className='shrink-0 z-40'>
          <Navbar/>
        </div>

        {/* Made main scrollable and added scrollbar hiding utilities */}
        <main className='flex-grow overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
            <BodyContent/>
            <Footer/>
        </main>
    </div>
  )
}

export default Home