(this.webpackJsonpadmincuentas=this.webpackJsonpadmincuentas||[]).push([[0],{27:function(e,t,c){},39:function(e,t,c){},40:function(e,t,c){},51:function(e,t,c){"use strict";c.r(t);var a=c(2),n=c.n(a),r=c(31),s=c.n(r),o=(c(39),c(40),c(10)),i=c(21),l=(c(27),c(6)),j=c(1);function d(){var e=Object(a.useState)(""),t=Object(o.a)(e,2),c=t[0],n=t[1],r=Object(l.f)();Object(a.useEffect)((function(){var e=localStorage.getItem("currentId");n(e)}),[]);return Object(j.jsxs)("div",{children:[Object(j.jsx)("nav",{className:"navbar navbar-dark bg-blue mb-0 pb-0 py-3",children:Object(j.jsx)("div",{className:"container",children:Object(j.jsxs)(i.b,{className:"navbar-brand d-flex justify-content-between w-100",children:[Object(j.jsxs)("div",{children:[Object(j.jsx)("i",{className:"fas fa-calculator mr-2"}),"AdminCuentas"]}),Object(j.jsxs)("div",{className:c?"d-flexx":"d-none",onClick:function(e){return localStorage.setItem("currentId",""),n(""),void r.push("/")},children:[Object(j.jsx)("i",{className:"fas fa-sign-out text-light mr-2"}),"Salir"]})]})})}),Object(j.jsx)("div",{className:"menu"})]})}var u=c(4),b=c.n(u),h=c(7),f=c(11),O=c(33),m=(c(47),c(53),c(52),O.a.initializeApp({apiKey:"AIzaSyCF-z2ZrX_tkqsmkUfHhLkEYsMuYDBTtiE",authDomain:"adminhome-36c6e.firebaseapp.com",projectId:"adminhome-36c6e",storageBucket:"adminhome-36c6e.appspot.com",messagingSenderId:"450868120054",appId:"1:450868120054:web:527d8ee64f78be64105fd7",rules:{".read":"auth != null",".write":"auth != null"}})),x=(m.auth(),m.firestore());m.storage().ref();var p=function(){var e=Object(a.useState)(""),t=Object(o.a)(e,2),c=t[0],n=t[1],r=Object(a.useState)("toralla"),s=Object(o.a)(r,2),i=s[0],d=s[1],u=Object(a.useState)(null),O=Object(o.a)(u,2),m=O[0],p=O[1],g=Object(a.useState)([]),v=Object(o.a)(g,2),N=v[0],w=v[1],k=Object(l.f)();Object(a.useEffect)((function(){y()}),[]);var y=function(){var e=Object(f.a)(b.a.mark((function e(){var t,c,a;return b.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,x.collection("users").get();case 2:t=e.sent,c=t.docs,a=c.map((function(e){return Object(h.a)({id:e.id},e.data())})),w(a);case 6:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}(),S=function(){var e=Object(f.a)(b.a.mark((function e(t){return b.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:t.preventDefault(),N.forEach((function(e){c.trim()===e.user&&i.trim()===e.pass?(k.push("/home"),localStorage.setItem("currentId",e.id),window.location.reload()):p("Usuario o contrase\xf1a incorrecta.")}));case 2:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}();return Object(j.jsx)("div",{children:Object(j.jsx)("div",{className:"container",children:Object(j.jsx)("div",{className:"row justify-content-center align-items-center mt-5",children:Object(j.jsxs)("div",{className:"col-sm-12 col-md-4 shadow p-5 bg-light rounded-lg m-4 m-sm-0",children:[Object(j.jsxs)("form",{onSubmit:function(e){return S(e)},children:[Object(j.jsxs)("div",{className:"form-group",children:[Object(j.jsxs)("label",{children:[Object(j.jsx)("i",{className:"fas fa-user mr-2"}),"Usuario"]}),Object(j.jsx)("input",{onChange:function(e){return n(e.target.value)},value:c,className:"form-control",type:"text",placeholder:"Email..."})]}),Object(j.jsxs)("div",{className:"form-group",children:[Object(j.jsxs)("label",{children:[Object(j.jsx)("i",{className:"fas fa-key mr-2"}),"Contrase\xf1a"]}),Object(j.jsx)("input",{onChange:function(e){return d(e.target.value)},value:i,className:"form-control",type:"password",dplaceholder:"Contrase\xf1a..."})]}),Object(j.jsx)("button",{className:"btn btn-dark bg-blue btn-block mt-4",children:"Ingresar"})]}),null!=m?Object(j.jsx)("div",{className:"alert alert-danger mt-2",role:"alert",children:m}):Object(j.jsx)("span",{})]})})})})},g=c(18),v=c.n(g);function N(e){var t=function(){var e=new Date;return e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()},c={cantidad:0,fecha:"",hora:t(),descripcion:""},n={cantidad:0,fecha:"",hora:t(),descripcion:""},r=Object(a.useState)([]),s=Object(o.a)(r,2),i=(s[0],s[1]),l=Object(a.useState)(c),d=Object(o.a)(l,2),u=d[0],O=d[1],m=Object(a.useState)(n),p=Object(o.a)(m,2),g=p[0],N=p[1],w=Object(a.useState)(""),k=Object(o.a)(w,2),y=k[0],S=k[1];Object(a.useEffect)((function(){I();var e=localStorage.getItem("currentId");S(e)}),[]);var I=function(){var e=Object(f.a)(b.a.mark((function e(){var t,c,a;return b.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return console.log("Data de inquilinos"),e.next=3,x.collection("inquilinos").get();case 3:t=e.sent,c=t.docs,a=c.map((function(e){return Object(h.a)({id:e.id},e.data())})),i(a);case 7:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}(),E=function(){var t=Object(f.a)(b.a.mark((function t(a){return b.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return a.preventDefault(),t.next=3,x.collection("ingresos-".concat(y)).add(u).then((function(t){e.calculo(),v()({title:"Agregado correctamente",icon:"success",timer:1e3}),O(c)})).catch((function(e){return console.log(e)}));case 3:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}(),C=function(){var t=Object(f.a)(b.a.mark((function t(c){return b.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return c.preventDefault(),t.next=3,x.collection("egresos-".concat(y)).add(g).then(function(){var t=Object(f.a)(b.a.mark((function t(c){return b.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:e.calculo(),v()({title:"Agregado correctamente",icon:"success",timer:1e3}),N(n);case 3:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}()).catch((function(e){return console.log(e)}));case 3:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}();return Object(j.jsxs)("div",{className:"w-100",children:[Object(j.jsxs)("form",{onSubmit:function(e){return C(e)},className:"w-100  bg-yellow p-2",children:[Object(j.jsxs)("div",{className:"row",children:[Object(j.jsx)("div",{className:"col p-0",children:Object(j.jsxs)("div",{className:"form-group ml-3",children:[Object(j.jsxs)("label",{children:[Object(j.jsxs)("strong",{children:[" ",Object(j.jsx)("i",{class:"fas fa-money-bill-alt"})," Egreso:"]})," "]}),Object(j.jsx)("input",{className:"form-control",type:"number",onChange:function(e){return N(Object(h.a)(Object(h.a)({},g),{},{cantidad:Number(e.target.value)}))},value:g.cantidad})]})}),Object(j.jsx)("div",{className:"col",children:Object(j.jsxs)("div",{className:"form-group",children:[Object(j.jsxs)("label",{children:[" ",Object(j.jsxs)("strong",{children:[Object(j.jsx)("i",{class:"fas fa-calendar-day"})," Fecha:"]})," "]}),Object(j.jsx)("input",{className:"form-control",type:"date",name:"",id:"",onChange:function(e){return N(Object(h.a)(Object(h.a)({},g),{},{fecha:e.target.value}))},value:g.fecha})]})})]}),Object(j.jsxs)("div",{className:"form-group",children:[Object(j.jsxs)("label",{children:[Object(j.jsx)("strong",{children:" Descripci\xf3n:"})," "]}),Object(j.jsx)("input",{className:"form-control",type:"text",id:"",onChange:function(e){return N(Object(h.a)(Object(h.a)({},g),{},{descripcion:e.target.value}))},value:g.descripcion})]}),Object(j.jsxs)("button",{className:" w-100 btn bg-blue text-light d-block",onClick:function(t){e.agregarData(!1)},children:[Object(j.jsx)("i",{className:"fas fa-check mr-2"}),"  Agregar"]})]}),Object(j.jsxs)("form",{onSubmit:function(e){return E(e)},className:"w-100 bg-green mt-3 p-2 border",children:[Object(j.jsxs)("div",{className:"row",children:[Object(j.jsx)("div",{className:"col p-0",children:Object(j.jsxs)("div",{className:"form-group ml-3",children:[Object(j.jsxs)("label",{children:[Object(j.jsxs)("strong",{children:[" ",Object(j.jsx)("i",{class:"fas fa-money-bill-alt"})," Ingreso:"]})," "]}),Object(j.jsx)("input",{onChange:function(e){return O(Object(h.a)(Object(h.a)({},u),{},{cantidad:Number(e.target.value)}))},value:u.cantidad,className:"form-control",min:"0",type:"number",id:""})]})}),Object(j.jsx)("div",{className:"col",children:Object(j.jsxs)("div",{className:"form-group",children:[Object(j.jsxs)("label",{children:[" ",Object(j.jsxs)("strong",{children:[Object(j.jsx)("i",{class:"fas fa-calendar-day"})," Fecha:"]})]}),Object(j.jsx)("input",{onChange:function(e){return O(Object(h.a)(Object(h.a)({},u),{},{fecha:e.target.value}))},value:u.fecha,className:"form-control",type:"date",name:"",id:""})]})})]}),Object(j.jsxs)("div",{className:"form-group",children:[Object(j.jsxs)("label",{children:[Object(j.jsx)("strong",{children:" Descripci\xf3n:"})," "]}),Object(j.jsx)("input",{className:"form-control",type:"text",id:"",onChange:function(e){return O(Object(h.a)(Object(h.a)({},u),{},{descripcion:e.target.value}))},value:u.inquilino})]}),Object(j.jsxs)("button",{onClick:function(t){e.agregarData(!0)},className:" w-100 btn bg-blue text-light d-block",children:[Object(j.jsx)("i",{className:"fas fa-check mr-2"})," Agregar"]})]})]})}function w(e){Object(a.useEffect)((function(){e.getDataE()}),[]);var t=function(){var t=Object(f.a)(b.a.mark((function t(c){var a;return b.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return a=localStorage.getItem("currentId"),t.next=3,x.collection("egresos-".concat(a)).doc(c).delete().then((function(t){e.getDataE(),v()({title:"Eliminado correctamente",icon:"success",timer:1e3})})).catch((function(e){return console.log(e)}));case 3:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}();return Object(j.jsxs)("div",{className:"",children:[Object(j.jsx)("h5",{className:"text-center w-100 d-block py-1 bg-yellow text-dark",children:Object(j.jsx)("strong",{children:"Egresos"})}),Object(j.jsxs)("table",{className:"table table-hover table-striped",children:[Object(j.jsx)("thead",{className:"",children:Object(j.jsxs)("tr",{children:[Object(j.jsx)("th",{scope:"col",children:"#"}),Object(j.jsx)("th",{scope:"col",children:"Cantidad"}),Object(j.jsx)("th",{scope:"col",children:"Descripci\xf3n"}),Object(j.jsx)("th",{scope:"col",children:"Fecha"}),Object(j.jsx)("th",{scope:"col",children:"Hora"}),Object(j.jsx)("th",{scope:"col",children:"Eliminar"})]})}),Object(j.jsx)("tbody",{children:e.listEgresos2.map((function(e,c){return Object(j.jsxs)("tr",{children:[Object(j.jsx)("th",{scope:"row",children:c+1}),Object(j.jsxs)("td",{children:[" Q ",e.cantidad]}),Object(j.jsx)("td",{children:e.descripcion}),Object(j.jsx)("td",{children:e.fecha}),Object(j.jsx)("td",{children:e.hora}),Object(j.jsxs)("td",{children:[Object(j.jsx)("button",{onClick:function(c){return t(e.id)},className:"btn btn-danger bg-red",children:Object(j.jsx)("i",{className:"fas fa-trash"})}),"  "]})]},c)}))})]})]})}function k(e){Object(a.useEffect)((function(){e.getData()}),[]);var t=function(){var t=Object(f.a)(b.a.mark((function t(c){var a;return b.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return a=localStorage.getItem("currentId"),t.next=3,x.collection("ingresos-".concat(a)).doc(c).delete().then((function(t){e.getData(),v()({title:"Eliminado correctamente",icon:"success",timer:1e3})})).catch((function(e){return console.log(e)}));case 3:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}();return Object(j.jsxs)("div",{className:"",children:[Object(j.jsx)("h5",{className:"text-center w-100 d-block py-1 bg-green text-dark",children:Object(j.jsx)("strong",{children:"Ingresos"})}),Object(j.jsxs)("table",{className:"table table-hover table-striped",children:[Object(j.jsx)("thead",{className:"",children:Object(j.jsxs)("tr",{children:[Object(j.jsx)("th",{scope:"col",children:"#"}),Object(j.jsx)("th",{scope:"col",children:"Cantidad"}),Object(j.jsx)("th",{scope:"col",children:"Descripci\xf3n"}),Object(j.jsx)("th",{scope:"col",children:"Fecha"}),Object(j.jsx)("th",{scope:"col",children:"Hora"}),Object(j.jsx)("th",{scope:"col",children:"Eliminar"})]})}),Object(j.jsx)("tbody",{children:e.listIngresos2.map((function(e,c){return Object(j.jsxs)("tr",{children:[Object(j.jsx)("th",{scope:"row",children:c+1}),Object(j.jsxs)("td",{children:[" Q ",e.cantidad]}),Object(j.jsx)("td",{children:e.descripcion}),Object(j.jsx)("td",{children:e.fecha}),Object(j.jsx)("td",{children:e.hora}),Object(j.jsx)("td",{children:Object(j.jsx)("button",{onClick:function(c){return t(e.id)},className:"btn btn-danger bg-red",children:Object(j.jsx)("i",{className:"fas fa-trash"})})})]},c)}))})]})]})}function y(){Object(a.useEffect)((function(){localStorage.getItem("currentId")&&S()}),[]);var e=Object(a.useState)(!1),t=Object(o.a)(e,2),c=t[0],n=t[1],r=Object(a.useState)([]),s=Object(o.a)(r,2),i=s[0],l=s[1],d=Object(a.useState)([]),u=Object(o.a)(d,2),O=u[0],m=u[1],p=Object(a.useState)(0),g=Object(o.a)(p,2),v=g[0],y=g[1],S=function(){var e=Object(f.a)(b.a.mark((function e(){var t,c,a,n;return b.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,localStorage.getItem("currentId");case 2:return t=e.sent,e.next=5,x.collection("totalCaja-".concat(t)).get();case 5:c=e.sent,a=c.docs,n=a.map((function(e){return Object(h.a)({id:e.id},e.data())})),y(n[1].total-n[0].total);case 9:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}(),I=function(e){var t=e.split("-");switch(t[1]){case"01":t[1]="Ene";break;case"02":t[1]="Feb";break;case"03":t[1]="Mar";break;case"04":t[1]="Abr";break;case"05":t[1]="May";break;case"06":t[1]="Jun";break;case"07":t[1]="Jul";break;case"08":t[1]="Ago";break;case"09":t[1]="Sep";break;case"10":t[1]="Oct";break;case"11":t[1]="Nov";break;case"12":t[1]="Dic"}return t[2]+"-"+t[1]+"-"+t[0]},E=0,C=function(){var e=Object(f.a)(b.a.mark((function e(){var t,c,a,n;return b.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return console.log("obteniendo data Ingresos"),t=localStorage.getItem("currentId"),e.next=4,x.collection("ingresos-".concat(t)).orderBy("fecha","desc").get();case 4:return c=e.sent,a=c.docs,(n=a.map((function(e){return Object(h.a)({id:e.id},e.data())}))).forEach((function(e){E+=e.cantidad,e.fecha=I(e.fecha)})),e.next=10,x.collection("totalCaja-".concat(t)).doc("total_ingresos-".concat(t)).set({total:E});case 10:l(n);case 11:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}(),D=function(){var e=Object(f.a)(b.a.mark((function e(){var t,c,a,n;return b.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return t=localStorage.getItem("currentId"),e.next=3,x.collection("egresos-".concat(t)).orderBy("fecha","desc").get();case 3:return c=e.sent,a=c.docs,(n=a.map((function(e){return Object(h.a)({id:e.id},e.data())}))).forEach((function(e){E+=e.cantidad,e.fecha=I(e.fecha)})),e.next=9,x.collection("totalCaja-".concat(t)).doc("total_egresos-".concat(t)).set({total:E});case 9:m(n);case 10:case"end":return e.stop()}}),e)})));return function(){return e.apply(this,arguments)}}();return Object(j.jsx)("div",{className:"container",children:Object(j.jsxs)("div",{className:"row mt-4",children:[Object(j.jsx)("div",{className:"col-12 col-sm-4 mb-5 mb-sm-0 order-2 order-md-1",children:Object(j.jsx)(N,{calculo:S,agregarData:function(e){e?(C(),S()):(D(),S())}})}),Object(j.jsxs)("div",{className:"col-12 col-sm-8 mt-4 mt-md-0 order-1 order-md-2",children:[Object(j.jsxs)("select",{onChange:function(e){return function(e){"Egreso"===e.target.value?n(!1):"Ingreso"===e.target.value&&n(!0)}(e)},className:"form-control bg-blue text-light",id:"FormControlSelect1",children:[Object(j.jsx)("option",{children:" Seleccione una tabla..."}),Object(j.jsx)("option",{children:"Ingreso"}),Object(j.jsx)("option",{children:"Egreso"})]}),Object(j.jsx)("div",{className:"mt-2 bg-light customTable",children:c?Object(j.jsx)(k,{getData:C,listIngresos2:i}):Object(j.jsx)(w,{getDataE:D,calculo:S,listEgresos2:O})}),Object(j.jsxs)("div",{className:"bg-light d-flex justify-content-end pr-3 mt-2 mb-5 mb-md-0 w-100 h5",children:[Object(j.jsx)("strong",{className:"pr-2",children:" Caja: "})," Q ",v,".00"]})]})]})})}var S=function(){return Object(j.jsx)("div",{className:"fondo",children:Object(j.jsxs)(i.a,{children:[Object(j.jsx)(d,{}),Object(j.jsxs)(l.c,{children:[Object(j.jsxs)(l.a,{path:"/home",children:[" ",Object(j.jsx)(y,{})," "]}),Object(j.jsx)(l.a,{path:"/",children:Object(j.jsx)(p,{})})]})]})})};c(50);s.a.render(Object(j.jsx)(n.a.StrictMode,{children:Object(j.jsx)(S,{})}),document.getElementById("root"))}},[[51,1,2]]]);
//# sourceMappingURL=main.0311f0ef.chunk.js.map