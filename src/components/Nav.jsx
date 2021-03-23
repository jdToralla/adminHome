import React from 'react'
import { Link } from 'react-router-dom'


export default function Nav() {
    return (
        <div >
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container">
                    <Link to="/" className="navbar-brand">Cuentas</Link>
                
                </div>
            </nav>
        </div>
    )
}
