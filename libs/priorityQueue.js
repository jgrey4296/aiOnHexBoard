/* jshint esversion : 6 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define(['lodash'],function(_){
    "use strict";
    /**
       PriorityQueue
       @constructor
       @param {Boolean} maximising Whether its a max or min heap
     */
    var PriorityQueue = function(maximising){
        if(maximising){
            this.type = 'maximising';
            this.comp = (a,b,i,j)=>a.p>b.p ? i : j;
        }else{
            this.type = 'minimising';
            this.comp = (a,b,i,j)=>a.p<b.p ? i : j;
        }
        //to extract from objects a priority:
        this.value = "value";
        //for heap[k] -> leftChild = heap[k*2], rightChild = heap[k*2+1], parent = heap[Math.floor(k/2)]
        this.heap = [0];

    };

    /**
       empty
       @returns {Boolean} Whether the PQ has values or not
     */
    PriorityQueue.prototype.empty = function(){
        return this.heap.length < 2 ? true : false;
    };

    /**
       insert : Insert some data into the PQ with a priority
       If no priority, uses the data if applicable
       @param data
       @param priority
     */
    PriorityQueue.prototype.insert = function(data,priority){
        if(priority === undefined){
            if(data[this.value] !== undefined){            
                priority = data[this.value];
            }else if(!isNaN(data)){
                priority = data;
            }else{
                throw new Error("cannot detect priority");
            }
        }
        
        //add to the end:
        this.heap.push({
            data : data,
            p : priority
        });
        this.modify(this.heap.length-1,priority);
        //this.bubbleUp(this.heap.length-1);        
    };

    /*
      next : removes the top priority and elem from the heap
      @returns data 
    */
    PriorityQueue.prototype.next = function(){
        if(this.empty()){
            throw new Error('empty priority queue');
        }
        let returnVal = this.heap[1],
            newTop = this.heap.pop();
        if(this.empty()){
            return returnVal.data;
        }        
        //take the last element as the new head:
        this.heap[1] = newTop;
        this.heapify();
        return returnVal.data;
    };

    //modify a priority
    PriorityQueue.prototype.modify = function(index,newPriority){
        if(this.type === 'maximising' && newPriority < this.heap[index].p){
            throw new Error('new key is smaller than existing');
        }else if(this.type === 'minimising' && newPriority > this.heap[index].p){
            throw new Error('new key is larger than existing');
        }
        let parent = this.parent(index);
        this.heap[index].p = newPriority;

        while(index > 1 && this.comp(this.heap[index],this.heap[parent],index,parent) === index){
            let swap = this.heap[index];
            this.heap[index] = this.heap[parent];
            this.heap[parent] = swap;
            index = parent;
            parent = this.parent(index);
        }
    };

    //heapify
    PriorityQueue.prototype.heapify = function(){
        let i = 1,
            l= this.left(i),
            r = this.right(i),
            preferred;
        while(true){
            if(l <= this.heap.length-1 && this.comp(this.heap[l],this.heap[i],l,i) === l){
                preferred = l;
            }else{
                preferred = i;
            }
            if(r <= this.heap.length-1 && this.comp(this.heap[r],this.heap[preferred],r,preferred) === r){
                preferred = r;
            }
            if(preferred !== i){
                let swap = this.heap[i];
                this.heap[i] = this.heap[preferred];
                this.heap[preferred] = swap;
                i = preferred;
                l = this.left(i);
                r = this.right(i);
            }else{
                return;
            }
        }
    };

    //utilities
    PriorityQueue.prototype.left = (i)=>Math.floor(i * 2);
    PriorityQueue.prototype.right = (i)=>Math.floor((i * 2) + 1);
    PriorityQueue.prototype.parent = function(index){
        return Math.floor(index * 0.5);
    };

    
    return PriorityQueue;
});
