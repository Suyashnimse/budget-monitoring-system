require('dotenv').config();
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with admin@test.com...');
    const response = await axios.post('https://budget-monitoring-system.onrender.com/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });
    console.log('Login successful!');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('Login failed:');
    console.log(error.response?.data || error.message);
  }
}

testLogin();
