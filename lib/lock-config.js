/**
 * Lock configuration — maps customer-facing locker IDs to Codelocks API parameters.
 *
 * To add a new lock:
 * 1. Register it in the Codelocks Connect Portal
 * 2. Add an entry here with its identifier and timecode from the portal
 *
 * identifier: 6-digit lock identifier from Codelocks portal
 * timecode: initialization timestamp without separators (YYYYMMDDHHmm)
 * locationId: which physical site this locker belongs to
 */
export const LOCK_CONFIG = {
  // Pilot lock — pickleball centre
  "A1": {
    identifier: "101353",
    timecode: "202605171626",
    locationId: "pickleball-centre",
  },
};

export function getLockConfig(lockerId) {
  const config = LOCK_CONFIG[lockerId];
  if (!config) {
    throw new Error(`Unknown locker ID: ${lockerId}`);
  }
  return config;
}
