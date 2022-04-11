import { useState } from "react";
import * as _swal from 'sweetalert';
import { firedb } from "../firebaseConfig";

export default function NewExpense() {

    const getHora = () => {
        let date
        date = new Date();
        // let hora = date.getHours() + ":" + date.getUTCMinutes() + ":" + date.getSeconds();
        let hora = date.getHours() + ":" + date.getMinutes()
        return hora;
    };

    let emptyEgreso = {
        cantidad: "",
        fecha: "",
        hora: getHora(),
        descripcion: "",
        idUser2: parseInt(localStorage.getItem('currentId'))
      };

    const [dataEgreso, setDataEgreso] = useState(emptyEgreso);
    const [idUser, setIdUser] = useState('');

    const setEgreso = async (e) => {
        e.preventDefault();
        // let idUser = localStorage.getItem('currentId')
        if(dataEgreso.fecha.length > 0 && dataEgreso.cantidad != 0 && dataEgreso.descripcion.length > 0){
    
          await firedb
            .collection(`egresos-${idUser}`)
            .add(dataEgreso)
            .then(async (r) => {
              console.log('Data ingreso', dataEgreso.cantidad2);
            //   props.calculo()
              
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
        <div>
                  <form onSubmit={(e) => setEgreso(e)} className="w-100  bg-yellow p-2">
        <div className="row">
          <div className="col p-0">
            <div className="form-group ml-3">
              <label>
                <strong> <i className="fas fa-money-bill-alt"></i> Egreso:</strong>{" "}
              </label>
              <input
                className="form-control"
                type="text"
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
        <div className="d-flex justify-content-end">
        <button
          className="btn bg-danger text-light">
          <i className="fas fa-times mr-2"></i>  Cancelar
        </button>
        <button
          className="btn bg-blue text-light ml-2">
          <i className="fas fa-check mr-2"></i>  Agregar
        </button>
        </div>
      </form>


        </div>
    );

}