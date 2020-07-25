
import React from 'react';
import './App.scss';
import 'bootstrap/dist/css/bootstrap.min.css'; 
import { useAuth0 } from "./services/auth/react-auth0-spa";


import {
  BrowserRouter as Router,
} from "react-router-dom";
import PrivatePage from './pages/private-page';


function App() {
  const { loading } = useAuth0();
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <div className="App">
      <header className="App-header"></header>
      <Router basename={process.env.REACT_APP_BASE_URL}>
        <PrivatePage />
      </Router>
    </div>
  );
}

export default App;
