import React from 'react';

const CluesFooter = () => {
  return (
    <footer className="clues-footer">
      <div className="footer-container">
        {/* Company Information */}
        <div className="footer-section company-info">
          <h3 className="section-title">Company Information</h3>
          <p className="company-name">JOHN E. DESAUTELS & ASSOCIATES</p>
          <p className="tagline">Real Estate Intelligence</p>
          <p className="tagline">Empowering Your Global Journey</p>
          <div className="clues-branding">
            <p className="clues-title">CLUES™ Technology</p>
            <p className="clues-subtitle">Comprehensive Location &<br/>Utility Evaluation System</p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="footer-section contact-info">
          <h3 className="section-title">Contact Information</h3>
          <a href="mailto:brokerpinellas@gmail.com" className="footer-link">
            📧 brokerpinellas@gmail.com
          </a>
          <a href="mailto:cluesnomads@gmail.com" className="footer-link">
            📧 cluesnomads@gmail.com
          </a>
          <a href="tel:7274523506" className="footer-link">
            📞 (727) 452-3506
          </a>
          <a href="https://cluesnomad.com" target="_blank" rel="noopener noreferrer" className="footer-link">
            🌐 cluesnomad.com
          </a>
          <p className="footer-text">📍 290 41st Ave, St. Pete Beach, FL 33706</p>
          <p className="footer-text">YouTube: @modernlodges</p>
        </div>

        {/* Professional Services */}
        <div className="footer-section services-info">
          <h3 className="section-title">Professional Services</h3>
          <p className="service-item">✓ Licensed Real Estate Broker FL/CO</p>
          <p className="service-item">✓ CLUES™ Relocation Intelligence</p>
          <p className="service-item">✓ International Relocation Specialist</p>
          <p className="service-item">✓ AI-Powered Market Analysis</p>
          <p className="service-item">✓ SMART Property Scoring</p>
        </div>

        {/* Technology */}
        <div className="footer-section technology-info">
          <h3 className="section-title">Technology</h3>
          <p className="tech-title">SMART Scoring Model</p>
          <p className="tech-subtitle">Strategic Market Assessment<br/>& Rating Technology</p>
          <p className="tech-description">Powered by advanced analytics<br/>and real-time market data</p>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="copyright-bar">
        <p className="copyright-text">
          © 2025 John E. Desautels & Associates. All Rights Reserved.
        </p>
        <p className="trademark-text">
          CLUES™ and SMART™ are registered trademarks.
        </p>
      </div>

      <style jsx>{`
        .clues-footer {
          position: relative;
          width: 100%;
          background: linear-gradient(135deg, 
            rgba(10, 10, 15, 0.98) 0%,
            rgba(30, 31, 46, 0.95) 50%,
            rgba(10, 10, 15, 0.98) 100%
          );
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border-top: 1px solid rgba(0, 255, 255, 0.3);
          box-shadow: 
            0 -8px 32px rgba(0, 0, 0, 0.6),
            0 0 80px rgba(0, 255, 255, 0.15),
            0 0 40px rgba(139, 92, 246, 0.1),
            inset 0 -1px 0 rgba(0, 255, 255, 0.1);
          padding: 3rem 2rem 0;
          margin-top: 4rem;
          transform-style: preserve-3d;
          perspective: 1000px;
        }

        .clues-footer::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 25% 0%, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 75% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 100%, rgba(255, 0, 128, 0.1) 0%, transparent 50%);
          pointer-events: none;
          z-index: -1;
        }

        .footer-container {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 3rem;
          padding-bottom: 2rem;
        }

        /* Footer Sections */
        .footer-section {
          transform: translateZ(20px);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .footer-section:hover {
          transform: translateZ(40px);
        }

        .section-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1.1rem;
          font-weight: 700;
          background: linear-gradient(135deg, #00ffff 0%, #67e8f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 1rem 0;
          letter-spacing: 1px;
          text-transform: uppercase;
          filter: drop-shadow(0 0 10px rgba(0, 255, 255, 0.4));
        }

        /* Company Info */
        .company-name {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #cbd5e1;
          margin: 0.5rem 0;
          letter-spacing: 1px;
        }

        .tagline {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          color: #94a3b8;
          margin: 0.25rem 0;
        }

        .clues-branding {
          margin-top: 1rem;
          padding: 1rem;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.4);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          box-shadow: 
            0 0 20px rgba(139, 92, 246, 0.2),
            inset 0 0 20px rgba(139, 92, 246, 0.1);
        }

        .clues-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          background: linear-gradient(135deg, #8b5cf6 0%, #ff0080 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
          letter-spacing: 2px;
          filter: drop-shadow(0 0 10px rgba(255, 0, 128, 0.4));
        }

        .clues-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          color: #00ff88;
          line-height: 1.4;
          margin: 0;
          text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        /* Contact Info */
        .footer-link {
          display: block;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: #94a3b8;
          text-decoration: none;
          margin: 0.5rem 0;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .footer-link:hover {
          color: #00ffff;
          background: rgba(0, 255, 255, 0.15);
          transform: translateX(4px);
          box-shadow: 
            0 0 20px rgba(0, 255, 255, 0.3),
            0 0 40px rgba(0, 255, 255, 0.15);
        }

        .footer-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          color: #94a3b8;
          margin: 0.5rem 0;
        }

        /* Services Info */
        .service-item {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: #94a3b8;
          margin: 0.5rem 0;
          padding-left: 0.5rem;
          border-left: 2px solid rgba(0, 255, 255, 0.3);
          transition: all 0.3s ease;
        }

        .service-item:hover {
          color: #00ffff;
          border-left-color: rgba(0, 255, 255, 0.8);
          padding-left: 1rem;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        /* Technology Info */
        .tech-title {
          font-family: 'Montserrat', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ffd700 0%, #00ff88 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
          letter-spacing: 1px;
          filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.4));
        }

        .tech-subtitle {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: #cbd5e1;
          line-height: 1.4;
          margin: 0 0 1rem 0;
        }

        .tech-description {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem;
          font-weight: 400;
          color: #94a3b8;
          line-height: 1.5;
          font-style: italic;
          margin: 0;
        }

        /* Copyright Bar */
        .copyright-bar {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1.5rem 0;
          border-top: 1px solid rgba(0, 255, 255, 0.2);
          text-align: center;
          transform: translateZ(10px);
        }

        .copyright-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: #94a3b8;
          margin: 0 0 0.5rem 0;
        }

        .trademark-text {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 400;
          color: #64748b;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .footer-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
        }

        @media (max-width: 640px) {
          .clues-footer {
            padding: 2rem 1rem 0;
          }

          .footer-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .footer-section {
            text-align: center;
          }

          .section-title {
            font-size: 1rem;
          }

          .service-item {
            border-left: none;
            border-bottom: 1px solid rgba(59, 130, 246, 0.3);
            padding-left: 0;
            padding-bottom: 0.5rem;
          }

          .service-item:hover {
            padding-left: 0;
          }

          .copyright-bar {
            padding: 1rem 0;
          }

          .copyright-text,
          .trademark-text {
            font-size: 0.7rem;
          }
        }

        /* 5D Glassmorphic Enhancement */
        @media (prefers-reduced-motion: no-preference) {
          .footer-section {
            position: relative;
          }

          .footer-section::before {
            content: '';
            position: absolute;
            inset: -10px;
            background: linear-gradient(135deg, 
              rgba(0, 255, 255, 0.08) 0%, 
              rgba(139, 92, 246, 0.08) 100%
            );
            border-radius: 16px;
            opacity: 0;
            transition: opacity 0.4s ease;
            z-index: -1;
          }

          .footer-section:hover::before {
            opacity: 1;
          }
        }

        /* Dark Mode Optimization */
        @media (prefers-color-scheme: dark) {
          .clues-footer {
            background: linear-gradient(135deg, 
              rgba(10, 10, 15, 0.99) 0%,
              rgba(19, 20, 31, 0.97) 50%,
              rgba(10, 10, 15, 0.99) 100%
            );
          }
        }
      `}</style>
    </footer>
  );
};

export default CluesFooter;
