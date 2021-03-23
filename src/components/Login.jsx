import React, {useState, useEffect} from 'react'
import { firedb } from '../firebaseConfig'
import {useHistory} from 'react-router-dom'
import './styles.css'

function Login() {
    
    const [email, setEmail] = useState('')
    const [pass, setPass] = useState('')
    const [msgerror, setMsgError] = useState(null)
    const [dataUser, setDataUser] = useState([])
    const historial = useHistory()

    useEffect( ()=>{
        getData()
    },[])

    const getData = async()=>{
        const {docs} = await firedb.collection('users').get()
        const nuevoArray = docs.map(item=>(
            {id: item.id,...item.data()}
        ))
        setDataUser(nuevoArray)
    }

    const registrarUsuario = async(e)=>{
        e.preventDefault()

        dataUser.forEach(user=>{
            
            if(email.trim() === user.user && pass.trim() === user.pass){     
                historial.push(`/home`)
            }else{
               
                setMsgError('Usuario o contraseña incorrecta.')
            }

        })
        
    }

    
    return (
        <div>
        <div className="container">
        
        <div className="row justify-content-center align-items-center mt-5">
            <div className="col-sm-12 col-md-4 shadow p-5 bg-light rounded-lg m-4 m-sm-0">
                <form onSubmit={e=>registrarUsuario(e)}>
                    <div className="form-group">
                        <label><i className="fas fa-user mr-2"></i>Usuario</label>
                        <input onChange={e => setEmail(e.target.value)} value={email} className="form-control" type="text" placeholder="Email..." />
                    </div>
                    <div className="form-group">
                        <label><i className="fas fa-key mr-2"></i>Contraseña</label>
                        <input onChange={e => setPass(e.target.value)} value={pass} className="form-control" type="text" dplaceholder="Contraseña..." />
                    </div>
                    <button className="btn btn-dark btn-block mt-4">
                            Ingresar
                    </button>
                </form>
                
                {
                    msgerror != null ?
                    <div className="alert alert-danger mt-2" role="alert">
                        {msgerror}
                    </div>
                    :
                    <span></span>
                }
            </div>
        </div>
       </div>
    </div>
    )
}

export default Login
