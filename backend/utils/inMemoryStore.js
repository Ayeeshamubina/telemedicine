const defaultDoctors = [
  {
    _id: 'doc_1',
    user: {
      _id: 'usr_doc_1',
      name: 'Dr. Ravi',
      email: 'ravi@medibridge.org',
      phone: '9876543210',
      location: 'Chennai',
      preferredLanguage: 'English',
      status: 'active',
      role: 'doctor'
    },
    speciality: 'General Medicine',
    experience: 12,
    languages: ['English', 'Tamil'],
    clinicHospitalInfo: 'Apollo Hospitals, Chennai',
    professionalBio: 'Senior Consultant Physician specializing in internal medicine and telemedicine consultations.',
    location: 'Chennai',
    consultationFee: 500,
    consultationModes: { online: true, inClinic: true },
    isApproved: true,
    weeklyAvailability: [
      { day: 'Monday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 15, isAvailable: true },
      { day: 'Tuesday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 15, isAvailable: true },
      { day: 'Wednesday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 15, isAvailable: true },
      { day: 'Thursday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 15, isAvailable: true },
      { day: 'Friday', startTime: '09:00', endTime: '18:00', slotDurationMinutes: 15, isAvailable: true }
    ]
  },
  {
    _id: 'doc_2',
    user: {
      _id: 'usr_doc_2',
      name: 'Dr. Priya Sharma',
      email: 'priya@medibridge.org',
      phone: '9876543212',
      location: 'Bangalore',
      preferredLanguage: 'Hindi',
      status: 'active',
      role: 'doctor'
    },
    speciality: 'Cardiology',
    experience: 15,
    languages: ['English', 'Hindi', 'Kannada'],
    clinicHospitalInfo: 'Fortis Hospital, Bangalore',
    professionalBio: 'Consultant Cardiologist with expertise in preventive cardiology and tele-health.',
    location: 'Bangalore',
    consultationFee: 700,
    consultationModes: { online: true, inClinic: true },
    isApproved: true,
    weeklyAvailability: [
      { day: 'Monday', startTime: '10:00', endTime: '16:00', slotDurationMinutes: 15, isAvailable: true },
      { day: 'Wednesday', startTime: '10:00', endTime: '16:00', slotDurationMinutes: 15, isAvailable: true },
      { day: 'Friday', startTime: '10:00', endTime: '16:00', slotDurationMinutes: 15, isAvailable: true }
    ]
  }
];

const defaultPatients = [
  {
    _id: 'usr_pat_1',
    name: 'Ayeesha',
    email: 'ayeesha@medibridge.org',
    password: '',
    role: 'patient',
    phone: '9876543211',
    preferredLanguage: 'Tamil',
    location: 'Chennai',
    status: 'active'
  }
];

if (!global.__inMemoryUsers) {
  global.__inMemoryUsers = [...defaultPatients, defaultDoctors[0].user, defaultDoctors[1].user];
}
if (!global.__inMemoryDoctors) {
  global.__inMemoryDoctors = [...defaultDoctors];
}
if (!global.__inMemoryAppointments) {
  global.__inMemoryAppointments = [];
}
if (!global.__inMemoryConsultations) {
  global.__inMemoryConsultations = [];
}

module.exports = {
  inMemoryUsers: global.__inMemoryUsers,
  inMemoryDoctors: global.__inMemoryDoctors,
  inMemoryAppointments: global.__inMemoryAppointments,
  inMemoryConsultations: global.__inMemoryConsultations
};
