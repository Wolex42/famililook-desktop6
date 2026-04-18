import{c as p,r as a,j as e}from"./index-RlVPvNmR.js";/**
 * @license lucide-react v0.473.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]],j=p("Camera",y);/**
 * @license lucide-react v0.473.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],C=p("RefreshCw",k);function w({label:r,onPhotoReady:i}){const[d,x]=a.useState(null),[n,o]=a.useState(!1),l=a.useRef(null),c=a.useCallback(t=>{if(!t||!t.type.startsWith("image/"))return;const s=new FileReader;s.onload=b=>{const h=b.target.result;x(h),i(h)},s.readAsDataURL(t)},[i]),u=a.useCallback(t=>{const s=t.target.files?.[0];s&&c(s)},[c]),f=a.useCallback(t=>{t.preventDefault(),o(!1);const s=t.dataTransfer.files?.[0];s&&c(s)},[c]),g=a.useCallback(t=>{t.preventDefault(),o(!0)},[]),m=a.useCallback(()=>{o(!1)},[]),v=a.useCallback(()=>{x(null),l.current&&(l.current.value="")},[]);return d?e.jsxs("div",{className:"flex flex-col items-center gap-2",children:[r&&e.jsx("span",{className:"text-xs font-semibold text-gray-400",children:r}),e.jsx("div",{className:"relative w-36 h-36 rounded-2xl overflow-hidden",style:{border:"2px solid rgba(94,92,230,0.3)"},children:e.jsx("img",{src:d,alt:r||"Uploaded photo",className:"w-full h-full object-cover"})}),e.jsxs("button",{onClick:v,className:"flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-2",style:{minHeight:"44px",minWidth:"44px"},children:[e.jsx(C,{size:12}),"Change"]})]}):e.jsxs("div",{className:"flex flex-col items-center gap-2",children:[r&&e.jsx("span",{className:"text-xs font-semibold text-gray-400",children:r}),e.jsxs("button",{type:"button",onClick:()=>l.current?.click(),onDrop:f,onDragOver:g,onDragLeave:m,className:`
          w-36 h-36 rounded-2xl flex flex-col items-center justify-center gap-2
          transition-all duration-200 cursor-pointer
          ${n?"border-brand-blue scale-[1.03]":"border-white/15 hover:border-white/30"}
        `,style:{border:`2px dashed ${n?"#0a84ff":"rgba(255,255,255,0.15)"}`,background:n?"rgba(10,132,255,0.08)":"rgba(255,255,255,0.03)",minHeight:"44px",minWidth:"44px"},children:[e.jsx(j,{size:24,className:"text-gray-500"}),e.jsx("span",{className:"text-xs text-gray-500",children:n?"Drop here":"Tap to upload"})]}),e.jsx("input",{ref:l,type:"file",accept:"image/*",onChange:u,className:"hidden"})]})}export{j as C,w as P};
