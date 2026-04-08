import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const DisclaimerModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already accepted the disclaimer
    const hasAccepted = localStorage.getItem('disclaimerAccepted');
    if (!hasAccepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('disclaimerAccepted', 'true');
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Extremely blurred backdrop to prevent interacting with the site */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-2xl overflow-hidden bg-[#0d1117] border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.15)] rounded-3xl"
            >
              {/* Top Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500" />
              
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Legal Disclaimer & Warning</h2>
                    <p className="text-sm text-orange-300/80 mt-1 font-medium">Important notice regarding AI-generated predictions.</p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="bg-[#161b22] px-5 py-6 rounded-2xl border border-white/5 space-y-4 shadow-inner">
                  <p className="text-gray-300 leading-relaxed text-[15px] sm:text-base">
                    <span className="font-semibold text-white">⚠️ Disclaimer:</span> All stock prices, charts, and AI predictions on this website are for informational purposes only.
                  </p>
                  <p className="text-gray-300 leading-relaxed text-[15px] sm:text-base">
                    Predictions are based on factors such as historical price trends, trading volume, recent news, social sentiment, and market indicators. <strong className="text-white">This website does not provide financial advice or guarantee investment performance.</strong>
                  </p>
                  <p className="text-gray-300 leading-relaxed text-[15px] sm:text-base">
                    Users are responsible for their own investment decisions and should consult a professional financial advisor before making any trades. By using this website, you acknowledge and accept that the predictions are <span className="text-orange-400 font-medium">probabilistic</span> and may not reflect actual market outcomes.
                  </p>
                </div>

                {/* Footer / Actions */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <a href="#" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors underline decoration-gray-600 underline-offset-4">
                    Read full disclaimer
                  </a>
                  
                  <button
                    onClick={handleAccept}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transform hover:-translate-y-0.5"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Accept & Continue
                  </button>
                  
                  {/* Mobile link visibility */}
                  <a href="#" className="sm:hidden text-sm text-gray-500 hover:text-white transition-colors mt-2">
                    Read full disclaimer
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default DisclaimerModal;
