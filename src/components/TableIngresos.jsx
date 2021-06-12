import React, {useEffect}from 'react'
import { firedb } from '../firebaseConfig'
import sweet from 'sweetalert'

export default function TableIngresos(props) {
      
    useEffect(()=>{     
      props.getDataIngresos()  
      // props.calculo()    
    },[])

    const eliminarIngreso = async(id)=>{
      console.log(id);
      let idUser = localStorage.getItem('currentId')
      await firedb.collection(`ingresos-${idUser}`).doc(id).delete().then(
        r=> {
          props.getDataIngresos()
          sweet({
            title: "Eliminado correctamente",
            icon: "success",
            timer: 1000,
          });
          // window.location.reload();
        }
      ).catch(e => console.log(e)) 
    }
  
    return (
        <div className="">
        <h5 className="text-center w-100 d-block py-1 bg-green text-dark"><strong>Ingresos</strong></h5>
        <table className="table table-hover table-striped">
          <thead className="">
            <tr>
                <th scope="col">#</th>
                <th scope="col">Cantidad</th>
                <th scope="col">Descripción</th>
                <th scope="col">Fecha</th>
                <th scope="col">Hora</th>
                <th scope="col">Eliminar</th>
            </tr>
          </thead>
          <tbody>
          {
            props.listIngresos2.map((item, index)=>(
            <tr key={index}>
              <th scope="row">{index + 1}</th>
              <td> Q {item.cantidad}</td>
              <td>{item.descripcion}</td>
              <td>{item.fecha}</td>
              <td>{item.hora}</td>
              <td><button onClick={e=>eliminarIngreso(item.id)}  className="btn btn-danger bg-red"><i className="fas fa-trash"></i></button></td>
            </tr>
            ))
          }
          </tbody>
        </table>
      </div>
    )
}
