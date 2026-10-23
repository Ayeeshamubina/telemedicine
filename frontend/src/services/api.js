const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('medibridge_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
};

export const api = {
  // Authentication
  auth: {
    login: async (credentials) => {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return handleResponse(res);
    },
    register: async (userData) => {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      return handleResponse(res);
    },
    getMe: async () => {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    updateProfile: async (data) => {
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  },

  // Doctors
  doctors: {
    getAll: async (params = {}) => {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/doctors?${query}`);
      return handleResponse(res);
    },
    getById: async (id) => {
      const res = await fetch(`${API_BASE_URL}/doctors/${id}`);
      return handleResponse(res);
    },
    getSpecialities: async () => {
      const res = await fetch(`${API_BASE_URL}/doctors/specialities`);
      return handleResponse(res);
    },
    updateProfile: async (data) => {
      const res = await fetch(`${API_BASE_URL}/doctors/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    updateAvailability: async (data) => {
      const res = await fetch(`${API_BASE_URL}/doctors/availability`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    }
  },

  // Appointments
  appointments: {
    create: async (data) => {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    getMy: async () => {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    getById: async (id) => {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    updateStatus: async (id, statusData) => {
      const res = await fetch(`${API_BASE_URL}/appointments/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(statusData)
      });
      return handleResponse(res);
    },
    getBookedSlots: async (doctorId, date) => {
      const res = await fetch(`${API_BASE_URL}/appointments/booked-slots?doctorId=${doctorId}&date=${date}`);
      return handleResponse(res);
    }
  },

  // Consultations
  consultations: {
    startInstant: async (data) => {
      const res = await fetch(`${API_BASE_URL}/consultations/instant`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    getByRoom: async (roomId) => {
      const res = await fetch(`${API_BASE_URL}/consultations/room/${roomId}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    updateStatus: async (id, status) => {
      const res = await fetch(`${API_BASE_URL}/consultations/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return handleResponse(res);
    },
    getHistory: async () => {
      const res = await fetch(`${API_BASE_URL}/consultations/history`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  },

  // Interpreters
  interpreters: {
    getProfile: async () => {
      const res = await fetch(`${API_BASE_URL}/interpreters/profile`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    updateProfile: async (data) => {
      const res = await fetch(`${API_BASE_URL}/interpreters/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    toggleAvailability: async (isAvailable) => {
      const res = await fetch(`${API_BASE_URL}/interpreters/availability`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isAvailable })
      });
      return handleResponse(res);
    },
    request: async (requestData) => {
      const res = await fetch(`${API_BASE_URL}/interpreters/request`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });
      return handleResponse(res);
    },
    getPendingRequests: async () => {
      const res = await fetch(`${API_BASE_URL}/interpreters/requests/pending`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    respondToRequest: async (requestId, action) => {
      const res = await fetch(`${API_BASE_URL}/interpreters/requests/${requestId}/respond`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action })
      });
      return handleResponse(res);
    }
  },

  // Prescriptions
  prescriptions: {
    create: async (data) => {
      const res = await fetch(`${API_BASE_URL}/prescriptions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    getMy: async () => {
      const res = await fetch(`${API_BASE_URL}/prescriptions`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    getById: async (id) => {
      const res = await fetch(`${API_BASE_URL}/prescriptions/${id}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  },

  // Admin
  admin: {
    login: async (credentials) => {
      const res = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      return handleResponse(res);
    },
    getStats: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    getUsers: async (role = '') => {
      const res = await fetch(`${API_BASE_URL}/admin/users?role=${role}`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    updateUserStatus: async (id, status) => {
      const res = await fetch(`${API_BASE_URL}/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      return handleResponse(res);
    },
    toggleDoctorApproval: async (id, isApproved) => {
      const res = await fetch(`${API_BASE_URL}/admin/doctors/${id}/approval`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isApproved })
      });
      return handleResponse(res);
    },
    getAppointments: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/appointments`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    getConsultations: async () => {
      const res = await fetch(`${API_BASE_URL}/admin/consultations`, {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    }
  },

  // Translation Service
  translation: {
    getStatus: async () => {
      const res = await fetch(`${API_BASE_URL}/translation/status`);
      return handleResponse(res);
    },
    translate: async (text, sourceLang, targetLang) => {
      const res = await fetch(`${API_BASE_URL}/translation/translate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text, sourceLang, targetLang })
      });
      return handleResponse(res);
    },
    getTtsAudioUrl: (text, lang) => {
      return `${API_BASE_URL}/translation/tts?text=${encodeURIComponent(text)}&lang=${encodeURIComponent(lang)}`;
    }
  }
};
