import React, { useEffect, useState } from "react";
import { useHistory, useParams } from 'react-router-dom';
import * as _swal from 'sweetalert';
import { firedb } from "../firebaseConfig";


export default function AddData(props) {
  
  const history = useHistory()
  const { id } = useParams()

  const getHora = () => {
    let date
    date = new Date();
    let hora = date.getHours() + ":" + date.getUTCMinutes() + ":" + date.getSeconds();
    return hora;
  };

  let emptyIngreso = {
    cantidad: "",
    fecha: "",
    hora: getHora(),
    descripcion: "",
    idUser: parseInt(localStorage.getItem('currentId')),
    tipo: 2
  };

  let emptyEgreso = {
    cantidad: "",
    fecha: "",
    hora: getHora(),
    descripcion: "",
    idUser: parseInt(localStorage.getItem('currentId')),
    tipo: 1
  };

  const [dataIngreso, setDataIngreso] = useState(emptyIngreso);
  const [dataEgreso, setDataEgreso] = useState(emptyEgreso);

  useEffect(() => {
    
  }, []);

  const setIngreso = async (e) => {

    e.preventDefault();
    if(dataIngreso.fecha.length > 0 && dataIngreso.cantidad.length !== 0 && dataIngreso.descripcion.length > 0){
      await firedb
        .collection(`caja-chica`)
        .add(dataIngreso)
        .then((r) => {
          console.log('Data ingreso', dataIngreso);
          messageAlert('Agregado correctamente', 'success',1000, false)
          history.push(`/home`)
          setDataIngreso(emptyIngreso);
        })
        .catch((e) => console.log(e));

    }else{
      messageAlert('Agregue todos los campos correspondientes', 'error',1200,false)
    }
  };

  const setEgreso = async (e) => {
    e.preventDefault();
    if(dataEgreso.fecha.length > 0 && dataEgreso.cantidad !== 0 && dataEgreso.descripcion.length > 0){

      await firedb
        .collection(`caja-chica`)
        .add(dataEgreso)
        .then(async (r) => {
          console.log('Data ingreso', dataEgreso.cantidad2);
          messageAlert('Agregado correctamente', 'success',1000, false)
          history.push(`/home`)
          setDataEgreso(emptyEgreso);
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
  }

  return (
    <div className="w-100 px-3" style={{ paddingTop: 90 }}>
       <form onSubmit={(e) => setEgreso(e)} className="w-100 bg-yellow p-2" style={{display: id === '1'? 'block': 'none'}} >
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
          <textarea
            className="form-control"
            type="text"
            id=""
            onChange={(e) =>
              setDataEgreso({ ...dataEgreso, descripcion: e.target.value })
            }
            value={dataEgreso.descripcion}
          />
        </div>

        <div className="d-flex justify-content-end">
        <button
          className="btn bg-danger text-light" onClick={() => history.push('/home')}>
          <i className="fas fa-times mr-2"></i>  Cancelar
        </button>
        <button
          className="btn bg-blue text-light ml-2"
          onClick={(e) => {
            setEgreso(e);
          }}>
          <i className="fas fa-check mr-2"></i>  Agregar
        </button>
        </div>

      </form> 

      {/* Aqui empiza el otro Form */}
      <form
        onSubmit={(e) => setIngreso(e)}
        className="w-100 bg-green p-2 border"
        style={{display: id === '2'? 'block': 'none'}}
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
        <div className="form-group">
          <label>
            <strong> Descripción:</strong>{" "}
          </label>
          <textarea
            className="form-control"
            type="text"
            id=""
            onChange={(e) =>
              setDataIngreso({ ...dataIngreso, descripcion: e.target.value })
            }
            value={dataIngreso.descripcion}
          />
        </div>
        <div className="d-flex justify-content-end">
        <button
          className="btn bg-danger text-light" onClick={() => history.push('/home')}>
          <i className="fas fa-times mr-2"></i>  Cancelar
        </button>
        <button
          className="btn bg-blue text-light ml-2"
          onClick={(e) => {
            // props.agregarData(true);
            setIngreso(e);
          }}>
          <i className="fas fa-check mr-2"></i>  Agregar
        </button>
        </div>
        
      </form>
    </div>
  );
}
