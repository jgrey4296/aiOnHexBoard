/* jshint esversion : 6 */
/**
   Hexagon and pathfinding implemented from http://www.redblobgames.com/
 */
define(['lodash','d3','util','PriorityQueue','Cube'],function(_,d3,util,PriorityQueue,Cube){
    "use strict";
    /**
       A Hexagon board representation. uses an ODD R OFFSET REPRESENTATION
       @param ctx The canvas context to draw to
       @param heigh Screen height
       @param width Screen Width
       @param columns The number of cell columns on the board
       @param rows The number of cell rows on the board
    */
    let Hexagon = function(ctx,height,width,columns,rows){
        //Offset the drawn board
        this.ctx = ctx;
        this.translationAmount = {
            x : 50,
            y : 50
        };
        ctx.translate(this.translationAmount.x,this.translationAmount.y);
        this.boardWidth = width - (this.translationAmount.x * 2);
        this.boardHeight = height - (this.translationAmount.y * 2);
        this.centre = [Math.floor(this.boardWidth*0.5),Math.floor(this.boardHeight*0.5)];
        //Board Dimensions:
        this.columns = columns || 20; //q
        this.rows = rows || 15; //r
        //Hex Dimensions:
        let cellWidth = width / columns*0.5,
            cellHeight = height / rows*0.5;
        this.radius =  Math.floor(Math.max(cellWidth,cellHeight)) || 20;
        this.hexHeight = (2 * this.radius);
        //INDIVIDUAL CELLS:
        this.positions = Array(this.columns*this.rows).fill(0).map(function(d,i){
            return {index : i, colour : "black", agents : {}};
        });
        //Current position:
        this.curIndex = this.offsetToIndex({q:0,r:0});
        //Record all registered agents used in this hexboard
        this.agents = {};
        //--------------------
        //Test Setups:
        //Generate a map:
        this.genMap();
    };

    //place an array of agents into a board position
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

    /**
       set a cell's colour
     */
    Hexagon.prototype.colour = function(index,colour){
        if(this.positions[index] === undefined){
            throw new Error('invalid position');
        }
        let position = this.positions[index];
        position.colour = colour;
    };
    

    /**
       flip flop the block tag of a cell
       @param index
       @param force - will force to blocked, short circuiting the flip flop
    */
    Hexagon.prototype.block = function(index, force){
        if(this.positions[index] === undefined){
            console.log(index);
            throw new Error('invalid position specified to block');
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

    //Convert screen coordinates to a position on the board
    Hexagon.prototype.screenToIndex = function(screenX,screenY){
        screenX -= this.translationAmount.x;
        screenY -= this.translationAmount.y;
        let q = (screenX * Math.sqrt(3)/3 - screenY/3) / this.radius,
            r = screenY * 2/3 / this.radius,
            cube = new Cube(q,-q-r,r),
            rounded = cube.round();
        try{
            return this.offsetToIndex(this.cubeToOffset(rounded));
        }catch(error){
            return undefined;
        }
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
    Hexagon.prototype.indexToCube = function(index){
        return this.offsetToCube(this.indexToOffset(index));
    };
    
    
    //offset -> index
    Hexagon.prototype.offsetToIndex = function(offset){
        if(!this.inBounds(offset)){
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
            neighbours = cube.neighbours(),
            //get offset locations
            n_offset = neighbours.map(d=>d.toOffset()),
            //filter by out of bounds
            n_offset_filtered = n_offset.filter(d=>this.inBounds(d)),
            //convert to indices
            n_indices = n_offset_filtered.map(d=>this.offsetToIndex(d)),
            //filter by out of bounds
            n_indices_filtered = n_indices.filter(d=> d >= 0 && d < positionsLength);

        return n_indices_filtered;
    };

    /**
       Move an agent, by id, to the specified cell/tile
       Removes the agent from it's prior tile
    */
    Hexagon.prototype.moveTo = function(agentId,targetTile){
        let agent = this.agents[agentId];
        if(agent === undefined){
            throw new Error('unrecognised agent');
        }
        let agentOffset = agent.values,
            oldIndex = this.offsetToIndex(agentOffset),
            newIndex = targetTile,
            //CRUCIAL LINE:
            newOffset = this.indexToOffset(targetTile);
        
        if(this.positions[newIndex] === undefined){
            return;
        }

        //update the agent's own location store
        agent.values.q = newOffset.q;
        agent.values.r = newOffset.r;
        //remove from the old position
        delete this.positions[oldIndex].agents[agentId];
        //add to the new position:
        this.positions[newIndex].agents[agentId] = agent;
    };

    
    /**
       Move the specified agent (by id), from its current position,
       to a new position, BY DIRECTION
     */    
    Hexagon.prototype.move = function(agentId,direction){
        let agent = this.agents[agentId];
        if(agent === undefined){
            throw new Error("Unrecognised agent");
        }
        let agentOffset = agent.values,
            oldIndex = this.offsetToIndex(agentOffset),
            cube = this.offsetToCube(agentOffset),
            //CRUCIAL LINE:
            moved = cube.move(direction),
            //update the agent's offset:
            newOffset = moved.toOffset(),
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

    /**
       Hex based distance, between two points
       ACCEPTS indices / offsets / cubes
       (upscales to cubes internally)
    */
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
        
        return a.distance(b);
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
       A* Pathfind from a specified index node, to target index node
       @param a as index
       @param b as index
       @returns {Array} of indices
     */
    Hexagon.prototype.pathFind = function(source,target){
        if(this.positions[source] === undefined || this.positions[target] === undefined){
            throw new Error('invalid source or target');
        }
        let hRef = this,
            frontier = new PriorityQueue(),//minimising
            cameFrom = {},//history of best moves
            costs = {},//record of costs
            path = [],//the generated path
            current = null,
            //calculate cost and add to potential nodes, update frontier
            reduceFunc = function(m,v){
                let newCost = costs[current] + hRef.costOf(v),
                    distance = hRef.distance(v,target);
                if(m[v] === undefined || newCost < costs[v] ){
                    frontier.insert(v,newCost + distance);
                    costs[v] = newCost;
                    //hRef.colour(v,"grey");
                    m[v] = current;
                }
                return m;
            },
            //filter out invalid potential neighbours
            filterFunc = function(d){
                let position = hRef.positions[d];
                if(position !== undefined && position.blocked !== true){
                    return true;
                }else{
                    return false;
                }
            };

        //start point:
        frontier.insert(source,0);
        cameFrom[source] = null;
        costs[source] = 0;

        //MAIN LOOP:
        //expand the frontier to the goal
        while(!frontier.empty()){
            current = frontier.next();
            //hRef.colour(current,"blue");
            let distance = hRef.distance(current,target);
            if(current === target || cameFrom[target] !== undefined){
                break;
            }
            let neighbourIndices = this.neighbours(current).filter(filterFunc);
            cameFrom = neighbourIndices.reduce(reduceFunc,cameFrom);
        }        
        
        //Retrace steps from target to source to construct path
        current = target;
        while(current !== null && current !== undefined){
            path.unshift(current);
            current = cameFrom[current];
        }

        //if path doesnt start with the source, pathfinding failed
        if(_.first(path) !== source){
            return [];
        }
        //return the successful path:
        return path;
    };


    /**
       Generate a map from a random path, with some random walks off that path
     */
    Hexagon.prototype.genMap = function(){
        //pathfind from between two random points
        let randPoints = _.sampleSize(this.positions,2),
            pathIndices = this.pathFind(randPoints[0].index,randPoints[1].index),
            breakPointIndices = _.sampleSize(pathIndices,Math.floor(pathIndices.length*0.2)),
            //pick points on that path and random walk along
            subPaths = breakPointIndices.map(d=>this.randomWalk(d)),
            //combine them all together:
            combinedIndices = subPaths.reduce((m,v)=>{
                return m.concat(v);
            },pathIndices),
            indicesSet = new Set(combinedIndices);
        //---------- DEBUG: 
        //colour the steps
        pathIndices.forEach(d=>this.positions[d].colour = "grey");
        subPaths.forEach(d=>d.forEach(e=>this.positions[e].colour = "orange"));
        breakPointIndices.forEach(d=>this.positions[d].colour = "yellow");
        randPoints.forEach(d=>this.positions[d.index].colour = "purple");
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

    //Given a centre and radius, get an area of cells
    Hexagon.prototype.getRing = function(i,radius){
        let centre = this.indexToCube(i),
            subCentre = centre.subtract(radius),
            addCentre = centre.add(radius),
            cubes = this.positions.map((d,i)=>this.indexToCube(i)),
            xBounded = cubes.filter(d=>subCentre.x < d.x && d.x < addCentre.x),
            yBounded = xBounded.filter(d=>subCentre.y < d.y && d.y < addCentre.y),
            zBounded = yBounded.filter(d=>subCentre.z < d.z && d.z < addCentre.z);

        return zBounded.map(d=>this.offsetToIndex(d.toOffset()));
    };
    

    //Given a centre, and a direction, get all cells on that direction
    Hexagon.prototype.getLine = function(i,direction){
        let directions = {
            horizontal : ['left','right'],
            vertLeft : ['upLeft','downRight'],
            vertRight : ['upRight','downLeft'],
        },
            chosenDirectionPair = directions[direction],
            start = this.indexToCube(i),
            foundCells = [start],
            current = start.move(chosenDirectionPair[0]);
        //dir 1
        while(this.inBounds(current)){
            foundCells.unshift(current);
            current = current.move(chosenDirectionPair[0]);
            
        }
        //dir2
        current = start.move(chosenDirectionPair[1]);
        while(this.inBounds(current)){
            foundCells.push(current);
            current = current.move(chosenDirectionPair[1]);
        }

        return foundCells.map(d=>this.offsetToIndex(d.toOffset()));
    };

    //Check an offset/cube is within bounds of the board,
    //internally use offset
    Hexagon.prototype.inBounds = function(cube){
        let offset = cube;
        if(cube instanceof Cube){
            offset = cube.toOffset();
        }
        let inBounds = !(offset.q < 0 || offset.q >= this.columns || offset.r < 0 || offset.r >= this.rows);
        return inBounds;
    };

    //----------------------------------------
    //duck type check for offset:
    function isOffset(pOffset){
        if(pOffset.q && pOffset.r){
            return true;
        }
        return false;
    }
    
    return Hexagon;
});


