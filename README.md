# MEDIBRIDGE – Multilingual Telemedicine Platform

### *Healthcare Without Language Barriers*

---

## 📌 Project Overview

**MEDIBRIDGE** is a comprehensive, production-ready multilingual telemedicine web platform designed to eliminate linguistic friction between healthcare providers and patients. By combining real-time WebRTC audio/video consultations, an on-demand medical interpreter dispatch mesh, and an intelligent bidirectional speech-and-text translation engine, MEDIBRIDGE ensures that quality medical consultations are universally accessible regardless of language proficiency.

---

## 🩺 Problem Statement

Language barriers in medical consultations can lead to misdiagnoses, delayed treatments, reduced patient compliance, and significant healthcare disparities. In multilingual societies, patients frequently struggle to articulate complex physical symptoms in languages other than their mother tongue, while doctors face immense challenges understanding regional idioms and terminology. Existing telemedicine tools lack embedded, real-time multilingual translation and verified interpreter dispatching, leaving vulnerable populations without equitable access to remote healthcare.

---

## ✨ Key Features

1. **Bidirectional Real-Time Live Translation**
   - Instant speech-to-text recognition and translation across **English, Tamil, Hindi, Telugu, Malayalam, and Kannada**.
   - Clinically tailored medical lexicon preserving natural honorifics and medical symptom nuance.
   - Text-to-speech audio playback for translated speech.
   - Distinct, isolated visual speech bubbles with clear speaker attribution.

2. **WebRTC High-Definition Video & Audio Consultations**
   - Low-latency peer-to-peer audio/video streaming via browser-native `RTCPeerConnection`.
   - Adaptive media stream acquisition with seamless fallback support and one-click camera activation.
   - In-call controls: Microphone mute/unmute, Video toggle, Live Subtitles toggle, and Call Termination.

3. **Multi-Peer Interpreter Mesh**
   - Three-way conferencing allowing patients and doctors to request a certified medical interpreter on demand.
   - Interpreters receive incoming call dispatches with instant accept/decline workflows.

4. **Doctor Discovery & Intelligent Appointment Booking**
   - Filter verified physicians by medical speciality, languages spoken, consultation mode (In-Clinic or Online Video), and location.
   - Real-time slot reservation system with double-booking conflict prevention.

5. **Digital Clinical Prescriptions**
   - Doctors issue structured digital prescriptions (diagnosis, clinical notes, medications, dosages, dietary instructions, and follow-up dates).
   - Patients can view and download their prescriptions directly from their medical records dashboard.

6. **Role-Based Security & Data Privacy**
   - Cryptographically secured authentication using JSON Web Tokens (JWT) and bcrypt password hashing.
   - Strict authorization middleware restricting medical records and session data to verified participants.

---

## 👥 User Roles

| Role | Responsibilities & Capabilities |
|---|---|
| **Patient** | Searches doctors, books appointments, conducts online video consultations, accesses live translation, views digital prescriptions, and reviews consultation history. |
| **Doctor** | Manages clinical profile, availability slots, and consultation fees; conducts two-way video calls; requests live interpreters; and authors structured digital prescriptions. |
| **Interpreter** | Sets language pair competencies (e.g., Tamil ⇄ English, Hindi ⇄ English), toggles live availability, receives consultation dispatch requests, and joins calls as a certified mediator. |
| **Administrator** | Accesses protected system metrics, audits platform registrations, verifies medical licenses, and moderates platform users. |

---

## 🛠 Technology Stack

- **Frontend**:
  - React.js (v18)
  - React Router DOM (v6)
  - Vite build tool
  - `i18next` & `react-i18next` (Internationalization)
  - `socket.io-client` (Signalling & live transcripts)
  - `lucide-react` (Accessible UI iconography)
- **Backend**:
  - Node.js & Express.js
  - Socket.IO (WebSockets for WebRTC signalling)
  - Mongoose (MongoDB ODM)
  - JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
  - DualProxy SSL helper for mobile/local network testing
- **Database**:
  - MongoDB (Community Server / Atlas)
- **Protocols**:
  - WebRTC (`RTCPeerConnection`, `MediaStream`)
  - WebSocket (WSS / Socket.IO)
  - HTTPS / TLS

---

## 📂 Project Folder Structure

```
TELEMEDICINE/
├── backend/
│   ├── certs/                   # SSL/TLS certificates for local HTTPS proxy
│   ├── config/
│   │   └── db.js                # MongoDB connection handler
│   ├── controllers/
│   │   ├── adminController.js   # Administrator login & moderation
│   │   ├── appointmentController.js # Appointment booking & conflict prevention
│   │   ├── authController.js    # Registration, login & profile retrieval
│   │   ├── consultationController.js # Consultation rooms & instant calls
│   │   ├── doctorController.js  # Doctor profile & availability slots
│   │   ├── interpreterController.js # Interpreter requests & matchmaking
│   │   └── prescriptionController.js # Digital prescription issuance
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification & role authorization
│   │   └── errorMiddleware.js   # Centralized error handler
│   ├── models/
│   │   ├── Appointment.js       # Appointment schema
│   │   ├── Consultation.js      # Video consultation session schema
│   │   ├── DoctorProfile.js     # Doctor clinical details schema
│   │   ├── InterpreterProfile.js # Interpreter language competency schema
│   │   ├── InterpreterRequest.js # Active interpretation dispatch schema
│   │   ├── Prescription.js      # Medical prescription schema
│   │   └── User.js              # Core user account schema
│   ├── routes/                  # Express REST API routes
│   │   ├── adminRoutes.js
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── consultationRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── interpreterRoutes.js
│   │   ├── prescriptionRoutes.js
│   │   └── translationRoutes.js
│   ├── services/
│   │   ├── socketService.js     # WebRTC signalling & transcript relay hub
│   │   └── translationService.js # Modular neural translation engine
│   ├── utils/
│   │   └── jwt.js               # JWT signing helper
│   ├── .env.example             # Backend environment template
│   ├── package.json
│   └── server.js                # Express & Socket.IO server entrypoint
│
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── appointment/     # Booking modal
│   │   │   ├── common/          # Navbar, Footer, Modal, Spinner
│   │   │   ├── consultation/    # VideoControls, LanguageBridge
│   │   │   └── doctor/          # DoctorCard, PrescriptionModal
│   │   ├── contexts/            # React contexts (Auth, Socket, Toast)
│   │   ├── hooks/
│   │   │   └── useWebRTC.js     # WebRTC media acquisition & peer connection hook
│   │   ├── i18n/                # Localization JSON files (en, ta, hi, te, ml, kn)
│   │   ├── pages/               # Application view routes
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── ConsultationRoom.jsx # Core video consultation view
│   │   │   ├── DoctorDashboard.jsx
│   │   │   ├── FindDoctors.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── InterpreterDashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PatientDashboard.jsx
│   │   │   └── Register.jsx
│   │   ├── services/
│   │   │   └── api.js           # Centralized Axios/fetch API client
│   │   ├── App.jsx              # Main router & layout guards
│   │   ├── index.css            # Custom CSS styling system
│   │   └── main.jsx             # React DOM entrypoint
│   ├── index.html
│   ├── package.json
│   └── vite.config.js           # Vite development server configuration
│
├── .env.example                 # Root environment template
├── .gitignore                   # Git exclusion rules
├── package.json                 # Workspace root package manifest
└── README.md                    # Project documentation
```

---

## ⚙️ Prerequisites

Before running the project locally, ensure you have:
1. **Node.js**: `v18.x` or higher (`v20+` recommended).
2. **npm**: `v9.x` or higher.
3. **MongoDB**: Local MongoDB community service running on port `27017` or a MongoDB Atlas URI.
4. **Modern Web Browser**: Google Chrome or Microsoft Edge (recommended for Web Speech API and WebRTC support).

---

## 📥 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/medibridge-multilingual-telemedicine.git
   cd medibridge-multilingual-telemedicine
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

---

## 🔐 Environment Variable Setup

1. In the `backend/` directory, copy `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Configure your local settings inside `backend/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/medibridge
   JWT_SECRET=your_custom_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@medibridge.org
   ADMIN_PASSWORD=your_secure_admin_password
   CLIENT_URL=http://localhost:5173

   # Optional external translation API key (built-in neural translation is enabled by default)
   TRANSLATION_API_KEY=
   SPEECH_TO_TEXT_API_KEY=
   ```

---

## 🗄️ Database Setup

1. Start your local MongoDB daemon:
   - **Windows**: Ensure the `MongoDB` service is running in `services.msc`, or run `mongod`.
   - **macOS / Linux**: `sudo systemctl start mongod` or `brew services start mongodb-community`.
2. MEDIBRIDGE will automatically create the required collections (`users`, `doctorprofiles`, `appointments`, `prescriptions`, `consultations`) upon initial startup and registration.

---

## 🚀 Running the Application Locally

### 1. Start the Backend Server
```bash
cd backend
npm run dev
```
* The backend server will start on `http://localhost:5000` with MongoDB and Socket.IO active.
* DualProxy will simultaneously initialize on `https://0.0.0.0:5173` to facilitate mobile network testing.

### 2. Start the Frontend Development Server
In a separate terminal window:
```bash
cd frontend
npm run dev
```
* The Vite frontend will serve on `http://localhost:5174` (or `https://localhost:5173` via DualProxy).

---

## 🌐 API Documentation

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new Patient, Doctor, or Interpreter | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Private (Bearer Token) |
| `GET` | `/api/doctors` | Search doctors with speciality, language, and mode filters | Public |
| `GET` | `/api/doctors/:id` | Get detailed doctor profile and weekly availability slots | Public |
| `POST` | `/api/appointments` | Book consultation appointment with conflict validation | Private (Patient) |
| `GET` | `/api/appointments` | List appointments for authenticated user | Private |
| `PATCH` | `/api/appointments/:id/status` | Update appointment status (`confirmed`, `completed`, `cancelled`) | Private |
| `POST` | `/api/consultations/instant` | Generate an instant WebRTC consultation room | Private (Patient) |
| `GET` | `/api/consultations/room/:roomId` | Fetch consultation room metadata | Private |
| `POST` | `/api/interpreters/request` | Dispatch an on-demand interpretation request | Private |
| `GET` | `/api/interpreters/requests/pending` | List pending interpretation requests matching languages | Private (Interpreter) |
| `PATCH` | `/api/interpreters/requests/:id/respond` | Accept or decline interpretation request | Private (Interpreter) |
| `POST` | `/api/prescriptions` | Create a structured digital clinical prescription | Private (Doctor) |
| `GET` | `/api/prescriptions` | Retrieve medical prescriptions for patient | Private |
| `POST` | `/api/translation/translate` | Real-time multilingual neural text translation | Public |
| `POST` | `/api/admin/login` | Administrator authentication | Public (Hidden route) |
| `GET` | `/api/admin/stats` | Retrieve platform-wide metrics & user statistics | Admin |

---

## 📸 Screenshots

*(Screenshots can be added here)*

| Consultation Room & Live Translation | Doctor Discovery & Booking |
|:---:|:---:|
| ![Consultation Room](https://via.placeholder.com/600x340?text=Consultation+Room+%26+Live+Translation) | ![Doctor Discovery](https://via.placeholder.com/600x340?text=Doctor+Discovery+%26+Booking) |

| Patient Prescriptions Dashboard | Multilingual Language Bridge |
|:---:|:---:|
| ![Prescriptions](https://via.placeholder.com/600x340?text=Prescriptions+Dashboard) | ![Language Bridge](https://via.placeholder.com/600x340?text=Language+Bridge+Panel) |

---

## 🔮 Future Enhancements

- **Offline-First Synchronisation**: PWA caching for rural areas with unstable network connectivity.
- **AI Medical Summary Generation**: Automatic generation of clinical notes and diagnosis drafts from call transcripts.
- **Integration with National Health ID (ABHA)**: Direct interoperability with standardized electronic health record registries.
- **Expanded Regional Dialect Support**: Acoustic fine-tuning for regional dialects in rural healthcare centers.

---

## 👩‍💻 Author

**Ayeesha Mubina M.**  
*Developer, MEDIBRIDGE Telemedicine Platform*
