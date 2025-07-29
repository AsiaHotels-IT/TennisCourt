import axios from 'axios';

export const getReservations = async ()=>
    await axios.get(process.env.REACT_APP_API + '/reservation');

export const getReservationById = async (id)=>
    await axios.get(process.env.REACT_APP_API + '/reservation/' + id);

export const createReservations = async (data)=>
    await axios.post(process.env.REACT_APP_API + '/reservation', data);

export const updateReservations = async (id, data) =>
  await axios.put(`${process.env.REACT_APP_API}/reservation/${id}`, data);
  
export const deleteReservations = async (id) =>
  await axios.delete(`${process.env.REACT_APP_API}/reservation/${id}`);

export const listCancelReservation = async ()=>
    await axios.get(process.env.REACT_APP_API + '/cancelReserv');