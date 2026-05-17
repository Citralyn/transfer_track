import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Users, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#fdfcf0]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#ff0000] rounded-none flex items-center justify-center text-white font-black text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            TT
          </div>
          <span className="text-2xl font-black text-black tracking-tight">Transfer Track</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-black font-bold hover:text-black transition-colors">
            Login
          </Link>
          <Link to="/signup" className="bg-[#ff0000] text-white px-5 py-2.5 rounded-none font-bold shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 pt-20 pb-32 max-w-7xl mx-auto text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-brand-200 rounded-none blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent-100 rounded-none blur-3xl animate-pulse delay-1000" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-black text-black mb-6 leading-tight uppercase tracking-tighter">
          Your Bridge to <br />
          <span className="text-white bg-black px-4 py-2 inline-block -rotate-2 mt-2">Academic Excellence</span>
        </h1>
        <p className="text-xl text-black mb-10 max-w-2xl mx-auto leading-relaxed">
          The social network dedicated to California transfer students. Connect with 4-year professors, discover research opportunities, and build your transfer roadmap.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/signup" className="w-full sm:w-auto bg-[#ff0000] text-white px-8 py-4 rounded-none font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
            Join the Community <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="w-full sm:w-auto bg-white text-black border-4 border-black px-8 py-4 rounded-none font-black text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
            Learn More
          </a>
        </div>
      </header>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-black mb-4">Built for Transfer Success</h2>
            <p className="text-black max-w-2xl mx-auto">Everything you need to navigate the journey from Community College to University.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<GraduationCap className="w-8 h-8 text-white" />}
              title="Professor Connections"
              description="Directly message faculty at your target universities to discuss research, classes, and transfer advice."
              color="bg-[#ff0000]"
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-black" />}
              title="Research & Labs"
              description="Discover exclusive opportunities for transfer students to join research labs and academic projects."
              color="bg-[#ffff00]"
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-white" />}
              title="Peer Network"
              description="Connect with fellow transfer students to share resources, tips, and support through the application process."
              color="bg-[#ff00ff]"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-[#00ff00] border-4 border-black rounded-none p-12 md:p-20 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-none blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/10 rounded-none blur-3xl" />
          
          <h2 className="text-3xl md:text-5xl font-black text-black mb-8 relative z-10 uppercase tracking-tighter">
            Ready to start your next chapter?
          </h2>
          <p className="text-black font-black text-xl mb-12 max-w-2xl mx-auto relative z-10">
            Join thousands of California students and professors building the future of academic collaboration.
          </p>
          <Link to="/signup" className="inline-block bg-white text-black border-4 border-black px-10 py-4 rounded-none font-black text-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all relative z-10 uppercase">
            Create Your Profile
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t-4 border-black text-center text-black font-black uppercase tracking-widest">
        <p>© 2026 Transfer Track. Supporting California's academic journey.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <div className="bg-white p-8 rounded-none border-4 border-black hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group">
      <div className={clsx("w-16 h-16 rounded-none flex items-center justify-center mb-6 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform", color)}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-black mb-3 uppercase tracking-tighter">{title}</h3>
      <p className="text-black font-black leading-relaxed">{description}</p>
    </div>
  )
}
