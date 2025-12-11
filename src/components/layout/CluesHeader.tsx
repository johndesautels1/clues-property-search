import React from 'react';

const CluesHeader: React.FC = () => {
  return (
    <header className="relative w-full bg-gradient-to-r from-[rgba(10,10,15,0.95)] via-[rgba(30,31,46,0.90)] to-[rgba(10,10,15,0.95)] backdrop-blur-xl border-b border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_80px_rgba(0,255,255,0.15),0_0_40px_rgba(139,92,246,0.1),inset_0_1px_0_rgba(0,255,255,0.1)] py-6 px-8 z-[1000]">
      <div className="max-w-[1400px] mx-auto translate-x-12 grid grid-cols-1 md:grid-cols-[auto_auto_1fr_auto] gap-8 items-center">
        {/* Logo Section */}
        <div className="flex items-center justify-center md:justify-start">
          <div className="w-[60px] h-[60px] bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center font-montserrat text-[2rem] font-extrabold text-[#0a0a0f] shadow-[0_0_30px_rgba(0,255,255,0.6),0_0_60px_rgba(0,255,255,0.4),0_0_90px_rgba(139,92,246,0.3),inset_0_-2px_10px_rgba(0,0,0,0.4),inset_0_2px_10px_rgba(255,255,255,0.3)] transition-all duration-400 hover:scale-105 hover:shadow-[0_0_50px_rgba(0,255,255,0.9),0_0_100px_rgba(0,255,255,0.6),0_0_150px_rgba(139,92,246,0.5)] animate-pulse">
            D
          </div>
        </div>

        {/* CLUES Property Dashboard */}
        <div className="flex flex-col items-start justify-center">
          <h2 className="font-orbitron font-bold text-2xl text-gradient-quantum">
            CLUES
          </h2>
          <p className="text-sm text-gray-400 uppercase tracking-widest">
            Property Dashboard
          </p>
        </div>

        {/* Brand Section */}
        <div className="text-center">
          <h1 className="font-montserrat text-2xl md:text-3xl font-bold tracking-[2px] bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent mb-3 drop-shadow-[0_0_30px_rgba(0,255,255,0.5)] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            JOHN E. DESAUTELS & ASSOCIATES
          </h1>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-2xl filter drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]">🔍🌍</span>
            <span className="font-montserrat text-xl font-extrabold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent tracking-[3px] drop-shadow-[0_0_20px_rgba(139,92,246,0.5)] filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              CLUES™
            </span>
            <span className="font-montserrat text-xs font-medium text-[#00ff88] tracking-wider uppercase opacity-90 drop-shadow-[0_0_10px_rgba(0,255,136,0.6)]">
              Comprehensive Location & Utility Evaluation System
            </span>
          </div>
        </div>

        {/* Contact Section */}
        <div className="flex flex-col gap-2 items-center md:items-end">
          <a
            href="tel:7274523506"
            className="font-montserrat text-sm font-medium text-white px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-xl backdrop-blur-md transition-all duration-300 whitespace-nowrap relative overflow-hidden hover:bg-cyan-400/20 hover:border-cyan-400/60 hover:text-cyan-400 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,255,255,0.4),0_0_40px_rgba(0,255,255,0.3),0_0_60px_rgba(139,92,246,0.2)]"
          >
            📞 (727) 452-3506
          </a>
          <a
            href="https://cluesnomad.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-montserrat text-sm font-medium text-white px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-xl backdrop-blur-md transition-all duration-300 whitespace-nowrap relative overflow-hidden hover:bg-cyan-400/20 hover:border-cyan-400/60 hover:text-cyan-400 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,255,255,0.4),0_0_40px_rgba(0,255,255,0.3),0_0_60px_rgba(139,92,246,0.2)]"
          >
            🌐 cluesnomad.com
          </a>
        </div>
      </div>

      {/* Background gradient overlay */}
      <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-[-1]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(0,255,255,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_50%,rgba(139,92,246,0.1)_0%,transparent_50%)]"></div>
      </div>
    </header>
  );
};

export default CluesHeader;
