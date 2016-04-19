/* jshint esversion : 6 */
/**
   Hexagon and pathfinding implemented from http://www.redblobgames.com/
 */
define(['underscore','d3','util'],function(_,d3,util){

    
    //odd r offset
    var Hexagon = function(ctx,height,width,columns,rows){
        this.centre = [width*0.5,height*0.5];
        this.boardWidth = width;
        this.boardHeight = height;
        //Hex Dimensions:
        this.radius = 20;
        this.hexHeight = (2 * this.radius);
        //Board Dimensions:
        this.columns = columns || 20; //q
        this.rows = rows || 15; //r
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

    //------------------------------
    //Utilities:
    Hexagon.prototype.screenToIndex = function(screenX,screenY){
        let q = (screenX * Math.sqrt(3)/3 - screenY/3) / this.radius,
            r = screenY * 2/3 / this.radius,
            rounded = this.round({x : q, y : -q-r, z : r});

        return this.offsetToIndex(this.cubeToOffset(rounded));
    };


    Hexagon.prototype.round = function(cube){
        let rx = Math.round(cube.x),
            ry = Math.round(cube.y),
            rz = Math.round(cube.z);

        let xd = Math.abs(rx - cube.x),
            yd = Math.abs(ry - cube.y),
            zd = Math.abs(rz - cube.z);

        if(xd > yd && xd > zd){
            rx = -ry-rz;
        }else if(yd > zd){
            ry = -rx-rz;
        }else{
            rz = -rx-ry;
        }

        return {
            x : rx,
            y : ry,
            z : rz
        };        
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
        let x = offset.q - (offset.r - (offset.r%2)) /2,
            z = offset.r,
            y = -x-z;
        
        return {
            x: x,
            y: y,
            z: z
        };
    };

    //cube -> offset
    Hexagon.prototype.cubeToOffset = function(cube){
        let col = cube.x + (cube.z - (cube.z%2)) /2,
            row = cube.z;
        
        return {
            q : col,
            r : row
        };
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
       Pathfind from a specified index node, to target index node
       @param a as index
       @param b as index
       @returns {Array} of indices
     */
    Hexagon.prototype.pathFind = function(a,b){
        if(this.positions[a] === undefined || this.positions[b] === undefined){
            throw new Error('invalid source or target');
        }
        let frontier = [],
            cameFrom = {},
            path = [],
            reduceFunc = function(m,v){
                if(m[v] === undefined){
                    frontier.push(v);
                    m[v] = current;
                }
                return m;
            };

        frontier.push(a);
        cameFrom[a] = null;

        //expand the frontier to the goal
        while(frontier.length > 0){
            let current = frontier.shift();
            if(current === b){
                break;
            }
            let neighbours = this.neighbours(current);
            cameFrom = neighbours.reduce(reduceFunc,cameFrom);
        }        

        //walk back:
        let current = b;
        while(current !== null){
            path.unshift(current);
            current = cameFrom[current];
        }
        return path;
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


