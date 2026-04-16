import React, { useState } from 'react';

interface Props {
  profile: {
    name: string;
    age: number;
    weight_kg: number;
    diabetes_type: string;
    regimen: string;
    dietary_preference: string;
  };
  onUpdate: (updated: any) => Promise<void>;
}

export default function UserProfileCard({ profile, onUpdate }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await onUpdate(formData);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-card, #fff)',
      border: '1px solid rgba(148,163,184,0.35)',
      borderRadius: 12,
      padding: '20px 24px',
      marginBottom: 16,
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: '#0D2149',
          fontFamily: "'Playfair Display', serif",
        }}>Your Profile</h3>
        <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} style={{
          padding: '6px 12px', background: isEditing ? '#1a2a5e' : '#2ab5c1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}>{isEditing ? (loading ? 'Saving...' : 'Save') : 'Edit'}</button>
      </div>

      {isEditing ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{
              width: '100%', padding: '8px', marginTop: 4, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: "'DM Sans'", boxSizing: 'border-box',
            }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Age</label>
            <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: Number(e.target.value) })} style={{
              width: '100%', padding: '8px', marginTop: 4, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: "'DM Sans'", boxSizing: 'border-box',
            }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Weight (kg)</label>
            <input type="number" step="0.1" value={formData.weight_kg} onChange={e => setFormData({ ...formData, weight_kg: Number(e.target.value) })} style={{
              width: '100%', padding: '8px', marginTop: 4, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: "'DM Sans'", boxSizing: 'border-box',
            }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Diabetes Type</label>
            <select value={formData.diabetes_type} onChange={e => setFormData({ ...formData, diabetes_type: e.target.value })} style={{
              width: '100%', padding: '8px', marginTop: 4, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: "'DM Sans'", boxSizing: 'border-box',
            }}>
              <option value="type_1">Type 1</option>
              <option value="type_2">Type 2</option>
              <option value="gestational">Gestational</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Dietary Preference</label>
            <select value={formData.dietary_preference} onChange={e => setFormData({ ...formData, dietary_preference: e.target.value })} style={{
              width: '100%', padding: '8px', marginTop: 4, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: "'DM Sans'", boxSizing: 'border-box',
            }}>
              <option value="none">None</option>
              <option value="bernstein_low_carb">Bernstein Low-Carb</option>
              <option value="keto">Keto</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
            </select>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Name</div>
            <div style={{ fontSize: 14, color: '#1a2a5e', marginTop: 4 }}>{formData.name}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Age</div>
            <div style={{ fontSize: 14, color: '#1a2a5e', marginTop: 4 }}>{formData.age} years</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Weight</div>
            <div style={{ fontSize: 14, color: '#1a2a5e', marginTop: 4 }}>{formData.weight_kg} kg</div>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Diabetes Type</div>
            <div style={{ fontSize: 14, color: '#1a2a5e', marginTop: 4, textTransform: 'capitalize' }}>{formData.diabetes_type.replace('_', ' ')}</div>
          </div>
        </div>
      )}
    </div>
  );
}
