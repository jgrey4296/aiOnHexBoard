require.config({
    baseUrl : "/src",
    paths:{
        d3 : "/libs/d3.min",
        underscore:"/libs/underscore-min",
        ExclusionFactBase: '/libs/ExclusionFactBase',
        BTree : '/libs/bTreeSimple'
    },
    shim:{
        underscore:{
            exports:'_',
        },
    }
});

require(['d3','underscore','ExclusionFactBase','BTree','Hexagon'],function(d3,_,ExclusionFactBase,BTree,Hexagon){
    console.log('initial');
    let height = 800,
        width = 800;
    
    //Create a Canvas helper function:
    function drawCanvas(name,before){
        var group = d3.select('body').insert("p",before).attr("id",name),
            title = group.append('h1').text(name),
            canvas = group.append("canvas")
            .attr("width",width)
            .attr("height",height),
            ctx = canvas.node().getContext("2d");
        ctx.strokeRect(0,0,width,height);
        return ctx;
    }

    //create the canvas:
    let canvas = drawCanvas("Hexagon AI Test"),
    //Then create the hexagon board:
        hexBoard = new Hexagon(canvas,height,width);
    hexBoard.draw();

    //Create the characters, place them on the board:
    let baseBTree = new BTree(),
        bob = baseBTree.newCharacter({
            name : "bob",
            q : 0,
            r : 0,
            baseTile : { colour : "black" }
        }),
        bill = baseBTree.newCharacter({
            name : "bill",
            q : 0,
            r : 1,
            baseTile : { colour : "black" }
        });

    //run the behaviours

    
    
    //Register key presses
    // d3.select('body').on('keyup',function(){
    //     var event = d3.event,
    //         movements = {
    //             "q" : "upLeft",
    //             "e" : "upRight",
    //             "a" : "left",
    //             "d" : "right",
    //             "z" : "downLeft",
    //             "c" : "downRight"
    //         };
    
    //     //if valid movement, move
    //     if(movements[d3.event.key] !== undefined){
    //     var newIndex = move(curIndex,movements[d3.event.key]);
    //         if(newIndex >= 0 && newIndex < positions.length){
    //             curIndex = newIndex;
    //         }
    //     }
    // });
    //-----
    //console.log("Positions:",positions);
    //console.log(curIndex);

    
});
