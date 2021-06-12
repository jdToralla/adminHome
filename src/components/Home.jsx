import React, { useState, useEffect } from "react";
import AddData from "./AddData";
import TableEgresos from "./TableEgresos";
import TableIngresos from "./TableIngresos";
import { firedb } from "../firebaseConfig";

export default function Home() {

  useEffect(() => {
    let idUser = localStorage.getItem('currentId')
    if (idUser) {
      calculo()
    }

  }, [])

  const [flagTable, setFlagTable] = useState(false)
  const [listIngresos, setListIngresos] = useState([])
  const [listIngresosTmp, setListIngresosTmp] = useState([])
  const [listEgresos, setListEgresos] = useState([])
  const [listEgresosTmp, setListEgresosTmp] = useState([])
  const [total, setTotal] = useState(0)

  const calculo = async () => {

    let idUser2 = await localStorage.getItem('currentId')
    const { docs } = await firedb.collection(`totalCaja-${idUser2}`).get()
    const newArray = docs.map(item => (
      { id: item.id, ...item.data() }
    ))

    setTotal(newArray[1].total - newArray[0].total)
  }

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

  const agregarData = (e) => {

    if (e) {
      getDataIngresos()
      calculo()
    } else {
      getDataEgresos()
      calculo()
    }
  }

  let suma = 0;
  const getDataIngresos = async () => {
    console.log('obteniendo data Ingresos');
    let idUser = localStorage.getItem('currentId')

    // const {docs} = await firedb.collection(`ingresos`).orderBy("fecha","desc").get()
    const { docs } = await firedb.collection(`ingresos-${idUser}`).orderBy("fecha", "desc").get()

    const newArray = docs.map(item => (
      { id: item.id, ...item.data() }
    ))
    console.log(newArray);

    newArray.forEach(val => {
      suma += val.cantidad
      val.fecha = formatoFecha(val.fecha)
    })

    await firedb.collection(`totalCaja-${idUser}`).doc(`total_ingresos-${idUser}`).set({ "total": suma })

    setListIngresos(newArray)
    setListIngresosTmp(newArray)
  }

  const getDataEgresos = async () => {
    console.log('Entro a obtener data egreso');
    let idUser = localStorage.getItem('currentId')
    console.log('id usuario:', idUser);
    const { docs } = await firedb.collection(`egresos-${idUser}`).orderBy("fecha", "desc").get()
    // const {docs} = await firedb.collection(`egresos`).orderBy("fecha","desc").get()
    const newArray = docs.map(item => (
      { id: item.id, ...item.data() }
    ))

    console.log(newArray);

    newArray.forEach(val => {
      suma += val.cantidad
      val.fecha = formatoFecha(val.fecha)
    })

    await firedb.collection(`totalCaja-${idUser}`).doc(`total_egresos-${idUser}`).set({ "total": suma })

    setListEgresos(newArray)
    setListEgresosTmp(newArray)
  }


  const seleccion = (e) => {
    console.log(e.target.value);

    if (e.target.value === 'Egreso') {
      console.log('Entre aqui');
      // console.log(listEgresosTmp);
      setListEgresos(listEgresosTmp)
      // if(listEgresos.length > 0){
      //   // getDataEgresos()
      // }
      setFlagTable(false)
    } else if (e.target.value === 'Ingreso') {
      setFlagTable(true)
    }
  }

  const agregar = () => {
    console.log('Click', listEgresos);
    listEgresos.forEach(val => {

      let data = {
        cantidad: val.cantidad,
        fecha: val.fecha,
        hora: val.hora,
        descripcion: val.descripcion,
        idUser: 2
      }
      console.log(data);

      // let data ={
      //   ...val,
      //   idUser: 2,
      //   // descripcion: val.inquilino
      // }

      firedb
        .collection(`egresos-2`)
        .add(data)
        .then((r) => {

          console.log('Listo');
        })
        .catch((e) => console.log(e));
    })
  }

  const searchByDate = async (date) => {
    if(date){
      console.log(date);
    let idUser = localStorage.getItem('currentId')
    const { docs } = await firedb.collection(`egresos-${idUser}`).where("fecha", "==", `${date}`).get()
    const newArray = docs.map(item => (
      { id: item.id, ...item.data() }
    ))

    console.log(newArray);

    newArray.forEach(val => {
      suma += val.cantidad
      val.fecha = formatoFecha(val.fecha)
    })

    // await firedb.collection(`totalCaja-${idUser}`).doc(`total_egresos-${idUser}`).set({"total":suma})
    setListEgresos(newArray)
    }else{
      if(flagTable === false){
        setListEgresos(listEgresosTmp)
      }else if(flagTable === true){
        setListEgresos(listIngresosTmp)
      }
    }

  }


  return (
    <div className="container mt-5 pt-3">
      {/* <div>
        <button className="btn btn-primary" onClick={e=> agregar()}>add </button>
      </div> */}
      <div className="row mt-4">
        {/* <input className="form-control col-6 mx-2" type="text" placeholder="Bucar por descripcion..."/>
        <input onChange={(e) => searchByDate(e.target.value)}  className="form-control col-5 ml-2" type="date" /> */}
        <div className="input-group mb-3 col-12 col-sm-6">
          <div className="input-group-prepend">
            <span className="input-group-text" id="basic-addon1"><i className="fas fa-search"></i></span>
          </div>
          <input onChange={(e) => searchByDate(e.target.value)}  className="form-control" type="date" />
        </div>
        <div className="input-group mb-0 mb-sm-3 col-12 col-sm-6">
          <div className="input-group-prepend">
            <span className="input-group-text" id="basic-addon1"><i className="fas fa-search"></i></span>
          </div>
          <input className="form-control" type="text" placeholder="Bucar por descripcion..."/>
        </div>
      </div>
      <div className="row mt-2">
        <div className="col-12 col-sm-4 mb-5 mb-sm-0 order-2 order-md-1">
          <AddData calculo={calculo} agregarData={agregarData}></AddData>
        </div>
        <div className="col-12 col-sm-8 mt-4 mt-md-0 order-1 order-md-2">
          <select onClick={e => seleccion(e)} onChange={e => seleccion(e)} className="form-control bg-blue text-light" id="FormControlSelect1">
            <option> Seleccione una tabla...</option>
            <option>Ingreso</option>
            <option>Egreso</option>
          </select>
          <div className="mt-2 bg-light customTable">
            {flagTable ? <TableIngresos getDataIngresos={getDataIngresos} listIngresos2={listIngresos} /> : <TableEgresos getDataEgresos={getDataEgresos} calculo={calculo} listEgresos2={listEgresos} />}
          </div>
          <div className="bg-light d-flex justify-content-end pr-3 mt-2 mb-5 mb-md-0 w-100 h5">
            <strong className="pr-2"> Caja: </strong> Q {total}.00
            </div>
        </div>
      </div>
    </div>
  );
}
