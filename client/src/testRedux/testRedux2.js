import React from 'react'
import { useDispatch } from 'react-redux';
import { login, logout } from '../store/userSlice';

const TestRedux2 = () => {
  const dispatch = useDispatch();
  return (
    <div>
      <button onClick={() => dispatch(login())}>Login</button>
      <button onClick={() => dispatch(logout())}>Logout</button>
    </div>
  )
}

export default TestRedux2;