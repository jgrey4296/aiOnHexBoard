define(['underscore','d3'],function(_,d3){

    var util = {};

    /**
       draw an arbitrary sided polygon, 
       potentially rotated to have a point or a flat top
     */
    util.drawPolygon = function(ctx,centre,radius,polygonNumber,flatTopped,fillColour){
        if(fillColour !== undefined){
            //console.log("Drawing colour:",fillColour);
            ctx.fillStyle = fillColour;
            ctx.beginPath();
            var p1 = util.calcPoint(centre,radius,0,polygonNumber,flatTopped);
            ctx.moveTo(Math.floor(p1[0]),Math.floor(p1[1]));
            Array(polygonNumber).fill(0).forEach(function(d,i){
                p1 = util.calcPoint(centre,radius,i,polygonNumber,flatTopped),
                ctx.lineTo(Math.floor(p1[0]),Math.floor(p1[1]));
            });
            ctx.fill();
        }

        ctx.strokeStyle = "grey";
        ctx.beginPath();
        Array(polygonNumber).fill(0).forEach(function(d,i){
            var p1 = util.calcPoint(centre,radius,i,polygonNumber,flatTopped),
                p2 = util.calcPoint(centre,radius,i+1,polygonNumber,flatTopped);
            ctx.moveTo(Math.floor(p1[0]),Math.floor(p1[1]));
            ctx.lineTo(Math.floor(p2[0]),Math.floor(p2[1]));
            });
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.fillRect(centre[0]-2,centre[1]-2,4,4);
    };

    //calculate the ith vertex position of a polygon
    util.calcPoint = function(centre,radius,i,polygon,flatTopped){
        var rotate = (2*Math.PI)/polygon,
            rotateAmt = flatTopped ? i*rotate+(rotate*0.5) : i*rotate;
            pointX = centre[0] + (Math.sin(rotateAmt) * radius),
        pointY = centre[1] + (Math.cos(rotateAmt) * radius);
        return [pointX,pointY];
    };

    util.strokeCircle = function(ctx,xpos,ypos,radius){
        ctx.beginPath();
        ctx.arc(xpos,ypos,radius,0,2*Math.PI);
        ctx.stroke();
    };
    
    
    return util;
});
