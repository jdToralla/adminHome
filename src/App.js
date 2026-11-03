import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import AddData from './components/AddData';
import Home from './components/Home';
import Login from './components/Login';
import Movimientos from './components/Movimientos';
import NavegacionInferior from './components/NavegacionInferior';

function App() {
  return (
    <div className="fondo">
      <Router>
        <Switch>
          <Route path="/add-data/:id"> <AddData/> </Route>
          <Route path="/movimientos"> <Movimientos/> </Route>
          <Route path="/home"> <Home/> </Route>
          <Route path="/login"><Login/></Route>
          <Route path="/"><Login/></Route>
        </Switch>
        <NavegacionInferior />
      </Router>
    </div>
  );
}

export default App;
