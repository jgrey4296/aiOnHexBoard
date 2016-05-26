if(typeof define !== 'function'){
    var define = require('amdefine')(module);
}

define([],function(){
    "use strict";
    let Cube = function(x,y,z){
        this.x = x;
        this.y = y;
        this.z = z;
    };

    Cube.prototype.add = function(x,y,z){
        if(x instanceof Cube){
            z = x.z;
            y = x.y;
            x = x.x;
        }
        return new Cube(this.x + x, this.y + y, this.z = z);
    };

    Cube.prototype.toOffset = function(){
        let col = Math.floor(this.x + (this.z - (this.z%2)) / 2),
            row = this.z;
        return { q : col, r : row };
    };

    Cube.prototype.round = function(){
        let rounded = new Cube(Math.round(this.x), Math.round(this.y), Math.round(this.z)),
            delta = rounded.subtract(this),
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

    
    
    return Cube;
});
