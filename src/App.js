import './App.css';
import Nav from './components/Nav';
import { HashRouter as Router, Switch, Route} from 'react-router-dom'
import Login from './components/Login';
import Home from './components/Home';

function App() {
  
  return (
    <div className="fondo">
        <Router>
            <Nav/> 
          <Switch>
            <Route path="/home"> <Home/> </Route>
            <Route path="/"><Login/></Route>
          </Switch>
        </Router>
    </div>
  );
}

export default App;
