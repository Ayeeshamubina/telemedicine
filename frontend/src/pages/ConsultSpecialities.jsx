import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Heart,
  Activity,
  Smile,
  Stethoscope,
  ArrowRight
} from 'lucide-react';

const SPECIALITY_METADATA = {
  'Cardiology': { icon: Heart, desc: 'Heart health, blood pressure, and cardiovascular conditions.' },
  'Dermatology': { icon: Activity, desc: 'Skin health, rashes, acne, allergies, and dermatological care.' },
  'Dentistry': { icon: Smile, desc: 'Oral hygiene, dental pain, tooth extractions, and cleanings.' },
  'Gynecology': { icon: Stethoscope, desc: "Women's reproductive health, prenatal care, and consultations." },
  'Neurology': { icon: Activity, desc: 'Brain, spinal cord, nerve disorders, and chronic migraines.' },
  'Orthopedics': { icon: Activity, desc: 'Bones, joints, ligaments, fractures, and sports injuries.' },
  'Pediatrics': { icon: Smile, desc: 'Childhood healthcare, infant nutrition, and vaccinations.' },
  'General Physician': { icon: Stethoscope, desc: 'General health, fevers, infections, and chronic disease management.' },
  'Nutrition': { icon: Heart, desc: 'Dietary guidance, weight management, and metabolic nutrition.' }
};

export const ConsultSpecialities = () => {
  const navigate = useNavigate();
  const [specialities, setSpecialities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialities = async () => {
      try {
        const res = await api.doctors.getSpecialities();
        if (res.success) {
          setSpecialities(res.data);
        }
      } catch (err) {
        console.error('Failed to load specialities:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialities();
  }, []);

  return (
    <div className="section" style={{ minHeight: '80vh' }}>
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px' }}>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '12px', color: '#0f172a' }}>
            Medical Specialities
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.05rem', margin: 0 }}>
            Find specialized physicians and schedule an appointment in your preferred language.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading specialities..." size="large" />
        ) : (
          <div className="grid-3" style={{ gap: '24px' }}>
            {specialities.map((item) => {
              const meta = SPECIALITY_METADATA[item.name] || { icon: Stethoscope, desc: 'Comprehensive medical consultation.' };
              const Icon = meta.icon;
              const hasDoctors = item.doctorCount > 0;

              return (
                <div
                  key={item.name}
                  onClick={() => navigate(`/find-doctors?speciality=${encodeURIComponent(item.name)}`)}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    justifyContent: 'space-between',
                    padding: '28px'
                  }}
                >
                  <div>
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '12px',
                        backgroundColor: '#f0f9ff',
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px'
                      }}
                    >
                      <Icon size={26} />
                    </div>

                    <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>
                      {item.name}
                    </h3>

                    <p style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '16px', lineHeight: 1.5 }}>
                      {meta.desc}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: hasDoctors ? '#059669' : '#94a3b8'
                      }}
                    >
                      {hasDoctors
                        ? `${item.doctorCount} Doctors available`
                        : 'No doctors are available in this speciality yet.'}
                    </span>
                    <ArrowRight size={16} color={hasDoctors ? '#0284c7' : '#94a3b8'} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
