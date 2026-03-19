/**
 * ═════════════════════════════════════════════════════════════════════════════
 * TBC CARE - FRONTEND APP CLIENT (tbc_care.js)
 * ═════════════════════════════════════════════════════════════════════════════
 * Drop this into your website. It acts as the bridge between your custom HTML
 * interface and the Google Apps Script backend database.
 */

class TBCCareApp {
  /**
   * Initialize the CRM App
   * @param {Object} config - Configuration object
   * @param {string} config.endpoint - Your published Google Web App URL
   * @param {string} config.token - The active user's session token
   * @param {string} config.email - The active user's email address
   */
  constructor(config = {}) {
    if (!config.endpoint) {
      throw new Error("[TBC Care] Missing endpoint URL in configuration.");
    }
    this.endpoint = config.endpoint;
    this.token = config.token || '';
    this.email = config.email || '';
    
    // Internal state cache (optional, useful for UI performance)
    this.state = {
      members: [],
      prayerRequests: [],
      todos: [],
      contacts: []
    };

    // ── 1. MEMBERSHIP DIRECTORY ─────────────────────────────────────────────
    this.members = {
      /** Fetch all active members */
      list: async (includeArchived = false) => {
        const res = await this._sendRequest('members.list', { includeArchived });
        this.state.members = res.rows; // Cache locally
        return res.rows;
      },

      /** Search for a specific member by query */
      search: async (query) => {
        const res = await this._sendRequest('members.search', { q: query });
        return res.rows;
      },

      /** Create a new member profile */
      create: async (memberData) => {
        return await this._sendRequest('members.create', memberData);
      },

      /** Update an existing member profile */
      update: async (rowIndex, updateData) => {
        updateData.rowIndex = rowIndex;
        return await this._sendRequest('members.update', updateData);
      }
    };

    // ── 2. PASTORAL CARE & CONTACTS ─────────────────────────────────────────
    this.contacts = {
      /** Get contact history for a specific member */
      list: async (memberId) => {
        const res = await this._sendRequest('contacts.list', { memberId });
        this.state.contacts = res.rows;
        return res.rows;
      },

      /** Log a new touchpoint (call, visit, etc.) */
      create: async (memberId, type, direction, details, followUp = false) => {
        return await this._sendRequest('contacts.create', {
          memberId: memberId,
          contactType: type,
          direction: direction,
          details: details,
          followUpNeeded: followUp
        });
      }
    };

    // ── 3. PRAYER REQUESTS ──────────────────────────────────────────────────
    this.prayer = {
      /** Fetch recent prayer requests */
      list: async (memberId = '', includeArchived = false) => {
        const res = await this._sendRequest('prayer.list', { memberId, includeArchived });
        this.state.prayerRequests = res.rows;
        return res.rows;
      },

      /** Submit a new prayer request */
      create: async (prayerText, name = '', category = 'Other', isConfidential = false) => {
        return await this._sendRequest('prayer.create', {
          prayerText: prayerText,
          submitterName: name,
          category: category,
          isConfidential: isConfidential
        });
      },

      /** Change status of a prayer request (e.g., to "Answered") */
      updateStatus: async (rowIndex, status) => {
        return await this._sendRequest('prayer.update', { rowIndex: rowIndex, status: status });
      }
    };

    // ── 4. TASK MANAGEMENT (TODO) ───────────────────────────────────────────
    this.tasks = {
      /** Load tasks assigned to the current user */
      listMyTasks: async () => {
        const res = await this._sendRequest('todo.list', { assignedTo: this.email });
        this.state.todos = res.rows;
        return res.rows;
      },

      /** Create a new follow-up task */
      create: async (title, description, memberId = '', dueDate = '') => {
        return await this._sendRequest('todo.create', {
          title: title,
          description: description,
          assignedMemberId: memberId,
          dueDate: dueDate
        });
      },

      /** Mark a task as Done */
      markDone: async (rowIndex) => {
        return await this._sendRequest('todo.update', { rowIndex: rowIndex, status: 'Done' });
      }
    };
  }

  // ── CORE NETWORK ROUTER ────────────────────────────────────────────────────

  /**
   * Internal fetch method to communicate with the GAS doGet() backend.
   * Converts all payloads to query parameters since GAS Web Apps (doGet) 
   * require URL parameters.
   */
  async _sendRequest(action, payload = {}) {
    // 1. Build the base request with required auth and action
    const params = new URLSearchParams({
      action: action,
      token: this.token,
      email: this.email
    });

    // 2. Append all other dynamic data from the payload
    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    }

    const requestUrl = `${this.endpoint}?${params.toString()}`;

    try {
      const response = await fetch(requestUrl, {
        method: 'GET', // GAS Web Apps restricted to GET for simple cross-origin
        headers: { 'Accept': 'application/json' }
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      
      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.message || 'API rejected the request.');
      }
      
      return data;
    } catch (error) {
      console.error(`[TBC Care API Error] Action: ${action}`, error);
      throw error; // Re-throw so the UI can catch and show an error message
    }
  }

  // ── APP HEALTH & AUTH ──────────────────────────────────────────────────────

  /**
   * Pings the server to ensure the script is running and reachable.
   */
  async checkHealth() {
    return await this._sendRequest('health');
  }
}

// Export for module systems (e.g., if you are using Webpack/Vite)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TBCCareApp;
}