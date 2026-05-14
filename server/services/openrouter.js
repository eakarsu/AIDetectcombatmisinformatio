const fetch = require('node-fetch');
const { parseAIJson } = require('./parseAIJson');
require('dotenv').config({ path: '../../.env' });

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(messages, options = {}) {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'FactCheck AI',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages,
      temperature: options.temperature || 0.3,
      max_tokens: options.max_tokens || 1024,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function analyzeClaim(claimText) {
  const messages = [
    {
      role: 'system',
      content: `You are an expert fact-checker AI assistant. Analyze the given claim and provide a structured assessment. Respond in JSON format with these fields:
      - verdict: one of "Very Likely True", "Likely True", "Uncertain", "Likely False", "Very Likely False", "Extremely Dangerous and False"
      - confidence: a number between 0 and 1
      - reasoning: detailed explanation of your analysis
      - key_indicators: array of key factors that informed your assessment
      - risk_level: one of "low", "medium", "high", "critical"
      - recommended_action: suggested next steps for fact-checkers
      - category: the category this claim falls into
      - manipulation_techniques: array of any manipulation techniques detected (e.g., "emotional_language", "false_authority", "cherry_picking")`
    },
    {
      role: 'user',
      content: `Analyze this claim for factual accuracy: "${claimText}"`
    }
  ];
  const result = await callOpenRouter(messages);
  return parseAIJson(result);
}

async function analyzeSourceCredibility(sourceName, sourceUrl, description) {
  const messages = [
    {
      role: 'system',
      content: `You are an expert media analyst. Evaluate the credibility of the given source. Respond in JSON format with:
      - credibility_score: number from 0 to 10
      - factors: object with evaluation factors
      - assessment: detailed credibility assessment text
      - recommendation: how fact-checkers should treat this source
      - bias_indicators: array of detected biases
      - reliability_history: brief assessment of source track record`
    },
    {
      role: 'user',
      content: `Evaluate the credibility of this source:\nName: ${sourceName}\nURL: ${sourceUrl || 'N/A'}\nDescription: ${description || 'N/A'}`
    }
  ];
  const result = await callOpenRouter(messages);
  return parseAIJson(result);
}

async function analyzeSentiment(text) {
  const messages = [
    {
      role: 'system',
      content: `You are a sentiment and emotional analysis expert. Analyze the given text for sentiment, emotions, and manipulation indicators. Respond in JSON format with:
      - sentiment: one of "Strongly Positive", "Positive", "Neutral", "Negative", "Strongly Negative"
      - score: number from -1 to 1
      - emotions: object with emotion scores (fear, anger, joy, sadness, distrust, surprise, disgust, contempt) from 0 to 1
      - manipulation_indicators: object with boolean values for techniques like emotional_language, fear_mongering, authority_distrust, false_statistics, scapegoating, urgency_pressure, bandwagon_effect
      - viral_potential: one of "Very Low", "Low", "Medium", "High", "Very High"
      - target_audience: who this message is designed to influence
      - emotional_triggers: array of identified emotional triggers in the text`
    },
    {
      role: 'user',
      content: `Analyze the sentiment and manipulation techniques in this text: "${text}"`
    }
  ];
  const result = await callOpenRouter(messages);
  return parseAIJson(result);
}

async function generateFactCheckSummary(claim, evidence) {
  const messages = [
    {
      role: 'system',
      content: `You are a professional fact-check report writer. Generate a clear, concise fact-check summary for the public. Respond in JSON format with:
      - headline: attention-grabbing but accurate headline
      - summary: 2-3 sentence summary for general audience
      - detailed_analysis: thorough analysis paragraph
      - verdict_explanation: why this verdict was reached
      - what_to_know: array of key facts the public should know
      - share_message: brief message optimized for social media sharing`
    },
    {
      role: 'user',
      content: `Write a fact-check summary for:\nClaim: ${claim}\nEvidence: ${evidence}`
    }
  ];
  const result = await callOpenRouter(messages);
  return parseAIJson(result);
}

async function detectMisinformationPatterns(text) {
  const messages = [
    {
      role: 'system',
      content: `You are a misinformation pattern detection expert. Analyze the given text for common misinformation patterns and techniques. Respond in JSON format with:
      - patterns_detected: array of objects with {pattern_name, description, confidence, severity}
      - overall_risk: one of "low", "medium", "high", "critical"
      - narrative_type: the type of narrative being used
      - likely_origin: assessment of where this type of misinformation typically originates
      - counter_narrative: suggested factual counter-narrative
      - similar_debunked_claims: array of similar claims that have been debunked
      - recommended_response: how to respond to this misinformation`
    },
    {
      role: 'user',
      content: `Detect misinformation patterns in this text: "${text}"`
    }
  ];
  const result = await callOpenRouter(messages);
  return parseAIJson(result);
}

module.exports = {
  callOpenRouter,
  analyzeClaim,
  analyzeSourceCredibility,
  analyzeSentiment,
  generateFactCheckSummary,
  detectMisinformationPatterns,
};
