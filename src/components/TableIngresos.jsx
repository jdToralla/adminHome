import React, {useEffect}from 'react'


export default function TableIngresos(props) {
      
    useEffect(()=>{     
      props.getData()
      
    })
  
    return (
        <div className="">
        <h5 className="text-center w-100 d-block py-1 bg-success text-light">Ingresos</h5>
        <table className="table table-hover table-striped">
          <thead className="table-success">
            <tr>
                <th scope="col">#</th>
                <th scope="col">Cantidad</th>
                <th scope="col">Inquilino</th>
                <th scope="col">Fecha</th>
                <th scope="col">Hora</th>
            </tr>
          </thead>
          <tbody>
          {
            props.listIngresos2.map((item, index)=>(
            <tr key={index}>
              <th scope="row">{index + 1}</th>
              <td> Q {item.cantidad}</td>
              <td>{item.inquilino}</td>
              <td>{item.fecha}</td>
              <td>{item.hora}</td>
            </tr>
            ))
          }
          </tbody>
        </table>
      </div>
    )
}
