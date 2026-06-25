import Background from './components/Background'
import Nav from './components/Nav'
import Hero from './components/Hero'
import HowItWorks from './components/HowItWorks'
import ClaimDemo from './components/ClaimDemo'
import Stack from './components/Stack'
import Footer from './components/Footer'

export default function App() {
  return (
    <>
      <Background />
      <Nav />
      <main className="relative">
        <Hero />
        <HowItWorks />
        <ClaimDemo />
        <Stack />
        <Footer />
      </main>
    </>
  )
}
