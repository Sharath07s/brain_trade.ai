import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const DisclaimerModal = ({ isOpen, onAccept, onCancel }: { isOpen: boolean, onAccept: () => void, onCancel: () => void }) => {

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
                    The Brain Trade Engine provides AI-generated insights, signals, and analysis based on market data.
                  </p>
                  <p className="text-gray-300 leading-relaxed text-[15px] sm:text-base">
                    These insights are for informational and educational purposes only and should <strong className="text-white">NOT</strong> be considered as financial advice, investment recommendations, or trading guarantees.
                  </p>
                  <p className="text-gray-300 leading-relaxed text-[15px] sm:text-base">
                    Stock markets are subject to high risk and volatility. You are solely responsible for your investment decisions and any resulting profits or losses.
                  </p>
                  <div className="text-gray-300 leading-relaxed text-[15px] sm:text-base">
                    <span className="font-semibold text-white">By proceeding, you acknowledge that:</span>
                    <ul className="list-none mt-2 space-y-1.5 ml-1">
                      <li className="flex items-start gap-2"><span className="text-orange-400 mt-0.5">•</span> You understand the risks involved in trading and investing</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 mt-0.5">•</span> You will not rely solely on this tool for making financial decisions</li>
                      <li className="flex items-start gap-2"><span className="text-orange-400 mt-0.5">•</span> BrainTrade.AI is not liable for any financial losses</li>
                    </ul>
                  </div>
                  <p className="text-orange-300 font-semibold text-[15px] sm:text-base pt-2">
                    Please trade responsibly.
                  </p>
                </div>

                {/* Footer / Actions */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button onClick={onCancel} className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors underline decoration-gray-600 underline-offset-4">
                    Cancel & Go Back
                  </button>
                  
                  <button
                    onClick={onAccept}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] transform hover:-translate-y-0.5"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    Accept & Continue
                  </button>
                  
                  {/* Mobile link visibility */}
                  <button onClick={onCancel} className="sm:hidden text-sm text-gray-500 hover:text-white transition-colors mt-2">
                    Cancel & Go Back
                  </button>
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
