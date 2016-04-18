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

require(['d3','underscore','ExclusionFactBase','BTree','Hexagon','BehaviourDefinitions'],function(d3,_,ExclusionFactBase,BTree,Hexagon,BModule){
    console.log('initial');
    let height = 800,
        width = 800,
        movements = {
            "q" : "upLeft",
            "e" : "upRight",
            "a" : "left",
            "d" : "right",
            "z" : "downLeft",
            "c" : "downRight"
        };

    
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

    //Create the characters, place them on the board:
    let baseBTree = new BTree(undefined,BModule),
        agents = [];
    agents.push(baseBTree.newCharacter({
        name : "bob",
        colour : "red",
        q : 0,
        r : 0,
        baseTile : { colour : "black" },
        board : hexBoard,
        movements : movements
    }));
    agents.push(baseBTree.newCharacter({
        name : "bill",
        colour : "blue",
        q : 1,
        r : 1,
        baseTile : { colour : "black" },
        board : hexBoard,
        movements : movements
    }));
    //Register the agents into the board:
    hexBoard.register(agents);
    
    //run the behaviours
    hexBoard.draw();
    
    //Register key presses
    d3.select('body').on('keyup',function(){
        agents.forEach(function(d){
            d.update();
        });
        hexBoard.draw();
    });

    //-----
    console.log(hexBoard);
});
