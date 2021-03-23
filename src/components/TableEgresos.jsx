import React, {useEffect} from "react";

import { firedb } from '../firebaseConfig'
export default function TableEgresos(props) {
  
  useEffect(()=>{     
    props.getDataE()
    props.calculo()
  })

  const eliminarEgreso = async(id)=>{
    console.log("delete", id);
    const {docs} = await firedb.collection("egresos").get()
    const newData = docs.map(item=>(
      {...item.data()}
    ))
    
    console.log(newData);

  }
  
  return (
    <div className="">
        <h5 className="text-center w-100 d-block py-1 bg-warning text-light">Egresos</h5>
        <table className="table table-hover table-striped">
          <thead className="table-success">
            <tr>
                <th scope="col">#</th>
                <th scope="col">Cantidad</th>
                <th scope="col">Descripcion</th>
                <th scope="col">Fecha</th>
                <th scope="col">Hora</th>
                <th scope="col">Eliminar</th>
            </tr>
          </thead>
          <tbody>
          {
            props.listEgresos2.map((item, index)=>(
            <tr key={index}>
              <th scope="row">{index + 1}</th>
              <td> Q {item.cantidad}</td>
              <td>{item.descripcion}</td>
              <td>{item.fecha}</td>
              <td>{item.hora}</td>
              <td ><button onClick={e=>eliminarEgreso(item.id)}  className="btn btn-danger"><i className="fas fa-trash"></i></button>  </td>
            </tr>
            ))
          }
          </tbody>
        </table>
      </div>
  );
}
