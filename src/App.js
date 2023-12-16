
import React from 'react'
import ImageUpload from './Components/ImageUpload'
import "./App.css"
import Navbar from './Components/Navbar'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';

export default function App() {
  return (
    <>
    <Navbar></Navbar>
  <ImageUpload></ImageUpload>
  <ToastContainer></ToastContainer>
  </>
  )
}
