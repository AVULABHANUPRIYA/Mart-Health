import { LanguageCode } from '../types';

export interface TranslationDictionary {
  app: {
    name: string;
    tagline: string;
    emergencyCall: string;
    emergencyBanner: string;
    emergencySubtext: string;
    rightsReserved: string;
    demoNotice: string;
  };
  nav: {
    home: string;
    hospitals: string;
    bloodNetwork: string;
    patientIntake: string;
    patientDashboard: string;
    healthMetrics: string;
    medications: string;
    queueBoard: string;
    myToken: string;
    triageAssessment: string;
    staffDashboard: string;
    hospitalAdmin: string;
    platformAdmin: string;
    about: string;
    login: string;
    logout: string;
    voiceAssistant: string;
    language: string;
    fhirInteroperability: string;
    featureMatrix: string;
  };
  roles: {
    patient: string;
    doctor: string;
    nurse: string;
    hospitalAdmin: string;
    donor: string;
    bloodCoordinator: string;
    platformAdmin: string;
  };
  triage: {
    immediate: string;
    urgent: string;
    standard: string;
    nonUrgent: string;
    immediateDesc: string;
    urgentDesc: string;
    standardDesc: string;
    nonUrgentDesc: string;
    urgencyLevel: string;
    overrideReason: string;
    reassessmentRequired: string;
    vitalSigns: string;
    warningSigns: string;
    clinicalNotes: string;
  };
  queue: {
    tokenNumber: string;
    patientName: string;
    department: string;
    doctor: string;
    status: string;
    urgency: string;
    estWait: string;
    arrivalOrder: string;
    actions: string;
    startConsultation: string;
    completeConsultation: string;
    reassess: string;
    printToken: string;
    liveUpdates: string;
    connected: string;
  };
  blood: {
    findDonors: string;
    requestBlood: string;
    bloodGroup: string;
    units: string;
    urgency: string;
    distance: string;
    availability: string;
    availableNow: string;
    contactDonor: string;
    compatibilityInfo: string;
    donorDashboard: string;
    activeRequests: string;
    matchedDonors: string;
  };
  medication: {
    schedule: string;
    adherence: string;
    markTaken: string;
    markSkipped: string;
    dosage: string;
    frequency: string;
    refillReminder: string;
    nextDose: string;
  };
  voice: {
    listening: string;
    speakNow: string;
    trySaying: string;
    textFallback: string;
    sendText: string;
    microphoneError: string;
    assistantResponse: string;
  };
  common: {
    save: string;
    cancel: string;
    submit: string;
    search: string;
    filter: string;
    loading: string;
    offlineMode: string;
    synced: string;
    pendingSync: string;
    viewDetails: string;
    success: string;
    error: string;
    required: string;
  };
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    app: {
      name: 'MART Health',
      tagline: 'Connected Care. Smarter Queues. Accessible Healthcare.',
      emergencyCall: 'Emergency Hotline: Dial 108 / 112',
      emergencyBanner: 'Medical Emergency Notice: If you are experiencing severe chest pain, shortness of breath, uncontrolled bleeding, or loss of consciousness, dial 108 immediately or proceed directly to the nearest emergency department.',
      emergencySubtext: 'MART Health assists triage coordination; do not delay emergency care for form completion.',
      rightsReserved: 'All rights reserved. Synthetic demonstration data for clinical hackathon.',
      demoNotice: 'Demo Environment: Using synthetic healthcare records. Not for unverified clinical diagnosis.',
    },
    nav: {
      home: 'Home',
      hospitals: 'Find Hospitals',
      bloodNetwork: 'Blood Network',
      patientIntake: 'Patient Registration',
      patientDashboard: 'Patient Portal',
      healthMetrics: 'Health Dashboard',
      medications: 'Medication Tracker',
      queueBoard: 'Dynamic Queue',
      myToken: 'My Queue Token',
      triageAssessment: 'Triage Assessment',
      staffDashboard: 'Clinical Dashboard',
      hospitalAdmin: 'Hospital Admin',
      platformAdmin: 'Platform Admin',
      about: 'About & Safety',
      login: 'Sign In / Switch Role',
      logout: 'Sign Out',
      voiceAssistant: 'Voice Assistant',
      language: 'Language',
      fhirInteroperability: 'FHIR / Interoperability',
      featureMatrix: 'Feature Coverage Matrix',
    },
    roles: {
      patient: 'Patient',
      doctor: 'Doctor / Clinician',
      nurse: 'Nurse / Triage Staff',
      hospitalAdmin: 'Hospital Administrator',
      donor: 'Blood Donor',
      bloodCoordinator: 'Blood Coordinator',
      platformAdmin: 'Platform Administrator',
    },
    triage: {
      immediate: 'Immediate (Level 1)',
      urgent: 'Urgent (Level 2)',
      standard: 'Standard (Level 3)',
      nonUrgent: 'Non-Urgent (Level 4)',
      immediateDesc: 'Life-threatening condition requiring immediate resuscitation.',
      urgentDesc: 'Severe distress, rapid deterioration risk; assess within 15 mins.',
      standardDesc: 'Moderate discomfort; stable vitals; standard priority queue.',
      nonUrgentDesc: 'Minor conditions or routine prescription review; stable.',
      urgencyLevel: 'Urgency Classification',
      overrideReason: 'Documented Clinical Reason for Priority Override',
      reassessmentRequired: 'Reassessment Recommended',
      vitalSigns: 'Vital Signs',
      warningSigns: 'Clinical Warning Flags',
      clinicalNotes: 'Clinical Observations & Handoff Notes',
    },
    queue: {
      tokenNumber: 'Token Number',
      patientName: 'Patient Name',
      department: 'Department',
      doctor: 'Assigned Clinician',
      status: 'Workflow Status',
      urgency: 'Triage Urgency',
      estWait: 'Est. Wait Time',
      arrivalOrder: 'Arrival Order',
      actions: 'Actions',
      startConsultation: 'Start Consultation',
      completeConsultation: 'Complete Visit',
      reassess: 'Reassess Patient',
      printToken: 'Print Token',
      liveUpdates: 'Live Queue Updates',
      connected: 'Live WebSocket/SSE Connected',
    },
    blood: {
      findDonors: 'Find Blood Donors',
      requestBlood: 'Request Blood Units',
      bloodGroup: 'Blood Group',
      units: 'Units Needed',
      urgency: 'Request Urgency',
      distance: 'Approx Distance',
      availability: 'Availability',
      availableNow: 'Available Now',
      contactDonor: 'Coordinate with Donor',
      compatibilityInfo: 'Compatibility Matrix',
      donorDashboard: 'Donor Dashboard',
      activeRequests: 'Active Requests',
      matchedDonors: 'Matched Candidates',
    },
    medication: {
      schedule: 'Medication Schedule',
      adherence: 'Adherence Rate',
      markTaken: 'Mark as Taken',
      markSkipped: 'Mark as Skipped',
      dosage: 'Dosage',
      frequency: 'Frequency',
      refillReminder: 'Refill Alert',
      nextDose: 'Next Scheduled Dose',
    },
    voice: {
      listening: 'Listening to your command...',
      speakNow: 'Speak now or select a quick command below',
      trySaying: 'Try saying:',
      textFallback: 'Type a command (Text Fallback)',
      sendText: 'Execute Command',
      microphoneError: 'Microphone permission not granted. Use text commands below.',
      assistantResponse: 'Assistant:',
    },
    common: {
      save: 'Save Changes',
      cancel: 'Cancel',
      submit: 'Submit',
      search: 'Search...',
      filter: 'Filter',
      loading: 'Loading...',
      offlineMode: 'Offline Mode (Local Storage Drafts)',
      synced: 'All Changes Synchronized',
      pendingSync: 'Unsynced Changes Pending',
      viewDetails: 'View Details',
      success: 'Operation completed successfully',
      error: 'An error occurred. Please verify your input.',
      required: 'Required field',
    },
  },
  te: {
    app: {
      name: 'మార్ట్ హెల్త్ (MART Health)',
      tagline: 'అనుసంధాన వైద్యం. తెలివైన క్యూలు. సులభతర ఆరోగ్య సంరక్షణ.',
      emergencyCall: 'అత్యవసర కాల్: 108 / 112 కు డయల్ చేయండి',
      emergencyBanner: 'అత్యవసర వైద్య హెచ్చరిక: మీకు తీవ్రమైన గుండెనొప్పి, శ్వాస ఆడకపోవడం, అధిక రక్తస్రావం లేదా స్పృహ తప్పడం ఉంటే, వెంటనే 108 కు డయల్ చేయండి లేదా సమీప అత్యవసర విభాగానికి వెళ్ళండి.',
      emergencySubtext: 'మార్ట్ హెల్త్ క్యూ సమన్వయానికి తోడ్పడుతుంది; అత్యవసర చికిత్సను ఆలస్యం చేయవద్దు.',
      rightsReserved: 'సర్వహక్కులు ప్రత్యేకించబడ్డాయి. సింథటిక్ డెమో డేటా.',
      demoNotice: 'డెమో పర్యావరణం: సింథటిక్ ఆరోగ్య రికార్డులు. ప్రత్యక్ష వైద్య నిర్ధారణకు కాదు.',
    },
    nav: {
      home: 'ప్రధాన పేజీ',
      hospitals: 'ఆసుపత్రుల శోధన',
      bloodNetwork: 'రక్తదాతల నెట్‌వర్క్',
      patientIntake: 'రోగి నమోదు',
      patientDashboard: 'రోగి పోర్టల్',
      healthMetrics: 'ఆరోగ్య డాష్‌బోర్డ్',
      medications: 'మందుల ట్రాకర్',
      queueBoard: 'ప్రత్యక్ష క్యూ బోర్డు',
      myToken: 'నా టోకెన్ స్థితి',
      triageAssessment: 'ట్రియాజ్ అంచనా',
      staffDashboard: 'క్లినికల్ డాష్‌బోర్డ్',
      hospitalAdmin: 'ఆసుపత్రి అడ్మిన్',
      platformAdmin: 'ప్లాట్‌ఫామ్ అడ్మిన్',
      about: 'భద్రత & సమాచారం',
      login: 'లాగిన్ / పాత్ర మార్పు',
      logout: 'లాగౌట్',
      voiceAssistant: 'వాయిస్ అసిస్టెంట్',
      language: 'భాష',
      fhirInteroperability: 'FHIR అనుసంధానం',
      featureMatrix: 'ఫీచర్ కవరేజ్ మాతృక',
    },
    roles: {
      patient: 'రోగి',
      doctor: 'వైద్యులు / క్లినీషియన్',
      nurse: 'నర్సు / ట్రియాజ్ సిబ్బంది',
      hospitalAdmin: 'ఆసుపత్రి అడ్మినిస్ట్రేటర్',
      donor: 'రక్తదాత',
      bloodCoordinator: 'రక్త సమన్వయకర్త',
      platformAdmin: 'ప్లాట్‌ఫామ్ అడ్మినిస్ట్రేటర్',
    },
    triage: {
      immediate: 'తక్షణ ప్రాధాన్యత (స్థాయి 1)',
      urgent: 'అత్యవసరం (స్థాయి 2)',
      standard: 'సాధారణం (స్థాయి 3)',
      nonUrgent: 'నాన్-అర్జెంట్ (స్థాయి 4)',
      immediateDesc: 'ప్రాణాంతక స్థితి; వెంటనే చికిత్స అవసరం.',
      urgentDesc: 'తీవ్ర ఇబ్బంది; 15 నిమిషాల్లో పరిశీలించాలి.',
      standardDesc: 'మితమైన అసౌకర్యం; స్థిరమైన నాడి మరియు రక్తపోటు.',
      nonUrgentDesc: 'సాధారణ తనిఖీ లేదా మందుల పునఃపరిశీలన.',
      urgencyLevel: 'ప్రాధాన్యతా వర్గీకరణ',
      overrideReason: 'ప్రాధాన్యత మార్పుకు వైద్య కారణం',
      reassessmentRequired: 'పునఃపరిశీలన సిఫార్సు',
      vitalSigns: 'ప్రాణాధార లక్షణాలు (Vitals)',
      warningSigns: 'క్లినికల్ హెచ్చరిక చిహ్నాలు',
      clinicalNotes: 'క్లినికల్ గమనికలు',
    },
    queue: {
      tokenNumber: 'టోకెన్ సంఖ్య',
      patientName: 'రోగి పేరు',
      department: 'విభాగం',
      doctor: 'కేటాయించిన వైద్యులు',
      status: 'స్థితి',
      urgency: 'ట్రియాజ్ ప్రాధాన్యత',
      estWait: 'సుమారు నిరీక్షణ సమయం',
      arrivalOrder: 'వచ్చిన క్రమం',
      actions: 'చర్యలు',
      startConsultation: 'కన్సల్టేషన్ ప్రారంభించండి',
      completeConsultation: 'పూర్తి చేయండి',
      reassess: 'రోగిని పునఃపరిశీలించండి',
      printToken: 'టోకెన్ ప్రింట్',
      liveUpdates: 'ప్రత్యక్ష క్యూ నవీకరణలు',
      connected: 'లైవ్ కనెక్ట్ చేయబడింది',
    },
    blood: {
      findDonors: 'రక్తదాతలను కనుగొనండి',
      requestBlood: 'రక్తం కోసం అభ్యర్థించండి',
      bloodGroup: 'రక్త వర్గం',
      units: 'అవసరమైన యూనిట్లు',
      urgency: 'అత్యవసరత',
      distance: 'సుమారు దూరం',
      availability: 'లభ్యత',
      availableNow: 'ప్రస్తుతం అందుబాటులో ఉన్నారు',
      contactDonor: 'రక్తదాతతో సమన్వయం',
      compatibilityInfo: 'అనుకూలత వివరాలు',
      donorDashboard: 'రక్తదాత డాష్‌బోర్డ్',
      activeRequests: 'క్రియాశీల అభ్యర్థనలు',
      matchedDonors: 'సరిపోలిన దాతలు',
    },
    medication: {
      schedule: 'మందుల షెడ్యూల్',
      adherence: 'క్రమశిక్షణ శాతం',
      markTaken: 'తీసుకున్నట్లు గుర్తించండి',
      markSkipped: 'దాటవేసినట్లు గుర్తించండి',
      dosage: 'మోతాదు',
      frequency: 'సమయాలు',
      refillReminder: 'మందుల రీఫిల్ హెచ్చరిక',
      nextDose: 'తదుపరి మోతాదు',
    },
    voice: {
      listening: 'మీ ఆదేశాన్ని వింటున్నాం...',
      speakNow: 'ఇప్పుడు మాట్లాడండి లేదా కింద ఎంపిక చేయండి',
      trySaying: 'ఇలా చెప్పండి:',
      textFallback: 'ఆదేశాన్ని టైప్ చేయండి',
      sendText: 'ఆదేశం అమలు చేయండి',
      microphoneError: 'మైక్రోఫోన్ అనుమతి లేదు. వచన ఆదేశాలను ఉపయోగించండి.',
      assistantResponse: 'సహాయకుడు:',
    },
    common: {
      save: 'మార్పులను భద్రపరచండి',
      cancel: 'రద్దు చేయండి',
      submit: 'సమర్పించండి',
      search: 'శోధించండి...',
      filter: 'ఫిల్టర్',
      loading: 'లోడ్ అవుతోంది...',
      offlineMode: 'ఆఫ్‌లైన్ మోడ్ (స్థానిక డ్రాఫ్ట్)',
      synced: 'అన్ని వివరాలు సింక్ అయ్యాయి',
      pendingSync: 'సింక్ కావాల్సినవి ఉన్నాయి',
      viewDetails: 'వివరాలు చూడండి',
      success: 'విజయవంతంగా పూర్తయింది',
      error: 'లోపం సంభవించింది. దయచేసి పరిశీలించండి.',
      required: 'తప్పనిసరి ఫీల్డ్',
    },
  },
  hi: {
    app: {
      name: 'मार्ट हेल्थ (MART Health)',
      tagline: 'कनेक्टेड केयर। स्मार्ट कतारें। सुलभ स्वास्थ्य सेवा।',
      emergencyCall: 'आपातकालीन हॉटलाइन: 108 / 112 डायल करें',
      emergencyBanner: 'चिकित्सा आपातकालीन सूचना: यदि आपको गंभीर सीने में दर्द, सांस लेने में तकलीफ, अनियंत्रित रक्तस्राव या बेहोशी का अनुभव हो रहा है, तो तुरंत 108 डायल करें या निकटतम आपातकालीन कक्ष में जाएं।',
      emergencySubtext: 'मार्ट हेल्थ ट्राइएज समन्वय में मदद करता है; आपातकालीन देखभाल में देरी न करें।',
      rightsReserved: 'सर्वाधिकार सुरक्षित। सिंथेटिक डेटा प्रदर्शन।',
      demoNotice: 'डेमो वातावरण: सिंथेटिक रिकॉर्ड। प्रत्यक्ष नैदानिक ​​निदान के लिए नहीं।',
    },
    nav: {
      home: 'मुख्य पृष्ठ',
      hospitals: 'अस्पताल खोजें',
      bloodNetwork: 'रक्तदाता नेटवर्क',
      patientIntake: 'मरीज़ पंजीकरण',
      patientDashboard: 'मरीज़ पोर्टल',
      healthMetrics: 'स्वास्थ्य डैशबोर्ड',
      medications: 'दवा ट्रैकर',
      queueBoard: 'डायनामिक कतार',
      myToken: 'मेरा टोकन',
      triageAssessment: 'ट्राइएज मूल्यांकन',
      staffDashboard: 'क्लिनिकल डैशबोर्ड',
      hospitalAdmin: 'अस्पताल व्यवस्थापक',
      platformAdmin: 'प्लेटफ़ॉर्म व्यवस्थापक',
      about: 'सुरक्षा और सहायता',
      login: 'साइन इन / भूमिका बदलें',
      logout: 'साइन आउट',
      voiceAssistant: 'वॉइस सहायक',
      language: 'भाषा',
      fhirInteroperability: 'FHIR इंटरऑपरेबिलिटी',
      featureMatrix: 'फ़ीचर कवरेज मैट्रिक्स',
    },
    roles: {
      patient: 'मरीज़',
      doctor: 'डॉक्टर / चिकित्सक',
      nurse: 'नर्स / ट्राइएज स्टाफ़',
      hospitalAdmin: 'अस्पताल व्यवस्थापक',
      donor: 'रक्तदाता',
      bloodCoordinator: 'रक्त समन्वयक',
      platformAdmin: 'प्लेटफ़ॉर्म व्यवस्थापक',
    },
    triage: {
      immediate: 'तत्काल (स्तर 1)',
      urgent: 'अति आवश्यक (स्तर 2)',
      standard: 'सामान्य (स्तर 3)',
      nonUrgent: 'गैर-आपातकालीन (स्तर 4)',
      immediateDesc: 'जीवन के लिए ख़तरा; तत्काल पुनर्जीवन की आवश्यकता।',
      urgentDesc: 'गंभीर संकट; 15 मिनट के भीतर परीक्षण करें।',
      standardDesc: 'मध्यम असुविधा; स्थिर महत्वपूर्ण संकेत।',
      nonUrgentDesc: 'मामूली स्थिति या नियमित पर्चा समीक्षा।',
      urgencyLevel: 'अत्यावश्यकता वर्गीकरण',
      overrideReason: 'प्राथमिकता बदलने का चिकित्सकीय कारण',
      reassessmentRequired: 'पुनर्मूल्यांकन अनुशंसित',
      vitalSigns: 'महत्वपूर्ण संकेत (Vitals)',
      warningSigns: 'नैदानिक ​​चेतावनी संकेत',
      clinicalNotes: 'क्लिनिकल नोट्स',
    },
    queue: {
      tokenNumber: 'टोकन संख्या',
      patientName: 'मरीज़ का नाम',
      department: 'विभाग',
      doctor: 'सौंपा गया चिकित्सक',
      status: 'कार्यप्रवाह स्थिति',
      urgency: 'ट्राइएज तात्कालिकता',
      estWait: 'अनुमानित प्रतीक्षा समय',
      arrivalOrder: 'आगमन क्रम',
      actions: 'कार्रवाई',
      startConsultation: 'परामर्श शुरू करें',
      completeConsultation: 'परामर्श पूर्ण करें',
      reassess: 'पुनर्मूल्यांकन करें',
      printToken: 'टोकन प्रिंट करें',
      liveUpdates: 'लाइव कतार अपडेट',
      connected: 'लाइव कनेक्टेड',
    },
    blood: {
      findDonors: 'रक्तदाता खोजें',
      requestBlood: 'रक्त का अनुरोध करें',
      bloodGroup: 'रक्त समूह',
      units: 'आवश्यक यूनिट',
      urgency: 'अनुरोध तात्कालिकता',
      distance: 'लगभग दूरी',
      availability: 'उपलब्धता',
      availableNow: 'अभी उपलब्ध',
      contactDonor: 'रक्तदाता से समन्वय करें',
      compatibilityInfo: 'संगतता मैट्रिक्स',
      donorDashboard: 'रक्तदाता डैशबोर्ड',
      activeRequests: 'सक्रिय अनुरोध',
      matchedDonors: 'समान उम्मीदवार',
    },
    medication: {
      schedule: 'दवा अनुसूची',
      adherence: 'अनुपालन दर',
      markTaken: 'ली गई के रूप में चिह्नित करें',
      markSkipped: 'छोड़ी गई के रूप में चिह्नित करें',
      dosage: 'खुराक',
      frequency: 'आवृत्ति',
      refillReminder: 'दवा पुनः भरने का अलर्ट',
      nextDose: 'अगली खुराक',
    },
    voice: {
      listening: 'आपके आदेश को सुन रहे हैं...',
      speakNow: 'अब बोलें या नीचे से आदेश चुनें',
      trySaying: 'ऐसे कहें:',
      textFallback: 'आदेश टाइप करें',
      sendText: 'आदेश निष्पादित करें',
      microphoneError: 'माइक्रोफ़ोन अनुमति नहीं है। टेक्स्ट का उपयोग करें।',
      assistantResponse: 'सहायक:',
    },
    common: {
      save: 'परिवर्तन सहेजें',
      cancel: 'रद्द करें',
      submit: 'जमा करें',
      search: 'खोजें...',
      filter: 'फ़िल्टर',
      loading: 'लोड हो रहा है...',
      offlineMode: 'ऑफ़लाइन मोड (स्थानीय ड्राफ्ट)',
      synced: 'सभी परिवर्तन सिंक हो गए',
      pendingSync: 'सिंक लंबित है',
      viewDetails: 'विवरण देखें',
      success: 'सफलतापूर्वक पूरा हुआ',
      error: 'त्रुटि हुई। कृपया जांचें।',
      required: 'आवश्यक फ़ील्ड',
    },
  },
};
