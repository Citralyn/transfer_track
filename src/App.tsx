import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { ProfessorDashboardPage } from './pages/ProfessorDashboardPage'
import { ProfessorPage } from './pages/ProfessorPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,241,235,0.9),_transparent_35%),_linear-gradient(180deg,_#fff,_#fff)] text-slate-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/onboarding" element={<Navigate to="/onboarding/profile" replace />} />
          <Route path="/onboarding/:step" element={<OnboardingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/professor/:id" element={<ProfessorPage />} />
          <Route path="/professor-dashboard" element={<ProfessorDashboardPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
