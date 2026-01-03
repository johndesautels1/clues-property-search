import React from 'react';

const CluesHeader = () => {
  return (
    <header className="clues-header">
      <div className="header-container">
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-placeholder">
            {/* Replace with actual logo */}
            <div className="dolphin-logo">D</div>
          </div>
        </div>

        {/* Brand Section */}
        <div className="brand-section">
          <h1 className="company-name">JOHN E. DESAUTELS & ASSOCIATES</h1>
          <div className="clues-brand">
            <span className="clues-logo">🔍🌍</span>
            <span className="clues-text">CLUES™</span>
            <span className="clues-tagline">Comprehensive Location & Utility Evaluation System</span>
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <a href="tel:7274523506" className="contact-item">📞 (727) 452-3506</a>
          <a href="https://cluesnomad.com" target="_blank" rel="noopener noreferrer" className="contact-item">
            🌐 cluesnomad.com
          </a>
        </div>
      </div>

      <style jsx>{`
        .clues-header {
          position: relative;
          width: 100%;
          background: linear-gradient(135deg, 
            rgba(10, 10, 15, 0.95) 0%,
            rgba(30, 31, 46, 0.90) 50%,
            rgba(10, 10, 15, 0.95) 100%
          );
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-bottom: 1px solid rgba(0, 255, 255, 0.3);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.6),
            0 0 80px rgba(0, 255, 255, 0.15),
            0 0 40px rgba(139, 92, 246, 0.1),
            inset 0 1px 0 rgba(0, 255, 255, 0.1);
          padding: 1.5rem 2rem;
          z-index: 1000;
        }

        .clues-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 50%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: -1;
        }

        .header-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 2rem;
          align-items: center;
        }

        /* Logo Section */
        .logo-section {
          display: flex;
          align-items: center;
        }

        .logo-placeholder {
          position: relative;
        }

        .dolphin-logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #00ffff 0%, #0080ff 50%, #8b5cf6 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Montserrat', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #0a0a0f;
          box-shadow: 
            0 0 30px rgba(0, 255, 255, 0.6),
            0 0 60px rgba(0, 255, 255, 0.4),
            0 0 90px rgba(139, 92, 246, 0.3),
            inset 0 -2px 10px rgba(0, 0, 0, 0.4),
            inset 0 2px 10px rgba(255, 255, 255, 0.3);
          transform: translateZ(50px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: quantum-pulse 3s ease-in-out infinite;
        }

        @keyframes quantum-pulse {
          0%, 100% {
            box-shadow: 
              0 0 30px rgba(0, 255, 255, 0.6),
              0 0 60px rgba(0, 255, 255, 0.4),
              0 0 90px rgba(139, 92, 246, 0.3);
          }
          50% {
            box-shadow: 
              0 0 40px rgba(0, 255, 255, 0.8),
              0 0 80px rgba(0, 255, 255, 0.6),
              0 0 120px rgba(139, 92, 246, 0.4);
          }
        }

        .dolphin-logo:hover {
          transform: translateZ(80px) scale(1.05);
          box-shadow: 
            0 0 50px rgba(0, 255, 255, 0.9),
            0 0 100px rgba(0, 255, 255, 0.6),
            0 0 150px rgba(139, 92, 246, 0.5);
        }

        /* Brand Section */
        .brand-section {
          text-align: center;
          transform: translateZ(30px);
        }

        .company-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 2px;
          background: linear-gradient(135deg, #00ffff 0%, #67e8f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.75rem 0;
          text-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 20px rgba(0, 255, 255, 0.4));
        }

        .clues-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .clues-logo {
          font-size: 1.5rem;
          filter: drop-shadow(0 0 15px rgba(139, 92, 246, 0.8));
        }

        .clues-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6 0%, #ff0080 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 3px;
          text-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 20px rgba(255, 0, 128, 0.4));
        }

        .clues-tagline {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          color: #00ff88;
          letter-spacing: 1px;
          text-transform: uppercase;
          opacity: 0.9;
          text-shadow: 0 0 10px rgba(0, 255, 136, 0.6);
        }

        /* Contact Section */
        .contact-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-end;
          transform: translateZ(20px);
        }

        .contact-item {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: #ffffff;
          text-decoration: none;
          padding: 0.5rem 1rem;
          background: rgba(0, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          position: relative;
          overflow: hidden;
        }

        .contact-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(139, 92, 246, 0.1));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .contact-item:hover {
          background: rgba(0, 255, 255, 0.2);
          border-color: rgba(0, 255, 255, 0.6);
          color: #00ffff;
          transform: translateY(-2px) translateZ(30px);
          box-shadow: 
            0 4px 20px rgba(0, 255, 255, 0.4),
            0 0 40px rgba(0, 255, 255, 0.3),
            0 0 60px rgba(139, 92, 246, 0.2);
        }

        .contact-item:hover::before {
          opacity: 1;
        }

        /* Mobile Responsive */
        @media (max-width: 1024px) {
          .header-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            text-align: center;
          }

          .logo-section {
            justify-content: center;
          }

          .contact-section {
            align-items: center;
          }

          .company-name {
            font-size: 1.25rem;
          }

          .clues-text {
            font-size: 1.1rem;
          }

          .clues-tagline {
            font-size: 0.65rem;
          }
        }

        @media (max-width: 640px) {
          .clues-header {
            padding: 1rem;
          }

          .company-name {
            font-size: 1rem;
            letter-spacing: 1px;
          }

          .clues-text {
            font-size: 1rem;
            letter-spacing: 2px;
          }

          .clues-tagline {
            font-size: 0.6rem;
          }

          .dolphin-logo {
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
          }

          .contact-item {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
          }
        }

        /* 5D Effect Enhancement */
        @media (prefers-reduced-motion: no-preference) {
          .clues-header {
            transform-style: preserve-3d;
            perspective: 1000px;
          }

          .header-container > * {
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .clues-header:hover .logo-section {
            transform: translateZ(60px);
          }

          .clues-header:hover .brand-section {
            transform: translateZ(40px);
          }

          .clues-header:hover .contact-section {
            transform: translateZ(30px);
          }
        }
      `}</style>
    </header>
  );
};

export default CluesHeader;
