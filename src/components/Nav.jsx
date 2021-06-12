import React, { useEffect, useState } from "react";
import { Link } from 'react-router-dom'
import './styles.css';
import {useHistory} from 'react-router-dom'


export default function Nav() {
    
    const [idUser, setIdUser] = useState('');
    const historial = useHistory()
    
    useEffect(()=>{
        
        
        // if(localStorage.getItem('currentId').length > 0){
        //     console.log('Entro aqui primero 2');
        //     // localStorage.setItem('currentId','')
            
        // }else{
            console.log('Entro aqui final');
            let idUser = localStorage.getItem('currentId')
            setIdUser(idUser)    
        // }
        
    },[])

    const logout = ()=>{
        localStorage.setItem('currentId', '')
        setIdUser('')    
        historial.push(`/`)
    }

    return (
        <div>
            <nav className="navbar navbar-dark bg-blue mb-0 pb-0 py-3 fixed">
                <div className="container">
                    <div className="navbar-brand d-flex justify-content-between w-100">
                    <div>
                    <i className="fas fa-calculator mr-2"></i>AdminCuentas    
                    </div>    
                    
                    <div className={idUser ? "d-flexx" : "d-none"} onClick={e=>logout()} >
                        <i className="fas fa-sign-out text-light mr-2"></i>Salir
                    </div>
                    </div>
                    {/* <div className="form-inline">
                        <input className="form-control" type="search" placeholder="Buscar..." aria-label="Search"/>
                        <button className="btn btn-success my-2 my-sm-0" type="submit"><i className="fas fa-search"></i> Buscar</button>
                    </div> */}
                </div>
            </nav>
            <div className="menu">

            </div>
        </div>
    )
}
