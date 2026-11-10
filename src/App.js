import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import './App.css';
import AddData from './components/AddData';
import Home from './components/Home';
import Login from './components/Login';
import Movimientos from './components/Movimientos';
import NavegacionInferior from './components/NavegacionInferior';
import Reportes from './components/Reportes';

function App() {
  const tieneSesion = Boolean(localStorage.getItem('currentId'));

  return (
    <div className="fondo">
      <Router>
        <Switch>
          <Route path="/add-data/:id"> <AddData/> </Route>
          <Route path="/movimientos"> <Movimientos/> </Route>
          <Route path="/reportes"> <Reportes/> </Route>
          <Route path="/home"> <Home/> </Route>
          <Route path="/login">
            {tieneSesion ? <Redirect to="/home" /> : <Login />}
          </Route>
          <Route exact path="/">
            {tieneSesion ? <Redirect to="/home" /> : <Login />}
          </Route>
        </Switch>
        <NavegacionInferior />
      </Router>
    </div>
  );
}

export default App;
