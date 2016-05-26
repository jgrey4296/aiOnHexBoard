/* jshint esversion : 6 */
require.config({
    baseUrl : "/src",
    paths:{
        d3 : "/libs/d3.min",
        underscore:"/libs/underscore-min",
        EL: '/libs/EL.min',
        BTree : '/libs/bTreeSimple',
        PriorityQueue : '/libs/priorityQueue',
        lodash : '/libs/lodash'
    },
    shim:{
        underscore:{
            exports:'_',
        },
    }
});

require(['d3','lodash','EL','BTree','Hexagon','BehaviourDefinitions','util'],function(d3,_,ExclusionFactBase,BTree,Hexagon,BModule,util){
    "use strict";
    console.log('Hexagon AI Behaviour Tree Test');
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
        hexBoard = new Hexagon(canvas,height,width,20,20),
        //Create the characters, place them on the board:
        baseBTree = new BTree(undefined,BModule),
        agents = [],
        //the current turn:
        turn = 0,
        //nodes that have been clicked:
        selectedNodes = [],
        //the last found path:
        priorPath = [];

    canvas.font ="20px Georgia";
    
    //Creation of agents:
    agents.push(baseBTree.newCharacter({
        name : "bob",
        colour : "grey",
        q : 0,
        r : 0,
        board : hexBoard,
        movements : movements
    }));
    agents.push(baseBTree.newCharacter({
        name : "bill",
        colour : "blue",
        q : 1,
        r : 1,
        board : hexBoard,
        movements : movements
    }));
    agents.push(baseBTree.newCharacter({
        name : "jill",
        colour : "green",
        q : 3,
        r : 5,
        board : hexBoard,
        movements : movements
    }));
    agents.push(baseBTree.newCharacter({
        name : "jim",
        colour : "yellow",
        q : 8,
        r : 2,
        board : hexBoard,
        movements : movements
    }));;

    //set debug flags for bob:
    //agents[0].setDebugFlags('binding');
    //agents[0].setDebugFlags('actions','update','cleanup','preConflictSet','postConflictSet','failure','facts');
    
    //Register the agents into the board:
    hexBoard.register(agents);
    
    //Draw the board initially:
    hexBoard.draw();
    
    //For triggering updates on a timer:
    // setInterval(function(){
    //     agents.forEach(function(d){
    //         d.update();
    //     });
    //     hexBoard.draw();
    // },500);


    //shift detection:
    let shift = false,
        selectType = 'ring',
        lineType = 'horizontal',
        ringRadius = 1;
    
    d3.select('body')
        .on('keydown',function(){
            if(d3.event.key === 'Shift'){
                shift = true;
            }else if(d3.event.key === 'l'){//draw line, select type:
                selectType = 'line';
            }else if(d3.event.key === 'h'){//horizontal
                lineType = 'horizontal';
            }else if(d3.event.key === 't'){//vert 1
                lineType = 'vertLeft';
            }else if(d3.event.key === 'u'){//vert 2
                lineType = 'vertRight';
            }else if(d3.event.key === 'p'){//pathfind
                selectType = 'path';
            }else if(d3.event.key === 'r'){//ring
                selectType = 'ring';
            }else if(!isNaN(Number(d3.event.key))){
                //set the ring radius
                ringRadius = Number(d3.event.key);
            }else{
                //update agents
                agents.forEach(function(d){
                    d.update();
                });
                hexBoard.draw();
                canvas.fillText(`Turn : ${turn++}`,400,-25);
                //console.log('---------');
            }
        })
        .on('keyup',function(){
            if(d3.event.key === 'Shift'){
                shift = false;
            }
        });
    
    //Click based selection/pathfinding:
    d3.select('canvas')
        .on('mousedown',function(){
            if(shift){
                addBlockade(d3.event,this);
            }else if(selectType === 'line'){
                drawLine(d3.event,this);
            }else if(selectType === 'ring'){
                drawRing(d3.event,this);
            }else if(selectType === 'path'){
                pathFind(d3.event,this);
            }
            hexBoard.draw();            
        });

    let pathFind = function(event,element){
            //convert the mouse click to a position in the canvas
        let pos = util.screenToElementPosition(event,element),
            //convert that to a board position
            index = hexBoard.screenToIndex(pos.x,pos.y),
            colour = shift ? "blue" : "green";
        if(index === undefined){ return; }
        //store the position
        selectedNodes.unshift(index);
            
        hexBoard.positions[index].colour = colour;
        //uncolour old positions
        if(selectedNodes.length > 2){
            let remainder = selectedNodes.splice(2);
            remainder.forEach(d=>hexBoard.positions[d].colour = 'black');
        }
        //if two positions have been selected, pathfind between
        if(selectedNodes.length === 2){
            //remove the old path
            priorPath.forEach(d=>hexBoard.positions[d].colour = "black");
            //set the new path
            let path = hexBoard.pathFind(selectedNodes[0],selectedNodes[1]);
            priorPath = path;
            path.forEach(d=>hexBoard.positions[d].colour = colour);
        }
    };
    
    let addBlockade = function(event,element){
        let mousePosition = d3.mouse(element),
            index = hexBoard.screenToIndex(mousePosition[0],mousePosition[1]);
        if(index === undefined) { return; }
        hexBoard.block(index);
    };

    let drawLine = function(event,element){
        let pos = util.screenToElementPosition(event,element),
            index = hexBoard.screenToIndex(pos.x,pos.y),
            theLine = hexBoard.getLine(index,lineType);
        hexBoard.positions[index].colour = 'purple';
        console.log('found line',theLine,index);
        theLine.forEach(d=>hexBoard.block(d,true));
    };

    let drawRing = function(event,element){
        let pos = util.screenToElementPosition(event,element),
            index = hexBoard.screenToIndex(pos.x,pos.y),
            theRing = hexBoard.getRing(index,ringRadius);
        console.log(theRing);
        hexBoard.positions[index].colour = "grey";
        theRing.forEach(d=>hexBoard.block(d,true));
    };
    
    //-----
    console.log(hexBoard);
});
