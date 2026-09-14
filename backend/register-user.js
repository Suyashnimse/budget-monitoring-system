require('dotenv').config();
const axios = require('axios');

const testUser = {
  name: 'Test Admin',
  email: 'admin@test.com',
  password: 'admin123',
  role: 'Admin',
  departmentId: ''
};

axios.post('https://budget-monitoring-system.onrender.com/register', testUser)
  .then(response => {
    console.log('User registered successfully:');
    console.log(JSON.stringify(response.data, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.log('Registration error:');
    console.log(error.response?.data || error.message);
    process.exit(1);
  });
