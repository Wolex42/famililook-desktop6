import{c as x}from"./chevron-left-D9ZhSLMb.js";import{r as l,j as t,_}from"./index-BwvGOR5n.js";/**
 * @license lucide-react v0.473.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],T=x("Camera",j);/**
 * @license lucide-react v0.473.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]],R=x("Check",k);/**
 * @license lucide-react v0.473.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]],P=x("Upload",C);/**
 * @license lucide-react v0.473.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],w=x("X",N),g=1024,E=.8;function v(h){return new Promise((p,i)=>{const n=new FileReader;n.onload=()=>{const o=new Image;o.onload=()=>{const c=document.createElement("canvas");let{width:r,height:a}=o;if(r>g||a>g){const m=Math.min(g/r,g/a);r=Math.round(r*m),a=Math.round(a*m)}c.width=r,c.height=a,c.getContext("2d").drawImage(o,0,0,r,a),p(c.toDataURL("image/jpeg",E))},o.onerror=i,o.src=n.result},n.onerror=i,n.readAsDataURL(h)})}const D=Object.freeze(Object.defineProperty({__proto__:null,fileToBase64:v},Symbol.toStringTag,{value:"Module"})),M=10*1024*1024,I=["image/jpeg","image/png","image/webp"];function U(){const[h,p]=l.useState(null),[i,n]=l.useState(null),[o,c]=l.useState(!1),r=l.useRef(null),a=l.useCallback(e=>e?I.includes(e.type)?e.size>M?"File must be under 10MB":null:"Please use JPEG, PNG, or WebP":"No file selected",[]),d=l.useCallback(async e=>{const s=a(e);if(s)return n(s),null;c(!0),n(null);try{const b=await v(e);return p(b),b}catch{return n("Failed to process image"),null}finally{c(!1)}},[a]),m=l.useCallback(e=>{const s=e.target.files?.[0];s&&d(s)},[d]),y=l.useCallback(e=>{e.preventDefault();const s=e.dataTransfer.files?.[0];s&&d(s)},[d]),u=l.useCallback(()=>{r.current?.click()},[]),f=l.useCallback(()=>{p(null),n(null),r.current&&(r.current.value="")},[]);return{photo:h,error:i,loading:o,inputRef:r,handleFile:d,handleInputChange:m,handleDrop:y,openFilePicker:u,clearPhoto:f}}function S({label:h,onPhotoReady:p,disabled:i}){const{photo:n,error:o,loading:c,inputRef:r,handleInputChange:a,handleDrop:d,openFilePicker:m,clearPhoto:y}=U();return t.jsxs("div",{className:"flex flex-col items-center gap-3",children:[h&&t.jsx("p",{className:"text-sm text-gray-400 font-medium",children:h}),n?t.jsxs("div",{className:"relative",children:[t.jsx("img",{src:n,alt:"Uploaded",className:"w-40 h-40 rounded-2xl object-cover border-2 border-primary/40"}),!i&&t.jsx("button",{onClick:()=>{y(),p?.(null)},className:"absolute -top-4 -right-4 bg-red-500 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-red-600",children:t.jsx(w,{size:18})})]}):t.jsx("div",{onDragOver:u=>u.preventDefault(),onDrop:u=>{d(u)},onClick:m,className:`w-40 h-40 rounded-2xl border-2 border-dashed border-gray-600
            flex flex-col items-center justify-center gap-2 cursor-pointer
            hover:border-primary/60 hover:bg-surface-light/50 transition-all
            ${i?"opacity-50 pointer-events-none":""}`,children:c?t.jsx("div",{className:"animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"}):t.jsxs(t.Fragment,{children:[t.jsx(P,{size:24,className:"text-gray-500"}),t.jsx("span",{className:"text-xs text-gray-500",children:"Drop or tap"})]})}),t.jsx("input",{ref:r,type:"file",accept:"image/jpeg,image/png,image/webp",className:"hidden",onChange:u=>{a(u);const f=u.target.files?.[0];f&&_(async()=>{const{fileToBase64:e}=await Promise.resolve().then(()=>D);return{fileToBase64:e}},void 0).then(({fileToBase64:e})=>e(f).then(s=>p?.(s)))},disabled:i}),o&&t.jsx("p",{className:"text-xs text-red-400",children:o})]})}export{R as C,S as P,T as a};
