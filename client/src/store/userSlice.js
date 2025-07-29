import { createSlice } from '@reduxjs/toolkit'

const   initialState = {
    value: 'Asia Tennis Stadium',
    user: []
}
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      state.value = "login"
      state.user = action.payload
    },
    logout: (state) => {
      state.user = [];
      localStorage.clear(); //clear token
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload
    }
  }
})

export const { login, logout, incrementByAmount } = userSlice.actions

export default userSlice.reducer