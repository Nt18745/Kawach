export type Language = 'en' | 'hi' | 'kn';

export interface TranslationDict {
  appName: string;
  tagline: string;
  sos: string;
  sosSubtext: string;
  callEmergency: string;
  helpNearMe: string;
  emergencyNumbers: string;
  trustedContacts: string;
  safetyTimer: string;
  safeJourney: string;
  myLocation: string;
  settings: string;
  fakeCall: string;
  voiceSos: string;
  hardwareSos: string;
  adminPortal: string;
  officialDisclaimer: string;
  sosActive: string;
  sosStarted: string;
  sharingWith: string;
  call112: string;
  shareLocation: string;
  viewMap: string;
  cancelSos: string;
  confirmCancel: string;
  safeConfirm: string;
  countdown: string;
  tapToCancel: string;
  offlineNotice: string;
  lowBatteryActive: string;
  verifiedOfficial: string;
  emergency112Name: string;
  women181Name: string;
  distance: string;
  travelTime: string;
  directions: string;
  call: string;
  testAlert: string;
  addContact: string;
  startTimer: string;
  startJourney: string;
  aiChat: string;
  minutes: string;
  gracePeriod: string;
  destination: string;
  safeWordLabel: string;
  handsFreeVoice: string;
  safeWordTriggered: string;
}

export const translations: Record<Language, TranslationDict> = {
  en: {
    appName: 'Kawach',
    tagline: 'Your Guardian Shield. One Tap. Help Is On The Way.',
    sos: 'EMERGENCY SOS',
    sosSubtext: 'Tap to trigger immediate emergency alert & 112 dialer',
    callEmergency: 'Call Emergency Services',
    helpNearMe: 'Help Near Me',
    emergencyNumbers: 'Emergency Numbers',
    trustedContacts: 'Trusted Contacts',
    safetyTimer: 'Safety Timer',
    safeJourney: 'Safe Journey',
    myLocation: 'My Location',
    settings: 'Safety & Settings',
    fakeCall: 'Simulated Call',
    voiceSos: 'Voice SOS Trigger',
    hardwareSos: 'Power Button Guide',
    adminPortal: 'Admin & Verification',
    officialDisclaimer: 'Official ERSS 112 & Women Helpline 181 integration. Kawach connects to official public safety authorities.',
    sosActive: 'SOS ACTIVE',
    sosStarted: 'Emergency started',
    sharingWith: 'Sharing live location with',
    call112: 'CALL 112',
    shareLocation: 'SHARE LOCATION',
    viewMap: 'VIEW MAP',
    cancelSos: 'CANCEL SOS',
    confirmCancel: 'Confirm I am Safe',
    safeConfirm: 'I Am Safe Now',
    countdown: 'Alert triggering in',
    tapToCancel: 'TAP TO CANCEL',
    offlineNotice: 'Offline Mode: Official numbers & dialer are ready.',
    lowBatteryActive: 'Emergency Low-Battery Saver Active',
    verifiedOfficial: 'Verified Official',
    emergency112Name: '112 National ERSS',
    women181Name: '181 Women Helpline',
    distance: 'Distance',
    travelTime: 'Est. Time',
    directions: 'Directions',
    call: 'Call',
    testAlert: 'Test Alert',
    addContact: 'Add Trusted Contact',
    startTimer: 'Start Safety Timer',
    startJourney: 'Start Safe Journey',
    aiChat: 'AI Safety Guardian',
    minutes: 'mins',
    gracePeriod: 'Grace period',
    destination: 'Destination',
    safeWordLabel: 'Emergency Safe-Word',
    handsFreeVoice: 'Hands-Free Voice SOS',
    safeWordTriggered: 'Triggered by Voice Safe-Word'
  },
  hi: {
    appName: 'कवच (Kawach)',
    tagline: 'आपका सुरक्षा कवच। एक टैप में तत्काल सहायता।',
    sos: 'आपातकालीन SOS',
    sosSubtext: 'तत्काल आपातकालीन सहायता और 112 डायलर के लिए टैप करें',
    callEmergency: 'आपातकालीन कॉल',
    helpNearMe: 'मेरे पास मदद',
    emergencyNumbers: 'आपातकालीन नंबर',
    trustedContacts: 'विश्वसनीय संपर्क',
    safetyTimer: 'सुरक्षा टाइमर',
    safeJourney: 'सुरक्षित यात्रा',
    myLocation: 'मेरा स्थान',
    settings: 'सुरक्षा व सेटिंग्स',
    fakeCall: 'सिम्युलेटेड कॉल',
    voiceSos: 'वॉइस SOS',
    hardwareSos: 'पावर बटन गाइड',
    adminPortal: 'व्यवस्थापक पोर्टल',
    officialDisclaimer: 'आधिकारिक ERSS 112 एवं महिला हेल्पलाइन 181 से जुड़ा हुआ। कवच आधिकारिक सुरक्षा नेटवर्क है।',
    sosActive: 'SOS सक्रिय है',
    sosStarted: 'आपातकाल शुरू हुआ',
    sharingWith: 'लाइव लोकेशन साझा हो रही है',
    call112: 'कॉल 112',
    shareLocation: 'लोकेशन शेयर करें',
    viewMap: 'नक्शा देखें',
    cancelSos: 'SOS रद्द करें',
    confirmCancel: 'पुष्टि करें कि मैं सुरक्षित हूँ',
    safeConfirm: 'मैं अब सुरक्षित हूँ',
    countdown: 'अलर्ट शुरू होने में शेष',
    tapToCancel: 'रद्द करने के लिए टैप करें',
    offlineNotice: 'ऑफ़लाइन मोड: आपातकालीन डायलर सक्रिय है।',
    lowBatteryActive: 'लो-बैटरी सेवर सक्रिय',
    verifiedOfficial: 'सत्यापित आधिकारिक',
    emergency112Name: '112 राष्ट्रीय आपातकालीन',
    women181Name: '181 महिला हेल्पलाइन',
    distance: 'दूरी',
    travelTime: 'अनुमानित समय',
    directions: 'रास्ता देखें',
    call: 'कॉल करें',
    testAlert: 'टेस्ट अलर्ट',
    addContact: 'नया संपर्क जोड़ें',
    startTimer: 'टाइमर शुरू करें',
    startJourney: 'यात्रा शुरू करें',
    aiChat: 'AI सुरक्षा साथी',
    minutes: 'मिनट',
    gracePeriod: 'अतिरिक्त समय',
    destination: 'गंतव्य',
    safeWordLabel: 'आपातकालीन सेफ-वर्ड',
    handsFreeVoice: 'हैंड्स-फ्री वॉइस SOS',
    safeWordTriggered: 'वॉइस सेफ-वर्ड द्वारा ट्रिगर किया गया'
  },
  kn: {
    appName: 'ಕವಚ (Kawach)',
    tagline: 'ನಿಮ್ಮ ರಕ್ಷಣಾ ಕವಚ. ಒಂದು ಟ್ಯಾಪ್. ಸಹಾಯ ದಾರಿಯಲ್ಲಿದೆ.',
    sos: 'ತುರ್ತು SOS',
    sosSubtext: 'ತ್ವರಿತ ತುರ್ತು ಎಚ್ಚರಿಕೆ ಮತ್ತು 112 ಕರೆಗಾಗಿ ಟ್ಯಾಪ್ ಮಾಡಿ',
    callEmergency: 'ತುರ್ತು ಸೇವೆಗೆ ಕರೆ',
    helpNearMe: 'ಸಮೀಪದ ಸಹಾಯ',
    emergencyNumbers: 'ತುರ್ತು ಸಂಖ್ಯೆಗಳು',
    trustedContacts: 'ವಿಶ್ವಾಸಾರ್ಹ ಸಂಪರ್ಕಗಳು',
    safetyTimer: 'ಸುರಕ್ಷತಾ ಟೈಮರ್',
    safeJourney: 'ಸುರಕ್ಷಿತ ಪ್ರಯಾಣ',
    myLocation: 'ನನ್ನ ಸ್ಥಳ',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    fakeCall: 'ನಕಲಿ ಕರೆ',
    voiceSos: 'ಧ್ವನಿ SOS',
    hardwareSos: 'ಪವರ್ ಬಟನ್ ಮಾಹಿತಿ',
    adminPortal: 'ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್',
    officialDisclaimer: 'ಅಧಿಕೃತ 112 ERSS ಮತ್ತು 181 ಮಹಿಳಾ ಸಹಾಯವಾಣಿ ಸಂಯೋಜನೆ. ಕವಚ ರಕ್ಷಣೆ ನೀಡುತ್ತದೆ.',
    sosActive: 'SOS ಸಕ್ರಿಯವಾಗಿದೆ',
    sosStarted: 'ತುರ್ತು ಪ್ರಾರಂಭವಾಯಿತು',
    sharingWith: 'ಲೈವ್ ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಲಾಗುತ್ತಿದೆ',
    call112: 'ಕರೆ ಮಾಡಿ 112',
    shareLocation: 'ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಿ',
    viewMap: 'ನಕ್ಷೆ ವೀಕ್ಷಿಸಿ',
    cancelSos: 'SOS ರದ್ದುಮಾಡಿ',
    confirmCancel: 'ನಾನು ಸುರಕ್ಷಿತ ಎಂದು ಖಚಿತಪಡಿಸಿ',
    safeConfirm: 'ನಾನು ಈಗ ಸುರಕ್ಷಿತ',
    countdown: 'ಎಚ್ಚರಿಕೆ ಪ್ರಾರಂಭವಾಗಲು',
    tapToCancel: 'ರದ್ದು ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ',
    offlineNotice: 'ಆಫ್‌ಲೈನ್ ಮೋಡ್: ಸಂಖ್ಯೆಗಳು ಲಭ್ಯವಿವೆ.',
    lowBatteryActive: 'ಬ್ಯಾಟರಿ ಉಳಿತಾಯ ಸಕ್ರಿಯ',
    verifiedOfficial: 'ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ',
    emergency112Name: '112 ರಾಷ್ಟ್ರೀಯ ತುರ್ತು',
    women181Name: '181 ಮಹಿಳಾ ಸಹಾಯವಾಣಿ',
    distance: 'ದೂರ',
    travelTime: 'ಅಂದಾಜು ಸಮಯ',
    directions: 'ದಿಕ್ಕುಗಳು',
    call: 'ಕರೆ',
    testAlert: 'ಪರೀಕ್ಷಾ ಎಚ್ಚರಿಕೆ',
    addContact: 'ಸಂಪರ್ಕ ಸೇರಿಸಿ',
    startTimer: 'ಟೈಮರ್ ಪ್ರಾರಂಭಿಸಿ',
    startJourney: 'ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ',
    aiChat: 'AI ಸುರಕ್ಷತಾ ಸಹಾಯಕ',
    minutes: 'ನಿಮಿಷಗಳು',
    gracePeriod: 'ಹೆಚ್ಚುವರಿ ಸಮಯ',
    destination: 'ಗುರಿ',
    safeWordLabel: 'ತುರ್ತು ಸೇಫ್-ವರ್ಡ್',
    handsFreeVoice: 'ಹ್ಯಾಂಡ್ಸ್-ಫ್ರೀ ಧ್ವನಿ SOS',
    safeWordTriggered: 'ಧ್ವನಿ ಸೇಫ್-ವರ್ಡ್ ಮೂಲಕ ಪ್ರಚೋದಿಸಲಾಗಿದೆ'
  }
};
