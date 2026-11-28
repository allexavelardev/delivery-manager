export type DemoOrder = { id:string; sourceId?:string; courierName?:string; customer:string; items:string; total:number; status:'Em preparo'|'Saiu para entrega'|'Concluído'|'Aguardando'; time:string };
export const orders:DemoOrder[] = [
 {id:'#1048',customer:'Mariana Costa',items:'2x Smash Burger, 1x Batata',total:58.9,status:'Em preparo',time:'19:42'},
 {id:'#1047',customer:'João Pedro',items:'1x Pizza Calabresa G',total:49.9,status:'Saiu para entrega',time:'19:35'},
 {id:'#1046',customer:'Ana Clara',items:'1x Combo Família',total:89.9,status:'Concluído',time:'19:18'},
 {id:'#1045',customer:'Lucas Martins',items:'2x X-Bacon',total:52,status:'Aguardando',time:'19:05'},
];
export const money=(n:number)=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
