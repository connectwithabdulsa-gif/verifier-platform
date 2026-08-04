export interface Metrics { increment(name: string, labels?: Readonly<Record<string,string>>): void; observe(name: string, value: number, labels?: Readonly<Record<string,string>>): void; }
export class InMemoryMetrics implements Metrics {
  readonly counters = new Map<string,number>(); readonly observations = new Map<string,number[]>();
  increment(name: string, labels: Readonly<Record<string,string>> = {}): void { const key=metricKey(name,labels); this.counters.set(key,(this.counters.get(key)??0)+1); }
  observe(name: string, value: number, labels: Readonly<Record<string,string>> = {}): void { const key=metricKey(name,labels); this.observations.set(key,[...(this.observations.get(key)??[]),value]); }
}
const metricKey=(name:string,labels:Readonly<Record<string,string>>):string => `${name}{${Object.entries(labels).sort().map(([k,v])=>`${k}=${v}`).join(",")}}`;
