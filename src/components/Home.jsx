import React, {useState, useEffect} from "react";
import AddData from "./AddData";
import TableEgresos from "./TableEgresos";
import TableIngresos from "./TableIngresos";
import { firedb } from "../firebaseConfig";

export default function Home() {
    
    useEffect(()=>{
        calculo()
    },[])

    const [flagTable, setFlagTable] = useState(false)
    const [listIngresos, setListIngresos] = useState([])
    const [listEgresos, setListEgresos] = useState([])
    const [total, setTotal] = useState(0)

    const formatoFecha =(fecha)=>{
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
        return f[2] + '-' +f[1] + '-' + f[0]
    }

    const calculo =async ()=>{
      const {docs} = await firedb.collection('totalCaja').get()
      const newArray = docs.map(item=>(
        {id:item.id,...item.data()}
        ))    
        
        setTotal(newArray[1].total - newArray[0].total )
    }

    const agregarData = (e)=>{
      if(e === true){
        getData()
        calculo()
      }else{
        getDataE()
        calculo()
      }
    }

    let suma = 0; 
    const getData = async()=>{
      // console.log('obteniendo data Ingresos');
      const {docs} = await firedb.collection('ingresos').orderBy("fecha","desc").get()
      const newArray = docs.map(item=>(
         {id:item.id,...item.data()}
       ))        
       
       newArray.forEach(val=>{
          suma +=  val.cantidad
          val.fecha =  formatoFecha(val.fecha)
        })
        
        await firedb.collection("totalCaja").doc('total_ingresos').set({"total":suma})

        setListIngresos(newArray)
    }

    const getDataE = async()=>{
      // console.log('Obteniendo data Egresos');
      const {docs} = await firedb.collection('egresos').orderBy("fecha","desc").get()
       const newArray = docs.map(item=>(
         {id:item.id,...item.data()}
       ))        
       

      
      newArray.forEach(val=>{
        suma +=  val.cantidad
        val.fecha =  formatoFecha(val.fecha)
      })
      
      await firedb.collection("totalCaja").doc('total_egresos').set({"total":suma})

      setListEgresos(newArray)
    }

    
    const seleccion = (e)=>{  
      if(e.target.value === 'Egreso'){
        setFlagTable(false)
      }else if(e.target.value === 'Ingreso'){
        setFlagTable(true)
      }
    }

    return (
    <div className="container">
      <div className="row mt-4">
        <div className="col-12 col-sm-4 mb-5 mb-sm-0 order-2 order-md-1">
          <AddData calculo={calculo} agregarData={agregarData}></AddData>
        </div>
        <div className="col-12 col-sm-8 mt-4 mt-md-0 order-1 order-md-2">
          <select onChange={e=>seleccion(e)} className="form-control bg-dark text-light" id="FormControlSelect1">
            <option> Seleccione una tabla...</option>
            <option >Ingreso</option>
            <option >Egreso</option>
          </select>
          <div className="mt-2 bg-light customTable">
              { flagTable ? <TableIngresos getData={getData}  listIngresos2={listIngresos}/>: <TableEgresos getDataE={getDataE} calculo={calculo}  listEgresos2={listEgresos}/>}
          </div>
          <div className="bg-light d-flex justify-content-end pr-3 mt-2 mb-5 mb-md-0 w-100 h5">
              <strong className="pr-2"> Caja: </strong> Q {total}.00
            </div>
        </div>
      </div>
    </div>
  );
}
