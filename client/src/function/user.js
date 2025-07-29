import axios from 'axios';

export const getAllUser = async ()=>
    await axios.get(process.env.REACT_APP_API + '/user');

export const getUserById = async (id)=>
    await axios.get(process.env.REACT_APP_API + '/user/' + id);

export const createUser = async (data)=>
    await axios.post(process.env.REACT_APP_API + '/user', data);

export const updateUser = async (id, data) =>
  await axios.put(`${process.env.REACT_APP_API}/user/${id}`, data);

export const deleteUser = async (id) =>
  await axios.delete(`${process.env.REACT_APP_API}/user/${id}`);

