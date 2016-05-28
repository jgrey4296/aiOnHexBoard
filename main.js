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
    const DEBUG = false,
          height = 800,
          width = 800,
          BOARDX_SIZE = 50,
          BOARDY_SIZE = 50,
          movements = {
              "q" : "upLeft",
              "e" : "upRight",
              "a" : "left",
              "d" : "right",
              "z" : "downLeft",
              "c" : "downRight"
          };

    //variables to control the display:
    let shift = false,
        selectType = 'ring',
        lineType = 'horizontal',
        ringRadius = 1,
        timer = null,
    //create the canvas:
        canvas = util.createCanvas("Hexagon AI Test",width,height),
        //Then create the hexagon board:
        hexBoard = new Hexagon(canvas,height,width,BOARDX_SIZE,BOARDY_SIZE),
        //Create the base agent:
        baseBTree = new BTree(undefined,BModule),
        agents = [],
        //the current turn:
        turn = 0,
        //nodes that have been clicked:
        selectedNodes = [],
        //the last found path:
        priorPath = [];

    
    //command object for lookup
    let commands = {
        //register that shift is pressed
        Shift : ()=>{
            console.log('shift');
            shift = true;},
        //start/stop the simulation
        s : ()=>{
            if(timer === null){
                timer = setInterval(()=>{
                    agents.forEach(d=>d.update());
                    hexBoard.draw();
                    canvas.fillText(`Turn : ${turn++}`,400,-25);
                },500);                    
            }else{
                clearInterval(timer);
                timer = null;
            };
        },
        //create a line/path/ring
        l : ()=>selectType = 'line',
        p : ()=>selectType = 'path',
        r : ()=>selectType = 'ring',
        //create a particular type of line
        h : ()=>lineType = 'horizontal',
        t : ()=>lineType = 'vertLeft',
        u : ()=>lineType = 'vertRight',
        //set the size of a ring/area
        number : n=>ringRadius = n,
        //do something when the user clicks
        click : function(event,container){
            if(shift){
                addBlockade(event,container);
            }else if(selectType === 'line'){
                drawLine(event,container);
            }else if(selectType === 'ring'){
                drawRing(event,container);
            }else if(selectType === 'path'){
                pathFind(event,container);
            }
        },
    };

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
    if(DEBUG){
        agents[0].setDebugFlags('binding');
        agents[0].setDebugFlags('actions','update','cleanup','preConflictSet','postConflictSet','failure','facts');
    }
    
    //Register the agents into the board:
    hexBoard.register(agents);
    
    //Draw the board initially:
    hexBoard.draw();

    //Register key presses
    d3.select('body')
        .on('keydown',function(){
            if(commands[d3.event.key] !== undefined){
                commands[d3.event.key]();
            }else if(!isNaN(Number(d3.event.key))){
                commands.number(Number(d3.event.key));
            }
        })
        .on('keyup',function(){
            //special case
            if(d3.event.key === 'Shift'){
                shift = false;
            }
        });

    //Register mouse clicks
    d3.select('canvas')
        .on('mousedown',function(){
            commands.click(d3.event,this);
            hexBoard.draw();            
        });


    //----------------------------------------
    
    /**
       Pathfind. using the last two positions specified, run A* on them
     */    
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

    //Convert a cell to be blocked for pathfinding
    let addBlockade = function(event,element){
        let mousePosition = d3.mouse(element),
            index = hexBoard.screenToIndex(mousePosition[0],mousePosition[1]);
        if(index === undefined) { return; }
        hexBoard.block(index);
    };

    //Find a draw a line of cells 
    let drawLine = function(event,element){
        let pos = util.screenToElementPosition(event,element),
            index = hexBoard.screenToIndex(pos.x,pos.y),
            theLine = hexBoard.getLine(index,lineType);
        hexBoard.positions[index].colour = 'purple';
        console.log('found line',theLine,index);
        theLine.forEach(d=>hexBoard.block(d,true));
    };

    //Get an area of the board
    let drawRing = function(event,element){
        let pos = util.screenToElementPosition(event,element),
            index = hexBoard.screenToIndex(pos.x,pos.y),
            theRing = hexBoard.getRing(index,ringRadius);
        hexBoard.positions[index].colour = "grey";
        theRing.forEach(d=>hexBoard.block(d,true));
    };
    
    //-----
    console.log(hexBoard);
});
