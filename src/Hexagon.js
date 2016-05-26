/* jshint esversion : 6 */
/**
   Hexagon and pathfinding implemented from http://www.redblobgames.com/
 */
define(['lodash','d3','util','PriorityQueue','Cube'],function(_,d3,util,PriorityQueue,Cube){

    
    //odd r offset
    var Hexagon = function(ctx,height,width,columns,rows){
        this.centre = [width*0.5,height*0.5];
        this.boardWidth = width;
        this.boardHeight = height;
        //Board Dimensions:
        this.columns = columns || 20; //q
        this.rows = rows || 15; //r
        //Hex Dimensions:
        //todo: use max of width/columns vs height/rows
        this.radius =  Math.floor(width / columns*0.5) || 20;
        this.hexHeight = (2 * this.radius);
        //store each individual board element:
        this.positions = Array(this.columns*this.rows).fill(0).map(function(d){
            return {colour : "black", agents : {}};
        });
        this.count = 0;
        //Current position:
        this.curIndex = this.offsetToIndex({q:0,r:0});
        //Offset the drawn board
        this.ctx = ctx;
        this.translationAmount = {
            x : 50,
            y : 50
        };
        ctx.translate(this.translationAmount.x,this.translationAmount.y);
        //Record all registered agents used in this hexboard
        this.agents = {};

        //Generate a map:
        //this.genMap();
    };

    //place an agent into a board position
    Hexagon.prototype.register = function(agents){
        agents.forEach(function(d){
            let index = this.offsetToIndex(d.values);
            this.positions[index].agents[d.id] = d;
            this.agents[d.id] = d;
        },this);
    };
    
    /**
       Draw the actual board
     */
    Hexagon.prototype.draw = function(){
        //Clear the screen
        this.ctx.clearRect(-this.translationAmount.x,-this.translationAmount.y,this.boardWidth,this.boardHeight);
        //draw each hexagon
        this.positions.forEach(function(d,i){
            let screenPos = this.indexToScreen(i,this.radius),
                colour = _.keys(d.agents).length > 0 ? _.first(_.values(d.agents)).values.colour : d.colour;
            util.drawPolygon(this.ctx,[screenPos.x,screenPos.y],this.radius,6,false,colour);
        },this);
    };

    Hexagon.prototype.colour = function(index,colour){
        if(this.positions[index] === undefined){
            throw new Error('invalid position');
        }
        let position = this.positions[index];
        position.colour = colour;
    };
    

    //flip flopping
    Hexagon.prototype.block = function(index, force){
        if(this.positions[index] === undefined){
            console.log(index);
            throw new Error('invalid position');
        }
        let position = this.positions[index];
        if(position.blocked !== true || force === true){
            position.colour = "red";
            position.blocked = true;
        }else{
            position.colour = "black";
            position.blocked = false;
        }
    };

    
    //------------------------------
    //Utilities:
    Hexagon.prototype.screenToIndex = function(screenX,screenY){
        screenX -= this.translationAmount.x;
        screenY -= this.translationAmount.y;
        let q = (screenX * Math.sqrt(3)/3 - screenY/3) / this.radius,
            r = screenY * 2/3 / this.radius,
            rounded = this.round({x : q, y : -q-r, z : r});

        try{
            return this.offsetToIndex(this.cubeToOffset(rounded));
        }catch(error){
            return undefined;
        }
    };


    Hexagon.prototype.round = function(cube){
        return cube.round();
    };
    
    //index -> screen position
    Hexagon.prototype.indexToScreen = function(index,radius){
        let offset = this.indexToOffset(index), //location
            xInc = (radius) * Math.sqrt(3) * (offset.q + 0.5 * (offset.r&1)),
            //yInc = (2 * radius) * (3/4); //screen y translation
            yInc = (radius) * (3/2) * offset.r;
        return {
            //x: offset.r&1 ? xInc + (offset.q * 2*xInc) : offset.q * 2*xInc,
            x : xInc,
            y : yInc
            //y: offset.r * yInc
        };
    };

    //index -> cube
    Hexagon.prototype.indexToCube = function(offset){
        return this.offsetToCube(this.indexToOffset(offset));
    };
    
    
    //offset -> index
    Hexagon.prototype.offsetToIndex = function(offset){
        if(offset.q < 0 || offset.q > this.columns || offset.r < 0 || offset.r > this.rows){
            throw new Error('out of bounds');
        }
        return (offset.q) + (offset.r * this.columns);
    };
    
    //index -> offset
    Hexagon.prototype.indexToOffset = function(i){
        return {
            q : Math.floor(i%this.columns),
            r : Math.floor(i/this.columns)
        };
    };
    
    //offset -> cube
    Hexagon.prototype.offsetToCube = function(offset){
        return new Cube(offset.q, offset.r);
    };

    //cube -> offset
    Hexagon.prototype.cubeToOffset = function(cube){
        return cube.toOffset();
    };

    /**
       neighbours : Get the 6 neighbours of a node,
       filters invalid neighbours
       @param index The central node, as an index
       @returns {Array} Array of indices of neighbours
     */
    Hexagon.prototype.neighbours = function(index){
        let positionsLength = this.positions.length,
            rows = this.rows,
            columns = this.columns,
            cube = this.offsetToCube(this.indexToOffset(index)),
            directions = [
                [1,-1,0],[1,0,-1],[0,1,-1],
                [-1,1,0],[-1,0,1],[0,-1,1]
            ],
            neighbours = directions.map(function(d){
                return {
                    x: cube.x + d[0],
                    y: cube.y + d[1],
                    z: cube.z + d[2]
                };
            }),
            //get offset locations
            n_offset = neighbours.map(d=>this.cubeToOffset(d)),
            //filter by out of bounds
            n_offset_filtered = n_offset.filter(function(d){
                return !(d.q < 0 || d.q >= columns || d.r < 0 || d.r >= rows);
            }),
            //convert to indices
            n_indices = n_offset_filtered.map(d=>this.offsetToIndex(d)),
            //filter by out of bounds
            n_indices_filtered = n_indices.filter(d=> d >= 0 && d < positionsLength);

        return n_indices_filtered;
    };

    Hexagon.prototype.moveTo = function(agentId,targetTile){
        let agent = this.agents[agentId];
        if(agent === undefined){
            throw new Error('unrecognised agent');
        }
        let agentOffset = agent.values,
            oldIndex = this.offsetToIndex(agentOffset),
            newIndex = targetTile,
            newOffset = this.indexToOffset(targetTile);
        
        if(this.positions[newIndex] === undefined){
            return;
        }
        
        agent.values.q = newOffset.q;
        agent.values.r = newOffset.r;
        //remove from the old position
        delete this.positions[oldIndex].agents[agentId];
        //add to the new position:
        this.positions[newIndex].agents[agentId] = agent;
   
    };

    
    /**
       Move the specified agent (by id), from its current position,
       to a new position
     */    
    Hexagon.prototype.move = function(agentId,direction){
        let agent = this.agents[agentId];
        if(agent === undefined){
            throw new Error("Unrecognised agent");
        }
        let moveDeltas = {
            upLeft:   { x : 0,  y : 1,  z : -1 },
            upRight:  { x : 1,  y : 0,  z : -1 },
            left:     { x : -1, y : 1,  z :  0 },
            right:    { x : 1,  y : -1, z:   0 },
            downLeft: { x : -1, y : 0,  z :  1 },
            downRight:{ x : 0,  y : -1, z :  1 }
        },
            agentOffset = agent.values,
            oldIndex = this.offsetToIndex(agentOffset),
            cube = this.offsetToCube(agentOffset);

        if(moveDeltas[direction] === undefined){
            throw new Error("Unrecognised direction:",direction);
        }
        let delta = moveDeltas[direction];
        cube.x += delta.x;
        cube.y += delta.y;
        cube.z += delta.z;

        //update the agent's offset:
        let newOffset = this.cubeToOffset(cube),
            newIndex = this.offsetToIndex(newOffset);
        if(this.positions[newIndex] === undefined){
            return;
        }
        agent.values.q = newOffset.q;
        agent.values.r = newOffset.r;

        //remove from the old position
        delete this.positions[oldIndex].agents[agentId];
        //add to the new position:
        this.positions[newIndex].agents[agentId] = agent;
    };

    //Hex based distance
    Hexagon.prototype.distance = function(a,b){
        if(typeof a === 'number'){
            a = this.indexToCube(a);
        }else if(isOffset(a)){
            a = this.offsetToCube(a);
        }
        if(typeof b === 'number'){
            b = this.indexToCube(b);
        }else if(isOffset(b)){
            b = this.offsetToCube(b);
        }
        
        return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) * 0.5;
    };

    /**
       Calculate the cost of a tile
     */
    Hexagon.prototype.costOf = function(tileIndex){
        let tile = this.positions[tileIndex];
        if(tile === undefined || tile.blocked){
            return Infinity;
        }
        if(tile.cost === undefined){
            return 1;
        }else{
            return tile.cost;
        }        
    };
    
    /**
       Pathfind from a specified index node, to target index node
       @param a as index
       @param b as index
       @returns {Array} of indices
     */
    Hexagon.prototype.pathFind = function(a,b){
        //console.log('Source:',a,'Target:',b);
        if(this.positions[a] === undefined || this.positions[b] === undefined){
            throw new Error('invalid source or target');
        }
        let hRef = this,
            frontier = new PriorityQueue(),//minimising
            cameFrom = {},
            costs = {},
            path = [],
            current = null,
            reduceFunc = function(m,v){
                let newCost = costs[current] + hRef.costOf(v),
                    distance = hRef.distance(v,b);
                if(m[v] === undefined || newCost < costs[v] ){
                    frontier.insert(v,newCost + distance);
                    costs[v] = newCost;
                    //hRef.colour(v,"grey");
                    m[v] = current;
                }
                return m;
            },
            filterFunc = function(d){
                let position = hRef.positions[d];
                if(position !== undefined && position.blocked !== true){
                    return true;
                }else{
                    return false;
                }
            };

        //start point:
        frontier.insert(a,0);
        cameFrom[a] = null;
        costs[a] = 0;

        //expand the frontier to the goal
        while(!frontier.empty()){
            current = frontier.next();
            //hRef.colour(current,"blue");
            let distance = hRef.distance(current,b);
            if(current === b || cameFrom[b] !== undefined){
                break;
            }
            let neighbourIndices = this.neighbours(current).filter(filterFunc);
            cameFrom = neighbourIndices.reduce(reduceFunc,cameFrom);
        }        
        
        //walk back:
        current = b;
        while(current !== null && current !== undefined){
            path.unshift(current);
            current = cameFrom[current];
        }
        //TODO: check that an empty path is returned for failure
        return path;
    };


    Hexagon.prototype.genMap = function(){
        //block some random points:
        //_.sampleSize(this.positions.map((d,i)=>i),Math.floor(this.positions.length*0.2)).forEach(d=>this.block(d));        
        //pathfind from between two random points
        let randPoints = _.sampleSize(this.positions.map((d,i)=>i),2),
            pathIndices = this.pathFind(randPoints[0],randPoints[1]),
            breakPointIndices = _.sampleSize(pathIndices,Math.floor(pathIndices.length*0.2)),
            //pick points on that path and random walk along
            subPaths = breakPointIndices.map(d=>this.randomWalk(d)),
            //combine them all together:
            combinedIndices = subPaths.reduce((m,v)=>{
                return m.concat(v);
            },pathIndices),
            indicesSet = new Set(combinedIndices);

        console.log(randPoints,pathIndices,subPaths);
        
        pathIndices.forEach(d=>this.positions[d].colour = "grey");
        subPaths.forEach(d=>d.forEach(e=>this.positions[e].colour = "orange"));
        breakPointIndices.forEach(d=>this.positions[d].colour = "yellow");
        randPoints.forEach(d=>this.positions[d].colour = "purple");
        
    };

    //Take a random walk from the startpoint
    Hexagon.prototype.randomWalk = function(startPoint){
        let len = Math.floor(2 + Math.random() * 10),
            subPath = [startPoint];
        for(let i = 0; i < len; i++){
            let neighbourIndices = this.neighbours(_.last(subPath)),
                neighbours = _.reject(neighbourIndices.map(d=>[d,this.positions[d]]),d=>d[1].blocked === true);
            subPath.push(_.sample(neighbours)[0]);            
        }
        return subPath;        
    };


    Hexagon.prototype.getLine = function(i,direction){
        let directions = {
            horizontal : [{ x : 1 , y : -1, z : 0 }, { x : -1, y : 1, z : 0}],
            vertLeft : [{x : 0, y : 1, z : -1},{x : 0, y : -1, z : 1}],
            vertRight : [{x : 1, y : 0, z : -1},{x: -1, y : 0, z : 1}]
        },
            start = this.indexToCube(i),
            foundCells = [];

        let current = this.positions[i],
            currentPosition = start;
        while(current !== undefined){
            foundCells.push(current);
            
        }

        
    };
    

    //----------------------------------------
    //simple utilities
    function isOffset(pOffset){
        if(pOffset.q && pOffset.r){
            return true;
        }
        return false;
    }

    function isCube(pCube){
        if(pCube.x && pCube.y && pCube.z){
            return true;
        }
        return false;
    }

    
    return Hexagon;
});


