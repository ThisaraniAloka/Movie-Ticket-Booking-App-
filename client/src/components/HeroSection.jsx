import React from 'react'
import {assets} from '../assets/assets'
import {ArrowRight, CalendarIcon, ClockIcon} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const HeroSection = () => {
  const navigate = useNavigate()  
  return (
    <div className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36
    bg-[url("/backgroundImage1.png")] bg-cover bg-center h-screen 
    '>
        <img src={assets.marvelLogo1} alt='' className='max-h-30 lg:h-30 -mt-0' />
        <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold max-w-310'>Hidden Face</h1>
        <div className='flex items-center gap-4 text-gray-300'>
            <span>Action | Adventure | Sci-Fi</span>
            <div className='flex items-center gap-1'>
                <CalendarIcon className='w-4.5 h-4.5'/> 2025
            </div>
            <div className='flex items-center gap-1'>
                <ClockIcon className='w-4.5 h-4.5'/> 2h 30m
            </div>
        </div>
        <p className='max-w-md text-gray-200'>Hidden Face is a Spanish thriller about a woman who mysteriously disappears, leading to a tense unraveling of secrets and betrayals among those close to her. The film explores themes of obsession, love, and deception, keeping viewers on edge until its shocking conclusion.
        </p>
        <button onClick={() => navigate('/movies')} className='flex items-center gap-1 px-6 py-3 text-sm bg-primary
        hover:bg-primary-dull transition rounded-full font-medium cursor-pointer
        '>
            Explore Movies 
            <ArrowRight className='w-5 h-5'/>
        </button>
    </div>
  )
}

export default HeroSection