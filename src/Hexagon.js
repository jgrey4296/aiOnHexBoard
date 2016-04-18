define(['underscore','d3','util'],function(_,d3,util){

    //odd r offset
    var Hexagon = function(ctx,height,width,columns,rows){
        this.centre = [width*0.5,height*0.5];
        //Hex Dimensions:
        this.radius = 20;
        this.height = (2 * this.radius);
        //Board Dimensions:
        this.columns = columns || 20; //q
        this.rows = rows || 15; //r
        this.positions = Array(this.columns*this.rows).fill(0).map(function(d){
            return {colour : "black"};
        });
        this.count = 0,
        //Current position:
        this.curIndex = this.offsetToIndex({q:0,r:0});
        //Offset the entire board
        this.ctx = ctx;
        ctx.translate(50,50);
    };

    /**
       Draw the actual board
     */
    Hexagon.prototype.draw = function(){
        //Clear the screen
        this.ctx.clearRect(0,0,this.width,this.height);
        //draw each hexagon
        this.positions.forEach(function(d,i){
            let screenPos = this.indexToScreen(i,this.radius);
            util.drawPolygon(this.ctx,[screenPos.x,screenPos.y],this.radius,6,false,d.colour);
        },this);
    };

    //------------------------------
    //Utilities:

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
        return this.offsetToCube(indexToOffset(offset));
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
        }
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

    //get neighbours of a hexagon
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

    //Movement:
    Hexagon.prototype.move = function(currentIndex,direction){
        let moveDeltas = {
            upLeft:   { x : 0,  y : 1,  z : -1 },
            upRight:  { x : 1,  y : 0,  z : -1 },
            left:     { x : -1, y : 1,  z : 0  },
            right:    { x : 1,  y : -1, z: 0   },
            downLeft: { x : -1, y : 0,  z : 1  },
            downRight:{ x : 0,  y : -1, z : 1  }
        },
            cube = this.offsetToCube(this.indexToOffset(currentIndex));

        if(moveDeltas[direction] === undefined){
            throw new Error("Unrecognised direction:",direction);
        }
        let delta = moveDeltas[direction];
        cube.x += delta.x;
        cube.y += delta.y;
        cube.z += delta.z;
        return this.offsetToIndex(this.cubeToOffset(cube));
    };

    
    return Hexagon;
});


