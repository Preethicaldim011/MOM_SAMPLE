const API_BASE_URL = 'http://localhost:8000';

async function handleResponse(response) {
  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = JSON.stringify(errorJson, null, 2);
    } catch {
      errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const api = {
  // Projects
  getProjects: async () => {
    const response = await fetch(`${API_BASE_URL}/projects/`);
    return handleResponse(response);
  },
  
  getProject: async (id) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`);
    return handleResponse(response);
  },
  
  createProject: async (projectData) => {
    const response = await fetch(`${API_BASE_URL}/projects/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });
    return handleResponse(response);
  },
  
  updateProject: async (id, projectData) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...projectData })
    });
    return handleResponse(response);
  },
  
  deleteProject: async (id) => {
    const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },
  
  // Meetings
  getMeetings: async () => {
    const response = await fetch(`${API_BASE_URL}/meetings/`);
    return handleResponse(response);
  },
  
  getMeeting: async (id) => {
    const response = await fetch(`${API_BASE_URL}/meetings/${id}`);
    return handleResponse(response);
  },
  
  getMeetingsByProject: async (projectId) => {
    const response = await fetch(`${API_BASE_URL}/meetings/project/${projectId}`);
    return handleResponse(response);
  },
  
  createMeeting: async (meetingData) => {
    const response = await fetch(`${API_BASE_URL}/meetings/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meetingData)
    });
    return handleResponse(response);
  },
  
  updateMeeting: async (id, meetingData) => {
    const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...meetingData })
    });
    return handleResponse(response);
  },
  
  deleteMeeting: async (id) => {
    const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },
  
  // Search
  searchMeetings: async (term) => {
    const response = await fetch(`${API_BASE_URL}/meetings/search/?search_term=${encodeURIComponent(term)}`);
    return handleResponse(response);
  }
};

export default api;