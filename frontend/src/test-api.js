import { api } from './services/api.js';
async function testAPI() {
  try {
    // Test health endpoint
    console.log('Testing API connection...');
    const healthResponse = await fetch('http://localhost:8000/health');
    const health = await healthResponse.json();
    console.log('Health check:', health);
    
    // Test get projects
    console.log('Getting projects...');
    const projects = await api.getProjects();
    console.log('Projects:', projects);
    
    console.log('✅ API connection successful!');
  } catch (error) {
    console.error('❌ API connection failed:', error.message);
  }
}

testAPI();