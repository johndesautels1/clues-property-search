import React from 'react';

const CluesFooter: React.FC = () => {
  return (
    <footer className="relative w-full bg-gradient-to-r from-[rgba(10,10,15,0.98)] via-[rgba(30,31,46,0.95)] to-[rgba(10,10,15,0.98)] backdrop-blur-xl border-t border-cyan-500/30 shadow-[0_-8px_32px_rgba(0,0,0,0.6),0_0_80px_rgba(0,255,255,0.15),0_0_40px_rgba(139,92,246,0.1),inset_0_-1px_0_rgba(0,255,255,0.1)] pt-12 px-8 mt-16">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-8">
          {/* Company Information */}
          <div className="transform transition-transform duration-400 hover:translate-z-10">
            <h3 className="font-montserrat text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent mb-4 tracking-wide uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
              Company Information
            </h3>
            <p className="font-montserrat text-base font-bold text-slate-300 my-2 tracking-wide">
              JOHN E. DESAUTELS & ASSOCIATES
            </p>
            <p className="font-montserrat text-sm font-normal text-slate-400 my-1">
              Real Estate Intelligence
            </p>
            <p className="font-montserrat text-sm font-normal text-slate-400 my-1">
              Empowering Your Global Journey
            </p>
            <div className="mt-4 p-4 bg-[#0F52BA]/15 border border-[#0F52BA]/40 rounded-xl backdrop-blur-md shadow-[0_0_20px_rgba(15,82,186,0.2),inset_0_0_20px_rgba(15,82,186,0.1)]">
              <p className="font-montserrat text-base font-bold bg-gradient-to-r from-[#0F52BA] to-[#FFD700] bg-clip-text text-transparent mb-2 tracking-[2px] drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
                CLUES™ Technology
              </p>
              <p className="font-montserrat text-xs font-medium text-[#C0C0C0] leading-relaxed drop-shadow-[0_0_10px_rgba(192,192,192,0.5)]">
                Comprehensive Location &<br/>Utility Evaluation System
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="transform transition-transform duration-400 hover:translate-z-10">
            <h3 className="font-montserrat text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent mb-4 tracking-wide uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
              Contact Information
            </h3>
            <a
              href="mailto:brokerpinellas@gmail.com"
              className="block font-montserrat text-sm font-medium text-slate-400 my-2 px-3 py-2 rounded-lg transition-all duration-300 hover:text-cyan-400 hover:bg-cyan-400/15 hover:translate-x-1 hover:shadow-[0_0_20px_rgba(0,255,255,0.3),0_0_40px_rgba(0,255,255,0.15)]"
            >
              📧 brokerpinellas@gmail.com
            </a>
            <a
              href="mailto:cluesnomads@gmail.com"
              className="block font-montserrat text-sm font-medium text-slate-400 my-2 px-3 py-2 rounded-lg transition-all duration-300 hover:text-cyan-400 hover:bg-cyan-400/15 hover:translate-x-1 hover:shadow-[0_0_20px_rgba(0,255,255,0.3),0_0_40px_rgba(0,255,255,0.15)]"
            >
              📧 cluesnomads@gmail.com
            </a>
            <a
              href="tel:7274523506"
              className="block font-montserrat text-sm font-medium text-slate-400 my-2 px-3 py-2 rounded-lg transition-all duration-300 hover:text-cyan-400 hover:bg-cyan-400/15 hover:translate-x-1 hover:shadow-[0_0_20px_rgba(0,255,255,0.3),0_0_40px_rgba(0,255,255,0.15)]"
            >
              📞 (727) 452-3506
            </a>
            <a
              href="https://cluesnomad.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block font-montserrat text-sm font-medium text-slate-400 my-2 px-3 py-2 rounded-lg transition-all duration-300 hover:text-cyan-400 hover:bg-cyan-400/15 hover:translate-x-1 hover:shadow-[0_0_20px_rgba(0,255,255,0.3),0_0_40px_rgba(0,255,255,0.15)]"
            >
              🌐 cluesnomad.com
            </a>
            <p className="font-montserrat text-sm font-normal text-slate-400 my-2">
              📍 290 41st Ave, St. Pete Beach, FL 33706
            </p>
            <a
              href="https://www.youtube.com/@modernlodges"
              target="_blank"
              rel="noopener noreferrer"
              className="block font-montserrat text-sm font-medium text-slate-400 my-2 px-3 py-2 rounded-lg transition-all duration-300 hover:text-cyan-400 hover:bg-cyan-400/15 hover:translate-x-1 hover:shadow-[0_0_20px_rgba(0,255,255,0.3),0_0_40px_rgba(0,255,255,0.15)]"
            >
              📺 YouTube: @modernlodges
            </a>
          </div>

          {/* Professional Services */}
          <div className="transform transition-transform duration-400 hover:translate-z-10">
            <h3 className="font-montserrat text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent mb-4 tracking-wide uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
              Professional Services
            </h3>
            <p className="font-montserrat text-sm font-medium text-slate-400 my-2 pl-2 border-l-2 border-cyan-500/30 transition-all duration-300 hover:text-cyan-400 hover:border-cyan-500/80 hover:pl-4 hover:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              ✓ Licensed Real Estate Broker FL/CO
            </p>
            <p className="font-montserrat text-sm font-medium text-slate-400 my-2 pl-2 border-l-2 border-cyan-500/30 transition-all duration-300 hover:text-cyan-400 hover:border-cyan-500/80 hover:pl-4 hover:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              ✓ CLUES™ Relocation Intelligence
            </p>
            <p className="font-montserrat text-sm font-medium text-slate-400 my-2 pl-2 border-l-2 border-cyan-500/30 transition-all duration-300 hover:text-cyan-400 hover:border-cyan-500/80 hover:pl-4 hover:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              ✓ International Relocation Specialist
            </p>
            <p className="font-montserrat text-sm font-medium text-slate-400 my-2 pl-2 border-l-2 border-cyan-500/30 transition-all duration-300 hover:text-cyan-400 hover:border-cyan-500/80 hover:pl-4 hover:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              ✓ AI-Powered Market Analysis
            </p>
            <p className="font-montserrat text-sm font-medium text-slate-400 my-2 pl-2 border-l-2 border-cyan-500/30 transition-all duration-300 hover:text-cyan-400 hover:border-cyan-500/80 hover:pl-4 hover:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]">
              ✓ SMART Property Scoring
            </p>
          </div>

          {/* Technology */}
          <div className="transform transition-transform duration-400 hover:translate-z-10">
            <h3 className="font-montserrat text-lg font-bold bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent mb-4 tracking-wide uppercase drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]">
              Technology
            </h3>
            <p className="font-montserrat text-base font-bold bg-gradient-to-r from-yellow-400 to-green-400 bg-clip-text text-transparent mb-2 tracking-wide drop-shadow-[0_0_10px_rgba(255,215,0,0.4)]">
              SMART Scoring Model
            </p>
            <p className="font-montserrat text-sm font-semibold text-slate-300 leading-relaxed mb-4">
              Strategic Market Assessment<br/>& Rating Technology
            </p>
            <p className="font-montserrat text-xs font-normal text-slate-400 leading-relaxed italic">
              Powered by advanced analytics<br/>and real-time market data
            </p>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="max-w-[1400px] mx-auto py-6 border-t border-cyan-500/20 text-center">
          <p className="font-montserrat text-sm font-medium text-slate-400 mb-2">
            © 2025 John E. Desautels & Associates. All Rights Reserved.
          </p>
          <p className="font-montserrat text-xs font-normal text-slate-500">
            CLUES™ and SMART™ are registered trademarks.
          </p>
        </div>
      </div>

      {/* Background gradient overlay */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-[-1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_0%,rgba(0,255,255,0.15)_0%,transparent_50%),radial-gradient(circle_at_75%_0%,rgba(139,92,246,0.15)_0%,transparent_50%),radial-gradient(circle_at_50%_100%,rgba(255,0,128,0.1)_0%,transparent_50%)]"></div>
      </div>
    </footer>
  );
};

export default CluesFooter;
