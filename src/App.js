import { HashRouter as Router, Route, Switch } from 'react-router-dom';
import './App.css';
import AddData from './components/AddData';
import Home from './components/Home';
import Login from './components/Login';
import Nav from './components/Nav';

function App() {
  
  return (
    <div className="fondo">
        <Router>
            <Nav/> 
          <Switch>
            <Route path="/add-data/:id"> <AddData/> </Route>
            <Route path="/home"> <Home/> </Route>
            <Route path="/login"><Login/></Route>
            <Route path="/"><Login/></Route>
          </Switch>
        </Router>
    </div>
  );
}

export default App;
