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
            this.comp = (a,b,i,j)=>a.p>b.p ? i : j;
        }else{
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
        this.bubbleUp(this.heap.length-1);        
    };

    /**
       Heapify : takes an array and repeatedly inserts it into the heap
       @param {Array} inputArray
     */
    PriorityQueue.prototype.heapify = function(inputArray){
        if(!(inputArray instanceof Array)){
            throw new Error('heapify takes an array');
        }
        inputArray.forEach(d=>this.insert(d));
    };
    
    /**
       bubble an element up the heap as far as necessary,
       returns the PQ to a heap state
       @param index : The element to start the process on
     */
    PriorityQueue.prototype.bubbleUp = function(index){
        let currentIndex = index,
            current = this.heap[currentIndex],
            parentIndex = Math.floor(currentIndex*0.5),
            parent = this.heap[parentIndex];
        if(current == undefined || parent === undefined){
            throw new Error('undefined elements for bubble');
        }
        if(this.empty()) {
            throw new Error('queue is empty');
        }
        if(parent === 0) return;
        while(currentIndex !== 0 && parentIndex !== 0 && this.comp(current,parent,currentIndex,parentIndex) === currentIndex){
            //swap as current is greater than parent
            this.heap[parentIndex] = current;
            this.heap[currentIndex] = parent;
            //update the indices and elements:
            currentIndex = parentIndex;
            current = parent;
            parentIndex = Math.floor(currentIndex*0.5);
            parent = this.heap[parentIndex];
        }        
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
        this.bubbleDown();
        return returnVal.data;
    };

    /**
       bubbleDown : Having removed an element from the heap,
       bubble down reasserts the heap state
     */
    PriorityQueue.prototype.bubbleDown = function(){
        let cIndex = 1,
            //utility functions for child indicies
            lciF = ()=>cIndex*2,
            rciF = ()=>cIndex*2+1;

        //go until you reach the of the heap
        //(or internally you reach satisfaction)
        while(cIndex < this.heap.length-1){
            //Get the children
            let lChildI = lciF(),
                rChildI = rciF(),
                lChild = this.heap[lChildI],
                rChild = this.heap[rChildI],
                bestChildIndex;
            //make sure the children exist
            if(lChild === undefined && rChild === undefined){
                //neither exist, bubbledown is done
                break;
            }else if(lChild === undefined && rChild !== undefined){
                bestChildIndex = rChildI;
            }else if(lChild !== undefined && rChild === undefined){
                bestChildIndex = lChildI;
            }else{
                bestChildIndex = this.comp(lChild,rChild,lChildI,rChildI);
            }
            
            //compare the current to the best:
            if(this.comp(this.heap[cIndex],this.heap[bestChildIndex],cIndex,bestChildIndex) === bestChildIndex){
                //swap and repeat:
                let curr = this.heap[cIndex];
                this.heap[cIndex] = this.heap[bestChildIndex];
                this.heap[bestChildIndex] = curr;
                cIndex = bestChildIndex;
            }else{
                break;
            }
        }        
    };
        

    return PriorityQueue;
});
