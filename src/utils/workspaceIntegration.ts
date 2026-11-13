/**
 * Google Workspace & Flight Surgeon Integration
 * Integrates Google Forms, Google Drive files, and clinical flight memos.
 */

import { getCachedAccessToken, ensureAccessToken } from '../firebase';

export interface GoogleFormDefinition {
  formId: string;
  responderUri: string;
  title: string;
  description: string;
}

export interface GoogleFormResponseItem {
  responseId: string;
  createTime: string;
  answers: Record<string, any>;
}

// Create an Astronaut Health & Symptom Survey in Google Forms
export async function createAstronautCheckinForm(
  title: string,
  astronautName: string
): Promise<GoogleFormDefinition> {
  const token = await ensureAccessToken();

  const formPayload = {
    info: {
      title: `${title} - Vitaluats Medical Log`,
      documentTitle: `${astronautName} Spaceflight Symptom Survey`,
    },
  };

  const response = await fetch('https://forms.googleapis.com/v1/forms', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Forms API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Populate questions via batchUpdate
  const updatePayload = {
    requests: [
      {
        createItem: {
          item: {
            title: 'Current Microgravity Symptoms',
            description: 'Select any symptoms experienced during this flight watch',
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: 'CHECKBOX',
                  options: [
                    { value: 'Hypercapnic headache / frontal pressure' },
                    { value: 'Visual blurriness / blind spots (SANS)' },
                    { value: 'Orthostatic dizziness on standing/floating' },
                    { value: 'Nausea or motion sickness (SMS)' },
                    { value: 'Muscle fatigue / spinal elongation pain' },
                    { value: 'None - Nominal' },
                  ],
                },
              },
            },
          },
          location: { index: 0 },
        },
      },
      {
        createItem: {
          item: {
            title: 'Subjective Fatigue Score (1-10)',
            questionItem: {
              question: {
                required: true,
                scaleQuestion: {
                  low: 1,
                  high: 10,
                  lowLabel: 'Well Rested',
                  highLabel: 'Severe Exhaustion',
                },
              },
            },
          },
          location: { index: 1 },
        },
      },
    ],
  };

  await fetch(`https://forms.googleapis.com/v1/forms/${data.formId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updatePayload),
  });

  return {
    formId: data.formId,
    responderUri: data.responderUri || `https://docs.google.com/forms/d/${data.formId}/viewform`,
    title: data.info?.title || title,
    description: 'Onboard astronaut physiological check-in',
  };
}

// Fetch Google Form Responses
export async function fetchFormResponses(formId: string): Promise<GoogleFormResponseItem[]> {
  const token = getCachedAccessToken();
  if (!token) return [];

  const safeFormId = encodeURIComponent(formId.trim());
  const response = await fetch(`https://forms.googleapis.com/v1/forms/${safeFormId}/responses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.warn(`Could not fetch form responses for ${formId}: HTTP ${response.status}`);
    return [];
  }

  const data = await response.json();
  return (data.responses || []).map((r: any) => ({
    responseId: r.responseId,
    createTime: r.createTime,
    answers: r.answers || {},
  }));
}
