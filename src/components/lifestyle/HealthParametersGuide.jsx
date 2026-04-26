import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const HEALTH_PARAMETERS = [
  {
    emoji: '💧',
    name: 'Water (Glasses)',
    goal: '8 glasses/day',
    simple: 'रोज़ कितना पानी पिया है',
    explanation: 'आपके शरीर को रोज़ 8-10 गिलास पानी चाहिए। यह त्वचा को नमी देता है, किडनी को साफ रखता है, और चेहरे पर निखार लाता है। कम पानी = सूखी और बेजान त्वचा।',
    benefits: ['त्वचा कोमल और चमकदार रहती है', 'पिंपल्स कम होते हैं', 'बेहतर पाचन'],
  },
  {
    emoji: '🌙',
    name: 'Sleep (Hours)',
    goal: '7-8 hours/night',
    simple: 'रात को कितने घंटे सोए हो',
    explanation: 'नींद वह समय है जब आपकी त्वचा खुद को ठीक करती है। 7-8 घंटे की नींद कोलेजन बनाती है (जो त्वचा को कसा हुआ रखता है)। कम नींद = काले घेरे, जल्दी बुढ़ापा दिखना, पिंपल्स बढ़ना।',
    benefits: ['त्वचा ठीक-ठाक होती है', 'आंखों के नीचे के काले घेरे कम होते हैं', 'बेहतर मानसिक स्वास्थ्य'],
  },
  {
    emoji: '🏃',
    name: 'Exercise (Minutes)',
    goal: '30 min/day',
    simple: 'रोज़ कितना व्यायाम किया है',
    explanation: 'व्यायाम खून का बहाव बढ़ाता है जिससे त्वचा को ज़्यादा ऑक्सीजन मिलती है। 30 मिनट का व्यायाम कर लो तो त्वचा में गुलाबी रंग आता है, पिंपल्स कम होते हैं, और मोटापा नहीं बढ़ता।',
    benefits: ['त्वचा में निखार आता है', 'मानसिक तनाव कम होता है', 'वजन नियंत्रित रहता है'],
  },
  {
    emoji: '😌',
    name: 'Stress Level',
    goal: '1-3 (Low)',
    simple: 'आपका तनाव कितना है',
    explanation: 'तनाव (Stress) त्वचा के लिए ज़हर है। जब आप तनाव में हो तो कोर्टिसोल नाम का हार्मोन बढ़ता है जो सीधे पिंपल्स और एक्ने बढ़ाता है। कम तनाव = साफ़ और खूबसूरत त्वचा।',
    benefits: ['पिंपल्स और एक्ने कम होते हैं', 'बेहतर नींद', 'बेहतर जिंदगी'],
  },
  {
    emoji: '🍎',
    name: 'Healthy Foods',
    goal: 'Colorful fruits & veggies',
    simple: 'क्या खान-पान सही है',
    explanation: 'जो खाओ वही त्वचा पर दिखता है। बाहर का तैलीय खाना = पिंपल्स। लेकिन सेब, टमाटर, पत्तागोभी, गाजर जैसी सब्जियां = साफ़ त्वचा। विटामिन और एंटीऑक्सीडेंट्स त्वचा की उम्र बढ़ाते हैं।',
    benefits: ['त्वचा साफ़ रहती है', 'गोरापन बढ़ता है', 'जल्दी बुढ़ापा नहीं आता'],
  },
];

export default function HealthParametersGuide() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
      <div className="mb-4">
        <h3 className="font-black text-base text-gray-900 flex items-center gap-2">
          👨‍⚕️ डॉक्टर की सलाह (Doctor's Advice)
        </h3>
        <p className="text-xs text-gray-500 mt-1">हर मेट्रिक को आसान भाषा में समझो</p>
      </div>

      <div className="space-y-2">
        {HEALTH_PARAMETERS.map((param, idx) => (
          <motion.div key={idx} layout className="rounded-xl overflow-hidden bg-white border border-gray-100">
            {/* Header */}
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 text-left">
                <span className="text-2xl">{param.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{param.name}</p>
                  <p className="text-xs text-indigo-600 font-medium">{param.simple}</p>
                </div>
              </div>
              <motion.div animate={{ rotate: openIndex === idx ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </motion.div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence initial={false}>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-gray-100"
                >
                  <div className="p-3.5 space-y-3">
                    {/* Goal */}
                    <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg">
                      <span className="text-lg">🎯</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-indigo-600">लक्ष्य (Goal)</p>
                        <p className="text-sm text-indigo-700 font-semibold">{param.goal}</p>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">डॉक्टर क्या कहते हैं?</p>
                      <p className="text-sm text-gray-700 leading-relaxed font-medium">{param.explanation}</p>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">इसके फायदे</p>
                      <ul className="space-y-1">
                        {param.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Bottom tip */}
      <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-xs text-amber-800 font-semibold">
          💡 बेस्ट टिप्स: सब कुछ बैलेंस में करो। कोई एक चीज़ ही सब कुछ नहीं है। सब को साथ में करोगे तो सबसे खूबसूरत त्वचा पाओगे!
        </p>
      </div>
    </div>
  );
}