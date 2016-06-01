/* jshint esversion : 6 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define([],function(){
    "use strict";
    /**
       A 3-d cube representation for use in the hexagon board.
     */
    let Cube = function(x,y,z){
        if(z === undefined){
            //passed in an offset
            let q = x,
                r = y;
            this.x = q - (r - (r%2)) / 2;
            this.z = r;
            this.y = -this.x-this.z;
        }else{
            //normal cube construction
            this.x = x;
            this.y = y;
            this.z = z;
        }

        if(isNaN(this.x) || isNaN(this.y) || isNaN(this.z)){
            console.log('theNaN',this,x,y,z);
            throw new Error('constructed a nan');
        }        
    };

    //Scale a cube coordiate
    Cube.prototype.scale = function(v){
        return new Cube(this.x * v, this.y * v, this.z * v);
    };

    
    //Add two cubes together, either as separate coords,
    //or as one arg
    Cube.prototype.add = function(x,y,z){
        //passed in a cube or something that looks like one
        if(x instanceof Cube || (x.x !== undefined && x.y !== undefined && x.z !== undefined)){
            z = x.z;
            y = x.y;
            x = x.x;
        }else if(typeof x == 'number' && y === undefined && z === undefined){
            y = x;
            z = x;          
        }
        return new Cube(this.x + x, this.y + y, this.z + z);
    };

    //Subtract a cube
    Cube.prototype.subtract = function(x,y,z){
        //passed in a cube or something that looks like one
        if(x instanceof Cube || (x.x !== undefined && x.y !== undefined && x.z !== undefined)){
            z = x.z;
            y = x.y;
            x = x.x;
        }else if(typeof x == 'number' && y === undefined && z === undefined){
            z = x;
            y = x;
        }
        return new Cube(this.x - x,this.y - y,this.z - z);
    };

    
    //Return the offset representation of the cube
    Cube.prototype.toOffset = function(){
        if(isNaN(this.x) || isNaN(this.z)){
            console.log(this);
            throw new Error('offsetting a NaN');
        }
        let col = this.x + (this.z - (this.z%2)) / 2,
            row = this.z;
        if(isNaN(col) || isNaN(row)){
            throw new Error('produced a NaN');
        }
        return { q : col, r : row };
    };

    //Round the cube coordinates
    Cube.prototype.round = function(){
        let rounded = new Cube(Math.round(this.x), Math.round(this.y), Math.round(this.z)),
            delta = rounded.subtract(this).abs(),
            fixed = rounded.fixRoundError(delta);
        return fixed;
    };

    //Get the absolute values of a cube
    Cube.prototype.abs = function(){
        return new Cube(
            Math.abs(this.x),
            Math.abs(this.y),
            Math.abs(this.z)
        );
    };

    //Recalculate one of the params to ensure x + y + z = 0;
    Cube.prototype.fixRoundError = function(delta){
        let fixed = new Cube(this.x,this.y,this.z);
        if(delta.x > delta.y && delta.x > delta.z){
            fixed.x = -this.y-this.z;
        }else if(delta.y > delta.z){
            fixed.y = -this.x-this.z;
        }else{
            fixed.z = -this.x-this.y;
        }
        return fixed;
    };

    //Get the Logical (not actual) neighbours of a cube
    //needs filtering in hexagon to remove non-existing positions
    Cube.prototype.neighbours = function(){
        let directions = [
                [1,-1,0],[1,0,-1],[0,1,-1],
                [-1,1,0],[-1,0,1],[0,-1,1]
        ],
            neighbours = directions.map(d=>new Cube(this.x + d[0],
                                                    this.y + d[1],
                                                    this.z + d[2]));
        return neighbours;
    };

    //Given a direction, return cube coords for a cube moved in that direction
    Cube.prototype.move = function(direction){
        let deltas = {
            upLeft:   { x : 0,  y : 1,  z : -1 },
            upRight:  { x : 1,  y : 0,  z : -1 },
            left:     { x : -1, y : 1,  z :  0 },
            right:    { x : 1,  y : -1, z:   0 },
            downLeft: { x : -1, y : 0,  z :  1 },
            downRight:{ x : 0,  y : -1, z :  1 }
        };
        if(deltas[direction] === undefined){
            throw new Error('unrecognised direction: ' + direction);
        }
        let delta = deltas[direction];
        return this.add(delta);
    };

    //Calculate the distance between two cubes
    Cube.prototype.distance = function(target){
        let subAbs = this.subtract(target).abs(),
            distance = Math.floor((subAbs.x + subAbs.y + subAbs.z) * 0.5);
        // let distance = ((Math.abs(this.x - target.x)) +
        //                 (Math.abs(this.y - target.y)) +
        //                 (Math.abs(this.z - target.z))) * 0.5;
        return distance;
    };
    
    
    return Cube;
});
