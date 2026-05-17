import { Link } from 'react-router-dom'
import { ArrowRight, GraduationCap, Users, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import logo from '@/assets/red_train.png'

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Transfer Track" className="w-10 h-10 object-contain" />
          <span className="text-3xl font-logo text-[#ff3b30] tracking-tight">Transfer Track</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-[#1d1d1f] font-bold hover:text-[#1d1d1f] transition-colors">
            Login
          </Link>
          <Link to="/signup" className="bg-[#ff3b30] text-white px-5 py-2.5 rounded-full font-bold shadow-xl hover:shadow-xl transition-all transform hover:-translate-y-0.5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="px-6 pt-24 pb-32 max-w-7xl mx-auto text-center relative">
        <div className="flex justify-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
           <div className="w-full max-w-2xl aspect-[21/9] bg-gradient-to-br from-[#ff3b30]/10 to-[#34c759]/10 rounded-[40px] border border-black/5 flex items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-around opacity-10 grayscale select-none">
                 <img src={logo} alt="" className="w-20 h-20 object-contain -rotate-12" />
                 <img src={logo} alt="" className="w-24 h-24 object-contain rotate-12" />
                 <img src={logo} alt="" className="w-20 h-20 object-contain -rotate-6" />
                 <img src={logo} alt="" className="w-28 h-28 object-contain rotate-6" />
              </div>
              <p className="text-[#1d1d1f] font-semibold text-lg relative z-10 flex flex-col items-center gap-2">
                 <img src="/src/assets/apples_background.jpg"></img>
              </p>
           </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-[#1d1d1f] mb-8 leading-tight tracking-tight">
          A Fresh Start to <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3b30] to-[#ff9500]">Academic Growth</span>
        </h1>
        <p className="text-xl text-[#86868b] mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
          Connect with faculty, discover research, and cultivate your academic future with the social network for transfer students.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link to="/signup" className="w-full sm:w-auto bg-[#ff3b30] text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2">
            Start Your Journey <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="w-full sm:w-auto bg-white text-[#1d1d1f] border border-black/10 px-10 py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-xl hover:scale-105 transition-all">
            Explore More
          </a>
        </div>
      </header>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-[#1d1d1f] mb-4">Built for Transfer Success</h2>
            <p className="text-[#1d1d1f] max-w-2xl mx-auto">Everything you need to navigate the journey from Community College to University.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<GraduationCap className="w-8 h-8 text-white" />}
              title="Professor Connections"
              description="Directly message faculty at your target universities to discuss research, classes, and transfer advice."
              color="bg-[#ff3b30]"
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-[#1d1d1f]" />}
              title="Research & Labs"
              description="Discover exclusive opportunities for transfer students to join research labs and academic projects."
              color="bg-[#ffcc00]"
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-white" />}
              title="Peer Network"
              description="Connect with fellow transfer students to share resources, tips, and support through the application process."
              color="bg-[#af52de]"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-[#34c759] border border-black/5 rounded-xl p-12 md:p-20 text-center shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-xl blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-black/10 rounded-xl blur-3xl" />
          
          <h2 className="text-3xl md:text-5xl font-semibold text-[#1d1d1f] mb-8 relative z-10 uppercase tracking-tighter">
            Ready to start your next chapter?
          </h2>
          <p className="text-[#1d1d1f] font-semibold text-xl mb-12 max-w-2xl mx-auto relative z-10">
            Join thousands of California students and professors building the future of academic collaboration.
          </p>
          <Link to="/signup" className="inline-block bg-white text-[#1d1d1f] border border-black/5 px-10 py-4 rounded-xl font-semibold text-xl shadow-xl hover:shadow-xl hover:translate-x-1 hover:translate-y-1 transition-all relative z-10 uppercase">
            Create Your Profile
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-black/5 text-center text-[#1d1d1f] font-semibold uppercase tracking-widest">
        <p>© 2026 Transfer Track. Supporting California's academic journey.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) {
  return (
    <div className="bg-white p-8 rounded-xl border border-black/5 hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all shadow-xl group">
      <div className={clsx("w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-black/5 shadow-xl group-hover:scale-110 transition-transform", color)}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[#1d1d1f] mb-3 uppercase tracking-tighter">{title}</h3>
      <p className="text-[#1d1d1f] font-semibold leading-relaxed">{description}</p>
    </div>
  )
}
