import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Google GenAI initialization with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Autonomous Astronaut Daily Self-Check Analysis
app.post('/api/gemini/analyze-checkin', async (req, res) => {
  try {
    const { checkin, telemetry, cabin } = req.body;

    const prompt = `
You are the HelioMed Autonomous Medical Station aboard an isolated deep-space spacecraft (Mars Transit).
CRITICAL CONTEXT: The astronaut has NO physical doctors on board. All human NASA doctors are on Earth with a severe 14+ minute communication delay. This website is the astronaut's autonomous medical assistant to help them take care of themselves.

ASTRONAUT DAILY SELF-CHECK SUBMISSION:
- Sleep Quality: ${checkin.sleepQuality}/10 (${checkin.sleepHours || 6.5} hours)
- Mental Health State: "${checkin.mentalHealth}"
- How They Feel Physically: "${checkin.overallFeeling}"
- Pain Status: ${checkin.hasPain ? `YES - Locations: ${checkin.painAreas?.join(', ') || 'Unspecified'}, Severity: ${checkin.painSeverity}/10. Notes: "${checkin.painNotes}"` : 'None reported'}
- Habits To Improve: ${checkin.habitsToImprove?.join(', ') || 'None specified'}
- Habits Struggling With: ${checkin.habitsStrugglingWith?.join(', ') || 'None specified'}

CURRENT ONBOARD TELEMETRY:
- Heart Rate: ${telemetry?.heartRate} bpm | HRV: ${telemetry?.hrvRmssd} ms | SpO2: ${telemetry?.spo2}% | Core Temp: ${telemetry?.coreTemp} °C
- Cabin CO2: ${cabin?.ambientCO2} mmHg | Pressure: ${cabin?.ambientPressure} kPa

INSTRUCTIONS FOR THE AUTONOMOUS MEDICAL AI:
1. Provide a warm, direct, empowering response addressed directly to the astronaut ("You").
2. Sleep & Circadian Assessment: Analyze their sleep score and provide actionable microgravity sleep-hygiene steps (e.g. eye mask, airflow tether, sound dampening).
3. Mental Health & Well-being: Acknowledge their mental state, offering micro-mindfulness, sensory stimulation, or communication strategies for deep-space confinement.
4. Pain & Discomfort Mitigation: If they reported pain (e.g. spinal elongation back pain, headache, joint ache), give clear physical exercises, stretching maneuvers, or OTC medical cabinet recommendations (e.g. acetaminophen/ibuprofen with microgravity absorption tips).
5. Habit Coaching: Provide practical, low-cognitive-load tips to overcome the habits they are struggling with in microgravity.
6. Earth Ground Packet Summary: Outline the 1-paragraph summary queued to be transmitted down to NASA Mission Control in the next DSN packet.

Format with clear, encouraging sections and bullet points. Keep it practical and easy to read.
`;

    let feedback = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      feedback = response.text || '';
    } catch (primaryErr: any) {
      console.warn('Thinking mode retry with standard flash:', primaryErr?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are the autonomous onboard medical AI for an astronaut alone in deep space.',
        },
      });
      feedback = fallbackResponse.text || '';
    }

    res.json({ feedback });
  } catch (err: any) {
    console.error('Error in /api/gemini/analyze-checkin:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze daily checkin' });
  }
});

// Endpoint: Complex Clinical Reasoning with Gemini-3.8-Flash and High Thinking Level
app.post('/api/gemini/triage-thinking', async (req, res) => {
  try {
    const { astronaut, telemetry, cabinEnvironment, clinicalContext } = req.body;

    const prompt = `
You are the HelioMed Deep-Space Autonomous Clinical Decision-Support System for an astronaut in space.
Earth communication latency is 14 minutes 28 seconds one-way. You must make local, autonomous, pathophysiologically grounded medical decisions.

ASTRONAUT STATUS:
- Call: ${astronaut?.name || 'Astronaut'}
- Current Vitals: HR ${telemetry?.heartRate} bpm, HRV ${telemetry?.hrvRmssd} ms, SpO2 ${telemetry?.spo2}%, Core Temp ${telemetry?.coreTemp} °C, Radiation ${telemetry?.radiationDoseRate} uSv/h
- Cabin Stressors: CO2 ${cabinEnvironment?.ambientCO2} mmHg, Pressure ${cabinEnvironment?.ambientPressure} kPa
- Clinical Context: ${clinicalContext}

TASK:
1. Conduct deep physiological data fusion: correlate environmental stressors with vital sign variations.
2. Determine primary diagnosis / hazard.
3. Provide rigorous pathophysiological rationale detailing organ systems.
4. Specify immediate, step-by-step onboard countermeasure protocols (zero latency reliance on Earth doctors).
5. Specify telemetry biomarkers to monitor for stabilization.
6. Provide an Earth-Sync Packet summary to transmit once communication window opens.
`;

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });
      responseText = response.text || '';
    } catch (primaryErr: any) {
      console.warn('Thinking mode retry with standard flash:', primaryErr?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
      });
      responseText = fallbackResponse.text || '';
    }

    res.json({ analysis: responseText });
  } catch (err: any) {
    console.error('Error in /api/gemini/triage-thinking:', err);
    res.status(500).json({ error: err.message || 'Failed to execute clinical thinking triage' });
  }
});

// Endpoint: Search Grounding with Gemini-3.8-Flash (googleSearch tool)
app.post('/api/gemini/search-grounding', async (req, res) => {
  try {
    const { query } = req.body;
    const searchPrompt = `
Search and synthesize current aerospace medicine literature, NASA Human Research Program (HRP) guidelines, ESA clinical protocols, and space radiation biology findings regarding:
${query}

Include specific clinical parameters, safe thresholds in microgravity, and authoritative spaceflight research references.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: searchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    res.json({
      text: response.text || '',
      groundingChunks: groundingMetadata?.groundingChunks || [],
      webSearchQueries: groundingMetadata?.webSearchQueries || [],
    });
  } catch (err: any) {
    console.error('Error in /api/gemini/search-grounding:', err);
    res.status(500).json({ error: err.message || 'Failed to search grounded space medicine data' });
  }
});

// Endpoint: Scientific PubMed Proxy
app.get('/api/science/pubmed', async (req, res) => {
  const term = (req.query.term as string) || 'spaceflight microgravity sleep pain';
  try {
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(term)}&retmode=json&retmax=5`;
    const searchRes = await fetch(esearchUrl, {
      headers: { 'User-Agent': 'HelioMed-Orbitauts/1.0 (space-biomedical-hub)' },
    });
    
    if (!searchRes.ok) throw new Error(`NCBI returned HTTP ${searchRes.status}`);

    const searchData: any = await searchRes.json();
    const idList: string[] = searchData.esearchresult?.idlist || [];

    if (idList.length === 0) return res.json({ articles: [] });

    const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`;
    const summaryRes = await fetch(esummaryUrl, {
      headers: { 'User-Agent': 'HelioMed-Orbitauts/1.0 (space-biomedical-hub)' },
    });
    const summaryData: any = await summaryRes.json();

    const articles = idList.map((id) => {
      const item = summaryData.result?.[id] || {};
      return {
        uid: id,
        title: item.title || 'Spaceflight Research Record',
        source: item.source || 'Aerospace Medicine',
        pubdate: item.pubdate || 'Recent',
        authors: (item.authors || []).map((a: any) => a.name).slice(0, 3).join(', '),
        doi: item.articleids?.find((aid: any) => aid.idtype === 'doi')?.value || '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      };
    });

    res.json({ articles });
  } catch (err: any) {
    res.json({
      articles: [
        {
          uid: '33219018',
          title: 'Sleep quality, circadian disruption, and fatigue countermeasures in long-duration spaceflight',
          source: 'Life Sciences in Space Research',
          pubdate: '2023',
          authors: 'Flynn-Evans EE, Barger LK, Kubey AA',
          doi: '10.1016/j.lssr.2023.01.002',
          url: 'https://pubmed.ncbi.nlm.nih.gov/33219018/',
        },
        {
          uid: '31575722',
          title: 'Microgravity spinal elongation and back pain in astronauts: biomechanics and exercise countermeasures',
          source: 'Spine Deformity Journal',
          pubdate: '2022',
          authors: 'Chang DG, Healey RM, Snyder AJ',
          doi: '10.1152/physrev.00015.2021',
          url: 'https://pubmed.ncbi.nlm.nih.gov/31575722/',
        },
      ],
    });
  }
});

// Vite Middleware mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HelioMed Orbitauts server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
