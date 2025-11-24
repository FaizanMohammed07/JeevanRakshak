export const mockPatients = [
  {
    id: "patient-1",
    migrant_health_id: "MH2025001234",
    name: "Aarav Nair",
    age: 32,
    gender: "Male",
    blood_group: "O+",
    emergency_contact: "+91 98765 43210",
    photo_url:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    allergies: ["Penicillin"],
    chronic_diseases: ["Hypertension"],
    current_medication: ["Amlodipine 5mg OD"],
    vaccinations: [
      {
        id: "vac-101",
        vaccine_name: "COVID-19 Booster",
        date_administered: "2025-08-15",
        next_dose_date: null,
      },
      {
        id: "vac-102",
        vaccine_name: "Influenza 2025",
        date_administered: "2025-09-20",
        next_dose_date: "2026-09-20",
      },
    ],
    visits: [
      {
        id: "visit-201",
        facility_name: "Primary Health Center, Ernakulam",
        visit_date: "2025-11-15",
        doctor_name: "Dr. Meera Varma",
        reason: "Hypertension follow-up",
      },
      {
        id: "visit-202",
        facility_name: "Community Clinic, Kochi",
        visit_date: "2025-10-02",
        doctor_name: "Dr. Rakesh Rao",
        reason: "Seasonal flu symptoms",
      },
    ],
    prescriptions: [
      {
        id: "rx-301",
        prescribed_at: "2025-10-02",
        prescribed_by: "Dr. Rakesh Rao",
        symptoms: "Fever, cough, body pain",
        diagnosis: "Seasonal Influenza",
        medicines: [
          { name: "Paracetamol 650mg", dosage: "1-1-1 after food" },
          { name: "Cetirizine 10mg", dosage: "0-0-1 for 5 days" },
        ],
        notes: "Rest and warm fluids recommended.",
      },
    ],
    documents: [
      {
        id: "doc-401",
        document_name: "Blood Test Report",
        document_type: "Lab Report",
        file_url: "https://via.placeholder.com/600x400?text=Blood+Report",
        uploaded_at: "2025-09-28",
        uploaded_by: "Dr. Meera Varma",
      },
    ],
  },
  {
    id: "patient-2",
    migrant_health_id: "MH2025005678",
    name: "Lakshmi Pillai",
    age: 28,
    gender: "Female",
    blood_group: "B+",
    emergency_contact: "+91 91234 56789",
    photo_url:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
    allergies: ["Seafood", "Dust"],
    chronic_diseases: ["Asthma"],
    current_medication: ["Levosalbutamol Inhaler (SOS)"],
    vaccinations: [
      {
        id: "vac-103",
        vaccine_name: "Tetanus Booster",
        date_administered: "2025-07-11",
        next_dose_date: "2035-07-11",
      },
    ],
    visits: [
      {
        id: "visit-203",
        facility_name: "District Hospital, Alappuzha",
        visit_date: "2025-09-12",
        doctor_name: "Dr. Anjali Mohan",
        reason: "Routine check-up",
      },
    ],
    prescriptions: [
      {
        id: "rx-302",
        prescribed_at: "2025-09-12",
        prescribed_by: "Dr. Anjali Mohan",
        symptoms: "Breathlessness on exertion",
        diagnosis: "Asthma - mild persistent",
        medicines: [
          { name: "Budesonide Inhaler", dosage: "2 puffs twice daily" },
          { name: "Montelukast 10mg", dosage: "1-0-0 at bedtime" },
        ],
        notes: "Avoid dust exposure; follow-up in 3 months.",
      },
    ],
    documents: [
      {
        id: "doc-402",
        document_name: "Pulmonary Function Test",
        document_type: "Lab Report",
        file_url: "https://via.placeholder.com/600x400?text=PFT+Report",
        uploaded_at: "2025-08-01",
        uploaded_by: "Dr. Anjali Mohan",
      },
    ],
  },
];
