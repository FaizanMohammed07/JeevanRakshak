// Hard-coded location translations for districts and villages.
// Extend the `villages` maps as needed for your dataset.

const districts = {
  // keys are English canonical district names as stored in patient data
  // values are per-language translations (lang code -> translated string)
  Thiruvananthapuram: {
    hi: "त्रिवेंद्रम",
    bn: "তিরুভনন্তপুরম",
    ml: "തിരുവനന്തപുരം",
    ta: "திருவனந்தபுரம்",
    as: "থিৰুভনন্তপুৰম",
    or: "ତିରୁଭୁବନଥପୁରମ",
  },
  Kollam: {
    hi: "कोल्लम",
    bn: "কোলাম",
    ml: "കൊല്ലം",
    ta: "கொள்ளம்",
    as: "কোলাম",
    or: "କୋଲ୍ଲମ",
  },
  Pathanamthitta: {
    hi: "पठानमथिट्टा",
    bn: "পঠানমাথিত্তা",
    ml: "പത്തനംതിട്ട",
    ta: "பத்தானம் திட்டா",
    as: "পাঠানমথিত্তা",
    or: "ପଥାନମଥିଟ୍ଟା",
  },
  Alappuzha: {
    hi: "अलप्पुझा",
    bn: "আলাপ্পুজা",
    ml: "ആലപ്പുഴ",
    ta: "அலப்புஜா",
    as: "আলাপ্পুজা",
    or: "ଆଲାପ୍ପୁଜା",
  },
  Kottayam: {
    hi: "कोट्टायम",
    bn: "কোত্তায়াম",
    ml: "കോട്ടയം",
    ta: "கோட்டயம்",
    as: "কোট্টায়াম",
    or: "କୋଟ୍ଟାୟମ",
  },
  Idukki: {
    hi: "इडुक्की",
    bn: "ইদুক্কি",
    ml: "ഇടുക്കി",
    ta: "இடுக்கி",
    as: "ইডুক্কি",
    or: "ଇଦୁକ୍କି",
  },
  Ernakulam: {
    hi: "एर्नाकुलम",
    bn: "এরনাকুলাম",
    ml: "എറണാകുളം",
    ta: "எர்னாகுளம்",
    as: "এৰ্ণাকুলাম",
    or: "ଏର୍ଣ୍ଣାକୁଲମ",
  },
  Thrissur: {
    hi: "त्रिशूर",
    bn: "থ্রিসু্র",
    ml: "ത്രിശ്ശൂര്‍",
    ta: "திரிசூர்",
    as: "ত্রিশুর",
    or: "ଥ୍ରିଶୁର",
  },
  Palakkad: {
    hi: "पालक्कड़",
    bn: "পালাক্কাদ",
    ml: "പാലക്കാട്",
    ta: "பாலக்காட்",
    as: "পালাক্কাদ",
    or: "ପାଳକ୍କାଦ",
  },
  Malappuram: {
    hi: "मलप्पुरम",
    bn: "মালাপ্পুরম",
    ml: "മലപ്പുറം",
    ta: "மலப்புரம்",
    as: "মালাপ্পুরম",
    or: "ମଲାପ୍ପୁରାମ",
  },
  Kozhikode: {
    hi: "कोझीकोड",
    bn: "কোজিকোডে",
    ml: "കോഴിക്കോട്ടു",
    ta: "கொழிக்கோடு",
    as: "কোজিকোডে",
    or: "କୋଜିହକୋଡ୍",
  },
  Wayanad: {
    hi: "वायनाड",
    bn: "ওয়ায়ানাড",
    ml: "വയനാട്",
    ta: "வயநாத்",
    as: "ৱায়ানাড",
    or: "ୱାୟାନାଡ",
  },
  Kannur: {
    hi: "कन्नूर",
    bn: "কান্নূর",
    ml: "കണ്ണൂര്‍",
    ta: "கண்ணூர்",
    as: "কান্নুর",
    or: "କାନ୍ନୁର",
  },
  Kasaragod: {
    hi: "कसरगोड़",
    bn: "কাসারগোড",
    ml: "കാസർഗോഡ്",
    ta: "காசராகோட்",
    as: "কাসারগোড",
    or: "କାସରଗୋଡ",
  },
};

// Village-level mapping is highly project-specific. Provide entries as needed.
// Example structure: villages["VillageName"][lang] = "translated name"
const villages = {
  // Add village mappings here when you know patient.village values
  // "Vattiyoorkavu": { hi: "वत्तियोर्कवु", ml: "വട്ടിയൂര്‍ക്കാവ്", ta: "வட்டியூர்க்காவு" },
};

export function translateLocationField(
  lang = "en",
  type = "district",
  value = ""
) {
  if (!value) return value;
  const key = String(value).trim();
  const l = (lang || "en").split("-")[0];
  if (type === "district") {
    const entry = districts[key];
    if (entry && entry[l]) return entry[l];
    // try case-insensitive lookup
    const found = Object.keys(districts).find(
      (k) => k.toLowerCase() === key.toLowerCase()
    );
    if (found && districts[found] && districts[found][l])
      return districts[found][l];
  }
  if (type === "village") {
    const entry = villages[key];
    if (entry && entry[l]) return entry[l];
    const found = Object.keys(villages).find(
      (k) => k.toLowerCase() === key.toLowerCase()
    );
    if (found && villages[found] && villages[found][l])
      return villages[found][l];
  }
  // If no mapping available, return original value so existing dynamic translation can be used.
  return value;
}
