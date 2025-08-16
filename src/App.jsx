
import { useState, useEffect } from 'react';
import './App.css';

const EMOJIS = [
  { label: 'Happy', emoji: '😃', style: 'Pop Art', color: '#FFD93D' },
  { label: 'Calm', emoji: '😊', style: 'Watercolor', color: '#A3D8F4' },
  { label: 'Neutral', emoji: '😐', style: 'Minimalist', color: '#E0E0E0' },
  { label: 'Sad', emoji: '😔', style: 'Pastel', color: '#B5A1E5' },
  { label: 'Angry', emoji: '😠', style: 'Expressionist', color: '#FF6F61' },
  { label: 'Anxious', emoji: '😱', style: 'Surrealism', color: '#6ECEDA' },
];

const GEMINI_API_KEY = 'AIzaSyD8MPthDteAU1TejFnCNs1V7jZ6le7Dh3c';

function App() {
  const [selectedMood, setSelectedMood] = useState(EMOJIS[0]);
  const [intensity, setIntensity] = useState(5);
  const [stress, setStress] = useState(5);
  const [prompt, setPrompt] = useState('');
  const [reflection, setReflection] = useState('');
  const [artUrl, setArtUrl] = useState('');
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [loadingArt, setLoadingArt] = useState(false);
  const [error, setError] = useState('');
  const [artPromptSuggestions, setArtPromptSuggestions] = useState([]);


  // Fetch prompt from Gemini (always unique)
  const fetchPrompt = async () => {
    setLoadingPrompt(true);
    setError('');
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `I am feeling ${selectedMood.label.toLowerCase()} with intensity ${intensity}/10 and stress ${stress}/10. Suggest a unique narrative therapy writing prompt for this mood. Make it different from previous suggestions if possible.` }] }]
        })
      });
      const data = await res.json();
      setPrompt(data.candidates?.[0]?.content?.parts?.[0]?.text || 'Describe your feelings in detail.');
    } catch (e) {
      setPrompt('Describe your feelings in detail.');
      setError('Could not fetch prompt.');
    }
    setLoadingPrompt(false);
  };

  // Generate artwork from Pollinations
  const generateArt = async () => {
    setLoadingArt(true);
    setError('');
    const style = selectedMood.style;
    const desc = `${style} painting, ${selectedMood.label.toLowerCase()} mood, ${reflection ? reflection.slice(0, 100) : ''}`;
    // Pollinations API: https://pollinations.ai/prompt/{prompt}
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(desc)}`;
    setArtUrl(url);
    setLoadingArt(false);
  };

  // Suggest prompt automatically on mood/intensity/stress change
  // and clear reflection/artwork
  const handleLogEmotion = async () => {
    fetchPrompt();
    setReflection('');
    setArtUrl('');
    // Suggest 3-5 art prompt ideas based on mood
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Suggest 5 creative, short, visual art prompts for an AI art generator for a person feeling ${selectedMood.label.toLowerCase()} (intensity ${intensity}/10, stress ${stress}/10). Return only the prompts as a numbered list.` }] }]
        })
      });
      const data = await res.json();
      // Parse numbered list from Gemini response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const suggestions = text.split(/\n|\r/).map(line => line.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
      setArtPromptSuggestions(suggestions);
    } catch (e) {
      setArtPromptSuggestions([]);
    }
  };

  // Remove auto-prompt on mood/intensity/stress change for clarity

  // On reflection submit, generate art
  const handleGenerateArt = (e) => {
    e.preventDefault();
    generateArt();
  };


  // Animate the whole page background when mood changes (panels stay glassmorphic)
  useEffect(() => {
    document.body.style.transition = 'background 1s cubic-bezier(0.4,0,0.2,1)';
    document.body.style.background = `linear-gradient(270deg, ${selectedMood.color}, #f7d1e0, #c3eaff, ${selectedMood.color})`;
    document.body.style.backgroundSize = '600% 600%';
    document.body.style.animation = 'ac-bg-animate 12s ease-in-out infinite';
  }, [selectedMood]);

  return (
    <div className="ac-root">
      {/* Left: Emotion Logging */}
      <section className="ac-panel ac-left">
        <div className="ac-chatbot-avatar" title="Affective Canvas Guide">
          <span role="img" aria-label="Chatbot">🧑‍🎨</span>
        </div>
        <h2>How are you feeling today?</h2>
        <div className="ac-emoji-row">
          {EMOJIS.map((mood) => (
            <button
              key={mood.label}
              className={`ac-emoji-btn${selectedMood.label === mood.label ? ' selected' : ''}`}
              style={{ background: selectedMood.label === mood.label ? mood.color : 'transparent' }}
              onClick={() => setSelectedMood(mood)}
            >
              <span role="img" aria-label={mood.label}>{mood.emoji}</span>
            </button>
          ))}
        </div>
        <div className="ac-slider-group">
          <label>Emotion Intensity
            <input type="range" min="1" max="10" value={intensity} onChange={e => setIntensity(Number(e.target.value))} />
            <span className="ac-slider-value">{intensity}/10</span>
          </label>
          <label>Stress Level
            <input type="range" min="1" max="10" value={stress} onChange={e => setStress(Number(e.target.value))} />
            <span className="ac-slider-value">{stress}/10</span>
          </label>
        </div>
  <button className="ac-log-btn" onClick={fetchPrompt}>Get a Writing Prompt</button>
      </section>

      {/* Center: Writing Prompt & Editor */}
  <section className="ac-panel ac-center">
        <div className="ac-prompt-header">
          <span className="ac-icon">💡</span>
          <h2>Your Narrative Therapy Prompt</h2>
        </div>
        <div className="ac-prompt-box">
          {loadingPrompt ? <span>Loading prompt...</span> : prompt}
        </div>
        <form className="ac-reflection-form" onSubmit={handleGenerateArt}>
          <textarea
            className="ac-reflection-textarea"
            placeholder="Write your thoughts here..."
            value={reflection}
            onChange={e => setReflection(e.target.value)}
            rows={7}
            required
          />
          <button className="ac-generate-btn" type="submit" disabled={!reflection}>Generate Artwork</button>
        </form>
        {artPromptSuggestions.length > 0 && (
          <div className="ac-art-suggestions">
            <div style={{marginBottom:'0.5rem', color:'#7a5c3e', fontWeight:'bold'}}>Art Prompt Ideas:</div>
            <ul style={{listStyle:'disc', paddingLeft:'1.5rem'}}>
              {artPromptSuggestions.map((s, i) => (
                <li key={i} style={{marginBottom:'0.3rem', cursor:'pointer', color:'#6ECEDA'}}
                  onClick={() => setReflection(s)}
                  title="Click to use this as your reflection"
                >{s}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="ac-chatbot-help">
          <span className="ac-chatbot-avatar-mini" role="img" aria-label="Chatbot">🧑‍🎨</span>
          <span>Need help? I’m here!</span>
        </div>
        {error && <div className="ac-error">{error}</div>}
      </section>

      {/* Right: Artwork Display */}
  <section className="ac-panel ac-right">
        <div className="ac-art-header">
          <span className="ac-icon">🎨</span>
          <h2>Your Therapeutic Artwork</h2>
        </div>
        <div className="ac-art-frame">
          {loadingArt && <span>Generating artwork...</span>}
          {artUrl ? (
            <>
              <img src={artUrl} alt="AI Artwork" className="ac-art-img" />
              <span className="ac-style-tag">{selectedMood.style}</span>
              <div className="ac-art-actions">
                <button
                  type="button"
                  title="Download"
                  onClick={async () => {
                    if (!artUrl) return;
                    const response = await fetch(artUrl);
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `affective-canvas-art.png`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                  }}
                  style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.3rem',marginRight:'0.7rem'}}
                >
                  <span role="img" aria-label="Download">⬇️</span>
                </button>
                <a href={artUrl} target="_blank" rel="noopener noreferrer" title="Open in new tab" style={{fontSize:'1.3rem'}}><span role="img" aria-label="Share">🔗</span></a>
              </div>
            </>
          ) : (
            <span style={{color:'#aaa'}}>Your artwork will appear here after you write and generate it.</span>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
