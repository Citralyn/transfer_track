import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Users, Sparkles, MessageCircle } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-brand-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
            TT
          </div>
          <span className="text-2xl font-bold text-brand-900 tracking-tight">Transfer Track</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-brand-700 font-medium hover:text-brand-900 transition-colors">
            Login
          </Link>
          <Link to="/signup" className="gradient-brand text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 pt-20 pb-32 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-brand-200 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent-100 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-brand-900 mb-6 leading-tight">
          Your Bridge to <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-brand-500 to-accent-500">Academic Excellence</span>
        </h1>
        <p className="text-xl text-brand-700 mb-10 max-w-2xl mx-auto leading-relaxed">
          The social network dedicated to California transfer students. Connect with 4-year professors, discover research opportunities, and build your transfer roadmap.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="w-full sm:w-auto gradient-brand text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            Join the Community <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="w-full sm:w-auto bg-white text-brand-800 border border-brand-200 px-8 py-4 rounded-full font-bold text-lg shadow-sm hover:shadow-md transition-all">
            Learn More
          </a>
        </div>
      </header>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-900 mb-4">Built for Transfer Success</h2>
            <p className="text-brand-600 max-w-2xl mx-auto">Everything you need to navigate the journey from Community College to University.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<GraduationCap className="w-8 h-8 text-white" />}
              title="Professor Connections"
              description="Directly message faculty at your target universities to discuss research, classes, and transfer advice."
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-white" />}
              title="Research & Labs"
              description="Discover exclusive opportunities for transfer students to join research labs and academic projects."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-white" />}
              title="Peer Network"
              description="Connect with fellow transfer students to share resources, tips, and support through the application process."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto gradient-brand rounded-3xl p-12 md:p-20 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/10 rounded-full blur-3xl" />
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10">
            Ready to start your next chapter?
          </h2>
          <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto relative z-10">
            Join thousands of California students and professors building the future of academic collaboration.
          </p>
          <Link to="/signup" className="inline-block bg-white text-accent-600 px-10 py-4 rounded-full font-bold text-xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1 relative z-10">
            Create Your Profile
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-brand-100 text-center text-brand-500">
        <p>© 2026 Transfer Track. Supporting California's academic journey.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-brand-50 p-8 rounded-3xl border border-brand-100 hover:border-brand-300 transition-all hover:shadow-lg group">
      <div className="w-16 h-16 gradient-brand rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-brand-900 mb-3">{title}</h3>
      <p className="text-brand-600 leading-relaxed">{description}</p>
    </div>
  )
}
