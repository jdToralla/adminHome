import React, { useEffect, useState } from "react";
import { useHistory } from 'react-router-dom';
import * as _swal from 'sweetalert';
import './styles.css';

export default function Nav() {

    const [idUser, setIdUser] = useState('');
    const historial = useHistory()

    useEffect(() => {
        let idUser = localStorage.getItem('currentId')
        setIdUser(idUser)
    }, [])

    const logout = () => {

        _swal({
            title: '¿Desea salir?',
            icon: 'warning',
            buttons: ["Cancelar", "Si, salir"]
        }).then(async (result) => {
            if (result) {
                localStorage.setItem('currentId', '')
                historial.push(`/`)
                setIdUser('')
            }
        })
    }

    return (
        <div>
            <nav className="navbar navbar-dark bg-blue mb-0 pb-0 py-3 fixed">
                <div className="container" style={{paddingTop:20}}>
                    <div className="navbar-brand d-flex justify-content-between w-100">
                        <div>
                            <i className="fas fa-calculator mr-2"></i>AdminCuentas
                        </div>

                        <div className={idUser ? "d-flexx" : "d-none"} onClick={e => logout()} style={{ cursor: 'pointer', fontSize: 17 }}>
                            <i className="fas fa-sign-out text-light mr-2"></i>Salir
                        </div>
                        {/* <div>
                        <i className="fas fa-bars"></i>
                    </div> */}
                    </div>
                </div>
            </nav>
        </div>
    )
}
