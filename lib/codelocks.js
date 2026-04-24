import { getLockConfig } from "./lock-config";

const LOCK_MODEL = "KL1060G3";

/**
 * Convert a JS Date to fixed UTC-8 (PST standard) and round down to the hour.
 * The lock clock runs on fixed UTC-8 with NO daylight saving adjustment.
 */
function toFixedPST(date) {
  // UTC-8 = subtract 8 hours from UTC
  const utcMs = date.getTime();
  const pstMs = utcMs - 8 * 60 * 60 * 1000;
  const pst = new Date(pstMs);

  const year = pst.getUTCFullYear();
  const month = String(pst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(pst.getUTCDate()).padStart(2, "0");
  const hour = String(pst.getUTCHours()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:00`;
}

/**
 * Generate a NetCode for a given locker.
 *
 * @param {string} lockerId - Customer-facing locker ID (e.g. "B07")
 * @param {Date} startTime - When the rental starts (current time)
 * @param {number} durationHours - Purchased duration (1, 3, or 5)
 * @returns {Promise<string>} The 7-digit NetCode
 */
export async function generateNetCode(lockerId, startTime, durationHours) {
  const { identifier, timecode } = getLockConfig(lockerId);

  const start = toFixedPST(startTime);

  // Duration ID = purchasedHours (adds +1hr buffer since we round start down)
  // duration=0 → 1hr, duration=1 → 2hr, duration=3 → 4hr, etc.
  const durationId = durationHours;

  const apiKey = process.env.CODELOCKS_API_KEY;
  const baseUrl = process.env.CODELOCKS_API_URL;

  if (!apiKey || !baseUrl) {
    throw new Error("Codelocks API credentials not configured");
  }

  const url = `${baseUrl}/n/3/netcode/${timecode}?identifier=${identifier}&lockmodel=${LOCK_MODEL}&start=${encodeURIComponent(start)}&duration=${durationId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Codelocks API error ${res.status}: ${body}`);
  }

  const data = await res.json();

  if (!data.ActualNetcode) {
    throw new Error("Codelocks API returned no NetCode");
  }

  return data.ActualNetcode;
}
