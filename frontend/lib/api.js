/**
 * api.js
 * ------
 * Centralised API utility for communicating with the SurakshaAI backend.
 * All functions return parsed JSON.  Errors are thrown with descriptive
 * messages so the calling component can display them.
 */

const BASE_URL = "http://34.131.123.111";

/**
 * Generic fetch wrapper with error handling.
 *
 * @param {string} path      – API path (e.g. "/analyze")
 * @param {object} options   – fetch options
 * @returns {Promise<object>} parsed JSON body
 */
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      const detail = errorBody?.detail || res.statusText || "Request failed";
      throw new Error(`API error ${res.status}: ${detail}`);
    }

    return await res.json();
  } catch (err) {
    // Network errors (backend down, CORS, etc.)
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(
        "Cannot reach the backend. Make sure the server is running on http://localhost:8000"
      );
    }
    throw err;
  }
}

/**
 * POST /analyze – analyse a single message.
 *
 * @param {string}  message    – the suspicious text
 * @param {string}  profile    – "student" | "elderly" | "business_owner" | "general"
 * @param {boolean} ai_enabled – whether to use AI analysis
 * @returns {Promise<object>}  full analysis result
 */
export async function analyzeMessage(message, profile = "general", ai_enabled = true) {
  const json = await request("/analyze", {
    method: "POST",
    body: JSON.stringify({ message, profile, ai_enabled }),
  });
  return json;
}

/**
 * POST /analyze-batch – analyse newline-separated messages.
 *
 * @param {string}  messages   – newline-separated texts
 * @param {string}  profile
 * @param {boolean} ai_enabled
 * @returns {Promise<object>}
 */
export async function analyzeBatch(messages, profile = "general", ai_enabled = true) {
  const json = await request("/analyze-batch", {
    method: "POST",
    body: JSON.stringify({ messages, profile, ai_enabled }),
  });
  return json;
}

/**
 * GET /trends – retrieve aggregate analytics.
 *
 * @returns {Promise<object>}
 */
export async function getTrends() {
  return request("/trends");
}

/**
 * GET /history – retrieve past analysis results.
 *
 * @param {number} limit
 * @returns {Promise<object>}
 */
export async function getHistory(limit = 100) {
  return request(`/history?limit=${limit}`);
}

/**
 * GET /report/{id} – download PDF report.
 * Returns a Blob so the caller can trigger a browser download.
 *
 * @param {number} analysisId
 * @returns {Promise<Blob>}
 */
export async function downloadReport(analysisId) {
  const url = `${BASE_URL}/report/${analysisId}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Failed to download report: ${res.statusText}`);
  }

  return await res.blob();
}