(this["webpackJsonpreact-three"]=this["webpackJsonpreact-three"]||[]).push([[0],{135:function(e,t,a){e.exports=a(312)},139:function(e,t,a){},312:function(e,t,a){"use strict";a.r(t);var r=a(0),o=a.n(r),n=a(36),i=a.n(n),l=(a(139),a(53)),c=a(38),s=a(132),m=a(80),h=a(2),f=function(e){return Math.ceil(e/3)},u=function(e){var t=e.sizeX,a=e.sizeY,r=e.sizeZ,n=e.color,i=o.a.createElement("meshStandardMaterial",{attach:"material",color:n}),l=o.a.createElement("meshStandardMaterial",{attach:"material",color:n,transparent:"true",opacity:"0.3"}),c=function(e){var t=e.sizeX,a=e.sizeY,r=f(t),o=f(a);console.log({xSections:r,ySections:o});var n=t/r,i=a/o;return new Array(o).fill().flatMap((function(e,t){return new Array(r).fill().flatMap((function(e,a){return console.log({j:t,i:a}),{xSize:n-.125,ySize:i-.125,x:(a+1)*n-n/2,y:(t+1)*i-i/2,z:.125}}))}))}({sizeX:t,sizeY:a});console.log({madeHoles:c});var s=c.map((function(e){var t=e.xSize,a=e.ySize,o=e.x,n=e.y,i=e.z;console.log({xSize:t,ySize:a,x:o,y:n,z:i});var l=new h.Mesh(new h.BoxGeometry(t,a,r));return l.position.x=o,l.position.y=n,l.position.z=i,l}));console.log({holes:s});var u=new h.Mesh(new h.BoxGeometry(t+.125,a+.125,r));u.position.x=t/2,u.position.y=a/2;var p=new m.a(u),g=s.reduce((function(e,t){return e.subtract(new m.a(t))}),p).toGeometry();return o.a.createElement("group",{"position-y":.0625},o.a.createElement("mesh",{castShadow:!0,receiveShadow:!1,geometry:g},i),o.a.createElement("mesh",{castShadow:!1,receiveShadow:!0,geometry:g},l))};u.defaultProps={color:"#ffffff"};var p=u,g=function(e){e.sizeX;var t=e.sizeY,a=(e.sizeZ,e.color),r=e.orientation,n=o.a.createElement("meshLambertMaterial",{attach:"material",color:a}),i=o.a.createElement("meshLambertMaterial",{attach:"material",color:a,transparent:!0,opacity:.2}),l="floor"===r?{"rotation-x":-Math.PI/2,"position-y":-.05}:{"rotation-x":0,"position-z":-1.05,"position-y":3};return o.a.createElement("group",null,o.a.createElement("mesh",Object.assign({},l,{receiveShadow:!0}),o.a.createElement("planeBufferGeometry",{attach:"geometry",args:[30,5*(t+1)]}),i),o.a.createElement("mesh",Object.assign({},l,{receiveShadow:!1,castShadow:!0}),o.a.createElement("planeBufferGeometry",{attach:"geometry",args:[30,5*(t+1)]}),n))};g.defaultProps={color:"#ffffff",orientation:"floor"};var d=g,w=function(e){return o.a.createElement(d,Object.assign({},e,{orientation:"wall"}))},y=function(e){var t=e.color,a=Object(s.a)(e,["color"]),r=a.sizeY;return o.a.createElement(o.a.Fragment,null,o.a.createElement("group",{"position-y":r/2},o.a.createElement(p,Object(l.a)({},a,{color:t}))),o.a.createElement(w,a),o.a.createElement(d,a))},z=a(123);Object(c.b)({OrbitControls:z.a,GridHelper:h.GridHelper,AxesHelper:h.AxesHelper});var E=function(e){e.sizeX,e.sizeY;var t=e.sizeZ,a=Object(c.c)(),r=a.camera,n=a.gl;return o.a.createElement(o.a.Fragment,null,o.a.createElement("orbitControls",{args:[r,n.domElement],target:[0,2,0],maxAzimuthAngle:Math.PI/2,minAzimuthAngle:-Math.PI/2,maxPolarAngle:Math.PI/2,minPolarAngle:-Math.PI/2,maxDistance:6*t,minDistance:2*t}))},b=a(40),v={"\u0411\u0435\u043b\u044b\u0439":"#ffffff","\u0427\u0435\u0440\u043d\u044b\u0439":"#333333","\u0421\u043e\u0441\u043d\u0430":"#fcd0aa"},S=function(){var e=Object(b.b)("\u0428\u0438\u0440\u0438\u043d\u0430",{type:"number",value:5,min:3,max:9}),t=Object(b.b)("\u0412\u044b\u0441\u043e\u0442\u0430",{type:"number",value:3,min:3,max:6}),a=Object(b.b)("\u041c\u0430\u0442\u0435\u0440\u0438\u0430\u043b",{type:"select",items:Object.keys(v)}),r=v[a],n={sizeX:e,sizeY:t,sizeZ:2};return o.a.createElement(o.a.Fragment,null,o.a.createElement(c.a,{gl:{antialias:!0,alpha:!1},camera:{position:[e/2,t+3,5]},onCreated:function(e){console.log({args:e});var t=e.gl;t.setClearColor(new h.Color("#ffffff")),t.shadowMap.enabled=!0,t.shadowMap.type=h.PCFSoftShadowMap}},o.a.createElement("ambientLight",{intensity:.3}),o.a.createElement("pointLight",{args:[16777215,.5],position:[-e/2-2,7,10],castShadow:!0,"shadow-mapSize-width":1024,"shadow-mapSize-height":1024}),o.a.createElement("pointLight",{args:[16777215,.5],position:[e/2+2,7,10],castShadow:!0,"shadow-mapSize-width":1024,"shadow-mapSize-height":1024}),o.a.createElement(y,Object(l.a)({},n,{color:r})),o.a.createElement(E,n)),o.a.createElement(b.a,null))};Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(o.a.createElement(S,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[135,1,2]]]);
//# sourceMappingURL=main.b27d69d5.chunk.js.map