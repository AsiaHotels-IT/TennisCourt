import axios from 'axios';

export const addMember = async (data) => {
  await axios.post(process.env.REACT_APP_API + '/member', data, { withCredentials: true });
};

export const listMember = async () => {
  return await axios.get(process.env.REACT_APP_API + '/member', { withCredentials: true });
};

export const reprintReceipt = async (data) => {
  await axios.post(process.env.REACT_APP_API + '/reprintReceipt', data, { withCredentials: true });
};

export const listreprintReceipt = async () => {
  return await axios.get(process.env.REACT_APP_API + '/reprintReceipt', { withCredentials: true });
};

export const register = async (data) => {
  return await axios.post(process.env.REACT_APP_API + '/register', data, { withCredentials: true });
}

export const login = async (data) => {
  return await axios.post(process.env.REACT_APP_API + '/login', data, { withCredentials: true });
};

export const checkPassword = async (data) => {
  return await axios.post(process.env.REACT_APP_API + '/check-password', data, { withCredentials: true });
}

export const logout = async () => {
  return await axios.post(process.env.REACT_APP_API + '/logout', {}, { withCredentials: true });
}