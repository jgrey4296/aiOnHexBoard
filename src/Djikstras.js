/* jshint esversion : 6 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['lodash','PriorityQueue'],function(_,PriorityQueue){
    "use strict";
    /**
       Run djikstras shortest path tree algorithm on a given graph
       @param graph : {nodeIndex:{ node: {}, distances: [[nodeIndex,distance]]}
     */
    let Djikstras = function(graph, source){
        console.log('input graph',graph,source);
        //initialise records
        let nodes = _.keys(graph),
            links = nodes.reduce((m,v)=>{
                m[v] = [Infinity,null];
                return m;
            },{}),
            pq = new PriorityQueue();
        //init distance from source to 0
        links[source][0] = 0;
        //init the priority queue
        _.keys(links).forEach(d=>pq.insert(d,links[d][0]));
        //-----
        //process each node by distance from the source
        while(!pq.empty()){
            let current = pq.next(),
                neighbours = _.keys(graph[current].distances);
            //get the best neighbour
            neighbours.forEach(d=>{
                let altDistance = links[current][0] + graph[current].distances[d];
                if(altDistance < links[d][0]){
                    links[d] = [altDistance,current];
                    //update the priority of an index
                    let index = _.findIndex(pq.heap,e=>e.data === d,1);
                    if(index !== -1) {
                        pq.modify(index,altDistance);
                    }
                }
            });
        }
        //construct the final tree, inverting the links
        let tree = _.keys(links).reduce((m,v)=>{
            if(links[v][1] === null) { return m; }
            if(m[links[v][1]] === undefined){ m[links[v][1]] = []; }
            m[links[v][1]].push(v);
            return m;
        },{});
        
        return tree;
    };
    


    return Djikstras;
});
