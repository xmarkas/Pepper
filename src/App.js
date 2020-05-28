import React from 'react';
import './App.css';
import './Pepper.css'
import './components/home';
import Pepper from './components/pepper';
import { Provider } from "react-redux";
import store from "./store/js/index";


function App() {

  return (
    <Provider store={store}>
      <Pepper></Pepper>
    </Provider>
  );
}

export default App;
