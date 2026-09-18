import { 
  Task, 
  Employee, 
  AllocationScore, 
  CandidateAlternative 
} from '../data/types';

export interface ExplanationResponse {
  summary: string;
  keyDrivers: string[];
  riskAnalysis: string;
  tradeoffs: string[];
  confidenceScore: number;
  isLiveGemini?: boolean;
  modelUsed?: string;
}

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";

export class AIExplainerService {
  /**
   * Calls real Gemini API using the provided key for live deep workforce analysis
   */
  static async generateAllocationExplanation(
    task: Task,
    selectedEmployee: Employee,
    score: AllocationScore,
    alternatives: CandidateAlternative[],
    beforeRisk: number,
    afterRisk: number
  ): Promise<ExplanationResponse> {
    const breakdown = score.breakdown;
    const topAlternative = alternatives[0];
    const riskDelta = beforeRisk - afterRisk;

    // Default analytical template fallback
    const fallbackResponse: ExplanationResponse = {
      summary: `${selectedEmployee.name} (${selectedEmployee.id}) was matched as the optimal engineer for ${task.code} (${task.name}) with an algorithmic score of ${score.total_score}/100, providing critical path stabilization.`,
      keyDrivers: [
        `High verified technical skill overlap (${breakdown.skill}% match) with zero retraining lag.`,
        `Favorable completion rate providing positive safety buffer (+${breakdown.sla} pts) before the SLA target.`,
        `Maintains engineer workload within the enterprise optimal zone (${selectedEmployee.utilization_pct}% current utilization).`,
        `High historical quality rating (${selectedEmployee.performance.quality}%) and on-time compliance (${selectedEmployee.performance.on_time}%).`
      ],
      riskAnalysis: `Reassignment mitigates SLA breach risk by ${riskDelta} points (reducing projected probability from ${beforeRisk}% down to ${afterRisk}%).`,
      tradeoffs: topAlternative ? [
        `Alternative candidate ${topAlternative.employee_name} (${topAlternative.employee_id}) was evaluated (score: ${topAlternative.score}) but ranked lower: ${topAlternative.reason}.`
      ] : [],
      confidenceScore: score.total_score,
      isLiveGemini: false,
      modelUsed: 'Deterministic Engine v2.4'
    };

    // Call real Google Gemini API
    try {
      const prompt = `You are the AI Analysis Engine inside NEXUS WORKFORCE OS, an enterprise SLA and workforce operating system.
Analyze this real-time allocation decision based on computed metrics:

TASK:
- Code: ${task.code}
- Name: ${task.name}
- Priority: ${task.priority}
- Remaining Effort: ${task.remaining_effort_min} minutes
- SLA Deadline: ${task.sla_deadline}

PROPOSED ASSIGNEE:
- Name: ${selectedEmployee.name} (ID: ${selectedEmployee.id})
- Title: ${selectedEmployee.title}
- Location: ${selectedEmployee.location} (${selectedEmployee.region})
- Current Utilization: ${selectedEmployee.utilization_pct}%
- Historical Quality: ${selectedEmployee.performance.quality}%
- Historical On-time: ${selectedEmployee.performance.on_time}%

7-FACTOR ALGORITHMIC SCORES (0-100):
- Skill Compatibility: ${breakdown.skill}
- SLA Protection: ${breakdown.sla}
- Schedule Availability: ${breakdown.availability}
- Workload Balance: ${breakdown.workload}
- Historical Performance: ${breakdown.performance}
- Location/Timezone: ${breakdown.location}
- Business Impact: ${breakdown.business_impact}
- TOTAL COMPOSITE SCORE: ${score.total_score}/100

IMPACT METRICS:
- Prior SLA Breach Risk: ${beforeRisk}%
- Projected SLA Breach Risk After Reassignment: ${afterRisk}%
- Risk Reduction Delta: -${riskDelta}%
- Top Alternative Candidate: ${topAlternative ? `${topAlternative.employee_name} (${topAlternative.employee_id}) with score ${topAlternative.score}: ${topAlternative.reason}` : 'None'}

Please return a JSON object with:
{
  "summary": "1-2 sentence executive explanation of why this resource is optimal",
  "keyDrivers": ["bullet 1", "bullet 2", "bullet 3", "bullet 4"],
  "riskAnalysis": "Detailed paragraph on SLA risk mitigation and buffer preservation",
  "tradeoffs": ["Explanation of why alternatives scored lower and potential workload tradeoffs"]
}
Only output valid JSON. No markdown ticks, no commentary.`;

      // Try gemini-2.5-flash, fallback to gemini-1.5-flash
      const models = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': GEMINI_API_KEY
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: prompt }]
                }
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000,
                responseMimeType: 'application/json'
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              return {
                summary: parsed.summary || fallbackResponse.summary,
                keyDrivers: parsed.keyDrivers || fallbackResponse.keyDrivers,
                riskAnalysis: parsed.riskAnalysis || fallbackResponse.riskAnalysis,
                tradeoffs: parsed.tradeoffs || fallbackResponse.tradeoffs,
                confidenceScore: score.total_score,
                isLiveGemini: true,
                modelUsed: `Gemini (${model}) Live Analysis`
              };
            }
          }
        } catch (innerErr) {
          console.warn(`Gemini call to ${model} failed, trying next...`, innerErr);
        }
      }
    } catch (e) {
      console.warn('Gemini API request failed, using deterministic engine fallback:', e);
    }

    return fallbackResponse;
  }
}
