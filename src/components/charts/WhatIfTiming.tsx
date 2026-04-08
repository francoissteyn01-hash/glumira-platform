import React, { useState } from 'react';

interface WhatIfTimingProps {
  basalEntries: Array<{ insulinName: string; dose: number; time: string }>;
  bolusEntries: Array<{ insulinName: string; dose: number; time: string; mealType?: string }>;
  onTimingChange: (type: 'basal' | 'bolus', index: number, newTime: string) => void;
  onDoseChange: (type: 'basal' | 'bolus', index: number, newDose: number) => void;
  onReset: () => void;
  isModified: boolean;
  tier?: 'free' | 'pro' | 'ai' | 'clinical';
}

const WhatIfTiming: React.FC<WhatIfTimingProps> = ({
  basalEntries,
  bolusEntries,
  onTimingChange,
  onDoseChange,
  onReset,
  isModified,
  tier = 'free',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'timing' | 'dose'>('timing');

  const hasDoseAccess = tier === 'pro' || tier === 'ai' || tier === 'clinical';

  const pillStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    padding: '6px 18px',
    borderRadius: 20,
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--accent-teal, #2AB5C1)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary, #6b7280)',
    transition: 'background 0.2s, color 0.2s',
  });

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    borderBottom: '1px solid var(--border, #e5e7eb)',
    padding: '0 4px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: 'var(--text-primary, #1a2a5e)',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-muted, #9ca3af)',
    padding: '12px 4px 4px',
  };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", position: 'relative' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 44,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-primary, #1a2a5e)',
          padding: '0 4px',
        }}
      >
        <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
        Explore what-if
      </button>

      {expanded && (
        <div style={{ padding: '0 0 16px' }}>
          {/* Yellow banner */}
          <div
            style={{
              background: '#FFC107',
              color: '#1a2a5e',
              fontSize: 12,
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: 6,
              marginBottom: 12,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            WHAT-IF — not your actual regimen
          </div>

          {/* Tab pills */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'var(--bg-card, #f9fafb)',
              borderRadius: 24,
              padding: 3,
              width: 'fit-content',
              marginBottom: 16,
            }}
          >
            <button style={pillStyle(activeTab === 'timing')} onClick={() => setActiveTab('timing')}>
              Timing
            </button>
            <button style={pillStyle(activeTab === 'dose')} onClick={() => setActiveTab('dose')}>
              Dose
            </button>
          </div>

          {/* TIMING TAB */}
          {activeTab === 'timing' && (
            <div>
              {basalEntries.length > 0 && (
                <>
                  <div style={sectionHeaderStyle}>Basal</div>
                  {basalEntries.map((entry, i) => (
                    <div key={`basal-${i}`} style={rowStyle}>
                      <span>
                        {entry.insulinName} {entry.dose}U
                      </span>
                      <input
                        type="time"
                        value={entry.time}
                        onChange={(e) => onTimingChange('basal', i, e.target.value)}
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 6,
                          padding: '4px 8px',
                          color: 'var(--text-primary, #1a2a5e)',
                          background: 'var(--bg-card, #fff)',
                        }}
                      />
                    </div>
                  ))}
                </>
              )}
              {bolusEntries.length > 0 && (
                <>
                  <div style={sectionHeaderStyle}>Bolus</div>
                  {bolusEntries.map((entry, i) => (
                    <div key={`bolus-${i}`} style={rowStyle}>
                      <span>
                        {entry.insulinName} {entry.dose}U{entry.mealType ? ` (${entry.mealType})` : ''}
                      </span>
                      <input
                        type="time"
                        value={entry.time}
                        onChange={(e) => onTimingChange('bolus', i, e.target.value)}
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 13,
                          border: '1px solid var(--border, #e5e7eb)',
                          borderRadius: 6,
                          padding: '4px 8px',
                          color: 'var(--text-primary, #1a2a5e)',
                          background: 'var(--bg-card, #fff)',
                        }}
                      />
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* DOSE TAB */}
          {activeTab === 'dose' && (
            <div>
              {!hasDoseAccess ? (
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: 'var(--text-muted, #9ca3af)',
                    padding: '20px 0',
                    textAlign: 'center',
                  }}
                >
                  Dose exploration available on Pro plan
                </div>
              ) : (
                <>
                  {/* Red pharmacological banner */}
                  <div
                    style={{
                      background: '#F44336',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '8px 16px',
                      borderRadius: 6,
                      marginBottom: 12,
                      fontFamily: "'DM Sans', sans-serif",
                      lineHeight: 1.5,
                    }}
                  >
                    PHARMACOLOGICAL EDUCATION — This shows what published insulin data predicts at this dose. It is NOT a prescription.
                  </div>

                  {basalEntries.length > 0 && (
                    <>
                      <div style={sectionHeaderStyle}>Basal</div>
                      {basalEntries.map((entry, i) => {
                        const min = Math.max(0, entry.dose * 0.5);
                        const max = entry.dose * 1.5;
                        return (
                          <div key={`basal-dose-${i}`} style={{ ...rowStyle, gap: 12 }}>
                            <span style={{ flexShrink: 0 }}>{entry.insulinName}</span>
                            <input
                              type="range"
                              min={min}
                              max={max}
                              step={0.25}
                              value={entry.dose}
                              onChange={(e) => onDoseChange('basal', i, parseFloat(e.target.value))}
                              className="what-if-time-slider" style={{ flex: 1 }}
                            />
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                              {entry.dose.toFixed(2)}U
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {bolusEntries.length > 0 && (
                    <>
                      <div style={sectionHeaderStyle}>Bolus</div>
                      {bolusEntries.map((entry, i) => {
                        const min = Math.max(0, entry.dose * 0.5);
                        const max = entry.dose * 1.5;
                        return (
                          <div key={`bolus-dose-${i}`} style={{ ...rowStyle, gap: 12 }}>
                            <span style={{ flexShrink: 0 }}>
                              {entry.insulinName}{entry.mealType ? ` (${entry.mealType})` : ''}
                            </span>
                            <input
                              type="range"
                              min={min}
                              max={max}
                              step={0.25}
                              value={entry.dose}
                              onChange={(e) => onDoseChange('bolus', i, parseFloat(e.target.value))}
                              className="what-if-time-slider" style={{ flex: 1 }}
                            />
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, flexShrink: 0, minWidth: 40, textAlign: 'right' }}>
                              {entry.dose.toFixed(2)}U
                            </span>
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Reset button */}
          <button
            onClick={onReset}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--border, #e5e7eb)',
              background: 'transparent',
              color: 'var(--text-primary, #1a2a5e)',
              cursor: 'pointer',
              marginTop: 16,
            }}
          >
            Back to actual regimen
          </button>

          {/* Disclaimer */}
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              fontStyle: 'italic',
              color: 'var(--text-muted, #9ca3af)',
              marginTop: 12,
              lineHeight: 1.5,
            }}
          >
            Based on published pharmacological data. Not a prescription. Discuss all changes with your care team.
          </div>

          {/* Watermark when modified */}
          {isModified && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(-15deg)',
                fontSize: 36,
                fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif",
                color: 'var(--text-primary, #1a2a5e)',
                opacity: 0.08,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              EDUCATIONAL EXPLORATION
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WhatIfTiming;
