import React, { useState, useRef, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import api from '../../utils/axiosInstance'
import { Btn, Spinner } from '../../components/common/UI'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

const VOICE_LANGUAGE_OPTIONS = [
  { value: 'en-IN', label: 'English' },
  { value: 'gu-IN', label: 'Gujarati' },
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'te-IN', label: 'Telugu' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'mr-IN', label: 'Marathi' },
]

const SPEECH_COPY = {
  'en-IN': { detected: 'Detected', and: 'and' },
  'gu-IN': { detected: 'ઓળખાયું', and: 'અને' },
  'hi-IN': { detected: 'पहचाना गया', and: 'और' },
  'te-IN': { detected: 'గుర్తించినవి', and: 'మరియు' },
  'ta-IN': { detected: 'கண்டறியப்பட்டது', and: 'மற்றும்' },
  'kn-IN': { detected: 'ಗುರುತಿಸಲಾಗಿದೆ', and: 'ಮತ್ತು' },
  'ml-IN': { detected: 'തിരിച്ചറിഞ്ഞത്', and: 'കൂടാതെ' },
  'bn-IN': { detected: 'শনাক্ত হয়েছে', and: 'এবং' },
  'mr-IN': { detected: 'ओळखले गेले', and: 'आणि' },
}

const ASSISTANT_COPY = {
  'en-IN': {
    nothingDetected: 'No objects detected yet.',
    askFirst: 'Ask about detected objects only.',
    nothingOn: (side) => `Nothing is detected on the ${side}.`,
    onSide: (summary, side) => `${summary} on the ${side}.`,
    notDetected: (label) => `${label} not detected.`,
    oneDetectedOn: (label, side) => `1 ${label} detected on the ${side}.`,
    manyDetectedOn: (count, label, positions) => `${count} ${label}s detected: ${positions}.`,
    isOn: (label, side) => `${label} is on the ${side}.`,
    yesOneOn: (label, side) => `Yes, ${label} is detected on the ${side}.`,
    yesManyOn: (count, label, positions) => `Yes, ${count} ${label}s are detected: ${positions}.`,
    canSee: (summary) => `I can see ${summary}.`,
    countAll: (count) => `${count} objects detected.`,
    groundedOnly: 'I can answer about detected objects and positions only.',
    runAndAsk: 'Run detection, then ask a question like “Where is the chair?”',
    qLabel: 'Q',
    aLabel: 'A',
    askPlaceholder: 'Ask: Where is the phone?',
    assistantAnswer: 'Assistant Answer',
    groundedBadge: 'Grounded answers only',
    assistantHint: 'Ask short questions about detected objects and positions',
    quickPrompts: ['What do you see?', 'Where is the phone?', 'How many objects are there?', 'What is on the left?'],
    positions: { left: 'left', center: 'center', right: 'right' },
  },
  'gu-IN': {
    nothingDetected: 'હજુ સુધી કોઈ વસ્તુ શોધાઈ નથી.',
    askFirst: 'માત્ર શોધાયેલ વસ્તુઓ વિશે પૂછો.',
    nothingOn: (side) => `${side} બાજુએ કંઈ શોધાયું નથી.`,
    onSide: (summary, side) => `${side} બાજુએ ${summary}.`,
    notDetected: (label) => `${label} શોધાયું નથી.`,
    oneDetectedOn: (label, side) => `1 ${label} ${side} બાજુએ છે.`,
    manyDetectedOn: (count, label, positions) => `${count} ${label} શોધાયા: ${positions}.`,
    isOn: (label, side) => `${label} ${side} બાજુએ છે.`,
    yesOneOn: (label, side) => `હા, ${label} ${side} બાજુએ છે.`,
    yesManyOn: (count, label, positions) => `હા, ${count} ${label} શોધાયા: ${positions}.`,
    canSee: (summary) => `હું ${summary} જોઈ શકું છું.`,
    countAll: (count) => `${count} વસ્તુઓ શોધાઈ.`,
    groundedOnly: 'હું માત્ર શોધાયેલ વસ્તુઓ અને તેમની સ્થિતિ વિશે જવાબ આપી શકું છું.',
    runAndAsk: 'પહેલાં ડિટેક્શન ચલાવો, પછી “ફોન ક્યાં છે?” જેવી પૂછપરછ કરો.',
    qLabel: 'પ્રશ્ન',
    aLabel: 'જવાબ',
    askPlaceholder: 'પૂછો: ફોન ક્યાં છે?',
    assistantAnswer: 'સહાયક જવાબ',
    groundedBadge: 'માત્ર ડિટેક્શન આધારિત જવાબો',
    assistantHint: 'શોધાયેલ વસ્તુઓ અને તેમની સ્થિતિ વિશે ટૂંકા પ્રશ્નો પૂછો',
    quickPrompts: ['તમે શું જુઓ છો?', 'ફોન ક્યાં છે?', 'કેટલી વસ્તુઓ છે?', 'ડાબી બાજુ શું છે?'],
    positions: { left: 'ડાબી', center: 'મધ્યમાં', right: 'જમણી' },
  },
  'hi-IN': {
    nothingDetected: 'अभी कोई वस्तु नहीं मिली।',
    askFirst: 'केवल मिली हुई वस्तुओं के बारे में पूछें।',
    nothingOn: (side) => `${side} में कुछ नहीं मिला।`,
    onSide: (summary, side) => `${side} में ${summary}।`,
    notDetected: (label) => `${label} नहीं मिला।`,
    oneDetectedOn: (label, side) => `1 ${label} ${side} में मिला।`,
    manyDetectedOn: (count, label, positions) => `${count} ${label} मिले: ${positions}।`,
    isOn: (label, side) => `${label} ${side} में है।`,
    yesOneOn: (label, side) => `हाँ, ${label} ${side} में मिला।`,
    yesManyOn: (count, label, positions) => `हाँ, ${count} ${label} मिले: ${positions}।`,
    canSee: (summary) => `मैं ${summary} देख सकता हूँ।`,
    countAll: (count) => `${count} वस्तुएँ मिलीं।`,
    groundedOnly: 'मैं केवल मिली हुई वस्तुओं और उनकी जगह के बारे में बता सकता हूँ।',
    runAndAsk: 'पहले डिटेक्शन चलाएँ, फिर पूछें जैसे “फोन कहाँ है?”',
    qLabel: 'प्रश्न',
    aLabel: 'उत्तर',
    askPlaceholder: 'पूछें: फोन कहाँ है?',
    assistantAnswer: 'सहायक उत्तर',
    groundedBadge: 'केवल डिटेक्शन आधारित',
    assistantHint: 'मिली हुई वस्तुओं और उनकी जगह के बारे में छोटे सवाल पूछें',
    quickPrompts: ['आप क्या देख रहे हैं?', 'फोन कहाँ है?', 'कितनी वस्तुएँ हैं?', 'बाएँ क्या है?'],
    positions: { left: 'बाएँ', center: 'बीच में', right: 'दाएँ' },
  },
  'te-IN': {
    nothingDetected: 'ఇప్పటివరకు ఎలాంటి వస్తువులు గుర్తించబడలేదు.',
    askFirst: 'గుర్తించిన వస్తువుల గురించి మాత్రమే అడగండి.',
    nothingOn: (side) => `${side} వైపు ఏదీ గుర్తించబడలేదు.`,
    onSide: (summary, side) => `${side} వైపు ${summary}.`,
    notDetected: (label) => `${label} గుర్తించబడలేదు.`,
    oneDetectedOn: (label, side) => `1 ${label} ${side} వైపు ఉంది.`,
    manyDetectedOn: (count, label, positions) => `${count} ${label} గుర్తించబడ్డాయి: ${positions}.`,
    isOn: (label, side) => `${label} ${side} వైపు ఉంది.`,
    yesOneOn: (label, side) => `అవును, ${label} ${side} వైపు ఉంది.`,
    yesManyOn: (count, label, positions) => `అవును, ${count} ${label} గుర్తించబడ్డాయి: ${positions}.`,
    canSee: (summary) => `నేను ${summary} చూడగలుగుతున్నాను.`,
    countAll: (count) => `${count} వస్తువులు గుర్తించబడ్డాయి.`,
    groundedOnly: 'నేను గుర్తించిన వస్తువులు మరియు వాటి స్థానాల గురించి మాత్రమే చెప్పగలను.',
    runAndAsk: 'ముందు డిటెక్షన్ నడిపి, తర్వాత “ఫోన్ ఎక్కడ ఉంది?” లాంటి ప్రశ్న అడగండి.',
    qLabel: 'ప్రశ్న',
    aLabel: 'సమాధానం',
    askPlaceholder: 'అడగండి: ఫోన్ ఎక్కడ ఉంది?',
    assistantAnswer: 'సహాయక సమాధానం',
    groundedBadge: 'గుర్తింపుల ఆధారిత జవాబులు మాత్రమే',
    assistantHint: 'గుర్తించిన వస్తువులు మరియు వాటి స్థానాల గురించి చిన్న ప్రశ్నలు అడగండి',
    quickPrompts: ['ఏం కనిపిస్తోంది?', 'ఫోన్ ఎక్కడ ఉంది?', 'ఎన్ని వస్తువులు ఉన్నాయి?', 'ఎడమ వైపు ఏముంది?'],
    positions: { left: 'ఎడమ', center: 'మధ్యలో', right: 'కుడి' },
  },
  'ta-IN': {
    nothingDetected: 'இன்னும் எந்த பொருளும் கண்டறியப்படவில்லை.',
    askFirst: 'கண்டறியப்பட்ட பொருட்களைப் பற்றியே கேளுங்கள்.',
    nothingOn: (side) => `${side} பகுதியில் எதுவும் கண்டறியப்படவில்லை.`,
    onSide: (summary, side) => `${side} பகுதியில் ${summary}.`,
    notDetected: (label) => `${label} கண்டறியப்படவில்லை.`,
    oneDetectedOn: (label, side) => `1 ${label} ${side} பகுதியில் உள்ளது.`,
    manyDetectedOn: (count, label, positions) => `${count} ${label} கண்டறியப்பட்டன: ${positions}.`,
    isOn: (label, side) => `${label} ${side} பகுதியில் உள்ளது.`,
    yesOneOn: (label, side) => `ஆம், ${label} ${side} பகுதியில் உள்ளது.`,
    yesManyOn: (count, label, positions) => `ஆம், ${count} ${label} கண்டறியப்பட்டன: ${positions}.`,
    canSee: (summary) => `நான் ${summary} காண்கிறேன்.`,
    countAll: (count) => `${count} பொருட்கள் கண்டறியப்பட்டன.`,
    groundedOnly: 'கண்டறியப்பட்ட பொருட்கள் மற்றும் அவற்றின் நிலைகளைப் பற்றியே நான் பதிலளிக்க முடியும்.',
    runAndAsk: 'முதலில் கண்டறிதலை இயக்கி, பிறகு “போன் எங்கே உள்ளது?” என்று கேளுங்கள்.',
    qLabel: 'கேள்வி',
    aLabel: 'பதில்',
    askPlaceholder: 'கேளுங்கள்: போன் எங்கே உள்ளது?',
    assistantAnswer: 'உதவியாளர் பதில்',
    groundedBadge: 'கண்டறிதல் அடிப்படையிலான பதில்கள் மட்டும்',
    assistantHint: 'கண்டறியப்பட்ட பொருட்கள் மற்றும் அவற்றின் இடங்களைப் பற்றிய குறுகிய கேள்விகளை கேளுங்கள்',
    quickPrompts: ['நீங்கள் என்ன பார்க்கிறீர்கள்?', 'போன் எங்கே உள்ளது?', 'எத்தனை பொருட்கள் உள்ளன?', 'இடப்பக்கத்தில் என்ன உள்ளது?'],
    positions: { left: 'இடது', center: 'நடுத்தில்', right: 'வலது' },
  },
  'kn-IN': {
    nothingDetected: 'ಇನ್ನೂ ಯಾವುದೇ ವಸ್ತು ಪತ್ತೆಯಾಗಿಲ್ಲ.',
    askFirst: 'ಪತ್ತೆಯಾದ ವಸ್ತುಗಳ ಬಗ್ಗೆ ಮಾತ್ರ ಕೇಳಿ.',
    nothingOn: (side) => `${side} ಭಾಗದಲ್ಲಿ ಏನೂ ಪತ್ತೆಯಾಗಿಲ್ಲ.`,
    onSide: (summary, side) => `${side} ಭಾಗದಲ್ಲಿ ${summary}.`,
    notDetected: (label) => `${label} ಪತ್ತೆಯಾಗಿಲ್ಲ.`,
    oneDetectedOn: (label, side) => `1 ${label} ${side} ಭಾಗದಲ್ಲಿದೆ.`,
    manyDetectedOn: (count, label, positions) => `${count} ${label} ಪತ್ತೆಯಾಗಿದೆ: ${positions}.`,
    isOn: (label, side) => `${label} ${side} ಭಾಗದಲ್ಲಿದೆ.`,
    yesOneOn: (label, side) => `ಹೌದು, ${label} ${side} ಭಾಗದಲ್ಲಿದೆ.`,
    yesManyOn: (count, label, positions) => `ಹೌದು, ${count} ${label} ಪತ್ತೆಯಾಗಿದೆ: ${positions}.`,
    canSee: (summary) => `ನಾನು ${summary} ನೋಡುತ್ತಿದ್ದೇನೆ.`,
    countAll: (count) => `${count} ವಸ್ತುಗಳು ಪತ್ತೆಯಾಗಿದೆ.`,
    groundedOnly: 'ನಾನು ಪತ್ತೆಯಾದ ವಸ್ತುಗಳು ಮತ್ತು ಅವುಗಳ ಸ್ಥಾನಗಳ ಬಗ್ಗೆ ಮಾತ್ರ ಉತ್ತರಿಸಬಲ್ಲೆ.',
    runAndAsk: 'ಮೊದಲು ಡಿಟೆಕ್ಷನ್ ಓಡಿಸಿ, ನಂತರ “ಫೋನ್ ಎಲ್ಲಿದೆ?” ಎಂದು ಕೇಳಿ.',
    qLabel: 'ಪ್ರಶ್ನೆ',
    aLabel: 'ಉತ್ತರ',
    askPlaceholder: 'ಕೇಳಿ: ಫೋನ್ ಎಲ್ಲಿದೆ?',
    assistantAnswer: 'ಸಹಾಯಕ ಉತ್ತರ',
    groundedBadge: 'ಪತ್ತೆಯಾದ ಮಾಹಿತಿಯ ಆಧಾರದ ಉತ್ತರಗಳು ಮಾತ್ರ',
    assistantHint: 'ಪತ್ತೆಯಾದ ವಸ್ತುಗಳು ಮತ್ತು ಅವುಗಳ ಸ್ಥಾನಗಳ ಬಗ್ಗೆ ಚಿಕ್ಕ ಪ್ರಶ್ನೆಗಳು ಕೇಳಿ',
    quickPrompts: ['ಏನು ಕಾಣುತ್ತಿದೆ?', 'ಫೋನ್ ಎಲ್ಲಿದೆ?', 'ಎಷ್ಟು ವಸ್ತುಗಳಿವೆ?', 'ಎಡಭಾಗದಲ್ಲಿ ಏನು ಇದೆ?'],
    positions: { left: 'ಎಡ', center: 'ಮಧ್ಯದಲ್ಲಿ', right: 'ಬಲ' },
  },
  'ml-IN': {
    nothingDetected: 'ഇതുവരെ ഒന്നും കണ്ടെത്തിയിട്ടില്ല.',
    askFirst: 'കണ്ടെത്തിയ വസ്തുക്കളെക്കുറിച്ചേ ചോദിക്കൂ.',
    nothingOn: (side) => `${side} ഭാഗത്ത് ഒന്നും കണ്ടെത്തിയില്ല.`,
    onSide: (summary, side) => `${side} ഭാഗത്ത് ${summary}.`,
    notDetected: (label) => `${label} കണ്ടെത്തിയില്ല.`,
    oneDetectedOn: (label, side) => `1 ${label} ${side} ഭാഗത്തുണ്ട്.`,
    manyDetectedOn: (count, label, positions) => `${count} ${label} കണ്ടെത്തി: ${positions}.`,
    isOn: (label, side) => `${label} ${side} ഭാഗത്തുണ്ട്.`,
    yesOneOn: (label, side) => `അതെ, ${label} ${side} ഭാഗത്തുണ്ട്.`,
    yesManyOn: (count, label, positions) => `അതെ, ${count} ${label} കണ്ടെത്തി: ${positions}.`,
    canSee: (summary) => `എനിക്ക് ${summary} കാണാം.`,
    countAll: (count) => `${count} വസ്തുക്കൾ കണ്ടെത്തി.`,
    groundedOnly: 'കണ്ടെത്തിയ വസ്തുക്കളെയും അവയുടെ സ്ഥാനങ്ങളെയും കുറിച്ചേ ഞാൻ പറയൂ.',
    runAndAsk: 'ആദ്യം ഡിറ്റക്ഷൻ നടത്തൂ, ശേഷം “ഫോൺ എവിടെയാണ്?” എന്ന് ചോദിക്കൂ.',
    qLabel: 'ചോദ്യം',
    aLabel: 'ഉത്തരം',
    askPlaceholder: 'ചോദിക്കൂ: ഫോൺ എവിടെയാണ്?',
    assistantAnswer: 'സഹായി ഉത്തരം',
    groundedBadge: 'കണ്ടെത്തലിനെ അടിസ്ഥാനപ്പെടുത്തിയ ഉത്തരങ്ങൾ മാത്രം',
    assistantHint: 'കണ്ടെത്തിയ വസ്തുക്കളെയും അവയുടെ സ്ഥാനങ്ങളെയും കുറിച്ച് ചെറു ചോദ്യങ്ങൾ ചോദിക്കൂ',
    quickPrompts: ['എന്താണ് കാണുന്നത്?', 'ഫോൺ എവിടെയാണ്?', 'എത്ര വസ്തുക്കളുണ്ട്?', 'ഇടത് ഭാഗത്ത് എന്തുണ്ട്?'],
    positions: { left: 'ഇടത്', center: 'മധ്യത്തിൽ', right: 'വലത്' },
  },
  'bn-IN': {
    nothingDetected: 'এখনও কোনো বস্তু শনাক্ত হয়নি।',
    askFirst: 'শুধু শনাক্ত হওয়া বস্তুর সম্পর্কে প্রশ্ন করুন।',
    nothingOn: (side) => `${side} দিকে কিছুই শনাক্ত হয়নি।`,
    onSide: (summary, side) => `${side} দিকে ${summary}।`,
    notDetected: (label) => `${label} শনাক্ত হয়নি।`,
    oneDetectedOn: (label, side) => `১টি ${label} ${side} দিকে আছে।`,
    manyDetectedOn: (count, label, positions) => `${count} ${label} শনাক্ত হয়েছে: ${positions}।`,
    isOn: (label, side) => `${label} ${side} দিকে আছে।`,
    yesOneOn: (label, side) => `হ্যাঁ, ${label} ${side} দিকে আছে।`,
    yesManyOn: (count, label, positions) => `হ্যাঁ, ${count} ${label} শনাক্ত হয়েছে: ${positions}।`,
    canSee: (summary) => `আমি ${summary} দেখতে পাচ্ছি।`,
    countAll: (count) => `${count}টি বস্তু শনাক্ত হয়েছে।`,
    groundedOnly: 'আমি শুধু শনাক্ত হওয়া বস্তু আর তাদের অবস্থান সম্পর্কে বলতে পারি।',
    runAndAsk: 'আগে ডিটেকশন চালান, তারপর “ফোন কোথায়?” এর মতো প্রশ্ন করুন।',
    qLabel: 'প্রশ্ন',
    aLabel: 'উত্তর',
    askPlaceholder: 'জিজ্ঞাসা করুন: ফোন কোথায়?',
    assistantAnswer: 'সহায়কের উত্তর',
    groundedBadge: 'শুধু শনাক্তকরণভিত্তিক উত্তর',
    assistantHint: 'শনাক্ত হওয়া বস্তু এবং তাদের অবস্থান সম্পর্কে ছোট প্রশ্ন করুন',
    quickPrompts: ['আপনি কী দেখছেন?', 'ফোন কোথায়?', 'কতগুলো বস্তু আছে?', 'বাম দিকে কী আছে?'],
    positions: { left: 'বাম', center: 'মাঝখানে', right: 'ডান' },
  },
  'mr-IN': {
    nothingDetected: 'अजून कोणतीही वस्तू सापडलेली नाही.',
    askFirst: 'फक्त सापडलेल्या वस्तूंबद्दलच विचारा.',
    nothingOn: (side) => `${side} बाजूला काहीच सापडले नाही.`,
    onSide: (summary, side) => `${side} बाजूला ${summary}.`,
    notDetected: (label) => `${label} आढळले नाही.`,
    oneDetectedOn: (label, side) => `1 ${label} ${side} बाजूला आहे.`,
    manyDetectedOn: (count, label, positions) => `${count} ${label} आढळले: ${positions}.`,
    isOn: (label, side) => `${label} ${side} बाजूला आहे.`,
    yesOneOn: (label, side) => `हो, ${label} ${side} बाजूला आहे.`,
    yesManyOn: (count, label, positions) => `हो, ${count} ${label} आढळले: ${positions}.`,
    canSee: (summary) => `मला ${summary} दिसत आहे.`,
    countAll: (count) => `${count} वस्तू आढळल्या.`,
    groundedOnly: 'मी फक्त सापडलेल्या वस्तू आणि त्यांच्या स्थानांबद्दलच सांगू शकतो.',
    runAndAsk: 'आधी डिटेक्शन चालवा, मग “फोन कुठे आहे?” असा प्रश्न विचारा.',
    qLabel: 'प्रश्न',
    aLabel: 'उत्तर',
    askPlaceholder: 'विचारा: फोन कुठे आहे?',
    assistantAnswer: 'सहाय्यक उत्तर',
    groundedBadge: 'फक्त डिटेक्शनवर आधारित उत्तरे',
    assistantHint: 'सापडलेल्या वस्तू आणि त्यांच्या स्थानांबद्दल छोटे प्रश्न विचारा',
    quickPrompts: ['तुला काय दिसत आहे?', 'फोन कुठे आहे?', 'किती वस्तू आहेत?', 'डाव्या बाजूला काय आहे?'],
    positions: { left: 'डाव्या', center: 'मध्यभागी', right: 'उजव्या' },
  },
}

const WAKE_ASSISTANT_PROMPTS = {
  'en-IN': 'How can I help you?',
  'gu-IN': 'હું તમને કેવી રીતે મદદ કરી શકું?',
  'hi-IN': 'मैं आपकी कैसे मदद कर सकता हूँ?',
  'te-IN': 'నేను మీకు ఎలా సహాయం చేయగలను?',
  'ta-IN': 'நான் உங்களுக்கு எப்படி உதவலாம்?',
  'kn-IN': 'ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
  'ml-IN': 'എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?',
  'bn-IN': 'আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  'mr-IN': 'मी तुम्हाला कशी मदत करू शकतो?',
}

const ASSISTANT_STOP_COMMANDS = {
  'en-IN': [
    'stop',
    'stop assistant',
    'stop listening',
    'that is all',
    'thank you',
    'thankyou',
    'thank u',
    'thanks',
    'tank you',
    'done',
    'i am done',
    'all done',
    'finish',
    'finished',
    'end',
    'end interaction',
    'end conversation',
    'interaction ended',
    'conversation ended',
    'exit',
    'quit',
    'cancel',
    'enough',
    'that s enough',
    'no more',
  ],
  'gu-IN': ['બંધ', 'રોકો', 'બસ', 'આભાર'],
  'hi-IN': ['रुको', 'बंद करो', 'बस', 'धन्यवाद', 'स्टॉप'],
  'te-IN': ['ఆపు', 'ఆపండి', 'చాలు', 'ధన్యవాదాలు', 'స్టాప్'],
  'ta-IN': ['நிறுத்து', 'நிறுத்துங்கள்', 'போதும்', 'நன்றி', 'ஸ்டாப்'],
  'kn-IN': ['ನಿಲ್ಲಿಸು', 'ನಿಲ್ಲಿಸಿ', 'ಸಾಕು', 'ಧನ್ಯವಾದ', 'ಸ್ಟಾಪ್'],
  'ml-IN': ['നിർത്തൂ', 'നിർത്തുക', 'മതി', 'നന്ദി', 'സ്റ്റോപ്പ്'],
  'bn-IN': ['থামুন', 'বন্ধ করুন', 'যথেষ্ট', 'ধন্যবাদ', 'স্টপ'],
  'mr-IN': ['थांबा', 'बंद करा', 'पुरे', 'धन्यवाद', 'स्टॉप'],
}

const ASSISTANT_ENDED_PROMPTS = {
  'en-IN': 'Interaction ended.',
  'gu-IN': 'વાતચીત સમાપ્ત થઈ.',
  'hi-IN': 'बातचीत समाप्त हुई।',
  'te-IN': 'సంభాషణ ముగిసింది.',
  'ta-IN': 'உரையாடல் முடிந்தது.',
  'kn-IN': 'ಸಂವಾದ ಮುಗಿದಿದೆ.',
  'ml-IN': 'സംഭാഷണം അവസാനിച്ചു.',
  'bn-IN': 'কথোপকথন শেষ হয়েছে।',
  'mr-IN': 'संवाद संपला.',
}

function getWakeAssistantPrompt(lang) {
  return WAKE_ASSISTANT_PROMPTS[lang] || WAKE_ASSISTANT_PROMPTS['en-IN']
}

function getAssistantEndedPrompt(lang) {
  return ASSISTANT_ENDED_PROMPTS[lang] || ASSISTANT_ENDED_PROMPTS['en-IN']
}

function isAssistantStopCommand(transcript = '', lang = 'en-IN') {
  const normalized = transcript
    .toLowerCase()
    .replace(/[^a-z0-9\u0A80-\u0AFF\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF\u0C80-\u0CFF\u0D00-\u0D7F\u0980-\u09FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const compact = normalized.replace(/\s+/g, '')
  if (!normalized) return false

  const commands = [
    ...ASSISTANT_STOP_COMMANDS['en-IN'],
    ...(ASSISTANT_STOP_COMMANDS[lang] || []),
  ]

  return commands.some((command) => {
    const normalizedCommand = command
      .toLowerCase()
      .replace(/[^a-z0-9\u0A80-\u0AFF\u0900-\u097F\u0C00-\u0C7F\u0B80-\u0BFF\u0C80-\u0CFF\u0D00-\u0D7F\u0980-\u09FF\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const compactCommand = normalizedCommand.replace(/\s+/g, '')

    return (
      normalized === normalizedCommand ||
      normalized.includes(normalizedCommand) ||
      compact === compactCommand ||
      compact.includes(compactCommand)
    )
  })
}

const DETECTION_LABEL_TRANSLATIONS = {
  person: { 'gu-IN': 'વ્યક્તિ', 'hi-IN': 'व्यक्ति', 'te-IN': 'వ్యక్తి', 'ta-IN': 'நபர்', 'kn-IN': 'ವ್ಯಕ್ತಿ', 'ml-IN': 'വ്യക്തി', 'bn-IN': 'ব্যক্তি', 'mr-IN': 'व्यक्ती' },
  bicycle: { 'hi-IN': 'साइकिल', 'te-IN': 'సైకిల్', 'ta-IN': 'மிதிவண்டி', 'kn-IN': 'ಸೈಕಲ್', 'ml-IN': 'സൈക്കിൾ', 'bn-IN': 'সাইকেল', 'mr-IN': 'सायकल' },
  car: { 'gu-IN': 'કાર', 'hi-IN': 'कार', 'te-IN': 'కారు', 'ta-IN': 'கார்', 'kn-IN': 'ಕಾರ್', 'ml-IN': 'കാർ', 'bn-IN': 'গাড়ি', 'mr-IN': 'कार' },
  motorcycle: { 'hi-IN': 'मोटरसाइकिल', 'te-IN': 'మోటార్ సైకిల్', 'ta-IN': 'மோட்டார் சைக்கிள்', 'kn-IN': 'ಮೋಟಾರ್ ಸೈಕಲ್', 'ml-IN': 'മോട്ടോർ സൈക്കിൾ', 'bn-IN': 'মোটরসাইকেল', 'mr-IN': 'मोटरसायकल' },
  airplane: { 'hi-IN': 'हवाई जहाज', 'te-IN': 'విమానం', 'ta-IN': 'விமானம்', 'kn-IN': 'ವಿಮಾನ', 'ml-IN': 'വിമാനം', 'bn-IN': 'বিমান', 'mr-IN': 'विमान' },
  bus: { 'hi-IN': 'बस', 'te-IN': 'బస్', 'ta-IN': 'பஸ்', 'kn-IN': 'ಬಸ್', 'ml-IN': 'ബസ്', 'bn-IN': 'বাস', 'mr-IN': 'बस' },
  train: { 'hi-IN': 'ट्रेन', 'te-IN': 'రైలు', 'ta-IN': 'ரயில்', 'kn-IN': 'ರೈಲು', 'ml-IN': 'ട്രെയിൻ', 'bn-IN': 'ট্রেন', 'mr-IN': 'रेल्वे' },
  truck: { 'hi-IN': 'ट्रक', 'te-IN': 'ట్రక్', 'ta-IN': 'லாரி', 'kn-IN': 'ಟ್ರಕ್', 'ml-IN': 'ട്രക്ക്', 'bn-IN': 'ট্রাক', 'mr-IN': 'ट्रक' },
  boat: { 'hi-IN': 'नाव', 'te-IN': 'పడవ', 'ta-IN': 'படகு', 'kn-IN': 'ದೋಣಿ', 'ml-IN': 'പടகு', 'bn-IN': 'নৌকা', 'mr-IN': 'नौका' },
  traffic_light: { 'hi-IN': 'ट्रैफिक लाइट', 'te-IN': 'ట్రాఫిక్ లైట్', 'ta-IN': 'போக்குவரத்து விளக்கு', 'kn-IN': 'ಟ್ರಾಫಿಕ್ ಲೈಟ್', 'ml-IN': 'ട്രാഫിക് ലൈറ്റ്', 'bn-IN': 'ট্রাফিক লাইট', 'mr-IN': 'ट्रॅफिक लाईट' },
  fire_hydrant: { 'hi-IN': 'फायर हाइड्रेंट', 'te-IN': 'ఫైర్ హైడ్రంట్', 'ta-IN': 'தீ அணைப்பு குழாய்', 'kn-IN': 'ಫೈರ್ ಹೈಡ್ರಂಟ್', 'ml-IN': 'ഫയർ ഹൈഡ്രന്റ്', 'bn-IN': 'ফায়ার হাইড্র্যান্ট', 'mr-IN': 'फायर हायड्रंट' },
  stop_sign: { 'hi-IN': 'रुकने का संकेत', 'te-IN': 'ఆపు గుర్తు', 'ta-IN': 'நிறுத்த குறி', 'kn-IN': 'ನಿಲ್ಲಿಸುವ ಚಿಹ್ನೆ', 'ml-IN': 'സ്റ്റോപ്പ് ബോർഡ്', 'bn-IN': 'থামার সাইন', 'mr-IN': 'थांबा चिन्ह' },
  parking_meter: { 'hi-IN': 'पार्किंग मीटर', 'te-IN': 'పార్కింగ్ మీటర్', 'ta-IN': 'பார்க்கிங் மீட்டர்', 'kn-IN': 'ಪಾರ್ಕಿಂಗ್ ಮೀಟರ್', 'ml-IN': 'പാർക്കിംഗ് മീറ്റർ', 'bn-IN': 'পার্কিং মিটার', 'mr-IN': 'पार्किंग मीटर' },
  bench: { 'hi-IN': 'बेंच', 'te-IN': 'బెంచ్', 'ta-IN': 'நாற்காலி மேடை', 'kn-IN': 'ಬೆಂಚ್', 'ml-IN': 'ബെഞ്ച്', 'bn-IN': 'বেঞ্চ', 'mr-IN': 'बेंच' },
  bird: { 'hi-IN': 'पक्षी', 'te-IN': 'పక్షి', 'ta-IN': 'பறவை', 'kn-IN': 'ಪಕ್ಷಿ', 'ml-IN': 'പക്ഷി', 'bn-IN': 'পাখি', 'mr-IN': 'पक्षी' },
  cat: { 'hi-IN': 'बिल्ली', 'te-IN': 'పిల్లి', 'ta-IN': 'பூனை', 'kn-IN': 'ಬೆಕ್ಕು', 'ml-IN': 'പൂച്ച', 'bn-IN': 'বিড়াল', 'mr-IN': 'मांजर' },
  dog: { 'hi-IN': 'कुत्ता', 'te-IN': 'కుక్క', 'ta-IN': 'நாய்', 'kn-IN': 'ನಾಯಿ', 'ml-IN': 'നായ', 'bn-IN': 'কুকুর', 'mr-IN': 'कुत्रा' },
  horse: { 'hi-IN': 'घोड़ा', 'te-IN': 'గుర్రం', 'ta-IN': 'குதிரை', 'kn-IN': 'ಕುದುರೆ', 'ml-IN': 'കുതിര', 'bn-IN': 'ঘোড়া', 'mr-IN': 'घोडा' },
  sheep: { 'hi-IN': 'भेड़', 'te-IN': 'గొర్రె', 'ta-IN': 'செம்மறியாடு', 'kn-IN': 'ಕುರಿ', 'ml-IN': 'ആട്', 'bn-IN': 'ভেড়া', 'mr-IN': 'मेंढी' },
  cow: { 'hi-IN': 'गाय', 'te-IN': 'ఆవు', 'ta-IN': 'மாடு', 'kn-IN': 'ಹಸು', 'ml-IN': 'പശു', 'bn-IN': 'গরু', 'mr-IN': 'गाय' },
  elephant: { 'hi-IN': 'हाथी', 'te-IN': 'ఏనుగు', 'ta-IN': 'யானை', 'kn-IN': 'ಆನೆ', 'ml-IN': 'ആന', 'bn-IN': 'হাতি', 'mr-IN': 'हत्ती' },
  bear: { 'hi-IN': 'भालू', 'te-IN': 'ఎలుగుబంటి', 'ta-IN': 'கரடி', 'kn-IN': 'ಕರಡಿ', 'ml-IN': 'കരടി', 'bn-IN': 'ভাল্লুক', 'mr-IN': 'अस्वल' },
  zebra: { 'hi-IN': 'ज़ेब्रा', 'te-IN': 'జీబ్రా', 'ta-IN': 'வரிக்குதிரை', 'kn-IN': 'ಜೀಬ್ರಾ', 'ml-IN': 'സീബ്ര', 'bn-IN': 'জেব্রা', 'mr-IN': 'झेब्रा' },
  giraffe: { 'hi-IN': 'जिराफ़', 'te-IN': 'జిరాఫీ', 'ta-IN': 'ஒட்டகச்சிவிங்கி', 'kn-IN': 'ಜಿರಾಫೆ', 'ml-IN': 'ജിറാഫ്', 'bn-IN': 'জিরাফ', 'mr-IN': 'जिराफ' },
  backpack: { 'hi-IN': 'बैग', 'te-IN': 'బ్యాగ్', 'ta-IN': 'பை', 'kn-IN': 'ಚೀಲ', 'ml-IN': 'ബാഗ്', 'bn-IN': 'ব্যাগ', 'mr-IN': 'पिशवी' },
  umbrella: { 'hi-IN': 'छाता', 'te-IN': 'గొడుగు', 'ta-IN': 'குடை', 'kn-IN': 'ಕೊಡೆ', 'ml-IN': 'കുട', 'bn-IN': 'ছাতা', 'mr-IN': 'छत्री' },
  handbag: { 'hi-IN': 'हैंडबैग', 'te-IN': 'హ్యాండ్‌బ్యాగ్', 'ta-IN': 'கைப்பை', 'kn-IN': 'ಹ್ಯಾಂಡ್ ಬ್ಯಾಗ್', 'ml-IN': 'ഹാൻഡ്‌ബാഗ്', 'bn-IN': 'হ্যান্ডব্যাগ', 'mr-IN': 'हँडबॅग' },
  tie: { 'hi-IN': 'टाई', 'te-IN': 'టై', 'ta-IN': 'டை', 'kn-IN': 'ಟೈ', 'ml-IN': 'ടൈ', 'bn-IN': 'টাই', 'mr-IN': 'टाय' },
  suitcase: { 'hi-IN': 'सूटकेस', 'te-IN': 'సూట్‌కేస్', 'ta-IN': 'சூட்கேஸ்', 'kn-IN': 'ಸೂಟ್‌ಕೇಸ್', 'ml-IN': 'സ്യൂട്ട്‌കേസ്', 'bn-IN': 'স্যুটকেস', 'mr-IN': 'सूटकेस' },
  frisbee: { 'hi-IN': 'फ्रिस्बी', 'te-IN': 'ఫ్రిస్బీ', 'ta-IN': 'ஃபிரிஸ்பி', 'kn-IN': 'ಫ್ರಿಸ್ಬಿ', 'ml-IN': 'ഫ്രിസ്‌ബി', 'bn-IN': 'ফ্রিসবি', 'mr-IN': 'फ्रिस्बी' },
  skis: { 'hi-IN': 'स्की', 'te-IN': 'స్కీలు', 'ta-IN': 'ஸ்கீ', 'kn-IN': 'ಸ್ಕೀ', 'ml-IN': 'സ്കീ', 'bn-IN': 'স্কি', 'mr-IN': 'स्की' },
  snowboard: { 'hi-IN': 'स्नोबोर्ड', 'te-IN': 'స్నోబోర్డ్', 'ta-IN': 'ஸ்னோபோர்ட்', 'kn-IN': 'ಸ್ನೋಬೋರ್ಡ್', 'ml-IN': 'സ്നോബോർഡ്', 'bn-IN': 'স্নোবোর্ড', 'mr-IN': 'स्नोबोर्ड' },
  sports_ball: { 'hi-IN': 'खेल की गेंद', 'te-IN': 'క్రీడా బంతి', 'ta-IN': 'விளையாட்டு பந்து', 'kn-IN': 'ಕ್ರೀಡಾ ಚೆಂಡು', 'ml-IN': 'കായിക പന്ത്', 'bn-IN': 'খেলার বল', 'mr-IN': 'खेळाचा चेंडू' },
  kite: { 'hi-IN': 'पतंग', 'te-IN': 'గాలిపటం', 'ta-IN': 'பட்டம்', 'kn-IN': 'ಗಾಳಿಪಟ', 'ml-IN': 'പാറ്റം', 'bn-IN': 'ঘুড়ি', 'mr-IN': 'पतंग' },
  baseball_bat: { 'hi-IN': 'बेसबॉल बैट', 'te-IN': 'బేస్‌బాల్ బ్యాట్', 'ta-IN': 'பேஸ்பால் பேட்', 'kn-IN': 'ಬೇಸ್‌ಬಾಲ್ ಬ್ಯಾಟ್', 'ml-IN': 'ബേസ്ബോൾ ബാറ്റ്', 'bn-IN': 'বেসবল ব্যাট', 'mr-IN': 'बेसबॉल बॅट' },
  baseball_glove: { 'hi-IN': 'बेसबॉल ग्लव', 'te-IN': 'బేస్‌బాల్ గ్లోవ్', 'ta-IN': 'பேஸ்பால் கையுறை', 'kn-IN': 'ಬೇಸ್‌ಬಾಲ್ ಗ್ಲೋವ್', 'ml-IN': 'ബേസ്ബോൾ ഗ്ലൗവ്', 'bn-IN': 'বেসবল গ্লাভস', 'mr-IN': 'बेसबॉल ग्लोव्ह' },
  skateboard: { 'hi-IN': 'स्केटबोर्ड', 'te-IN': 'స్కేట్‌బోర్డ్', 'ta-IN': 'ஸ்கேட்போர்ட்', 'kn-IN': 'ಸ್ಕೇಟ್‌ಬೋರ್ಡ್', 'ml-IN': 'സ്കേറ്റ്ബോർഡ്', 'bn-IN': 'স্কেটবোর্ড', 'mr-IN': 'स्केटबोर्ड' },
  surfboard: { 'hi-IN': 'सर्फबोर्ड', 'te-IN': 'సర్ఫ్‌బోర్డ్', 'ta-IN': 'சர்ஃப்போர்ட்', 'kn-IN': 'ಸರ್ಫ್‌ಬೋರ್ಡ್', 'ml-IN': 'സർഫ്‌ബോർഡ്', 'bn-IN': 'সার্ফবোর্ড', 'mr-IN': 'सर्फबोर्ड' },
  tennis_racket: { 'hi-IN': 'टेनिस रैकेट', 'te-IN': 'టెన్నిస్ రాకెట్', 'ta-IN': 'டென்னிஸ் ராக்கெட்', 'kn-IN': 'ಟೆನ್ನಿಸ್ ರಾಕೆಟ್', 'ml-IN': 'ടെന്നീസ് റാക്കറ്റ്', 'bn-IN': 'টেনিস র‍্যাকেট', 'mr-IN': 'टेनिस रॅकेट' },
  bottle: { 'hi-IN': 'बोतल', 'te-IN': 'సీసా', 'ta-IN': 'பாட்டில்', 'kn-IN': 'ಬಾಟಲಿ', 'ml-IN': 'കുപ്പി', 'bn-IN': 'বোতল', 'mr-IN': 'बाटली' },
  wine_glass: { 'hi-IN': 'वाइन गिलास', 'te-IN': 'వైన్ గ్లాస్', 'ta-IN': 'வைன் கண்ணாடி', 'kn-IN': 'ವೈನ್ ಗ್ಲಾಸ್', 'ml-IN': 'വൈൻ ഗ്ലാസ്', 'bn-IN': 'ওয়াইন গ্লাস', 'mr-IN': 'वाइन ग्लास' },
  cup: { 'hi-IN': 'कप', 'te-IN': 'కప్పు', 'ta-IN': 'கோப்பை', 'kn-IN': 'ಕಪ್', 'ml-IN': 'കപ്പ്', 'bn-IN': 'কাপ', 'mr-IN': 'कप' },
  fork: { 'hi-IN': 'कांटा', 'te-IN': 'ఫోర్క్', 'ta-IN': 'முள் கரண்டி', 'kn-IN': 'ಫೋರ್ಕ್', 'ml-IN': 'ഫോർക്ക്', 'bn-IN': 'কাঁটা', 'mr-IN': 'काटा' },
  knife: { 'hi-IN': 'चाकू', 'te-IN': 'కత్తి', 'ta-IN': 'கத்தி', 'kn-IN': 'ಚಾಕು', 'ml-IN': 'കത്തി', 'bn-IN': 'ছুরি', 'mr-IN': 'सुरी' },
  spoon: { 'hi-IN': 'चम्मच', 'te-IN': 'చెంచా', 'ta-IN': 'கரண்டி', 'kn-IN': 'ಚಮಚ', 'ml-IN': 'കരണ്ടി', 'bn-IN': 'চামচ', 'mr-IN': 'चमचा' },
  bowl: { 'hi-IN': 'कटोरा', 'te-IN': 'గిన్నె', 'ta-IN': 'கிண்ணம்', 'kn-IN': 'ಬಟ್ಟಲು', 'ml-IN': 'കിണ്ണം', 'bn-IN': 'বাটি', 'mr-IN': 'वाटी' },
  banana: { 'hi-IN': 'केला', 'te-IN': 'అరటి', 'ta-IN': 'வாழைப்பழம்', 'kn-IN': 'ಬಾಳೆಹಣ್ಣು', 'ml-IN': 'വാഴപ്പഴം', 'bn-IN': 'কলা', 'mr-IN': 'केळे' },
  apple: { 'hi-IN': 'सेब', 'te-IN': 'ఆపిల్', 'ta-IN': 'ஆப்பிள்', 'kn-IN': 'ಸೇಬು', 'ml-IN': 'ആപ്പിൾ', 'bn-IN': 'আপেল', 'mr-IN': 'सफरचंद' },
  sandwich: { 'hi-IN': 'सैंडविच', 'te-IN': 'సాండ్‌విచ్', 'ta-IN': 'சாண்ட்விச்', 'kn-IN': 'ಸ್ಯಾಂಡ್‌ವಿಚ್', 'ml-IN': 'സാൻഡ്‌വിച്ച്', 'bn-IN': 'স্যান্ডউইচ', 'mr-IN': 'सँडविच' },
  orange: { 'hi-IN': 'संतरा', 'te-IN': 'నారింజ', 'ta-IN': 'ஆரஞ்சு', 'kn-IN': 'ಕಿತ್ತಳೆ', 'ml-IN': 'ഓറഞ്ച്', 'bn-IN': 'কমলা', 'mr-IN': 'संत्रे' },
  broccoli: { 'hi-IN': 'ब्रोकोली', 'te-IN': 'బ్రోకోలీ', 'ta-IN': 'ப்ரோக்கொலி', 'kn-IN': 'ಬ್ರೋಕೋಲಿ', 'ml-IN': 'ബ്രോക്കോളി', 'bn-IN': 'ব্রকলি', 'mr-IN': 'ब्रोकोली' },
  carrot: { 'hi-IN': 'गाजर', 'te-IN': 'క్యారెట్', 'ta-IN': 'கேரட்', 'kn-IN': 'ಗಾಜರ್', 'ml-IN': 'കാരറ്റ്', 'bn-IN': 'গাজর', 'mr-IN': 'गाजर' },
  hot_dog: { 'hi-IN': 'हॉट डॉग', 'te-IN': 'హాట్ డాగ్', 'ta-IN': 'ஹாட் டாக்', 'kn-IN': 'ಹಾಟ್ ಡಾಗ್', 'ml-IN': 'ഹോട്ട് ഡോഗ്', 'bn-IN': 'হট ডগ', 'mr-IN': 'हॉट डॉग' },
  pizza: { 'hi-IN': 'पिज़्ज़ा', 'te-IN': 'పిజ్జా', 'ta-IN': 'பீட்சா', 'kn-IN': 'ಪಿಜ್ಜಾ', 'ml-IN': 'പിസ്സ', 'bn-IN': 'পিজ্জা', 'mr-IN': 'पिझ्झा' },
  donut: { 'hi-IN': 'डोनट', 'te-IN': 'డోనట్', 'ta-IN': 'டோனட்', 'kn-IN': 'ಡೋನಟ್', 'ml-IN': 'ഡോണട്ട്', 'bn-IN': 'ডোনাট', 'mr-IN': 'डोनट' },
  cake: { 'hi-IN': 'केक', 'te-IN': 'కేక్', 'ta-IN': 'கேக்', 'kn-IN': 'ಕೇಕ್', 'ml-IN': 'കേക്ക്', 'bn-IN': 'কেক', 'mr-IN': 'केक' },
  chair: { 'gu-IN': 'ખુરશી', 'hi-IN': 'कुर्सी', 'te-IN': 'కుర్చీ', 'ta-IN': 'நாற்காலி', 'kn-IN': 'ಕುರ್ಚಿ', 'ml-IN': 'കസേര', 'bn-IN': 'চেয়ার', 'mr-IN': 'खुर्ची' },
  couch: { 'hi-IN': 'सोफ़ा', 'te-IN': 'సోఫా', 'ta-IN': 'சோபா', 'kn-IN': 'ಸೋಫಾ', 'ml-IN': 'സോഫ', 'bn-IN': 'সোফা', 'mr-IN': 'सोफा' },
  potted_plant: { 'gu-IN': 'કુંડાનું છોડ', 'hi-IN': 'गमले का पौधा', 'te-IN': 'కుండ మొక్క', 'ta-IN': 'குடுவை செடி', 'kn-IN': 'ಕುಂಡೆಯ ಸಸಿ', 'ml-IN': 'കുടിലച്ചെടി', 'bn-IN': 'টবের গাছ', 'mr-IN': 'कुंडीतले झाड' },
  bed: { 'hi-IN': 'बिस्तर', 'te-IN': 'మంచం', 'ta-IN': 'படுக்கை', 'kn-IN': 'ಹಾಸಿಗೆ', 'ml-IN': 'കിടക്ക', 'bn-IN': 'বিছানা', 'mr-IN': 'खाट' },
  dining_table: { 'hi-IN': 'डाइनिंग टेबल', 'te-IN': 'డైనింగ్ టేబుల్', 'ta-IN': 'உணவு மேசை', 'kn-IN': 'ಡೈನಿಂಗ್ ಟೇಬಲ್', 'ml-IN': 'ഡൈനിംഗ് മേശ', 'bn-IN': 'ডাইনিং টেবিল', 'mr-IN': 'डायनिंग टेबल' },
  toilet: { 'hi-IN': 'शौचालय', 'te-IN': 'టాయిలెట్', 'ta-IN': 'கழிப்பறை', 'kn-IN': 'ಶೌಚಾಲಯ', 'ml-IN': 'ടോയ്ലറ്റ്', 'bn-IN': 'টয়লেট', 'mr-IN': 'शौचालय' },
  tv: { 'hi-IN': 'टीवी', 'te-IN': 'టీవీ', 'ta-IN': 'டிவி', 'kn-IN': 'ಟಿವಿ', 'ml-IN': 'ടിവി', 'bn-IN': 'টিভি', 'mr-IN': 'टीव्ही' },
  laptop: { 'gu-IN': 'લેપટોપ', 'hi-IN': 'लैपटॉप', 'te-IN': 'ల్యాప్‌టాప్', 'ta-IN': 'மடிக்கணினி', 'kn-IN': 'ಲ್ಯಾಪ್‌ಟಾಪ್', 'ml-IN': 'ലാപ്‌ടോപ്പ്', 'bn-IN': 'ল্যাপটপ', 'mr-IN': 'लॅपटॉप' },
  mouse: { 'gu-IN': 'માઉસ', 'hi-IN': 'माउस', 'te-IN': 'మౌస్', 'ta-IN': 'மவுஸ்', 'kn-IN': 'ಮೌಸ್', 'ml-IN': 'മൗസ്', 'bn-IN': 'মাউস', 'mr-IN': 'माऊस' },
  remote: { 'hi-IN': 'रिमोट', 'te-IN': 'రిమోట్', 'ta-IN': 'ரிமோட்', 'kn-IN': 'ರಿಮೋಟ್', 'ml-IN': 'റിമോട്ട്', 'bn-IN': 'রিমোট', 'mr-IN': 'रिमोट' },
  keyboard: { 'hi-IN': 'कीबोर्ड', 'te-IN': 'కీబోర్డ్', 'ta-IN': 'விசைப்பலகை', 'kn-IN': 'ಕೀಬೋರ್ಡ್', 'ml-IN': 'കീബോർഡ്', 'bn-IN': 'কীবোর্ড', 'mr-IN': 'कीबोर्ड' },
  cell_phone: { 'gu-IN': 'મોબાઇલ ફોન', 'hi-IN': 'मोबाइल फोन', 'te-IN': 'మొబైల్ ఫోన్', 'ta-IN': 'மொபைல் போன்', 'kn-IN': 'ಮೊಬೈಲ್ ಫೋನ್', 'ml-IN': 'മൊബൈൽ ഫോൺ', 'bn-IN': 'মোবাইল ফোন', 'mr-IN': 'मोबाईल फोन' },
  microwave: { 'hi-IN': 'माइक्रोवेव', 'te-IN': 'మైక్రోవేవ్', 'ta-IN': 'மைக்ரோவேவ்', 'kn-IN': 'ಮೈಕ್ರೋವೇವ್', 'ml-IN': 'മൈക്രോവേവ്', 'bn-IN': 'মাইক্রোওয়েভ', 'mr-IN': 'मायक्रोवेव्ह' },
  oven: { 'hi-IN': 'ओवन', 'te-IN': 'ఓవెన్', 'ta-IN': 'ஓவன்', 'kn-IN': 'ಒವನ್', 'ml-IN': 'ഓവൻ', 'bn-IN': 'ওভেন', 'mr-IN': 'ओव्हन' },
  toaster: { 'hi-IN': 'टोस्टर', 'te-IN': 'టోస్టర్', 'ta-IN': 'டோஸ்டர்', 'kn-IN': 'ಟೋಸ್ಟರ್', 'ml-IN': 'ടോസ്റ്റർ', 'bn-IN': 'টোস্টার', 'mr-IN': 'टोस्टर' },
  sink: { 'hi-IN': 'सिंक', 'te-IN': 'సింక్', 'ta-IN': 'சிங்க்', 'kn-IN': 'ಸಿಂಕ್', 'ml-IN': 'സിങ്ക്', 'bn-IN': 'সিঙ্ক', 'mr-IN': 'सिंक' },
  refrigerator: { 'hi-IN': 'फ्रिज', 'te-IN': 'ఫ్రిజ్', 'ta-IN': 'குளிர்சாதன பெட்டி', 'kn-IN': 'ಫ್ರಿಜ್', 'ml-IN': 'ഫ്രിഡ്ജ്', 'bn-IN': 'ফ্রিজ', 'mr-IN': 'फ्रिज' },
  book: { 'gu-IN': 'પુસ્તક', 'hi-IN': 'किताब', 'te-IN': 'పుస్తకం', 'ta-IN': 'புத்தகம்', 'kn-IN': 'ಪುಸ್ತಕ', 'ml-IN': 'പുസ്തകം', 'bn-IN': 'বই', 'mr-IN': 'पुस्तक' },
  clock: { 'hi-IN': 'घड़ी', 'te-IN': 'గడియారం', 'ta-IN': 'கடிகாரம்', 'kn-IN': 'ಗಡಿಯಾರ', 'ml-IN': 'ഘടികാരം', 'bn-IN': 'ঘড়ি', 'mr-IN': 'घड्याळ' },
  vase: { 'hi-IN': 'फूलदान', 'te-IN': 'పూలదానము', 'ta-IN': 'மலர் தொட்டி', 'kn-IN': 'ಹೂವಿನ ಕುಂಭ', 'ml-IN': 'പൂച്ചട്ടി', 'bn-IN': 'ফুলদানি', 'mr-IN': 'फुलदाणी' },
  scissors: { 'hi-IN': 'कैंची', 'te-IN': 'కత్తెర', 'ta-IN': 'கத்தரி', 'kn-IN': 'ಕತ್ತರಿ', 'ml-IN': 'കത്തി', 'bn-IN': 'কাঁচি', 'mr-IN': 'कात्री' },
  teddy_bear: { 'hi-IN': 'टेडी बियर', 'te-IN': 'టెడ్డి బేర్', 'ta-IN': 'டெடி கரடி', 'kn-IN': 'ಟೆಡ್ಡಿ ಕರಡಿ', 'ml-IN': 'ടെഡി കരടി', 'bn-IN': 'টেডি বিয়ার', 'mr-IN': 'टेडी बेअर' },
  hair_drier: { 'hi-IN': 'हेयर ड्रायर', 'te-IN': 'హెయిర్ డ్రయ్యర్', 'ta-IN': 'முடி உலர்ப்பான்', 'kn-IN': 'ಹೇರ್ ಡ್ರೈಯರ್', 'ml-IN': 'ഹെയർ ഡ്രയർ', 'bn-IN': 'হেয়ার ড্রায়ার', 'mr-IN': 'हेअर ड्रायर' },
  toothbrush: { 'hi-IN': 'टूथब्रश', 'te-IN': 'టూత్ బ్రష్', 'ta-IN': 'பல் தூரிகை', 'kn-IN': 'ಟೂತ್ ಬ್ರಷ್', 'ml-IN': 'ടൂത്ത് ബ്രഷ്', 'bn-IN': 'টুথব্রাশ', 'mr-IN': 'टूथब्रश' },
}

const OBJECT_ALIASES = {
  phone: 'cell_phone',
  mobile: 'cell_phone',
  mobile_phone: 'cell_phone',
  cellphone: 'cell_phone',
  ફોન: 'cell_phone',
  મોબાઇલ: 'cell_phone',
  'મોબાઇલ ફોન': 'cell_phone',
  tv: 'tv',
  television: 'tv',
  ટીવી: 'tv',
  sofa: 'couch',
  સોફા: 'couch',
  table: 'dining_table',
  ટેબલ: 'dining_table',
  કાર: 'car',
  ખુરશી: 'chair',
  માઉસ: 'mouse',
}

const QUESTION_KEYWORDS = {
  summary: [
    'what do you see',
    'what is around',
    'what objects',
    'what are the objects',
    'what are they',
    'what they are',
    'what are those',
    'what are these',
    'name them',
    'list them',
    'describe',
    'surroundings',
    'scene',
  ],
  count: ['how many', 'count', 'number of'],
  where: ['where', 'which side', 'position'],
  present: ['is there', 'do you see', 'can you see', 'any'],
}

const MULTILINGUAL_QUESTION_KEYWORDS = {
  summary: {
    'gu-IN': ['તમે શું જુઓ છો', 'શું દેખાય છે', 'શું છે', 'આસપાસ શું છે', 'વર્ણન કરો'],
    'hi-IN': ['आप क्या देख रहे हैं', 'क्या दिख रहा है', 'क्या है', 'आसपास क्या है', 'वर्णन करें'],
    'te-IN': ['ఏం కనిపిస్తోంది', 'ఏమి కనిపిస్తోంది', 'ఏం ఉంది', 'చుట్టూ ఏముంది', 'వివరించండి'],
    'ta-IN': ['என்ன பார்க்கிறீர்கள்', 'என்ன தெரிகிறது', 'என்ன உள்ளது', 'சுற்றிலும் என்ன உள்ளது', 'விவரிக்கவும்'],
    'kn-IN': ['ಏನು ಕಾಣುತ್ತಿದೆ', 'ಏನು ಕಾಣಿಸುತ್ತಿದೆ', 'ಏನು ಇದೆ', 'ಸುತ್ತಲು ಏನು ಇದೆ', 'ವಿವರಿಸಿ'],
    'ml-IN': ['എന്താണ് കാണുന്നത്', 'എന്താണ് കാണുന്നത്', 'എന്തുണ്ട്', 'ചുറ്റും എന്തുണ്ട്', 'വിവരിക്കൂ'],
    'bn-IN': ['আপনি কী দেখছেন', 'কি দেখা যাচ্ছে', 'কি আছে', 'চারপাশে কী আছে', 'বর্ণনা করুন'],
    'mr-IN': ['तुला काय दिसत आहे', 'काय दिसत आहे', 'काय आहे', 'सभोवती काय आहे', 'वर्णन करा'],
  },
  count: {
    'gu-IN': ['કેટલી વસ્તુઓ', 'કેટલા ઑબ્જેક્ટ્સ', 'કેટલા છે', 'ગણતરી', 'સંખ્યા'],
    'hi-IN': ['कितनी वस्तुएँ', 'कितनी वस्तु', 'कितने ऑब्जेक्ट', 'कितने हैं', 'गिनती', 'संख्या'],
    'te-IN': ['ఎన్ని వస్తువులు', 'ఎన్ని ఆబ్జెక్టులు', 'ఎన్ని ఉన్నాయి', 'లెక్క', 'సంఖ్య'],
    'ta-IN': ['எத்தனை பொருட்கள்', 'எத்தனை ஆப்ஜெக்ட்கள்', 'எத்தனை உள்ளது', 'எண்ணிக்கை', 'எண்ணிக்கை என்ன'],
    'kn-IN': ['ಎಷ್ಟು ವಸ್ತುಗಳು', 'ಎಷ್ಟು ಆಬ್ಜೆಕ್ಟ್‌ಗಳು', 'ಎಷ್ಟು ಇವೆ', 'ಎಣಿಕೆ', 'ಸಂಖ್ಯೆ'],
    'ml-IN': ['എത്ര വസ്തുക്കൾ', 'എത്ര ഒബ്ജക്ടുകൾ', 'എത്ര ഉണ്ട', 'എണ്ണം', 'സംഖ്യ'],
    'bn-IN': ['কতগুলো বস্তু', 'কতগুলি অবজেক্ট', 'কত আছে', 'গণনা', 'সংখ্যা'],
    'mr-IN': ['किती वस्तू', 'किती ऑब्जेक्ट्स', 'किती आहेत', 'मोजणी', 'संख्या'],
  },
  where: {
    'gu-IN': ['ક્યાં છે', 'કઈ બાજુ', 'કઈ તરફ', 'સ્થાન'],
    'hi-IN': ['कहाँ है', 'कहाँ हैं', 'किस तरफ', 'किस ओर', 'किस जगह', 'स्थान'],
    'te-IN': ['ఎక్కడ ఉంది', 'ఎక్కడ ఉన్నాయి', 'ఏ వైపు', 'ఏ దిశలో', 'స్థానం'],
    'ta-IN': ['எங்கே உள்ளது', 'எங்கே இருக்கிறது', 'எந்த பக்கம்', 'எந்த திசை', 'இடம்'],
    'kn-IN': ['ಎಲ್ಲಿದೆ', 'ಎಲ್ಲಿ ಇದೆ', 'ಯಾವ ಭಾಗದಲ್ಲಿ', 'ಯಾವ ದಿಕ್ಕಿನಲ್ಲಿ', 'ಸ್ಥಳ'],
    'ml-IN': ['എവിടെയാണ്', 'എവിടെയുണ്ട്', 'ഏത് ഭാഗത്ത്', 'ഏത് ദിശയിൽ', 'സ്ഥാനം'],
    'bn-IN': ['কোথায় আছে', 'কোথায়', 'কোন পাশে', 'কোন দিকে', 'অবস্থান'],
    'mr-IN': ['कुठे आहे', 'कुठे आहेत', 'कोणत्या बाजूला', 'कोणत्या दिशेला', 'स्थान'],
  },
  present: {
    'gu-IN': ['છે કે નહીં', 'શું છે', 'છે?', 'જુઓ છો'],
    'hi-IN': ['है या नहीं', 'क्या है', 'क्या दिख रहा है', 'दिख रहा है', 'देख रहे हैं'],
    'te-IN': ['ఉందా లేదా', 'ఉంది', 'కనిపిస్తోంది', 'చూస్తున్నావా'],
    'ta-IN': ['இருக்கிறதா இல்லையா', 'இருக்கிறதா', 'தெரிகிறதா', 'பார்க்கிறீர்களா'],
    'kn-IN': ['ಇದೆಯಾ ಇಲ್ಲವಾ', 'ಇದೆ', 'ಕಾಣಿಸುತ್ತಿದೆಯಾ', 'ನೋಡುತ್ತೀಯಾ'],
    'ml-IN': ['ഉണ്ടോ ഇല്ലയോ', 'ഉണ്ടോ', 'കാണുന്നുണ്ടോ', 'കാണുന്നുവോ'],
    'bn-IN': ['আছে কি না', 'আছে', 'দেখা যাচ্ছে', 'দেখছেন'],
    'mr-IN': ['आहे का नाही', 'आहे', 'दिसत आहे', 'पाहत आहेस'],
  },
}

const REGION_KEYWORDS = {
  left: ['left', 'ડાબી', 'ડાબે', 'बाएँ', 'బائیں', 'ఎడమ', 'இடது', 'ಎಡ', 'ഇടത്', 'বাম', 'डाव्या'],
  right: ['right', 'જમણી', 'જમણે', 'दाएँ', 'కుడి', 'வலது', 'ಬಲ', 'വലത്', 'ডান', 'उजव्या'],
  center: ['center', 'centre', 'મધ્ય', 'बीच', 'मध्य', 'మధ్య', 'நடுத்தில்', 'மத்தியில்', 'ಮಧ್ಯ', 'മധ്യ', 'মাঝ', 'मध्यभागी'],
}

// TTS helper — announces non-person detected objects
function pickVoice(voices, lang) {
  if (!voices?.length) return null

  return (
    voices.find((voice) => voice.lang === lang) ||
    voices.find((voice) => voice.lang?.toLowerCase() === lang.toLowerCase()) ||
    voices.find((voice) => voice.lang?.toLowerCase().startsWith(lang.toLowerCase().split('-')[0])) ||
    voices[0]
  )
}

function getSupportedLanguageOptions(voices) {
  if (!voices?.length) {
    return []
  }

  return VOICE_LANGUAGE_OPTIONS.filter((option) =>
    voices.some(
      (voice) =>
        voice.lang === option.value ||
        voice.lang?.toLowerCase() === option.value.toLowerCase() ||
        voice.lang?.toLowerCase().startsWith(option.value.toLowerCase().split('-')[0])
    )
  )
}

function translateLabel(label, lang) {
  if (!label) return ''
  if (lang === 'en-IN') return formatLabel(label)
  const normalized = label.toLowerCase().replace(/\s+/g, '_')
  return DETECTION_LABEL_TRANSLATIONS[normalized]?.[lang] || formatLabel(label)
}

function buildSpeechText(labels, lang) {
  const copy = SPEECH_COPY[lang] || SPEECH_COPY['en-IN']
  const translated = labels.map((label) => translateLabel(label, lang))

  if (translated.length === 1) {
    return `${copy.detected}: ${translated[0]}`
  }

  if (translated.length === 2) {
    return `${copy.detected}: ${translated[0]} ${copy.and} ${translated[1]}`
  }

  return `${copy.detected}: ${translated.slice(0, -1).join(', ')} ${copy.and} ${translated[translated.length - 1]}`
}

function speakTextFallback(text, lang, voices) {
  if (!window.speechSynthesis || !text) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.resume()
  const utterance = new SpeechSynthesisUtterance(text)
  const selectedVoice = pickVoice(voices, lang)
  utterance.lang = selectedVoice?.lang || lang
  if (selectedVoice) utterance.voice = selectedVoice
  utterance.rate = 0.95
  utterance.pitch = 1
  setTimeout(() => {
    window.speechSynthesis.speak(utterance)
  }, 60)
}

function normalizeLabel(label = '') {
  return label.toLowerCase().replace(/[_-]+/g, ' ').trim()
}

function normalizeObjectKey(label = '') {
  return normalizeLabel(label).replace(/\s+/g, '_')
}

function formatLabel(label = '') {
  return normalizeLabel(label)
}

function singularize(word = '') {
  return word.endsWith('s') ? word.slice(0, -1) : word
}

function getAssistantCopy(lang) {
  return ASSISTANT_COPY[lang] || ASSISTANT_COPY['en-IN']
}

const NUMBERING_SYSTEMS = {
  'gu-IN': 'gujr',
  'hi-IN': 'deva',
  'mr-IN': 'deva',
  'bn-IN': 'beng',
}

function formatLocalizedNumber(value, lang) {
  try {
    const numberingSystem = NUMBERING_SYSTEMS[lang]
    const locale = numberingSystem ? `${lang}-u-nu-${numberingSystem}` : lang
    return new Intl.NumberFormat(locale || 'en-IN').format(value)
  } catch {
    return String(value)
  }
}

const NUMBER_WORDS = {
  'en-IN': ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'],
  'gu-IN': ['શૂન્ય', 'એક', 'બે', 'ત્રણ', 'ચાર', 'પાંચ', 'છ', 'સાત', 'આઠ', 'નવ', 'દસ'],
  'hi-IN': ['शून्य', 'एक', 'दो', 'तीन', 'चार', 'पांच', 'छह', 'सात', 'आठ', 'नौ', 'दस'],
  'te-IN': ['సున్నా', 'ఒకటి', 'రెండు', 'మూడు', 'నాలుగు', 'ఐదు', 'ఆరు', 'ఏడు', 'ఎనిమిది', 'తొమ్మిది', 'పది'],
  'ta-IN': ['பூஜ்யம்', 'ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது', 'பத்து'],
  'kn-IN': ['ಸೊನ್ನೆ', 'ಒಂದು', 'ಎರಡು', 'ಮೂರು', 'ನಾಲ್ಕು', 'ಐದು', 'ಆರು', 'ಏಳು', 'ಎಂಟು', 'ಒಂಬತ್ತು', 'ಹತ್ತು'],
  'ml-IN': ['പൂജ്യം', 'ഒന്ന്', 'രണ്ട്', 'മൂന്ന്', 'നാല്', 'അഞ്ച്', 'ആറ്', 'ഏഴ്', 'എട്ട്', 'ഒമ്പത്', 'പത്ത്'],
  'bn-IN': ['শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ'],
  'mr-IN': ['शून्य', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा'],
}

const LOCAL_DIGIT_MAP = {
  '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
}

function normalizeDigitsForSpeech(value) {
  return String(value).replace(/[૦-૯०-९০-৯]/g, (digit) => LOCAL_DIGIT_MAP[digit] || digit)
}

function formatNumberForSpeech(value, lang) {
  const normalized = Number(normalizeDigitsForSpeech(value))
  const words = NUMBER_WORDS[lang] || NUMBER_WORDS['en-IN']
  if (Number.isInteger(normalized) && normalized >= 0 && normalized < words.length) {
    return words[normalized]
  }
  return formatLocalizedNumber(normalized, lang)
}

function normalizeSpeechText(text, lang) {
  return String(text).replace(/[0-9૦-૯०-९০-৯]+/g, (match) => formatNumberForSpeech(match, lang))
}

function getDetectionPosition(detection, imageWidth = 640) {
  const bbox = detection?.bbox
  if (!bbox || typeof bbox.x !== 'number' || typeof bbox.width !== 'number') return 'center'

  const width = imageWidth > 0 ? imageWidth : 640
  const centerX = bbox.x + bbox.width / 2
  const ratio = centerX / width

  if (ratio < 0.34) return 'left'
  if (ratio > 0.66) return 'right'
  return 'center'
}

function enrichDetections(detections = [], imageWidth = 640) {
  return detections.map((item) => ({
    ...item,
    canonicalLabel: normalizeObjectKey(item.label),
    displayLabel: formatLabel(item.label),
    position: getDetectionPosition(item, imageWidth),
  }))
}

function buildAliasMap() {
  const map = {}

  Object.entries(DETECTION_LABEL_TRANSLATIONS).forEach(([canonicalLabel, translations]) => {
    map[normalizeLabel(canonicalLabel)] = canonicalLabel
    map[normalizeLabel(canonicalLabel.replace(/_/g, ' '))] = canonicalLabel

    Object.values(translations).forEach((translated) => {
      map[normalizeLabel(translated)] = canonicalLabel
    })
  })

  Object.entries(OBJECT_ALIASES).forEach(([alias, canonical]) => {
    map[normalizeLabel(alias)] = canonical
  })

  return map
}

const LABEL_ALIAS_MAP = buildAliasMap()

function findTargetLabel(question = '', detections = []) {
  const normalizedQuestion = normalizeLabel(question)
  const detectionLabels = new Set(detections.map((item) => item.canonicalLabel))
  const entries = Object.entries(LABEL_ALIAS_MAP).sort((a, b) => b[0].length - a[0].length)

  for (const [alias, canonical] of entries) {
    if (!detectionLabels.has(canonical) && !Object.values(OBJECT_ALIASES).includes(canonical) && !DETECTION_LABEL_TRANSLATIONS[canonical]) {
      continue
    }
    if (normalizedQuestion.includes(alias)) {
      return canonical
    }
  }

  return null
}

function hasKeyword(normalizedQuestion, type, lang) {
  const englishKeywords = QUESTION_KEYWORDS[type] || []
  const localizedKeywords = MULTILINGUAL_QUESTION_KEYWORDS[type]?.[lang] || []
  return [...englishKeywords, ...localizedKeywords].some((keyword) =>
    normalizedQuestion.includes(normalizeLabel(keyword))
  )
}

function hasRegionKeyword(normalizedQuestion, region) {
  const keywords = REGION_KEYWORDS[region] || []
  return keywords.some((keyword) => normalizedQuestion.includes(normalizeLabel(keyword)))
}

function summarizeCounts(detections) {
  const counts = detections.reduce((acc, item) => {
    acc[item.canonicalLabel] = (acc[item.canonicalLabel] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => `${count} ${formatLabel(label)}${count > 1 ? 's' : ''}`)
}

function summarizeCountsLocalized(detections, lang) {
  const counts = detections.reduce((acc, item) => {
    acc[item.canonicalLabel] = (acc[item.canonicalLabel] || 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => `${formatLocalizedNumber(count, lang)} ${translateLabel(label, lang)}`)
}

function answerByRegion(detections, region, lang) {
  const copy = getAssistantCopy(lang)
  const matches = detections.filter((item) => item.position === region)
  const localizedSide = copy.positions[region] || region
  if (!matches.length) return copy.nothingOn(localizedSide)

  const summary = summarizeCountsLocalized(matches, lang)
  return copy.onSide(summary.join(', '), localizedSide)
}

function answerForTarget(detections, targetLabel, normalizedQuestion, lang) {
  const copy = getAssistantCopy(lang)
  const matches = detections.filter((item) => item.canonicalLabel === targetLabel)
  const display = translateLabel(targetLabel, lang)

  if (!matches.length) return copy.notDetected(display)

  const count = matches.length
  const positions = [...new Set(matches.map((item) => copy.positions[item.position] || item.position))]

  if (hasKeyword(normalizedQuestion, 'count', lang)) {
    if (count === 1) return copy.oneDetectedOn(display, copy.positions[matches[0].position] || matches[0].position)
    return copy.manyDetectedOn(formatLocalizedNumber(count, lang), display, positions.join(', '))
  }

  if (hasKeyword(normalizedQuestion, 'where', lang)) {
    if (count === 1) return copy.isOn(display, copy.positions[matches[0].position] || matches[0].position)
    return copy.manyDetectedOn(formatLocalizedNumber(count, lang), display, positions.join(', '))
  }

  if (hasKeyword(normalizedQuestion, 'present', lang)) {
    if (count === 1) return copy.yesOneOn(display, copy.positions[matches[0].position] || matches[0].position)
    return copy.yesManyOn(formatLocalizedNumber(count, lang), display, positions.join(', '))
  }

  if (count === 1) return copy.isOn(display, copy.positions[matches[0].position] || matches[0].position)
  return copy.manyDetectedOn(formatLocalizedNumber(count, lang), display, positions.join(', '))
}

function buildAssistantAnswer(detections, question, lang) {
  const copy = getAssistantCopy(lang)
  const normalizedQuestion = normalizeLabel(question)

  if (!detections.length) {
    return copy.nothingDetected
  }

  if (!normalizedQuestion) {
    return copy.askFirst
  }

  if (hasRegionKeyword(normalizedQuestion, 'left') && !findTargetLabel(question, detections)) {
    return answerByRegion(detections, 'left', lang)
  }
  if (hasRegionKeyword(normalizedQuestion, 'right') && !findTargetLabel(question, detections)) {
    return answerByRegion(detections, 'right', lang)
  }
  if (hasRegionKeyword(normalizedQuestion, 'center')) {
    if (!findTargetLabel(question, detections)) {
      return answerByRegion(detections, 'center', lang)
    }
  }

  const targetLabel = findTargetLabel(question, detections)
  if (targetLabel) {
    return answerForTarget(detections, targetLabel, normalizedQuestion, lang)
  }

  if (
    hasKeyword(normalizedQuestion, 'summary', lang) ||
    normalizedQuestion.includes('what is there') ||
    normalizedQuestion.includes('what are they') ||
    normalizedQuestion.includes('what they are') ||
    normalizedQuestion.includes('what are those') ||
    normalizedQuestion.includes('what are these') ||
    normalizedQuestion.includes('what are the objects') ||
    normalizedQuestion.includes('what detected') ||
    normalizedQuestion.includes('what is detected') ||
    normalizedQuestion.includes('which are they') ||
    normalizedQuestion.includes('tell me what they are') ||
    normalizedQuestion.includes('what objects') ||
    normalizedQuestion.includes('which objects') ||
    normalizedQuestion.includes('tell me the objects') ||
    normalizedQuestion.includes('list the objects') ||
    normalizedQuestion.includes('list them') ||
    normalizedQuestion.includes('name the objects') ||
    normalizedQuestion.includes('name them') ||
    normalizedQuestion.includes('what all objects')
  ) {
    const summary = summarizeCountsLocalized(detections, lang)
    return summary.length ? copy.canSee(summary.join(', ')) : copy.nothingDetected
  }

  if (hasKeyword(normalizedQuestion, 'count', lang)) {
    return copy.countAll(formatLocalizedNumber(detections.length, lang))
  }

  return copy.groundedOnly
}

function speakDetections(objects, lang, voices) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  window.speechSynthesis.resume()
  const nonPersons = objects.filter(o => o.label.toLowerCase() !== 'person')
  if (nonPersons.length === 0) return
  const labels = nonPersons.map(o => o.label)
  const unique = [...new Set(labels)]
  const text = buildSpeechText(unique, lang)
  const utt = new SpeechSynthesisUtterance(text)
  const selectedVoice = pickVoice(voices, lang)
  utt.lang = selectedVoice?.lang || lang
  if (selectedVoice) utt.voice = selectedVoice
  utt.rate = 0.95
  utt.pitch = 1
  setTimeout(() => {
    window.speechSynthesis.speak(utt)
  }, 60)
}

function waitForUiPaint(delay = 250) {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, delay)
      })
    })
  })
}

function BBoxCanvas({ results, onReady }) {
  const ref = useRef(null)
  React.useEffect(() => {
    if (!results?.imageUrl || !ref.current) return
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = results.imageUrl
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const colors = ['#4f8bff','#00d68f','#ffb020','#ff4d6a','#a78bfa','#34d399','#fb923c']
      results.detectedObjects.forEach((obj, i) => {
        const { x, y, width, height } = obj.bbox
        const c = colors[i % colors.length]
        ctx.strokeStyle = c; ctx.lineWidth = Math.max(2, img.width/250)
        ctx.strokeRect(x, y, width, height)
        const lh = Math.max(20, img.width/40)
        ctx.fillStyle = c + 'dd'
        ctx.fillRect(x, y - lh, width, lh)
        ctx.fillStyle = '#fff'
        ctx.font = `600 ${Math.max(11, img.width/70)}px DM Sans, sans-serif`
        ctx.fillText(`${obj.label} ${(obj.confidence*100).toFixed(0)}%`, x+5, y-5)
      })
      onReady?.()
    }
    img.onerror = () => onReady?.()
  }, [onReady, results])
  if (!results) return null
  return <canvas ref={ref} style={{ width:'100%', display:'block', borderRadius:'var(--r3)', border:'1px solid var(--border)' }} />
}

function normalizeWakeTranscript(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getWakeTranscripts(event) {
  return Array.from(event.results || [])
    .slice(event.resultIndex)
    .flatMap((result) =>
      Array.from(result || [])
        .map((option) => option?.transcript?.trim())
        .filter(Boolean)
    )
}

function isWakeCommand(transcript) {
  const normalized = normalizeWakeTranscript(transcript)
  const compact = normalized.replace(/\s/g, '')

  if (!normalized) return false

  const hasWakeName =
    normalized.includes('hey neural lens') ||
    normalized.includes('hey neural lense') ||
    normalized.includes('hey new lens') ||
    normalized.includes('hey newral lens') ||
    normalized.includes('neuralness') ||
    compact.includes('heyneurallens') ||
    compact.includes('heyneuralens') ||
    compact.includes('heynewlens') ||
    compact.includes('neurallens') ||
    compact.includes('neuralens') ||
    compact.includes('neuralness') ||
    normalized.includes('neural lens') ||
    normalized.includes('new lens')

  const hasLooseWake =
    normalized.includes('hey') &&
    (normalized.includes('neural') || normalized.includes('lens') || normalized.includes('neuralness') || normalized.includes('new lens'))

  const hasNeuralLensLikeName =
    normalized.includes('neural') ||
    normalized.includes('lens') ||
    normalized.includes('neuralness') ||
    compact.includes('neurallens') ||
    compact.includes('neuralens')

  const hasReadyWake =
    normalized === 'ready' ||
    normalized.includes('ready to start') ||
    normalized.includes('ready start') ||
    normalized.includes('are you ready') ||
    normalized.includes('i am ready') ||
    normalized.includes('ready now') ||
    normalized.includes('reddy') ||
    normalized.includes('redy') ||
    normalized.includes('already') ||
    normalized.includes('ready detection') ||
    normalized.includes('ready detect')

  const hasStartCommand =
    normalized === 'ready' ||
    normalized.includes('ready to start') ||
    normalized.includes('ready start') ||
    normalized.includes('ready detection') ||
    normalized.includes('ready detect') ||
    normalized.includes('start') ||
    normalized.includes('begin') ||
    normalized.includes('go ahead') ||
    normalized.includes('start now') ||
    normalized.includes('begin detection') ||
    normalized.includes('what s around me') ||
    normalized.includes('whats around me') ||
    normalized.includes('what is around me') ||
    normalized.includes('detect my') ||
    normalized.includes('detect the') ||
    normalized.includes('detect phone') ||
    normalized.includes('detect object') ||
    normalized.includes('start detection') ||
    normalized.includes('start detecting') ||
    normalized.includes('run detection') ||
    normalized.includes('start camera') ||
    normalized.includes('open camera') ||
    normalized.includes('detect now') ||
    normalized.includes('detect')

  return (
    hasReadyWake ||
    hasWakeName ||
    hasLooseWake ||
    (hasStartCommand && (
      hasNeuralLensLikeName ||
      normalized.includes('around me') ||
      normalized.includes('ready') ||
      normalized.includes('start') ||
      normalized.includes('begin') ||
      normalized.includes('go ahead')
    ))
  )
}

function cleanAssistantQuestionTranscript(transcript = '') {
  return transcript
    .replace(/\bready(?:\s+to\s+start)?\b/gi, '')
    .replace(/\b(?:hey|hi|a)\s+(?:neural\s*lens|neural\s*lense|neurallens|neuralens|neuralness|new\s*lens|newral\s*lens)\b/gi, '')
    .replace(/\b(?:neural\s*lens|neural\s*lense|neurallens|neuralens|neuralness|new\s*lens|newral\s*lens)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function Dashboard() {
  const { user } = useAuth()
  const [mode, setMode] = useState('upload')
  const [cameraFacing, setCameraFacing] = useState('environment')
  const [results, setResults] = useState(null)
  const [imageMeta, setImageMeta] = useState({ width: 640, height: 480 })
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [drag, setDrag] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [ttsLanguage, setTtsLanguage] = useState(() => localStorage.getItem('ttsLanguage') || 'en-IN')
  const [availableVoices, setAvailableVoices] = useState([])
  const [assistantQuestion, setAssistantQuestion] = useState('')
  const [assistantAnswer, setAssistantAnswer] = useState('')
  const [listening, setListening] = useState(false)
  const [wakeEnabled, setWakeEnabled] = useState(false)
  const [wakeListening, setWakeListening] = useState(false)
  const [wakeStatus, setWakeStatus] = useState('Say "ready" to detect')
  const [wakeCaptureRequest, setWakeCaptureRequest] = useState(0)
  const [wakeRestartRequest, setWakeRestartRequest] = useState(0)
  const fileRef = useRef(null)
  const camRef = useRef(null)
  const audioRef = useRef(null)
  const recognitionRef = useRef(null)
  const wakeRecognitionRef = useRef(null)
  const wakeTriggerPendingRef = useRef(false)
  const wakePausedForAssistantRef = useRef(false)
  const assistantConversationRef = useRef(false)
  const assistantProcessingRef = useRef(false)
  const assistantRestartTimerRef = useRef(null)
  const wakeCooldownRef = useRef(0)
  const latestResultsRef = useRef(null)
  const latestImageMetaRef = useRef(imageMeta)
  const resultVisualReadyRef = useRef(null)

  useEffect(() => {
    if (!window.speechSynthesis) return undefined

    const syncVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices())
    }

    syncVoices()
    window.speechSynthesis.onvoiceschanged = syncVoices

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('ttsLanguage', ttsLanguage)
  }, [ttsLanguage])

  useEffect(() => {
    latestResultsRef.current = results
  }, [results])

  useEffect(() => {
    latestImageMetaRef.current = imageMeta
  }, [imageMeta])

  const supportedLanguageOptions = getSupportedLanguageOptions(availableVoices)
  const assistantCopy = getAssistantCopy(ttsLanguage)
  const usingFrontCamera = cameraFacing === 'user'

  const handleResultVisualReady = useCallback(() => {
    resultVisualReadyRef.current?.()
    resultVisualReadyRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      recognitionRef.current?.stop?.()
      wakeRecognitionRef.current?.stop?.()
      resultVisualReadyRef.current?.()
      resultVisualReadyRef.current = null
      if (assistantRestartTimerRef.current) {
        window.clearTimeout(assistantRestartTimerRef.current)
      }
    }
  }, [])

  const playSpeech = useCallback(async (text, lang = ttsLanguage, options = {}) => {
    const { waitUntilDone = false } = options
      if (!text) return

    const speechText = normalizeSpeechText(text, lang)

    try {
      const { data } = await api.post(
        '/tts/speak',
        { text: speechText, lang },
        { responseType: 'blob' }
      )

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const audioUrl = URL.createObjectURL(data)
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      let finishSpeech = null
      const done = waitUntilDone
        ? new Promise((resolve) => {
            finishSpeech = resolve
          })
        : null
      const cleanupAudio = () => {
        URL.revokeObjectURL(audioUrl)
        if (audioRef.current === audio) audioRef.current = null
        finishSpeech?.()
      }
      audio.onended = () => {
        cleanupAudio()
      }
      audio.onerror = () => {
        cleanupAudio()
      }

      await audio.play()
      if (done) await done
    } catch {
      if (!availableVoices.length) {
        toast.error('Voice playback is not available right now.')
      } else {
        speakTextFallback(speechText, lang, availableVoices)
      }
    }
  }, [availableVoices, ttsLanguage])

  const askAssistant = useCallback(async (questionText, options = {}) => {
    const { waitUntilSpoken = false } = options
    const activeResults = latestResultsRef.current || results
    const activeImageMeta = latestImageMetaRef.current || imageMeta
    const detections = enrichDetections(activeResults?.detectedObjects || [], activeImageMeta.width)
    const trimmedQuestion = questionText.trim()
    if (!trimmedQuestion) {
      toast.error('Ask a question first.')
      return
    }

    const answer = buildAssistantAnswer(detections, trimmedQuestion, ttsLanguage)
    setAssistantAnswer(answer)
    if (ttsEnabled) {
      await playSpeech(answer, ttsLanguage, { waitUntilDone: waitUntilSpoken })
    }
    return answer
  }, [imageMeta, playSpeech, results, ttsEnabled, ttsLanguage])

  const handleAssistantSubmit = async (e) => {
    e?.preventDefault?.()
    await askAssistant(assistantQuestion)
  }

  const startVoiceQuestion = (options = {}) => {
    const { fromWake = false, conversational = false } = options
    if (!SpeechRecognitionAPI) {
      toast.error('Voice input is not supported in this browser.')
      return
    }

    if (fromWake && conversational) {
      assistantConversationRef.current = true
    }

    const pauseWakeListener = fromWake && wakeEnabled
    if (pauseWakeListener) {
      wakePausedForAssistantRef.current = true
      wakeRecognitionRef.current?.stop?.()
      setWakeListening(false)
      setWakeStatus('Detection ready. Ask your question now...')
    }

    recognitionRef.current?.stop?.()
    if (assistantRestartTimerRef.current) {
      window.clearTimeout(assistantRestartTimerRef.current)
      assistantRestartTimerRef.current = null
    }

    const recognition = new SpeechRecognitionAPI()
    recognitionRef.current = recognition
    recognition.lang = ttsLanguage
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    let wakeResumed = false
    const resumeWakeListener = () => {
      if (!pauseWakeListener || wakeResumed) return
      if (assistantConversationRef.current || assistantProcessingRef.current) return
      wakeResumed = true
      wakePausedForAssistantRef.current = false
      setWakeStatus('Listening for "ready"...')
      setWakeRestartRequest((count) => count + 1)
    }

    const continueAssistantConversation = () => {
      if (!fromWake || !assistantConversationRef.current) return
      setWakeStatus('Ask another question, or say "stop".')
      assistantRestartTimerRef.current = window.setTimeout(() => {
        assistantRestartTimerRef.current = null
        if (assistantConversationRef.current) {
          startVoiceQuestion({ fromWake: true })
        }
      }, 350)
    }

    recognition.onstart = () => setListening(true)
    recognition.onend = () => {
      setListening(false)
      if (fromWake && assistantConversationRef.current && !assistantProcessingRef.current) {
        continueAssistantConversation()
        return
      }
      resumeWakeListener()
    }
    recognition.onerror = (event) => {
      setListening(false)
      if (fromWake && assistantConversationRef.current) {
        if (event?.error !== 'not-allowed') {
          continueAssistantConversation()
          return
        }
        assistantConversationRef.current = false
      }
      resumeWakeListener()
      toast.error('Could not hear your question clearly.')
    }
    recognition.onresult = async (event) => {
      const transcript = cleanAssistantQuestionTranscript(event.results?.[0]?.[0]?.transcript?.trim() || '')
      setAssistantQuestion(transcript)
      if (transcript) {
        if (fromWake && isAssistantStopCommand(transcript, ttsLanguage)) {
          assistantConversationRef.current = false
          assistantProcessingRef.current = true
          wakePausedForAssistantRef.current = true
          wakeRecognitionRef.current?.stop?.()
          setAssistantQuestion('')
          setAssistantAnswer(getAssistantEndedPrompt(ttsLanguage))
          setWakeStatus('Interaction ended. Returning to wake word...')
          if (ttsEnabled) {
            await playSpeech(getAssistantEndedPrompt(ttsLanguage), ttsLanguage, { waitUntilDone: true })
          }
          assistantProcessingRef.current = false
          wakePausedForAssistantRef.current = false
          setWakeStatus('Listening for "ready"...')
          setWakeRestartRequest((count) => count + 1)
          return
        }

        assistantProcessingRef.current = fromWake && assistantConversationRef.current
        await askAssistant(transcript, { waitUntilSpoken: fromWake })
        assistantProcessingRef.current = false
        continueAssistantConversation()
      }
    }
    const startRecognition = (attempt = 0) => {
      try {
        recognition.start()
      } catch {
        if (attempt < 2) {
          window.setTimeout(() => startRecognition(attempt + 1), 350)
          return
        }
        setListening(false)
        resumeWakeListener()
        toast.error('Voice listener could not start. Please tap the mic once.')
      }
    }

    startRecognition()
  }

  const detect = async (imageData, sourceType, isFile=false, options={}) => {
    const { announce = true, openAssistant = false } = options
    setLoading(true); setResults(null)
    latestResultsRef.current = null
    resultVisualReadyRef.current?.()
    resultVisualReadyRef.current = null
    try {
      let res
      if (isFile) {
        const fd = new FormData(); fd.append('image', imageData); fd.append('sourceType', sourceType)
        const { data } = await api.post('/detection/detect', fd, { headers:{'Content-Type':'multipart/form-data'} })
        res = data
      } else {
        const { data } = await api.post('/detection/detect', { image: imageData, sourceType })
        res = data
      }
      let resultVisualReadyPromise = null
      if (openAssistant) {
        resultVisualReadyPromise = new Promise((resolve) => {
          resultVisualReadyRef.current = resolve
        })
      }

      latestResultsRef.current = res
      setResults(res)
      setLoading(false)
      toast.success(`${res.objectCount} object${res.objectCount!==1?'s':''} detected`)
      if (openAssistant) {
        setAssistantQuestion('')
        setAssistantAnswer('')
        await Promise.race([
          resultVisualReadyPromise,
          new Promise((resolve) => window.setTimeout(resolve, 2500)),
        ])
        resultVisualReadyRef.current = null
        await waitForUiPaint(100)
      }
      // TTS — announce non-person objects if enabled
      if (announce && ttsEnabled && res.detectedObjects?.length > 0) {
        const speechText = buildSpeechText(
          [...new Set(res.detectedObjects.filter((item) => item.label.toLowerCase() !== 'person').map((item) => item.label))],
          ttsLanguage
        )
        if (speechText) {
          await playSpeech(speechText, ttsLanguage, { waitUntilDone: openAssistant })
        }
      }
      if (openAssistant) {
        wakePausedForAssistantRef.current = true
        wakeRecognitionRef.current?.stop?.()
        setWakeListening(false)
        setWakeStatus('Detection ready. Assistant is about to listen...')
        if (ttsEnabled) {
          await playSpeech(getWakeAssistantPrompt(ttsLanguage), ttsLanguage, { waitUntilDone: true })
        }
        setWakeStatus('Detection ready. Ask your question now...')
        window.setTimeout(() => {
          startVoiceQuestion({ fromWake: true, conversational: true })
        }, sourceType === 'upload' ? 900 : 250)
      }
      return res
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Detection failed - is the ML service running?'
      toast.error(message)
      return null
    } finally { setLoading(false) }
  }

  const handleFile = (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      const src = e.target.result
      setPreview(src)
      const img = new Image()
      img.onload = () => setImageMeta({ width: img.width || 640, height: img.height || 480 })
      img.src = src
    }
    reader.readAsDataURL(file)
    detect(file, 'upload', true, { announce: true, openAssistant: true })
  }

  const capture = useCallback(() => {
    const img = camRef.current?.getScreenshot()
    if (!img) return toast.error('Camera unavailable')
    setPreview(img)
    const previewImage = new Image()
    previewImage.onload = () => setImageMeta({ width: previewImage.width || 640, height: previewImage.height || 480 })
    previewImage.src = img
    detect(img, 'camera', false, { announce: false, openAssistant: true })
  }, [camRef])

  const triggerWakeDetection = useCallback((transcript = '') => {
    const now = Date.now()
    if (loading || now - wakeCooldownRef.current < 4500) return

    wakeCooldownRef.current = now
    wakeTriggerPendingRef.current = true
    setWakeStatus('Wake word heard. Starting webcam...')
    setMode('camera')
    setResults(null)
    setPreview(null)
    setAssistantQuestion('')
    setAssistantAnswer('')
    setWakeCaptureRequest((count) => count + 1)
  }, [loading])

  useEffect(() => {
    if (mode !== 'camera' || !wakeTriggerPendingRef.current) return undefined

    let cancelled = false

    const attemptCapture = (attempt = 0) => {
      window.setTimeout(async () => {
        if (cancelled || !wakeTriggerPendingRef.current) return

        const img = camRef.current?.getScreenshot()
        if (!img) {
          if (attempt < 10) {
            attemptCapture(attempt + 1)
            return
          }

          wakeTriggerPendingRef.current = false
          setWakeStatus('Webcam unavailable. Try again.')
          toast.error('Camera unavailable')
          return
        }

        wakeTriggerPendingRef.current = false
        setWakeStatus('Detecting from wake word...')
        setPreview(img)

        const previewImage = new Image()
        previewImage.onload = () => setImageMeta({ width: previewImage.width || 640, height: previewImage.height || 480 })
        previewImage.src = img
        const detected = await detect(img, 'camera', false, { announce: false })
        if (cancelled) return

        if (detected) {
          wakePausedForAssistantRef.current = true
          wakeRecognitionRef.current?.stop?.()
          setWakeListening(false)
          setWakeStatus('Detection ready. Assistant is about to listen...')
          if (ttsEnabled) {
            await playSpeech(getWakeAssistantPrompt(ttsLanguage), ttsLanguage, { waitUntilDone: true })
          }
          if (cancelled) return
          setWakeStatus('Detection ready. Ask your question now...')
          window.setTimeout(() => {
            if (!cancelled) startVoiceQuestion({ fromWake: true, conversational: true })
          }, 250)
        }
      }, attempt === 0 ? 800 : 350)
    }

    attemptCapture()

    return () => {
      cancelled = true
    }
  }, [mode, wakeCaptureRequest, playSpeech, ttsEnabled, ttsLanguage])

  useEffect(() => {
    if (!wakeEnabled) {
      assistantConversationRef.current = false
      assistantProcessingRef.current = false
      if (assistantRestartTimerRef.current) {
        window.clearTimeout(assistantRestartTimerRef.current)
        assistantRestartTimerRef.current = null
      }
      wakeRecognitionRef.current?.stop?.()
      wakeRecognitionRef.current = null
      setWakeListening(false)
      setWakeStatus('Say "ready" to detect')
      return undefined
    }

    if (!SpeechRecognitionAPI) {
      setWakeEnabled(false)
      setWakeStatus('Wake word is not supported in this browser')
      toast.error('Wake word is not supported in this browser.')
      return undefined
    }

    let stopped = false

    const startWakeRecognition = () => {
      if (stopped || !wakeEnabled) return

      const recognition = new SpeechRecognitionAPI()
      wakeRecognitionRef.current = recognition
      recognition.lang = 'en-US'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 5

      recognition.onstart = () => {
        setWakeListening(true)
        setWakeStatus('Listening for "ready"...')
      }

      recognition.onerror = () => {
        setWakeListening(false)
        setWakeStatus('Wake listener paused. Retrying...')
      }

      recognition.onend = () => {
        setWakeListening(false)
        if (!stopped && wakeEnabled && !wakePausedForAssistantRef.current) {
          window.setTimeout(startWakeRecognition, 800)
        }
      }

      recognition.onresult = (event) => {
        const transcripts = getWakeTranscripts(event)
        const transcript = transcripts[0] || ''
        const heardWakeWord = transcripts.some(isWakeCommand)

        if (transcript && !heardWakeWord) {
          const shortTranscript = transcript.length > 72 ? `${transcript.slice(0, 69)}...` : transcript
          setWakeStatus(`Heard: "${shortTranscript}"`)
        }

        if (heardWakeWord) {
          triggerWakeDetection(transcript)
        }
      }

      try {
        recognition.start()
      } catch {
        setWakeListening(false)
      }
    }

    startWakeRecognition()

    return () => {
      stopped = true
      wakeRecognitionRef.current?.stop?.()
      wakeRecognitionRef.current = null
      setWakeListening(false)
    }
  }, [triggerWakeDetection, wakeEnabled, wakeRestartRequest])

  return (
    <div className="page">
      {/* Header */}
      <div className="mobile-stack" style={{ marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title">Good day, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-sub">Upload an image or use your webcam for real-time object detection</p>
        </div>
        <div
          className="mobile-inline-actions"
          style={{
            display:'flex',
            alignItems:'center',
            gap:10,
            flexWrap:'wrap',
            justifyContent:'flex-end',
          }}
        >
          <select
            value={ttsLanguage}
            onChange={(e) => setTtsLanguage(e.target.value)}
            disabled={!ttsEnabled}
            title="Select voice language"
            style={{
              padding:'8px 12px',
              minWidth:170,
              background:'var(--bg3)',
              border:'1px solid var(--border)',
              borderRadius:'var(--r2)',
              color: ttsEnabled ? 'var(--t1)' : 'var(--t3)',
              fontSize:12,
              fontWeight:600,
              outline:'none',
              opacity: ttsEnabled ? 1 : 0.65,
              cursor: ttsEnabled ? 'pointer' : 'not-allowed',
            }}
          >
            {VOICE_LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => setTtsEnabled(v => !v)}
            title={ttsEnabled ? 'Disable voice announcements' : 'Enable voice announcements'}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
              background: ttsEnabled ? 'var(--accent-bg)' : 'var(--bg3)',
              border:`1px solid ${ttsEnabled ? 'var(--accent)40' : 'var(--border)'}`,
              borderRadius:'var(--r2)', cursor:'pointer', transition:'all var(--ease)',
              color: ttsEnabled ? 'var(--accent)' : 'var(--t3)', fontSize:12, fontWeight:600,
            }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {ttsEnabled
                ? <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/></>
                : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
              }
            </svg>
            {ttsEnabled ? 'Voice On' : 'Voice Off'}
          </button>

          <button
            onClick={() => {
              if (!SpeechRecognitionAPI) {
                toast.error('Wake word is not supported in this browser.')
                return
              }
              setWakeEnabled((value) => !value)
            }}
            title='Enable hands-free detection with "ready"'
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'8px 14px',
              background: wakeEnabled ? 'var(--green-bg)' : 'var(--bg3)',
              border:`1px solid ${wakeEnabled ? 'var(--green)40' : 'var(--border)'}`,
              borderRadius:'var(--r2)', cursor:'pointer', transition:'all var(--ease)',
              color: wakeEnabled ? 'var(--green)' : 'var(--t3)', fontSize:12, fontWeight:600,
            }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            {wakeEnabled ? 'Wake Word On' : 'Wake Word Off'}
          </button>
        </div>
      </div>

      <div
        style={{
          marginBottom:20,
          display:'flex',
          alignItems:'center',
          gap:8,
          color: wakeEnabled ? 'var(--green)' : 'var(--t3)',
          fontSize:12,
          fontWeight:600,
        }}
      >
        <span
          style={{
            width:7,
            height:7,
            borderRadius:'50%',
            background: wakeListening ? 'var(--green)' : 'var(--t3)',
            animation: wakeListening ? 'pulse 1.4s infinite' : 'none',
            flexShrink:0,
          }}
        />
        {wakeEnabled ? wakeStatus : 'Wake word disabled. Turn it on and say "ready".'}
      </div>

      {/* Main grid — 2 columns full width */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, alignItems:'start' }} className="detection-grid">

        {/* LEFT — Input */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Mode tabs */}
              <div className="mobile-stack-tight" style={{ display:'flex', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:4, gap:4 }}>
            {[{id:'upload',label:'Upload Image',icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>},
               {id:'camera',label:'Webcam',icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>}
            ].map(m => (
              <button key={m.id} onClick={() => { setMode(m.id); setResults(null); setPreview(null) }} style={{
                flex:1, padding:'9px 14px', borderRadius:7, border:'none',
                background: mode===m.id ? 'var(--bg5)' : 'transparent',
                color: mode===m.id ? 'var(--t1)' : 'var(--t2)',
                fontWeight: mode===m.id ? 600 : 400,
                fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                transition:'all var(--ease)',
                boxShadow: mode===m.id ? 'var(--shadow)' : 'none',
              }}>{m.icon}{m.label}</button>
            ))}
          </div>

          {/* Upload zone */}
          {mode==='upload' && (
            <div onClick={() => fileRef.current?.click()}
              onDragOver={e=>{e.preventDefault();setDrag(true)}}
              onDragLeave={()=>setDrag(false)}
              onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0])}}
              style={{ border:`2px dashed ${drag?'var(--accent)':'var(--border)'}`, borderRadius:'var(--r3)', background: drag?'var(--accent-bg)':'var(--bg3)', cursor:'pointer', transition:'all var(--ease)', minHeight:280, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, padding:24 }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])} />
              {preview ? (
                <img src={preview} alt="preview" style={{ maxHeight:240, maxWidth:'100%', borderRadius:'var(--r2)', objectFit:'contain' }} />
              ) : (
                <>
                  <div style={{ width:56, height:56, background:'var(--accent-bg)', borderRadius:'var(--r2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontWeight:600, fontSize:14, marginBottom:4 }}>Drop image here or click to browse</p>
                    <p style={{ fontSize:12, color:'var(--t3)' }}>PNG, JPG, WEBP supported • Max 10MB</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Webcam */}
          {mode==='camera' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div className="mobile-camera-toolbar">
                <button
                  type="button"
                  className="mobile-camera-switch"
                  onClick={() => setCameraFacing((current) => current === 'user' ? 'environment' : 'user')}
                  aria-label={usingFrontCamera ? 'Switch to back camera' : 'Switch to front camera'}
                  title={usingFrontCamera ? 'Switch to back camera' : 'Switch to front camera'}
                  style={{
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4.5 9.5h3l1.6-2h5.8l1.6 2h3A1.5 1.5 0 0 1 21 11v6.5A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5V11a1.5 1.5 0 0 1 1.5-1.5Z"/>
                    <path d="M10.2 11.2a3.8 3.8 0 0 1 5.55-.1"/>
                    <path d="M15.7 10.1v1.95h-1.95"/>
                    <path d="M13.8 16.8a3.8 3.8 0 0 1-5.55.1"/>
                    <path d="M8.3 17.9v-1.95h1.95"/>
                  </svg>
                </button>
              </div>
              <div style={{ borderRadius:'var(--r3)', overflow:'hidden', border:'1px solid var(--border)', background:'var(--bg3)' }}>
                <Webcam
                  key={cameraFacing}
                  ref={camRef}
                  screenshotFormat="image/jpeg"
                  mirrored={usingFrontCamera}
                  style={{ width:'100%', display:'block', maxHeight:280, objectFit:'cover' }}
                  videoConstraints={{
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: cameraFacing,
                  }}
                />
              </div>
              <Btn full onClick={capture} loading={loading} size="lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
                Capture & Detect
              </Btn>
            </div>
          )}

          {mode==='upload' && (
            <Btn full size="lg" loading={loading} disabled={!preview}
              onClick={() => { if(fileRef.current?.files[0]) detect(fileRef.current.files[0],'upload',true, { announce: true, openAssistant: true }) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Run Detection
            </Btn>
          )}

          <div className="card" style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <div>
                <h3 className="section-title" style={{ marginBottom:4 }}>Smart Assistant</h3>
                <p style={{ fontSize:12, color:'var(--t3)' }}>{assistantCopy.assistantHint}</p>
              </div>
              <span className="badge badge-blue">{assistantCopy.groundedBadge}</span>
            </div>

            <form onSubmit={handleAssistantSubmit} className="mobile-stack-tight" style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <input
                value={assistantQuestion}
                onChange={(e) => setAssistantQuestion(e.target.value)}
                placeholder={assistantCopy.askPlaceholder}
                style={{
                  flex:1,
                  minWidth:220,
                  padding:'12px 14px',
                  background:'var(--bg5)',
                  border:'1px solid var(--border)',
                  borderRadius:'var(--r2)',
                  color:'var(--t1)',
                  fontSize:13,
                  outline:'none',
                }}
              />
              <button
                type="button"
                onClick={startVoiceQuestion}
                style={{
                  width:44,
                  height:44,
                  borderRadius:'var(--r2)',
                  border:`1px solid ${listening ? 'var(--accent)' : 'var(--border)'}`,
                  background:listening ? 'var(--accent-bg)' : 'var(--bg5)',
                  color:listening ? 'var(--accent)' : 'var(--t2)',
                  cursor:'pointer',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  transition:'all var(--ease)',
                }}
                title={listening ? 'Listening...' : 'Ask with voice'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                  <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <Btn type="submit">Ask</Btn>
            </form>

            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {assistantCopy.quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setAssistantQuestion(prompt)
                    askAssistant(prompt)
                  }}
                  style={{
                    padding:'7px 12px',
                    background:'var(--bg5)',
                    border:'1px solid var(--border)',
                    borderRadius:999,
                    color:'var(--t2)',
                    fontSize:12,
                    cursor:'pointer',
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>

            <div
              style={{
                padding:'14px 16px',
                background:'var(--bg5)',
                border:'1px solid var(--border)',
                borderRadius:'var(--r2)',
                minHeight:82,
                display:'flex',
                flexDirection:'column',
                gap:8,
                justifyContent:'center',
              }}
            >
              <span style={{ fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.08em' }}>{assistantCopy.assistantAnswer}</span>
              <p style={{ fontSize:14, color:'var(--t1)', lineHeight:1.6 }}>
                {assistantAnswer || assistantCopy.runAndAsk}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div>
          {loading ? (
            <div className="card" style={{ minHeight:360, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
              <div style={{ position:'relative', width:72, height:72 }}>
                <div style={{ position:'absolute', inset:0, border:'3px solid var(--accent-bg)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
                <div style={{ position:'absolute', inset:12, border:'2px solid var(--accent)20', borderTopColor:'var(--accent)50', borderRadius:'50%', animation:'spin 1.4s linear infinite reverse' }} />
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontFamily:'var(--display)', fontWeight:700, fontSize:16, marginBottom:6 }}>Analyzing image...</p>
                <p style={{ fontSize:13, color:'var(--t3)' }}>YOLOv11 is processing your input</p>
              </div>
            </div>
          ) : results ? (
            <div className="card" style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* Results header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
                <h3 className="section-title">Detection Results</h3>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span className="badge badge-green"><span className="dot"/>  {results.objectCount} detected</span>
                  <span className="badge badge-blue">{results.processingTime}ms</span>
                  <span className="badge badge-gray">{results.modelVersion}</span>
                </div>
              </div>

              {/* Annotated image */}
              <BBoxCanvas results={results} onReady={handleResultVisualReady} />

              {/* Object cards */}
              <div className="mobile-results-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:10 }}>
                {results.detectedObjects.map((obj,i) => (
                  <div key={i} style={{ padding:'12px 14px', background:'var(--bg5)', border:'1px solid var(--border)', borderRadius:'var(--r2)', display:'flex', flexDirection:'column', gap:7 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{obj.label}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)', flexShrink:0 }}>{(obj.confidence*100).toFixed(1)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${obj.confidence*100}%`, background:`hsl(${obj.confidence*120},65%,55%)` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ minHeight:360, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, textAlign:'center' }}>
              <div style={{ width:72, height:72, background:'var(--bg5)', border:'1px solid var(--border)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <div>
                <p style={{ fontFamily:'var(--display)', fontWeight:700, fontSize:16, marginBottom:6 }}>No results yet</p>
                <p style={{ fontSize:13, color:'var(--t3)', lineHeight:1.6, maxWidth:260 }}>Upload an image or capture from webcam to start object detection</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`@media(max-width:820px){.detection-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
