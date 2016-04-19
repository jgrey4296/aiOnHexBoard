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

require(['d3','underscore','ExclusionFactBase','BTree','Hexagon','BehaviourDefinitions','util'],function(d3,_,ExclusionFactBase,BTree,Hexagon,BModule,util){
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
    agents[0].setDebugFlags('actions','update','cleanup','preConflictSet','postConflictSet','failure','facts');
    
    //Register the agents into the board:
    hexBoard.register(agents);
    
    //run the behaviours
    hexBoard.draw();
    
    //Register key presses
    // setInterval(function(){
    //     agents.forEach(function(d){
    //         d.update();
    //     });
    //     hexBoard.draw();
    // },500);

    d3.select('body')
        .on('keydown',function(){
            agents.forEach(function(d){
                d.update();
                console.log("\n\n");
            });
            hexBoard.draw();
        });

    let selectedNodes = [],
        priorPath = [];
    
    d3.select('canvas')
        .on('mousedown',function(){
            //convert the mouse click to a position in the canvas
            let pos = util.screenToElementPosition(d3.event,this);
            pos.x -= 50;
            pos.y -= 50;
            //convert that to a board position
            let index = hexBoard.screenToIndex(pos.x,pos.y);
            //store the position
            selectedNodes.unshift(index);
            
            hexBoard.positions[index].colour = "blue";
            //uncolour old positions
            if(selectedNodes.length > 2){
                let remainder = selectedNodes.splice(2);
                remainder.forEach(d=>hexBoard.positions[d].colour = 'black');
            }
            //if two positions have been selected, pathfind between
            if(selectedNodes.length === 2){
                //remove the old path
                priorPath.forEach(d=>hexBoard.positions[d].colour = "black");
                let path = hexBoard.pathFind(selectedNodes[0],selectedNodes[1]);
                priorPath = path;
                path.forEach(d=>hexBoard.positions[d].colour = "blue");

            }
            hexBoard.draw();
        });
    


    
    
    //-----
    console.log(hexBoard);
});
