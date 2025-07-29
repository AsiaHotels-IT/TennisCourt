import React from 'react'
import {useSelector} from 'react-redux';

const TestRedux1 = () => {
    const {user} = useSelector(state => ({...state}));
    console.log(user);
  return (
    <div>
        {user.value}
        <br/>
        {user.user}
    </div>
  )
}

export default TestRedux1;