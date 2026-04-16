import React, { useState } from 'react';

interface Caregiver {
  id: string;
  name: string;
  relationshipType: string;
}

interface Props {
  caregivers: Caregiver[];
  onAdd: (name: string, relation: string) => Promise<void>;
  onRemove?: (id: string) => Promise<void>;
}

export default function CaregiverCard({ caregivers, onAdd, onRemove }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', relation: 'parent' });
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!formData.name.trim()) return;
    try {
      setLoading(true);
      await onAdd(formData.name, formData.relation);
      setFormData({ name: '', relation: 'parent' });
      setShowAddForm(false);
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
      <h3 style={{
        margin: '0 0 16px',
        fontSize: 16,
        fontWeight: 700,
        color: '#0D2149',
        fontFamily: "'Playfair Display', serif",
      }}>Caregivers</h3>

      {caregivers.length === 0 && !showAddForm && (
        <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 12 }}>No caregivers added yet.</p>
      )}

      {caregivers.map(cg => (
        <div key={cg.id} style={{
          padding: '12px',
          marginBottom: 8,
          background: '#f8f9fa',
          borderRadius: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2a5e' }}>{cg.name}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>{cg.relationshipType.replace('_', ' ')}</div>
          </div>
          {onRemove && (
            <button onClick={() => onRemove(cg.id)} style={{
              padding: '4px 8px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12,
            }}>Remove</button>
          )}
        </div>
      ))}

      {!showAddForm && (
        <button onClick={() => setShowAddForm(true)} style={{
          padding: '8px 12px', background: '#2ab5c1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, marginTop: caregivers.length > 0 ? 12 : 0,
        }}>+ Add Caregiver</button>
      )}

      {showAddForm && (
        <div style={{ padding: '12px', background: '#f0f9ff', borderRadius: 6, border: '1px solid #e0f2fe' }}>
          <input type="text" placeholder="Caregiver name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{
            width: '100%', padding: '8px', marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: "'DM Sans'", boxSizing: 'border-box',
          }} />
          <select value={formData.relation} onChange={e => setFormData({ ...formData, relation: e.target.value })} style={{
            width: '100%', padding: '8px', marginBottom: 8, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: "'DM Sans'", boxSizing: 'border-box',
          }}>
            <option value="parent">Parent</option>
            <option value="guardian">Guardian</option>
            <option value="spouse">Spouse</option>
            <option value="healthcare_provider">Healthcare Provider</option>
            <option value="other">Other</option>
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} disabled={loading} style={{
              flex: 1, padding: '8px 12px', background: '#1a2a5e', color: '#fff', border: 'none', borderRadius: 6, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, opacity: loading ? 0.6 : 1,
            }}>{loading ? 'Adding...' : 'Add'}</button>
            <button onClick={() => setShowAddForm(false)} style={{
              flex: 1, padding: '8px 12px', background: '#e5e7eb', color: '#666', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
