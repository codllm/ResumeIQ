const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3639";

/**
 * Login User API
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} API response data
 */
export const loginUserApi = async ({ email, password }) => {
  const response = await fetch(`${BASE_URL}/api/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Login failed. Please check your credentials.');
  }

  return data;
};

/**
 * Register User API
 * @param {Object} userData - { username, email, password }
 * @returns {Promise<Object>} API response data
 */
export const registerUserApi = async ({ username, email, password }) => {
  const response = await fetch(`${BASE_URL}/api/user/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Registration failed. Please check your details.');
  }

  return data;
};

export const logoutUserapi = async ()=>{
  const token = localStorage.getItem('token');

  try{
    const response = await fetch(`${BASE_URL}/api/user/logout`, {
      method:'POST',
      headers:{
        'constent-type':'application/json',
        'Authorization': `bearer ${token}`
      }
    })
    const data = response.JSON();
    return data; 
  }catch(err){
    console.error("Logout failed:", err); 
  }
}
export const getmeUserapi = async()=>{
  const token = localStorage.getItem('token');

  try{
       const response = await fetch(`${BASE_URL}/api/user/logout`, {
      method:'POST',
      headers:{
        'constent-type':'application/json',
        'Authorization': `bearer ${token}`
      }
    })
    const data = response.JSON();
    return data;
  }catch(err){
    return res.status(500).json({success:false,message:"Internal server error"})
  }
}

