/* jshint esversion : 6 */
if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define([],function(){
    "use strict";
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
    };

    Cube.prototype.add = function(x,y,z){
        console.log('adding',x,y,z);
        console.log('source',this);
        if(x instanceof Cube || (x.x !== undefined && x.y !== undefined && x.z !== undefined)){
            z = x.z;
            y = x.y;
            x = x.x;
        }
        let newCube = new Cube(this.x + x, this.y + y, this.z + z);
        console.log('result',newCube);
        console.log('\n');
        return newCube;
    };

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

    Cube.prototype.round = function(){
        let rounded = new Cube(Math.round(this.x), Math.round(this.y), Math.round(this.z)),
            delta = rounded.subtract(this).abs(),
            fixed = rounded.fixRoundError(delta);
        return fixed;
    };

    Cube.prototype.subtract = function(cube){
        return new Cube(
            this.x - cube.x,
            this.y - cube.y,
            this.z - cube.z
        );
    };

    Cube.prototype.abs = function(){
        return new Cube(
            Math.abs(this.x),
            Math.abs(this.y),
            Math.abs(this.z)
        );
    };

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

    Cube.prototype.distance = function(target){
        let distance = ((Math.abs(this.x - target.x))
                        + (Math.abs(this.y - target.y))
                        + (Math.abs(this.z - target.z))) * 0.5;
        return distance;
    };
    
    
    return Cube;
});