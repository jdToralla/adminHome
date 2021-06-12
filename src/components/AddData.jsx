import React, { useEffect, useState } from "react";
import { firedb } from "../firebaseConfig";
import * as _swal from 'sweetalert';


export default function AddData(props) {
  
  const getHora = () => {
    let date
    date = new Date();
    // let hora = date.getHours() + ":" + date.getUTCMinutes() + ":" + date.getSeconds();
    let hora = date.getHours() + ":" + date.getMinutes()
    return hora;
  };
  
  let emptyIngreso = {
    cantidad: "",
    fecha: "",
    hora: getHora(),
    descripcion: "",
    idUser2: parseInt(localStorage.getItem('currentId'))
  };

  let emptyEgreso = {
    cantidad: "",
    fecha: "",
    hora: getHora(),
    descripcion: "",
    idUser2: parseInt(localStorage.getItem('currentId'))
  };

  // const [inquilinos, setInquilinos] = useState([]);
  const [dataIngreso, setDataIngreso] = useState(emptyIngreso);
  const [dataEgreso, setDataEgreso] = useState(emptyEgreso);
  const [idUser, setIdUser] = useState('');

  useEffect(() => {
    // getDataInquilinos();
    let idUser = localStorage.getItem('currentId')
    setIdUser(idUser)    
  }, []);

  // const getDataInquilinos = async () => {
  //   console.log('Data de inquilinos');
  //   const { docs } = await firedb.collection("inquilinos").get();
  //   const newData = docs.map((item) => ({ id: item.id, ...item.data() }));
  //   setInquilinos(newData);
  // };

  const setIngreso = async (e) => {
    e.preventDefault();
    // let idUser = localStorage.getItem('currentId')
    if(dataIngreso.fecha.length > 0 && dataIngreso.cantidad.length != 0 && dataIngreso.descripcion.length > 0){
      await firedb
        .collection(`ingresos-${idUser}`)
        .add(dataIngreso)
        .then((r) => {
          console.log('Data ingreso', dataIngreso.cantidad2);
          props.calculo()
          // _swal({
          //   title: "Agregado correctamente",
          //   icon: "success",
          //   timer: 1000,
          // });
          messageAlert('Agregado correctamente', 'success',800, false)
          dataIngreso.cantidad2 = ""
          setDataIngreso(emptyIngreso);
          
        })
        .catch((e) => console.log(e));
    }else{
      messageAlert('Agregue todos los campos correspondientes', 'error',1200,false)
    }
  };

  const setEgreso = async (e) => {
    e.preventDefault();
    // let idUser = localStorage.getItem('currentId')
    if(dataEgreso.fecha.length > 0 && dataEgreso.cantidad != 0 && dataEgreso.descripcion.length > 0){

      await firedb
        .collection(`egresos-${idUser}`)
        .add(dataEgreso)
        .then(async (r) => {
          console.log('Data ingreso', dataEgreso.cantidad2);
          props.calculo()
          
          // sweet({
          //   title: "Agregado correctamente",
          //   icon: "success",
          //   timer: 1000,
          // });
          messageAlert('Agregado correctamente', 'success',800, false)
  
          setDataEgreso(emptyEgreso);
          dataEgreso.cantidad2 = ""
          
        })
        .catch((e) => console.log(e));
    }else{
      messageAlert('Agregue todos los campos correspondientes', 'error',1200,false)
    }
  };

  const messageAlert = (message, icon, timer,btn)=>{
    
    _swal({
      title: message,
      icon: icon,
      timer: timer,
      buttons: btn
    })
    // let Toast = _swal.mixin({
    //   toast: true,
    //   position: 'top-end',
    //   showConfirmButton: false,
    //   timer:timer ,
    //   timerProgressBar: true
    //   // didOpen: (toast) => {
    //   //   toast.addEventListener('mouseenter', Swal.stopTimer)
    //   //   toast.addEventListener('mouseleave', Swal.resumeTimer)
    //   // }
    // })
    
    // Toast.fire({
    //   icon: icon,
    //   title: message
    // })
  }

  return (
    <div className="w-100">
      <form onSubmit={(e) => setEgreso(e)} className="w-100  bg-yellow p-2">
        <div className="row">
          <div className="col p-0">
            <div className="form-group ml-3">
              <label>
                <strong> <i className="fas fa-money-bill-alt"></i> Egreso:</strong>{" "}
              </label>
              <input
                className="form-control"
                type="number"
                onChange={(e) =>
                  setDataEgreso({
                    ...dataEgreso,
                    cantidad: Number(e.target.value),
                  })
                }
                value={dataEgreso.cantidad}
              />
            </div>
          </div>
          <div className="col">
            <div className="form-group">
              <label>
                {" "}
                <strong><i className="fas fa-calendar-day"></i> Fecha:</strong>{" "}
              </label>
              <input
                className="form-control"
                type="date"
                name=""
                id=""
                onChange={(e) =>
                  setDataEgreso({ ...dataEgreso, fecha: e.target.value })
                }
                value={dataEgreso.fecha}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>
            <strong> Descripción:</strong>{" "}
          </label>
          <input
            className="form-control"
            type="text"
            id=""
            onChange={(e) =>
              setDataEgreso({ ...dataEgreso, descripcion: e.target.value })
            }
            value={dataEgreso.descripcion}
          />
        </div>
        <button
          className=" w-100 btn bg-blue text-light d-block"
          onClick={(e) => {
            props.agregarData(false);
          }}
        >
          <i className="fas fa-check mr-2"></i>  Agregar
        </button>
      </form>

      {/* Aqui empiza el otro Form */}
      <form
        onSubmit={(e) => setIngreso(e)}
        className="w-100 bg-green mt-3 p-2 border"
      >
        <div className="row">
          <div className="col p-0">
            <div className="form-group ml-3">
              <label>
                <strong> <i className="fas fa-money-bill-alt"></i> Ingreso:</strong>{" "}
              </label>
              <input
                onChange={(e) =>
                  setDataIngreso({
                    ...dataIngreso,
                    cantidad: Number(e.target.value),
                  })
                }
                value={dataIngreso.cantidad}
                className="form-control"
                min="0"
                type="number"
                id=""
              />
            </div>
          </div>
          <div className="col">
            <div className="form-group">
              <label>
                {" "}
                <strong><i className="fas fa-calendar-day"></i> Fecha:</strong>
              </label>
              <input
                onChange={(e) =>
                  setDataIngreso({ ...dataIngreso, fecha: e.target.value })
                }
                value={dataIngreso.fecha}
                className="form-control"
                type="date"
                name=""
                id=""
              />
            </div>
          </div>
        </div>
        {/* <div className="form-group">
          <label htmlFor="FormControlSelect1">
            <satrong>Descripción:</strong>
          </label>
          <select className="form-control" id="FormControlSelect1">
            <option> Seleccione un inquilino...</option>
            {inquilinos.map((item, index) => (
              <option
                key={index}
                onClick={(e) =>
                  setDataIngreso({ ...dataIngreso, inquilino: e.target.value })
                }
              >
                {" "}
                {item.name}
              </option>
            ))}
          </select>
        </div> */}
        <div className="form-group">
          <label>
            <strong> Descripción:</strong>{" "}
          </label>
          <input
            className="form-control"
            type="text"
            id=""
            onChange={(e) =>
              setDataIngreso({ ...dataIngreso, descripcion: e.target.value })
            }
            value={dataIngreso.descripcion}
          />
        </div>
        <button
          onClick={(e) => {
            props.agregarData(true);
          }}
          className=" w-100 btn bg-blue text-light d-block"
        >
          <i className="fas fa-check mr-2"></i> Agregar
        </button>
      </form>
    </div>
  );
}
