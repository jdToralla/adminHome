import React, { useEffect, useState } from "react";
import { firedb } from "../firebaseConfig";
import sweet from "sweetalert";

export default function AddData(props) {
  const getHora = () => {
    const date = new Date();
    const hora =
      date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    return hora;
  };

  let emptyIngreso = {
    cantidad: 0,
    fecha: "",
    hora: getHora(),
    inquilino: "",
  };

  let emptyEgreso = {
    cantidad: 0,
    fecha: "",
    hora: getHora(),
    descripcion: "",
  };

  const [inquilinos, setInquilinos] = useState([]);
  const [dataIngreso, setDataIngreso] = useState(emptyIngreso);
  const [dataEgreso, setDataEgreso] = useState(emptyEgreso);

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    const { docs } = await firedb.collection("inquilinos").get();
    const newData = docs.map((item) => ({ id: item.id, ...item.data() }));
    setInquilinos(newData);
  };

  const setIngreso = async (e) => {
    e.preventDefault();
    await firedb
      .collection("ingresos")
      .add(dataIngreso)
      .then((r) => {
        console.log(dataIngreso);
        sweet({
          title: "Agregado correctamente",
          icon: "success",
          timer: 1000,
        });
        setDataIngreso(emptyIngreso);
      })
      .catch((e) => console.log(e));
  };

  const setEgreso = async (e) => {
    e.preventDefault();
    await firedb
      .collection("egresos")
      .add(dataEgreso)
      .then(async(r) => {
        console.log(dataEgreso);
        sweet({
          title: "Agregado correctamente",
          icon: "success",
          timer: 1000,
        });
        
        /*const {docs} = await firedb.collection('totalCaja').get()
        const total  = docs.map(item=>(
          {...item.data()}
        ))
        console.log("tengo el total: ", typeof total[0].total);
        console.log("le resto: ", typeof dataEgreso.cantidad);
        console.log((total[0].total - dataEgreso.cantidad));
        */
        setDataEgreso(emptyEgreso);
      })
      .catch((e) => console.log(e));
  };

  return (
    <div className="w-100">
      <form onSubmit={(e) => setEgreso(e)} className="w-100 bg-warning p-2">
        <div className="row">
          <div className="col p-0">
            <div className="form-group ml-3">
              <label>
                <strong> Egreso:</strong>{" "}
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
              <label htmlFor="">
                {" "}
                <strong>Fecha:</strong>{" "}
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
            <strong> Descripcion:</strong>{" "}
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
          className=" w-100 btn btn-success d-block"
          onClick={(e) => {
            props.papi(false);
          }}
        >
          Agregar
        </button>
      </form>

      {/* Aqui empiza el otro Form */}
      <form
        onSubmit={(e) => setIngreso(e)}
        className="w-100 bg-light mt-3 p-2 border"
      >
        <div className="row">
          <div className="col p-0">
            <div className="form-group ml-3">
              <label>
                <strong> Ingreso:</strong>{" "}
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
              <label htmlFor="">
                {" "}
                <strong>Fecha:</strong>
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
          <label htmlFor="FormControlSelect1">
            <strong>Inquilino:</strong>
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
        </div>
        <button
          onClick={(e) => {
            props.papi(true);
          }}
          className=" w-100 btn btn-success d-block"
        >
          Agregar
        </button>
      </form>
      {/* <button onClick={e=> {props.papi(flagAdd)}} className=" w-100 btn btn-success d-block">Vamos paapi</button> */}
    </div>
  );
}
