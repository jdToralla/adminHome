import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { firedb } from '../firebaseConfig'
import './styles.css'

function Login() {
    
    const [email, setEmail] = useState('norma77')
    const [pass, setPass] = useState('toralla12')
    const [msgerror, setMsgError] = useState(null)
    const [dataUser, setDataUser] = useState([])
    const historial = useHistory()

    useEffect( ()=>{
        localStorage.setItem('currentId','')
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
                localStorage.setItem('currentId', '')
                localStorage.setItem('currentId', user.id)
                window.location.reload();
            }else{
               
                setMsgError('Usuario o contraseña incorrecta.')
            }

        })
        
        
    }

    
    return (
        <div>
        <div className="container">        
        <div className="row justify-content-center align-items-center" style={{ paddingTop: 120 }}>
            <div className="col-sm-12 col-md-4 shadow p-5 bg-light rounded-lg m-4 m-sm-0">
                <form onSubmit={e=>registrarUsuario(e)}>
                    <div className="form-group">
                        <label><i className="fas fa-user mr-2"></i>Usuario</label>
                        <input onChange={e => setEmail(e.target.value)} value={email} className="form-control" type="text" placeholder="Usuario..." />
                    </div>
                    <div className="form-group">
                        <label><i className="fas fa-key mr-2"></i>Contraseña</label>
                        <input onChange={e => setPass(e.target.value)} value={pass} className="form-control" type="password" dplaceholder="Contraseña..." />
                    </div>
                    <button className="btn btn-dark bg-blue btn-block mt-4">
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
