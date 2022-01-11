import React, { useEffect, useState } from "react";
import { useHistory } from 'react-router-dom';
import * as _swal from 'sweetalert';
import { firedb } from "../firebaseConfig";

export default function Home() {

  const historial = useHistory()
  useEffect(() => {
    getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  let calculoTotal = {
    egresosTotal: 0,
    ingresosTotal: 0,
    saldoTotal: 0
  };

  const [flag, setFlag] = useState(false)
  const [listData, setListData] = useState([])
  // const [listDataTmp, setListDataTmp] = useState([])
  const [sumaTotal, setSumaTotal] = useState(calculoTotal)


  const formatoFecha = (fecha) => {
    const f = fecha.split("-")
    switch (f[1]) {
      case '01': f[1] = 'Ene'
        break;
      case '02': f[1] = 'Feb'
        break;
      case '03': f[1] = 'Mar'
        break;
      case '04': f[1] = 'Abr'
        break;
      case '05': f[1] = 'May'
        break;
      case '06': f[1] = 'Jun'
        break;
      case '07': f[1] = 'Jul'
        break;
      case '08': f[1] = 'Ago'
        break;
      case '09': f[1] = 'Sep'
        break;
      case '10': f[1] = 'Oct'
        break;
      case '11': f[1] = 'Nov'
        break;
      case '12': f[1] = 'Dic'
        break;
      default:
        break;
    }
    return f[2] + '-' + f[1] + '-' + f[0]
  }


  const getData = async () => {
    setFlag(true)

    let idUser = localStorage.getItem('currentId')

    const { docs } = await firedb.collection(`caja-chica`).where("idUser", "==", parseInt(idUser)).orderBy("fecha", "desc").get()
    const newArray = docs.map(item => (
      { id: item.id, ...item.data() }
    ))

    setFlag(false)
    setListData(newArray)
    // setListDataTmp(newArray)
    calculate(newArray)

  }


  const seleccion = async (e) => {
    setListData([])
    setFlag(true)
    if (e.target.value === 'Egreso') {
      console.log('Egreso');
      // temp = listData.filter(val => val.tipo === 1)

      const { docs } = await firedb.collection(`caja-chica`).where("idUser", "==", parseInt(localStorage.getItem('currentId'))).where("tipo", "==", 1).get()
      const newArray = docs.map(item => (
        { id: item.id, ...item.data() }
      ))
      setListData(newArray)
      setFlag(false)

    } else if (e.target.value === 'Ingreso') {
      console.log('Ingreso');
      const { docs } = await firedb.collection(`caja-chica`).where("idUser", "==", parseInt(localStorage.getItem('currentId'))).where("tipo", "==", 2).get()
      const newArray = docs.map(item => (
        { id: item.id, ...item.data() }
      ))
      setListData(newArray)
      setFlag(false)
      // temp = listData.filter(val => val.tipo === 2)

    } else {
      getData()
    }

  }

  // const agregar = () => {
  //   console.log('Click', listEgresos);
  //   listEgresos.forEach(val => {

  //     let data = {
  //       cantidad: val.cantidad,
  //       fecha: val.fecha,
  //       hora: val.hora,
  //       descripcion: val.descripcion,
  //       idUser: 2
  //     }
  //     console.log(data);

  //     // let data ={
  //     //   ...val,
  //     //   idUser: 2,
  //     //   // descripcion: val.inquilino
  //     // }

  //     firedb
  //       .collection(`egresos-2`)
  //       .add(data)
  //       .then((r) => {

  //         console.log('Listo');
  //       })
  //       .catch((e) => console.log(e));
  //   })
  // }

  const searchByDate = async (date) => {
    if (date) {

      setFlag(true)
      setListData([])

      let idUser = localStorage.getItem('currentId')
      const { docs } = await firedb.collection(`caja-chica`).where("idUser", "==", parseInt(idUser)).where("fecha", "==", `${date}`).get()
      const newArray = docs.map(item => (
        { id: item.id, ...item.data() }
      ))

      console.log('Array fecha: ', newArray);
      setListData(newArray)
      setFlag(false)

    } else {
      getData()
    }
  }

  const addNewExpenseOrIncome = async (type) => {
    historial.push(`/add-data/${type}`)
  }

  const eliminarEgreso = async (id, description) => {

    _swal({
      title: '¿Desea eliminar?',
      text: `${description}`,
      icon: 'warning',
      buttons: ["Cancelar", "Si, eliminar"]
    }).then(async (result) => {
      if (result) {
        await firedb.collection(`caja-chica`).doc(id).delete().then(
          r => {
            getData()
            messageAlert('Eliminado correctamente', 'success', 1000, false)
          }
        ).catch(e => console.log(e))
      }
    })

  }

  const calculate = (arrayData) => {

    let sumEgresos = 0
    let sumIngresos = 0

    arrayData.forEach(val => {
      if (val.tipo === 1) {
        sumEgresos += val.cantidad
      }

      if (val.tipo === 2) {
        sumIngresos += val.cantidad
      }

    })

    let calculoTotal = {
      egresosTotal: sumEgresos,
      ingresosTotal: sumIngresos,
      saldoTotal: sumIngresos - sumEgresos
    };

    setSumaTotal(calculoTotal)
  }

  const messageAlert = (message, icon, timer, btn) => {
    _swal({
      title: message,
      icon: icon,
      timer: timer,
      buttons: btn
    })
  }

  return (
    <div className="container" style={{ paddingTop: 85 }}>
      {/* <div>
        <button className="btn btn-primary" onClick={e=> agregar()}>add </button>
      </div> */}
      <div className="mt-2 mt-3 d-flex justify-content-between">
        <button className="btn btn-success btn-sm" onClick={e => addNewExpenseOrIncome(2)}> <i className="fas fa-plus mr-2"> </i> Nuevo ingreso</button>
        <button className="btn btn-warning btn-sm" onClick={e => addNewExpenseOrIncome(1)}> <i className="fas fa-plus mr-2"></i> Nuevo egreso</button>
      </div>

      <div className="row mt-4">
        <div className="row w-100 mx-1">
          <div className="input-group col-12 px-1">
            <div className="input-group-prepend">
              <span className="input-group-text" id="basic-addon1"><i className="fas fa-calendar-alt"></i></span>
            </div>
            <input onChange={(e) => searchByDate(e.target.value)} className="form-control" type="date" placeholder="dd/mm/aaaa" style={{fontSize:10, height:'100%'}}/>
          </div>
          {/* <div className="input-group col-7 px-1">
            <div className="input-group-prepend">
              <span className="input-group-text" id="basic-addon1"><i className="fas fa-search"></i></span>
            </div>
            <input className="form-control" type="text" placeholder="Buscar..." style={{ zIndex: 0 }} />
          </div> */}
          <div className="col-12 px-1 mt-2">
            <select onChange={e => seleccion(e)} className="form-control " id="FormControlSelect1">
              <option>Todos</option>
              <option>Ingreso</option> 
              <option>Egreso</option>
            </select>
          </div>
        </div>
      </div>
      <div className="row mt-2" style={{maxHeight:'47vh', overflow:'auto'}}>
        <table className="table table-sm bg-light mx-2 text-center" style={{ fontSize: 13.5 }}>
          <thead className="">
            <tr>
              {/* <th scope="col">#</th> */}
              <th scope="col">Cantidad</th>
              <th scope="col">Descripción</th>
              <th scope="col">Tipo</th>
              <th scope="col">Fecha</th>
              <th scope="col"></th>
            </tr>
          </thead>
          <tbody>
            {flag ? <tr>
              <td></td>
              <td>
                <div className="spinner-border" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
              </td>
            </tr> : null}
            {

              listData.map((item, index) => (
                <tr key={index}>
                  {/* <th scope="row">{index + 1}</th> */}
                  <td>{item.cantidad.toFixed(2)}</td>
                  <td>{item.descripcion}</td>
                  <td > <span className={`${  item.tipo === 1 ? 'bg-warning':'bg-success' } px-1`} style={{borderRadius:5}}>{item.tipo === 1 ? 'Egreso' : 'Ingreso'}</span></td>
                  <td>{item.fecha} {item.hora}</td>
                  <td><button onClick={e => eliminarEgreso(item.id, item.descripcion)} className="btn btn-danger bg-red btn-sm"><i className="fas fa-trash"></i></button>  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

      </div>
      {/* <div className="row">
        <div className="col-12 col-sm-8 mt-4 mt-md-0 order-1 order-md-2">
          <div className="mt-2 bg-light customTable">
            {flagTable ? <TableIngresos getDataIngresos={getDataIngresos} listIngresos2={listIngresos} /> : <TableEgresos getDataEgresos={getDataEgresos} calculo={calculo} listEgresos2={listEgresos} />}
          </div>
          <div className="bg-light d-flex justify-content-end pr-3 mt-2 mb-5 mb-md-0 w-100 h5">
            <strong className="pr-2"> Caja: </strong> Q {total}.00
          </div>
        </div>
      </div> */}
      <table className="table table-sm mx-2" style={{ fontSize: 13.5 }}>
        <tbody>
          <tr>
            <th className="d-flex justify-content-end">+ Total ingresos</th>
            <td>Q {sumaTotal.ingresosTotal.toFixed(2)}</td>
          </tr>
          <tr >
            <th className="d-flex justify-content-end">- Total egresos</th>
            <td>Q {sumaTotal.egresosTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <th className="d-flex justify-content-end">Saldo</th>
            <td>Q {sumaTotal.saldoTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
