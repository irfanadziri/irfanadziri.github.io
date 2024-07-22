(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{7244:function(e,t,r){Promise.resolve().then(r.bind(r,6826))},7138:function(e,t,r){"use strict";r.d(t,{default:function(){return l.a}});var n=r(231),l=r.n(n)},291:function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"RouterContext",{enumerable:!0,get:function(){return n}});let n=r(9920)._(r(2265)).default.createContext(null)},6826:function(e,t,r){"use strict";let n,l,i,a;r.r(t),r.d(t,{ResumeIcon:function(){return eE},default:function(){return ej}});var s=r(7437),o=r(2265),u=r.t(o,2);function c(){let e=[],t={addEventListener:(e,r,n,l)=>(e.addEventListener(r,n,l),t.add(()=>e.removeEventListener(r,n,l))),requestAnimationFrame(){for(var e=arguments.length,r=Array(e),n=0;n<e;n++)r[n]=arguments[n];let l=requestAnimationFrame(...r);return t.add(()=>cancelAnimationFrame(l))},nextFrame(){for(var e=arguments.length,r=Array(e),n=0;n<e;n++)r[n]=arguments[n];return t.requestAnimationFrame(()=>t.requestAnimationFrame(...r))},setTimeout(){for(var e=arguments.length,r=Array(e),n=0;n<e;n++)r[n]=arguments[n];let l=setTimeout(...r);return t.add(()=>clearTimeout(l))},microTask(){for(var e,r=arguments.length,n=Array(r),l=0;l<r;l++)n[l]=arguments[l];let i={current:!0};return e=()=>{i.current&&n[0]()},"function"==typeof queueMicrotask?queueMicrotask(e):Promise.resolve().then(e).catch(e=>setTimeout(()=>{throw e})),t.add(()=>{i.current=!1})},style(e,t,r){let n=e.style.getPropertyValue(t);return Object.assign(e.style,{[t]:r}),this.add(()=>{Object.assign(e.style,{[t]:n})})},group(e){let t=c();return e(t),this.add(()=>t.dispose())},add:t=>(e.push(t),()=>{let r=e.indexOf(t);if(r>=0)for(let t of e.splice(r,1))t()}),dispose(){for(let t of e.splice(0))t()}};return t}function f(){let[e]=(0,o.useState)(c);return(0,o.useEffect)(()=>()=>e.dispose(),[e]),e}var d=Object.defineProperty,h=(e,t,r)=>t in e?d(e,t,{enumerable:!0,configurable:!0,writable:!0,value:r}):e[t]=r,p=(e,t,r)=>(h(e,"symbol"!=typeof t?t+"":t,r),r);class m{constructor(){p(this,"current",this.detect()),p(this,"handoffState","pending"),p(this,"currentId",0)}set(e){this.current!==e&&(this.handoffState="pending",this.currentId=0,this.current=e)}reset(){this.set(this.detect())}nextId(){return++this.currentId}get isServer(){return"server"===this.current}get isClient(){return"client"===this.current}detect(){return"undefined"==typeof window||"undefined"==typeof document?"server":"client"}handoff(){"pending"===this.handoffState&&(this.handoffState="complete")}get isHandoffComplete(){return"complete"===this.handoffState}}let v=new m,g=(e,t)=>{v.isServer?(0,o.useEffect)(e,t):(0,o.useLayoutEffect)(e,t)};function y(e){let t=(0,o.useRef)(e);return g(()=>{t.current=e},[e]),t}let b=function(e){let t=y(e);return o.useCallback(function(){for(var e=arguments.length,r=Array(e),n=0;n<e;n++)r[n]=arguments[n];return t.current(...r)},[t])};function x(){let e=(0,o.useRef)(!1);return g(()=>(e.current=!0,()=>{e.current=!1}),[]),e}function E(){let e;let t=(e="undefined"==typeof document,(0,u.useSyncExternalStore)(()=>()=>{},()=>!1,()=>!e)),[r,n]=o.useState(v.isHandoffComplete);return r&&!1===v.isHandoffComplete&&n(!1),o.useEffect(()=>{!0!==r&&n(!0)},[r]),o.useEffect(()=>v.handoff(),[]),!t&&r}let j=Symbol();function w(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];let n=(0,o.useRef)(t);(0,o.useEffect)(()=>{n.current=t},[t]);let l=b(e=>{for(let t of n.current)null!=t&&("function"==typeof t?t(e):t.current=e)});return t.every(e=>null==e||(null==e?void 0:e[j]))?void 0:l}function C(e,t){for(var r=arguments.length,n=Array(r>2?r-2:0),l=2;l<r;l++)n[l-2]=arguments[l];if(e in t){let r=t[e];return"function"==typeof r?r(...n):r}let i=Error(`Tried to handle "${e}" but there is no handler defined. Only defined handlers are: ${Object.keys(t).map(e=>`"${e}"`).join(", ")}.`);throw Error.captureStackTrace&&Error.captureStackTrace(i,C),i}function N(e){for(var t=arguments.length,r=Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];e&&r.length>0&&e.classList.add(...r)}function T(e){for(var t=arguments.length,r=Array(t>1?t-1:0),n=1;n<t;n++)r[n-1]=arguments[n];e&&r.length>0&&e.classList.remove(...r)}let k=(0,o.createContext)(null);k.displayName="OpenClosedContext";var F=((n=F||{})[n.Open=1]="Open",n[n.Closed=2]="Closed",n[n.Closing=4]="Closing",n[n.Opening=8]="Opening",n);function S(){return(0,o.useContext)(k)}function A(e){let{value:t,children:r}=e;return o.createElement(k.Provider,{value:t},r)}function O(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return Array.from(new Set(t.flatMap(e=>"string"==typeof e?e.split(" "):[]))).filter(Boolean).join(" ")}var R=((l=R||{})[l.None=0]="None",l[l.RenderStrategy=1]="RenderStrategy",l[l.Static=2]="Static",l),P=((i=P||{})[i.Unmount=0]="Unmount",i[i.Hidden=1]="Hidden",i);function L(e){let{ourProps:t,theirProps:r,slot:n,defaultTag:l,features:i,visible:a=!0,name:s,mergeRefs:o}=e;o=null!=o?o:D;let u=I(r,t);if(a)return H(u,n,l,s,o);let c=null!=i?i:0;if(2&c){let{static:e=!1,...t}=u;if(e)return H(t,n,l,s,o)}if(1&c){let{unmount:e=!0,...t}=u;return C(e?0:1,{0:()=>null,1:()=>H({...t,hidden:!0,style:{display:"none"}},n,l,s,o)})}return H(u,n,l,s,o)}function H(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=arguments.length>2?arguments[2]:void 0,n=arguments.length>3?arguments[3]:void 0,l=arguments.length>4?arguments[4]:void 0,{as:i=r,children:a,refName:s="ref",...u}=_(e,["unmount","static"]),c=void 0!==e.ref?{[s]:e.ref}:{},f="function"==typeof a?a(t):a;"className"in u&&u.className&&"function"==typeof u.className&&(u.className=u.className(t));let d={};if(t){let e=!1,r=[];for(let[n,l]of Object.entries(t))"boolean"==typeof l&&(e=!0),!0===l&&r.push(n);e&&(d["data-headlessui-state"]=r.join(" "))}if(i===o.Fragment&&Object.keys(M(u)).length>0){if(!(0,o.isValidElement)(f)||Array.isArray(f)&&f.length>1)throw Error(['Passing props on "Fragment"!',"",`The current component <${n} /> is rendering a "Fragment".`,"However we need to passthrough the following props:",Object.keys(u).map(e=>`  - ${e}`).join(`
`),"","You can apply a few solutions:",['Add an `as="..."` prop, to ensure that we render an actual element instead of a "Fragment".',"Render a single element as the child so that we can forward the props onto that element."].map(e=>`  - ${e}`).join(`
`)].join(`
`));let e=f.props,t="function"==typeof(null==e?void 0:e.className)?function(){for(var t=arguments.length,r=Array(t),n=0;n<t;n++)r[n]=arguments[n];return O(null==e?void 0:e.className(...r),u.className)}:O(null==e?void 0:e.className,u.className);return(0,o.cloneElement)(f,Object.assign({},I(f.props,M(_(u,["ref"]))),d,c,{ref:l(f.ref,c.ref)},t?{className:t}:{}))}return(0,o.createElement)(i,Object.assign({},_(u,["ref"]),i!==o.Fragment&&c,i!==o.Fragment&&d),f)}function D(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];return t.every(e=>null==e)?void 0:e=>{for(let r of t)null!=r&&("function"==typeof r?r(e):r.current=e)}}function I(){for(var e=arguments.length,t=Array(e),r=0;r<e;r++)t[r]=arguments[r];if(0===t.length)return{};if(1===t.length)return t[0];let n={},l={};for(let e of t)for(let t in e)t.startsWith("on")&&"function"==typeof e[t]?(null!=l[t]||(l[t]=[]),l[t].push(e[t])):n[t]=e[t];if(n.disabled||n["aria-disabled"])return Object.assign(n,Object.fromEntries(Object.keys(l).map(e=>[e,void 0])));for(let e in l)Object.assign(n,{[e](t){for(var r=arguments.length,n=Array(r>1?r-1:0),i=1;i<r;i++)n[i-1]=arguments[i];for(let r of l[e]){if((t instanceof Event||(null==t?void 0:t.nativeEvent)instanceof Event)&&t.defaultPrevented)return;r(t,...n)}}});return n}function z(e){var t;return Object.assign((0,o.forwardRef)(e),{displayName:null!=(t=e.displayName)?t:e.name})}function M(e){let t=Object.assign({},e);for(let e in t)void 0===t[e]&&delete t[e];return t}function _(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],r=Object.assign({},e);for(let e of t)e in r&&delete r[e];return r}function B(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"";return e.split(/\s+/).filter(e=>e.length>1)}let V=(0,o.createContext)(null);V.displayName="TransitionContext";var Z=((a=Z||{}).Visible="visible",a.Hidden="hidden",a);let q=(0,o.createContext)(null);function $(e){return"children"in e?$(e.children):e.current.filter(e=>{let{el:t}=e;return null!==t.current}).filter(e=>{let{state:t}=e;return"visible"===t}).length>0}function U(e,t){let r=y(e),n=(0,o.useRef)([]),l=x(),i=f(),a=b(function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:P.Hidden,a=n.current.findIndex(t=>{let{el:r}=t;return r===e});-1!==a&&(C(t,{[P.Unmount](){n.current.splice(a,1)},[P.Hidden](){n.current[a].state="hidden"}}),i.microTask(()=>{var e;!$(n)&&l.current&&(null==(e=r.current)||e.call(r))}))}),s=b(e=>{let t=n.current.find(t=>{let{el:r}=t;return r===e});return t?"visible"!==t.state&&(t.state="visible"):n.current.push({el:e,state:"visible"}),()=>a(e,P.Unmount)}),u=(0,o.useRef)([]),c=(0,o.useRef)(Promise.resolve()),d=(0,o.useRef)({enter:[],leave:[],idle:[]}),h=b((e,r,n)=>{u.current.splice(0),t&&(t.chains.current[r]=t.chains.current[r].filter(t=>{let[r]=t;return r!==e})),null==t||t.chains.current[r].push([e,new Promise(e=>{u.current.push(e)})]),null==t||t.chains.current[r].push([e,new Promise(e=>{Promise.all(d.current[r].map(e=>{let[t,r]=e;return r})).then(()=>e())})]),"enter"===r?c.current=c.current.then(()=>null==t?void 0:t.wait.current).then(()=>n(r)):n(r)}),p=b((e,t,r)=>{Promise.all(d.current[t].splice(0).map(e=>{let[t,r]=e;return r})).then(()=>{var e;null==(e=u.current.shift())||e()}).then(()=>r(t))});return(0,o.useMemo)(()=>({children:n,register:s,unregister:a,onStart:h,onStop:p,wait:c,chains:d}),[s,a,n,h,p,d,c])}function Y(){}q.displayName="NestingContext";let K=["beforeEnter","afterEnter","beforeLeave","afterLeave"];function W(e){var t;let r={};for(let n of K)r[n]=null!=(t=e[n])?t:Y;return r}let G=R.RenderStrategy,J=z(function(e,t){let{show:r,appear:n=!1,unmount:l=!0,...i}=e,a=(0,o.useRef)(null),s=w(a,t);E();let u=S();if(void 0===r&&null!==u&&(r=(u&F.Open)===F.Open),![!0,!1].includes(r))throw Error("A <Transition /> is used but it is missing a `show={true | false}` prop.");let[c,f]=(0,o.useState)(r?"visible":"hidden"),d=U(()=>{f("hidden")}),[h,p]=(0,o.useState)(!0),m=(0,o.useRef)([r]);g(()=>{!1!==h&&m.current[m.current.length-1]!==r&&(m.current.push(r),p(!1))},[m,r]);let v=(0,o.useMemo)(()=>({show:r,appear:n,initial:h}),[r,n,h]);(0,o.useEffect)(()=>{if(r)f("visible");else if($(d)){let e=a.current;if(!e)return;let t=e.getBoundingClientRect();0===t.x&&0===t.y&&0===t.width&&0===t.height&&f("hidden")}else f("hidden")},[r,d]);let y={unmount:l},x=b(()=>{var t;h&&p(!1),null==(t=e.beforeEnter)||t.call(e)}),j=b(()=>{var t;h&&p(!1),null==(t=e.beforeLeave)||t.call(e)});return o.createElement(q.Provider,{value:d},o.createElement(V.Provider,{value:v},L({ourProps:{...y,as:o.Fragment,children:o.createElement(Q,{ref:s,...y,...i,beforeEnter:x,beforeLeave:j})},theirProps:{},defaultTag:o.Fragment,features:G,visible:"visible"===c,name:"Transition"})))}),Q=z(function(e,t){var r,n,l;let i;let{beforeEnter:a,afterEnter:s,beforeLeave:u,afterLeave:d,enter:h,enterFrom:p,enterTo:m,entered:v,leave:j,leaveFrom:k,leaveTo:S,...R}=e,H=(0,o.useRef)(null),D=w(H,t),I=null==(r=R.unmount)||r?P.Unmount:P.Hidden,{show:z,appear:M,initial:_}=function(){let e=(0,o.useContext)(V);if(null===e)throw Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");return e}(),[Z,Y]=(0,o.useState)(z?"visible":"hidden"),K=function(){let e=(0,o.useContext)(q);if(null===e)throw Error("A <Transition.Child /> is used but it is missing a parent <Transition /> or <Transition.Root />.");return e}(),{register:J,unregister:Q}=K;(0,o.useEffect)(()=>J(H),[J,H]),(0,o.useEffect)(()=>{if(I===P.Hidden&&H.current){if(z&&"visible"!==Z){Y("visible");return}return C(Z,{hidden:()=>Q(H),visible:()=>J(H)})}},[Z,H,J,Q,z,I]);let X=y({base:B(R.className),enter:B(h),enterFrom:B(p),enterTo:B(m),entered:B(v),leave:B(j),leaveFrom:B(k),leaveTo:B(S)}),ee=(l={beforeEnter:a,afterEnter:s,beforeLeave:u,afterLeave:d},i=(0,o.useRef)(W(l)),(0,o.useEffect)(()=>{i.current=W(l)},[l]),i),et=E();(0,o.useEffect)(()=>{if(et&&"visible"===Z&&null===H.current)throw Error("Did you forget to passthrough the `ref` to the actual DOM node?")},[H,Z,et]);let er=M&&z&&_,en=et&&(!_||M)?z?"enter":"leave":"idle",el=function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,[t,r]=(0,o.useState)(e),n=x(),l=(0,o.useCallback)(e=>{n.current&&r(t=>t|e)},[t,n]),i=(0,o.useCallback)(e=>!!(t&e),[t]);return{flags:t,addFlag:l,hasFlag:i,removeFlag:(0,o.useCallback)(e=>{n.current&&r(t=>t&~e)},[r,n]),toggleFlag:(0,o.useCallback)(e=>{n.current&&r(t=>t^e)},[r])}}(0),ei=b(e=>C(e,{enter:()=>{el.addFlag(F.Opening),ee.current.beforeEnter()},leave:()=>{el.addFlag(F.Closing),ee.current.beforeLeave()},idle:()=>{}})),ea=b(e=>C(e,{enter:()=>{el.removeFlag(F.Opening),ee.current.afterEnter()},leave:()=>{el.removeFlag(F.Closing),ee.current.afterLeave()},idle:()=>{}})),es=U(()=>{Y("hidden"),Q(H)},K),eo=(0,o.useRef)(!1);!function(e){let{immediate:t,container:r,direction:n,classes:l,onStart:i,onStop:a}=e,s=x(),o=f(),u=y(n);g(()=>{t&&(u.current="enter")},[t]),g(()=>{let e=c();o.add(e.dispose);let t=r.current;if(t&&"idle"!==u.current&&s.current){var n,f,d;let r,s,o,h,p,m,v;return e.dispose(),i.current(u.current),e.add((n=l.current,f="enter"===u.current,d=()=>{e.dispose(),a.current(u.current)},s=f?"enter":"leave",o=c(),h=void 0!==d?(r={called:!1},function(){for(var e=arguments.length,t=Array(e),n=0;n<e;n++)t[n]=arguments[n];if(!r.called)return r.called=!0,d(...t)}):()=>{},"enter"===s&&(t.removeAttribute("hidden"),t.style.display=""),p=C(s,{enter:()=>n.enter,leave:()=>n.leave}),m=C(s,{enter:()=>n.enterTo,leave:()=>n.leaveTo}),v=C(s,{enter:()=>n.enterFrom,leave:()=>n.leaveFrom}),T(t,...n.base,...n.enter,...n.enterTo,...n.enterFrom,...n.leave,...n.leaveFrom,...n.leaveTo,...n.entered),N(t,...n.base,...p,...v),o.nextFrame(()=>{T(t,...n.base,...p,...v),N(t,...n.base,...p,...m),function(e,t){let r=c();if(!e)return r.dispose;let{transitionDuration:n,transitionDelay:l}=getComputedStyle(e),[i,a]=[n,l].map(e=>{let[t=0]=e.split(",").filter(Boolean).map(e=>e.includes("ms")?parseFloat(e):1e3*parseFloat(e)).sort((e,t)=>t-e);return t}),s=i+a;if(0!==s){r.group(r=>{r.setTimeout(()=>{t(),r.dispose()},s),r.addEventListener(e,"transitionrun",e=>{e.target===e.currentTarget&&r.dispose()})});let n=r.addEventListener(e,"transitionend",e=>{e.target===e.currentTarget&&(t(),n())})}else t();r.add(()=>t()),r.dispose}(t,()=>(T(t,...n.base,...p),N(t,...n.base,...n.entered),h()))}),o.dispose)),e.dispose}},[n])}({immediate:er,container:H,classes:X,direction:en,onStart:y(e=>{eo.current=!0,es.onStart(H,e,ei)}),onStop:y(e=>{eo.current=!1,es.onStop(H,e,ea),"leave"!==e||$(es)||(Y("hidden"),Q(H))})});let eu=R;return er?eu={...eu,className:O(R.className,...X.current.enter,...X.current.enterFrom)}:eo.current&&(eu.className=O(R.className,null==(n=H.current)?void 0:n.className),""===eu.className&&delete eu.className),o.createElement(q.Provider,{value:es},o.createElement(A,{value:C(Z,{visible:F.Open,hidden:F.Closed})|el.flags},L({ourProps:{ref:D},theirProps:eu,defaultTag:"div",features:G,visible:"visible"===Z,name:"Transition.Child"})))}),X=z(function(e,t){let r=null!==(0,o.useContext)(V),n=null!==S();return o.createElement(o.Fragment,null,!r&&n?o.createElement(J,{ref:t,...e}):o.createElement(Q,{ref:t,...e}))}),ee=Object.assign(J,{Child:X,Root:J});var et=e=>null==e,er=(e,t)=>{if("string"!=typeof t){let{children:e,...r}=t.props;t.key||(r.key="typist-cursor"),t=o.cloneElement(t,r,e)}let r=e=>{if(!e)return e;if(0===e.length)return[t];let n=e[e.length-1];if("string"==typeof n)return[...e,t];let{children:l,...i}=n.props;if(et(l))return[...e,t];let a=r(l),s=o.cloneElement(n,i,a);return[...e.slice(0,-1),s]};return r(e)};let en=()=>{},el=e=>e.split("");var ei=e=>null,ea=e=>null,es=(e,t)=>{let r=0,n=e=>o.Children.map(e,e=>{if(r>=t.length)return null;if((0,o.isValidElement)(e)){if(e.type===ei||e.type===ea)return null;let{children:l,...i}=e.props;if(et(l))return t[r++];let a=n(l);return a&&0===a.length?null:(0,o.cloneElement)(e,i,a)}return"string"==typeof e||"number"==typeof e?t[r++]:null});return n(e)},eo=({children:e})=>(0,s.jsx)(s.Fragment,{children:e});let eu=e=>({type:"TYPE_TOKEN",payload:e}),ec=e=>({type:"BACKSPACE",payload:e}),ef=e=>({type:"DELAY",payload:e}),ed=e=>({type:"PASTE",payload:e});var eh=(e,t)=>{let r=[],n=!1,l=0,i=e=>{o.Children.forEach(e,e=>{if((0,o.isValidElement)(e)){if(e.type===ei){let t=e.props.count,n=t>l?l:t;l-=n,r.push(ec(n));return}if(e.type===ea){r.push(ef(e.props.ms));return}if(e.type===eo){n=!0,o.Children.forEach(e.props.children,i),n=!1;return}if(et(e.props.children)){l+=1,r.push(eu(e));return}o.Children.forEach(e.props.children,i)}let a="number"==typeof e?e.toString(10):"string"==typeof e?e:void 0;if(void 0===a)return;if(n){l+=t(a).length,r.push(ed(a));return}let s=t(a);l+=s.length,s.forEach(e=>{r.push(eu(e))})})};return i(e),r};let ep=Object.assign(({cursor:e,disabled:t=!1,restartKey:r,children:n,splitter:l=el,typingDelay:i=75,backspaceDelay:a=i,onTypingDone:u,startDelay:c=0,finishDelay:f=0,loop:d=!1,pause:h=!1})=>{let[p,m]=(0,o.useState)([]),[v,g]=(0,o.useState)(-1),y=(0,o.useRef)(en),b=(0,o.useRef)(d),x=(0,o.useRef)(h),E=(0,o.useCallback)(e=>new Promise((t,r)=>{let n=setTimeout(t,"number"==typeof e?e:e());y.current=()=>{clearTimeout(n),r()}}),[]),j=(0,o.useCallback)(()=>new Promise((e,t)=>{let r=setInterval(()=>{x.current||(clearInterval(r),e())});y.current=()=>{clearInterval(r),t()}}),[]),w=(0,o.useCallback)(()=>new Promise((e,t)=>{let r=setInterval(()=>{b.current&&(clearInterval(r),e())});y.current=()=>{clearInterval(r),t()}}),[]);(0,o.useEffect)(()=>{b.current=d,x.current=h},[d,h]),(0,o.useEffect)(()=>{let e=function(e,t){let r=[],n=[],l=!1,i=e=>{o.Children.forEach(e,e=>{if((0,o.isValidElement)(e)){if(e.type===ea)return;if(e.type===ei){let l=e.props.count;for(;l--;){let e=n.length-1,l=n[e];for(;null===l&&e>0;)e-=1,l=n[e];if(null===l)break;if("object"==typeof l&&(n[e]=null),"string"==typeof l){let r=t(l).slice(0,-1).join("");n[e]=r||null}r.push([...n])}return}if(e.type===eo){l=!0,o.Children.forEach(e.props.children,i),l=!1;return}if(et(e.props.children)){n.push(e),r.push([...n]);return}o.Children.forEach(e.props.children,i)}let a="number"==typeof e?e.toString(10):"string"==typeof e?e:void 0;if(void 0===a)return;if(l){n.push(a),r.push([...n]);return}let s=t(a),u=n.length;for(let e=1;e<=s.length;e++){let t=s.slice(0,e).join("");n[u]=t,r.push([...n])}})};return i(e),r.map(t=>es(e,t))}(n,l);if(m(e),t){g(e.length-1);return}return(async()=>{try{do{g(-1);let e=eh(n,l);for(let{type:t,payload:r}of(c>0&&await E(c),e))if(x.current&&await j(),"TYPE_TOKEN"===t)g(e=>e+1),await E(i);else if("BACKSPACE"===t){let e=r;for(;e--;)g(e=>e+1),await E(a)}else"PASTE"===t?g(e=>e+1):"DELAY"===t&&await E(r);u?.(),f>0&&await E(f),b.current||await w()}while(b.current)}catch(e){}})(),()=>{y.current()}},[r,t]);let C=p[v];return(0,s.jsx)(s.Fragment,{children:e?er(C,e):C})},{Delay:ea,Backspace:ei,Paste:eo});var em=()=>{let[e,t]=(0,o.useState)(!0),[r,n]=(0,o.useState)(!1);return(0,o.useEffect)(()=>{let e=setTimeout(()=>{t(!1),setTimeout(()=>{n(!0),setTimeout(()=>{n(!1),setTimeout(()=>{t(!0)},1e3)},5e3)},1e3)},8e3);return()=>clearTimeout(e)},[e,r]),(0,s.jsxs)("div",{children:[(0,s.jsx)(ee,{show:e,enter:"transition-opacity ease-out duration-2000",enterFrom:"opacity-0",enterTo:"opacity-100",leave:"transition-opacity ease-in duration-500",leaveFrom:"opacity-100",leaveTo:"opacity-0",children:(0,s.jsx)("div",{className:"opacity-100",children:(0,s.jsxs)(ep,{typingDelay:75,cursor:(0,s.jsx)("span",{className:"cursor animate-pulse text-sky-500 dark:text-sky-400",children:"_"}),children:[(0,s.jsx)("p",{children:"Solution architect by day"}),(0,s.jsx)(ep.Delay,{ms:1500}),(0,s.jsx)(ep.Backspace,{count:25}),(0,s.jsx)("p",{children:"Lifelong learner by night"}),(0,s.jsx)(ep.Delay,{ms:3e3})]})})}),(0,s.jsx)(ee,{show:r,enter:"transition-opacity ease-out duration-1000",enterFrom:"opacity-0",enterTo:"opacity-100",leave:"transition-opacity ease-in duration-1000",leaveFrom:"opacity-100",leaveTo:"opacity-0",children:(0,s.jsx)("div",{className:"animate-bounce opacity-100",children:(0,s.jsx)("p",{children:"I design AWS solutions with scalability and security in mind."})})})]})},ev=r(590);function eg(e){return(0,s.jsx)("svg",{viewBox:"0 0 24 24","aria-hidden":"true",...e,children:(0,s.jsx)("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M12 2C6.475 2 2 6.588 2 12.253c0 4.537 2.862 8.369 6.838 9.727.5.09.687-.218.687-.487 0-.243-.013-1.05-.013-1.91C7 20.059 6.35 18.957 6.15 18.38c-.113-.295-.6-1.205-1.025-1.448-.35-.192-.85-.667-.013-.68.788-.012 1.35.744 1.538 1.051.9 1.551 2.338 1.116 2.912.846.088-.666.35-1.115.638-1.371-2.225-.256-4.55-1.14-4.55-5.062 0-1.115.387-2.038 1.025-2.756-.1-.256-.45-1.307.1-2.717 0 0 .837-.269 2.75 1.051.8-.23 1.65-.346 2.5-.346.85 0 1.7.115 2.5.346 1.912-1.333 2.75-1.05 2.75-1.05.55 1.409.2 2.46.1 2.716.637.718 1.025 1.628 1.025 2.756 0 3.934-2.337 4.806-4.562 5.062.362.32.675.936.675 1.897 0 1.371-.013 2.473-.013 2.82 0 .268.188.589.688.486a10.039 10.039 0 0 0 4.932-3.74A10.447 10.447 0 0 0 22 12.253C22 6.588 17.525 2 12 2Z"})})}function ey(e){return(0,s.jsx)("svg",{viewBox:"0 0 24 24","aria-hidden":"true",...e,children:(0,s.jsx)("path",{d:"M18.335 18.339H15.67v-4.177c0-.996-.02-2.278-1.39-2.278-1.389 0-1.601 1.084-1.601 2.205v4.25h-2.666V9.75h2.56v1.17h.035c.358-.674 1.228-1.387 2.528-1.387 2.7 0 3.2 1.778 3.2 4.091v4.715zM7.003 8.575a1.546 1.546 0 01-1.548-1.549 1.548 1.548 0 111.547 1.549zm1.336 9.764H5.666V9.75H8.34v8.589zM19.67 3H4.329C3.593 3 3 3.58 3 4.297v15.406C3 20.42 3.594 21 4.328 21h15.338C20.4 21 21 20.42 21 19.703V4.297C21 3.58 20.4 3 19.666 3h.003z"})})}var eb=r(7138);function ex(e){let{icon:t,...r}=e;return(0,s.jsx)(eb.default,{className:"group -m-1 p-1",...r,children:(0,s.jsx)(t,{className:"h-6 w-6 fill-zinc-500 transition group-hover:fill-sky-500 dark:fill-zinc-400 dark:group-hover:fill-sky-400"})})}function eE(e){return(0,s.jsx)(eb.default,{className:"group -m-1 p-1",...e,children:(0,s.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 24 24",fill:"currentColor",className:"h-6 w-6 fill-zinc-500 transition group-hover:fill-sky-500 dark:fill-zinc-400 dark:group-hover:fill-sky-400",children:[(0,s.jsx)("path",{fillRule:"evenodd",d:"M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z",clipRule:"evenodd"}),(0,s.jsx)("path",{d:"M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z"})]})})}async function ej(){return(0,s.jsx)(s.Fragment,{children:(0,s.jsx)(ev.W2,{children:(0,s.jsxs)("div",{className:"mx-auto max-w-3xl py-32 sm:py-48 lg:py-56",children:[(0,s.jsxs)("div",{className:"text-center",children:[(0,s.jsxs)("h1",{className:"text-5xl font-bold tracking-tight text-zinc-800 sm:text-6xl dark:text-zinc-100",children:[(0,s.jsx)("span",{className:"mb-4 block animate-wiggle",children:"\uD83D\uDC4B\uD83C\uDFFB"}),(0,s.jsx)("span",{className:"text-5xl",children:" Irfan's here!"})]}),(0,s.jsx)("div",{className:"mt-6 h-6 px-2 font-mono text-lg leading-8 tracking-tighter text-zinc-600 sm:text-xl dark:text-zinc-400",children:(0,s.jsx)(em,{})})]}),(0,s.jsxs)("div",{className:"mt-24 flex justify-center gap-6",children:[(0,s.jsx)(ex,{href:"https://github.com/irfanadziri","aria-label":"Follow on GitHub",icon:eg}),(0,s.jsx)(ex,{href:"https://www.linkedin.com/in/irfanadziri/","aria-label":"Follow on LinkedIn",icon:ey}),(0,s.jsx)(eE,{href:"/Resume_Irfanadziri.pdf",target:"_blank","aria-label":"Download Resume"})]})]})})})}},590:function(e,t,r){"use strict";r.d(t,{W2:function(){return o},Zb:function(){return a},le:function(){return s}});var n=r(7437),l=r(2265),i=r(4839);let a=(0,l.forwardRef)(function(e,t){let{className:r,children:l,...a}=e;return(0,n.jsx)("div",{ref:t,className:(0,i.Z)("sm:px-8",r),...a,children:(0,n.jsx)("div",{className:"mx-auto w-full max-w-7xl lg:px-8",children:l})})}),s=(0,l.forwardRef)(function(e,t){let{className:r,children:l,...a}=e;return(0,n.jsx)("div",{ref:t,className:(0,i.Z)("relative px-4 sm:px-8 lg:px-12",r),...a,children:(0,n.jsx)("div",{className:"mx-auto max-w-2xl lg:max-w-5xl",children:l})})}),o=(0,l.forwardRef)(function(e,t){let{children:r,...l}=e;return(0,n.jsx)(a,{ref:t,...l,children:(0,n.jsx)(s,{children:r})})})},4839:function(e,t,r){"use strict";t.Z=function(){for(var e,t,r=0,n="",l=arguments.length;r<l;r++)(e=arguments[r])&&(t=function e(t){var r,n,l="";if("string"==typeof t||"number"==typeof t)l+=t;else if("object"==typeof t){if(Array.isArray(t)){var i=t.length;for(r=0;r<i;r++)t[r]&&(n=e(t[r]))&&(l&&(l+=" "),l+=n)}else for(n in t)t[n]&&(l&&(l+=" "),l+=n)}return l}(e))&&(n&&(n+=" "),n+=t);return n}}},function(e){e.O(0,[231,971,23,744],function(){return e(e.s=7244)}),_N_E=e.O()}]);