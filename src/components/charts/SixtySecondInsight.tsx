import React from 'react';

interface SixtySecondInsightProps {
  view: 'clinical' | 'kids' | 'mountains';
  content: {
    basalCoverage: string;
    dangerText?: string;
    bolusStacking: string;
    keyObservation: string;
    disclaimer: string;
    peakPressure?: string;
    stackingRisk?: string;
    basalContribution?: string;
    lastBolusClear?: string;
    overnightNote?: string;
  };
  pressureClass: 'light' | 'moderate' | 'strong' | 'overlap';
}

const borderColors: Record<SixtySecondInsightProps['pressureClass'], string> = {
  light: '#4CAF50',
  moderate: '#FFC107',
  strong: '#FF9800',
  overlap: '#F44336',
};

const SixtySecondInsight: React.FC<SixtySecondInsightProps> = ({ view, content, pressureClass }) => {
  const isKids = view === 'kids' || view === 'mountains';
  const isMountains = view === 'mountains';

  const labels = isMountains
    ? { basal: 'THE ROLLING HILLS', danger: 'STORMY SKY!', bolus: 'THE TALL PEAKS', observation: 'WHAT THE MOUNTAINS MEAN' }
    : isKids
    ? { basal: 'THE BIG WAVE', danger: 'WATCH HERE!', bolus: 'MEAL MOUNTAINS', observation: 'WHAT MIRA NOTICED' }
    : { basal: 'BASAL COVERAGE', danger: 'DANGER WINDOWS', bolus: 'BOLUS STACKING', observation: 'KEY OBSERVATION' };

  const bodyFontSize = isKids ? '14px' : '13px';

  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#fff',
    marginBottom: '4px',
  };

  const bodyStyle: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: bodyFontSize,
    lineHeight: 1.7,
    color: '#C8D6E5',
    margin: 0,
  };

  return (
    <>
      <style>{`
        [data-theme="dark"] .sixty-sec-insight {
          background: #0D1B3E !important;
        }
      `}</style>
      <div
        className="sixty-sec-insight"
        style={{
          background: '#1a2a5e',
          color: '#fff',
          borderLeft: `4px solid ${borderColors[pressureClass]}`,
          borderRadius: '16px',
          padding: '24px',
          fontFamily: "'DM Sans', sans-serif",
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          {isKids ? (
            <>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#2AB5C1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#fff',
                  marginRight: '8px',
                  flexShrink: 0,
                }}
              >
                M
              </div>
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontWeight: 600,
                  fontSize: '14px',
                  color: '#2AB5C1',
                }}
              >
                {isMountains ? '⛰️ What the mountains mean' : '🦉 Mira says...'}
              </span>
            </>
          ) : (
            <span
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                fontSize: '14px',
                color: '#2AB5C1',
              }}
            >
              ⏱ 60-SECOND INSIGHT
            </span>
          )}

          {/* Kids avatar top-right */}
          {isKids && (
            <div
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#1a2a5e',
                border: '1px solid #2AB5C1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '12px',
                color: '#2AB5C1',
              }}
            >
              M
            </div>
          )}
        </div>

        {/* Basal Coverage */}
        <div style={{ marginBottom: '14px' }}>
          <div style={labelStyle}>{labels.basal}</div>
          <p style={bodyStyle}>{content.basalCoverage}</p>
        </div>

        {/* Danger Windows */}
        <div
          style={{
            marginBottom: '14px',
            ...(content.dangerText
              ? {
                  borderLeft: '4px solid #F44336',
                  background: 'rgba(244,67,54,0.08)',
                  padding: '10px 12px',
                  borderRadius: '4px',
                }
              : {}),
          }}
        >
          <div style={{ ...labelStyle, color: content.dangerText ? '#F44336' : '#fff' }}>
            {labels.danger}
          </div>
          {content.dangerText ? (
            <p style={bodyStyle}>{content.dangerText}</p>
          ) : (
            <p style={{ ...bodyStyle, color: '#4CAF50' }}>
              {isMountains
                ? 'Clear skies! The mountains are calm and well-spaced — no storms today.'
                : 'No danger windows detected. Steady basal coverage with well-separated bolus peaks.'}
            </p>
          )}
        </div>

        {/* Bolus Stacking */}
        <div style={{ marginBottom: '14px' }}>
          <div style={labelStyle}>{labels.bolus}</div>
          <p style={bodyStyle}>{content.bolusStacking}</p>
        </div>

        {/* Key Observation */}
        <div style={{ marginBottom: '14px' }}>
          <div style={labelStyle}>{labels.observation}</div>
          <p style={bodyStyle}>{content.keyObservation}</p>
        </div>

        {/* Pressure Map Details (clinical only) */}
        {!isKids && (content.peakPressure || content.stackingRisk || content.basalContribution || content.lastBolusClear || content.overnightNote) && (
          <div style={{ marginBottom: '14px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
            <div style={labelStyle}>PRESSURE MAP DETAIL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {content.peakPressure && <p style={bodyStyle}>{content.peakPressure}</p>}
              {content.stackingRisk && <p style={bodyStyle}>{content.stackingRisk}</p>}
              {content.basalContribution && <p style={bodyStyle}>{content.basalContribution}</p>}
              {content.lastBolusClear && <p style={bodyStyle}>{content.lastBolusClear}</p>}
              {content.overnightNote && (
                <p style={{ ...bodyStyle, color: '#FFC107' }}>{content.overnightNote}</p>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: '10px',
            fontStyle: 'italic',
            color: '#5A7491',
            margin: 0,
          }}
        >
          {content.disclaimer}
        </p>
      </div>
    </>
  );
};

export default SixtySecondInsight;
