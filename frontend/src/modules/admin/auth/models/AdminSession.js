/**
 * Enterprise Data Model for Admin Session.
 * Acts as an Anti-Corruption Layer (ACL) between API and UI.
 */
export class AdminSession {
  constructor(data) {
    this.id = data.admin_id;
    this.username = data.username;
    this.name = data.name || data.username;
    this.role = data.role;
    this.lastCheckedAt = Date.now();
    
    // Enhancement 2: Auth Versioning for Future-Proofing
    // If backend logic changes (e.g. v2 permissions), frontend can detect/invalidate.
    this.authVersion = 1; 
  }

  /**
   * Factory method to safely parse API response.
   * @param {Object} apiData - Raw JSON from backend
   */
  static fromJSON(apiData) {
    if (!apiData || !apiData.admin_id) {
      return null;
    }
    return new AdminSession(apiData);
  }

  isAdmin() {
    return true; 
  }
}