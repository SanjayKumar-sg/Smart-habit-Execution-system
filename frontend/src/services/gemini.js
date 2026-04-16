const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(sysPrompt, userPrompt, history = []) {
  const messages = [{ role: 'system', content: sysPrompt }];
  history.forEach(m => messages.push({ 
    role: m.role === 'model' ? 'assistant' : (m.role || 'user'), 
    content: m.content || m.parts?.[0]?.text || '' 
  }));
  if (userPrompt) messages.push({ role: 'user', content: userPrompt });

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7 })
  });

  const data = await res.json();
  if (!res.ok || data.error) throw new Error(JSON.stringify(data.error || data));
  return data.choices[0].message.content.trim();
}

// Build a rich system context from user data
function buildContext(userData = {}) {
  const { user, medicalRecord, ageGroup, mood, language } = userData;
  const lang = language === 'ta' ? 'Tamil' : 'English';
  return `
You are a compassionate AI health & habit coach integrated into a Smart Health Tracker app.

USER PROFILE:
- Name: ${user?.first_name || 'User'} ${user?.last_name || ''}
- Age Group: ${ageGroup || 'Adult'}
- Level: ${user?.level || 1}, Points: ${user?.total_points || 0}

MEDICAL RECORD:
- Conditions: ${medicalRecord?.conditions || 'None'}
- Allergies: ${medicalRecord?.allergies || 'None'}
- Medications: ${medicalRecord?.medications || 'None'}
- Resting HR: ${medicalRecord?.resting_heart_rate || 'Unknown'} BPM
- Blood Pressure: ${medicalRecord?.blood_pressure_systolic || '?'}/${medicalRecord?.blood_pressure_diastolic || '?'} mmHg
- Blood Glucose: ${medicalRecord?.blood_glucose || 'Unknown'} mg/dL
- Fitness Level: ${medicalRecord?.fitness_level || 'beginner'}

CURRENT MOOD: ${mood || 'neutral'}
RESPOND IN: ${lang}. If Tamil is requested, respond FULLY in Tamil script.

GUIDELINES:
- Be warm, encouraging, and medically responsible
- Personalize advice based on age group (Child/Adult/Senior)  
- Never suggest activities contraindicated by the medical conditions listed
- Keep responses concise (3-5 sentences unless detailed plan needed)
`.trim();
}

// Chat with AI Coach
export async function chatWithCoach(message, userData = {}, history = []) {
  const systemContext = buildContext(userData);
  return await callGroq(systemContext, message, history);
}

export async function analyzeAndModifyExercises(medicalRecord, ageGroup, language = 'en') {
  const lang = language === 'ta' ? 'Tamil' : 'English';
  const prompt = `
You are an expert physiotherapist and fitness coach.

The Doctor has provided the following clinical notes & plan for the patient:
"""${medicalRecord?.doctor_notes || 'No specific doctor notes provided.'}"""

Patient Clinical Data:
Age Group: ${ageGroup || 'Adult'}
Conditions: ${medicalRecord?.conditions || 'None'}
Fitness Level: ${medicalRecord?.fitness_level || 'beginner'}
Resting HR: ${medicalRecord?.resting_heart_rate || '?'} BPM
Blood Pressure: ${medicalRecord?.blood_pressure_systolic || '?'}/${medicalRecord?.blood_pressure_diastolic || '?'}
Blood Glucose: ${medicalRecord?.blood_glucose || '?'}

Your goal is to parse the doctor's plan and generate a daily exercise routine.
1. Extract any specific exercises or protocols the DOCTOR explicitly prescribed.
2. Generate complementary AI SUGGESTED exercises that strictly follow the doctor's notes and clinical data. Modifying or restricting the AI plan heavily based on the doctor's plan.

Respond ENTIRELY in ${lang}.
Return a JSON object like:
{
  "summary": "Brief health assessment in ${lang}",
  "doctor_prescribed_exercises": [
    { "name": "Doctor prescribed exercise name", "duration": "X minutes", "intensity": "low/medium/high", "reason": "As prescribed by doctor", "emoji": "🩺", "isDoctor": true }
  ],
  "ai_suggested_exercises": [
    { "name": "AI Recommended exercise name", "duration": "X minutes", "intensity": "low/medium/high", "reason": "Why this AI complement is recommended", "emoji": "🤖", "isDoctor": false }
  ],
  "avoid": ["List of exercises to avoid"],
  "tips": ["2-3 health tips"]
}
Only return valid JSON. No markdown formatting.
`;
  const text = await callGroq(prompt, "Provide the JSON response.");
  try {
    // Strip possible markdown code block
    const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: text,
      exercises: [],
      avoid: [],
      tips: [],
    };
  }
}

// Modify exercises based on current mood
export async function modifyExerciseByMood(mood, currentExercises = [], ageGroup = 'Adult', language = 'en') {
  const lang = language === 'ta' ? 'Tamil' : 'English';
  const exerciseList = currentExercises.map(e => e.title || e.name).join(', ') || 'Walking, Stretching, Breathing';
  const prompt = `
You are a mood-aware fitness coach.

The user feels: "${mood}" right now.
Age Group: ${ageGroup}
Planned exercises: ${exerciseList}

Based on the mood, suggest MODIFIED exercises that are better suited.
Respond ENTIRELY in ${lang}.
Return JSON:
{
  "moodMessage": "Empathetic message about their mood in ${lang}",
  "modifiedExercises": [
    { "name": "Exercise", "duration": "X min", "emoji": "🧘", "reason": "Why good for this mood" }
  ],
  "motivationalQuote": "Inspiring quote in ${lang}"
}
Only return valid JSON. No markdown.
`;
  const text = await callGroq(prompt, "Provide the JSON response.");
  try {
    const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  } catch {
    return {
      moodMessage: text,
      modifiedExercises: [],
      motivationalQuote: '',
    };
  }
}

// Translate a text to Tamil
export async function translateToTamil(text) {
  const prompt = `Translate the following English text to Tamil script. Return only the Tamil translation, nothing else:\n\n${text}`;
  return await callGroq(prompt, "Translate this.");
}
// Generate a merged plan if a day was missed
export async function generateMergedPlan(missedExercises, currentExercises, userData = {}) {
  const lang = userData.language === 'ta' ? 'Tamil' : 'English';
  const prompt = `
You are an expert fitness coach. The user missed their exercises yesterday (Day 1) and needs to do Day 2 today.
Instead of doing both full routines, create a MERGED WORKOUT that is efficient but covers key movements from both.

MISSED EXERCISES (Day 1):
${JSON.stringify(missedExercises)}

SCHEDULED EXERCISES (Day 2):
${JSON.stringify(currentExercises)}

Patient Context:
Age Group: ${userData.ageGroup || 'Adult'}
Medical Conditions: ${userData.medicalRecord?.conditions || 'None'}

Respond ENTIRELY in ${lang}.
Return a JSON object:
{
  "notification": "Notification message about merging Day 1 and Day 2 due to incompleteness.",
  "mergedExercises": [
    { "name": "Exercise name", "duration": "X mins", "intensity": "low/medium/high", "reason": "Why merged", "emoji": "⚡" }
  ],
  "tips": ["One or two recovery tips"]
}
`;
  const system = "You are a specialized exercise adaptation AI. Return only valid JSON.";
  const res = await callGroq(system, prompt);
  try {
    return JSON.parse(res);
  } catch {
    // Fallback if AI output is not clean JSON
    const jsonMatch = res.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : res);
  }
}
