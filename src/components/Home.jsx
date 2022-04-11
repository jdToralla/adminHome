import { useEffect, useState } from "react";
import { Button, Modal } from 'react-bootstrap';
import { useHistory } from 'react-router-dom';
import * as _swal from 'sweetalert';
import { firedb } from "../firebaseConfig";

let calculoTotal = {
  egresosTotal: 0,
  ingresosTotal: 0,
  saldoTotal: 0
};

const dataE = {
  id: '',
  cantidad: '',
  descripcion: '',
  newDescripcion: '',
  tipo: '',
  fecha: ''
}

export default function Home() {


  const historial = useHistory()
  useEffect(() => {
    getData()
  }, [])

  const [flag, setFlag] = useState(false)
  const [listData, setListData] = useState([])
  const [sumaTotal, setSumaTotal] = useState(calculoTotal)
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const [dataEdit, setDataEdit] = useState(dataE)

  const getData = async () => {
    setFlag(true)

    let idUser = localStorage.getItem('currentId')
    const { docs } = await firedb.collection(`caja-chica`).where("idUser", "==", parseInt(idUser)).orderBy("fecha", "desc").get()
    const newArray = docs.map(item => (
      { id: item.id, ...item.data() }
    ))
    newArray.map(v => {
      return v.fecha = dataFormate(v.fecha)
    })

    setFlag(false)
    setListData(newArray)
    calculate(newArray)

  }

  const dataFormate = (date) => {
    let d = date.split('-')
    return `${d[2]}/${d[1]}/${d[0]}`
  }


  const seleccion = async (e) => {
    setListData([])
    setFlag(true)
    if (e.target.value === 'Egreso') {

      const { docs } = await firedb.collection(`caja-chica`).where("idUser", "==", parseInt(localStorage.getItem('currentId'))).where("tipo", "==", 1).get()
      const newArray = docs.map(item => (
        { id: item.id, ...item.data() }
      ))
      setListData(newArray)
      setFlag(false)

    } else if (e.target.value === 'Ingreso') {

      const { docs } = await firedb.collection(`caja-chica`).where("idUser", "==", parseInt(localStorage.getItem('currentId'))).where("tipo", "==", 2).get()
      const newArray = docs.map(item => (
        { id: item.id, ...item.data() }
      ))
      setListData(newArray)
      setFlag(false)
    } else {
      getData()
    }

  }


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

  const handleShow = (id, item) => {
    console.log('Abrir', id, item);
    setDataEdit(item)
    setShow(true);
  }

  const saveEditRecord = () => {
    _swal({
      title: '¿Desea editar el registro?',
      icon: 'info',
      buttons: ["Cancelar", "Si, editar"]
    }).then(async (result) => {
      if (result) {
        console.log('Data edit: ', dataEdit);

        setShow(false)
        await firedb.collection('caja-chica').doc(dataEdit.id).update({
          descripcion: dataEdit.newDescripcion
        }).catch(e => console.log(e))
        getData()
      }
    })

  }


  // const columns = [
  //   {
  //     name: 'Cantidad',
  //     selector: row => row.cantidad,
  //     sortable: true,
  //   },
  //   {
  //     name: 'Descripción',
  //     selector: row => row.descripcion,
  //     sortable: true,
  //   },
  //   {
  //     name: 'Fecha',
  //     selector: row => row.fecha,
  //     sortable: true,
  //   },
  //   {
  //     name: 'Tipo',
  //     selector: row => row.tipo,
  //     sortable: true,
  //   },
  //   {
  //     name: 'Descripción',
  //     selector: row => row.descripcion,
  //     sortable: true,
  //     button: true,
  //     icon: 'pencil'
  //   },
  // ];


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
            <input onChange={(e) => searchByDate(e.target.value)} className="form-control" type="date" placeholder="dd/mm/aaaa" style={{ fontSize: 10, height: '100%' }} />
          </div>
          {/* <div className="input-group col-7 px-1">
            <div className="input-group-prepend">
              <span className="input-group-text" id="basic-addon1"><i className="fas fa-search"></i></span>
            </div>
            <input className="form-control" type="text" placeholder="Buscar..." style={{ zIndex: 0 }} />
          </div> */}
          <div className="col-12 px-1 mt-2">
            <select onChange={e => seleccion(e)} className="form-control" id="FormControlSelect1" style={{ fontSize: 10, height: '100%' }}>
              <option>Todos</option>
              <option>Ingreso</option>
              <option>Egreso</option>
            </select>
          </div>
        </div>
      </div>
      <div className="row mt-2" style={{ maxHeight: '47vh', overflow: 'auto' }}>
        <table className="table table-sm bg-light mx-2 text-center" style={{ fontSize: 13.5 }}>
          <thead className="">
            <tr>
              {/* <th scope="col">#</th> */}
              <th scope="col">Cantidad</th>
              <th scope="col">Descripción</th>
              <th scope="col">Tipo</th>
              <th scope="col">Fecha</th>
              <th scope="col"></th>
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
                  <td > <span className={`${item.tipo === 1 ? 'bg-warning' : 'bg-success'} px-1`} style={{ borderRadius: 5 }}>{item.tipo === 1 ? 'Egreso' : 'Ingreso'}</span></td>
                  <td>{item.fecha} {item.hora}</td>
                  <td><button onClick={e => eliminarEgreso(item.id, item.descripcion)} className="btn btn-danger btn-sm"><i className="fas fa-trash"></i></button>  </td>
                  <td><button onClick={e => handleShow(item.id, item)} className="btn btn-warning btn-sm"><i className="fas fa-pencil"></i></button>  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

      </div>
      {/* <div>
        <DataTable
          columns={columns}
          data={listData}
          fixedHeader
        />

      </div> */}

      {/* <Button variant="primary" onClick={handleShow}>
        Launch demo modal
      </Button> */}

      <Modal show={show} onHide={handleClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar registro</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="form-group">
            <label htmlFor="description"><b>Descripción:</b> {dataEdit.descripcion}</label>
            <textarea placeholder="Escriba la nueva descripcion" onChange={e => setDataEdit({ ...dataEdit, newDescripcion: e.target.value })} type="email"  className="form-control mt-2" id="description" aria-describedby="emailHelp" />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            <i className="fas fa-times mr-2"></i>
            Cancelar
          </Button>
          <Button variant="primary" onClick={saveEditRecord}>
            <i className="fas fa-check mr-2"></i>
            Guardar cambios
          </Button>
        </Modal.Footer>
      </Modal>

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
