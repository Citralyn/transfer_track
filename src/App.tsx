import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfessorDashboardPage } from './pages/ProfessorDashboardPage'
import { ProfessorPage } from './pages/ProfessorPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/professor/:id" element={<ProfessorPage />} />
          <Route path="/professor-dashboard" element={<ProfessorDashboardPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
