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
          AGENTS = true,
          GENMAP = true,
          height = 800,
          width = 800,
          BOARD_X_SIZE = 25,
          BOARD_Y_SIZE = 25,
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
        selectType = 'path',
        lineType = 'horizontal',
        ringRadius = 1,
        timer = null,
        //create the canvas:
        canvas = util.createCanvas("Hexagon AI Test",width,height),
        //Then create the hexagon board:
        hexBoard = new Hexagon(canvas,height,width,BOARD_X_SIZE,BOARD_Y_SIZE),
        //Create the base agent:
        baseBTree = new BTree(undefined,BModule),
        agents = createAgents(baseBTree,hexBoard,movements),
        //the current turn:
        turn = 0,
        //nodes that have been clicked:
        selectedNodes = [],
        //the last found path:
        priorPath = [],
        //debug gen map:
        generatedMap = [];

    
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
                    //todo:pass in neighbours?
                    agents.forEach(d=>d.update());
                    //agents.forEach(d=>console.log(`${d.values.name} : ${_.keys(d.allRealNodes).length}`));
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
        //clear all:
        c : ()=>hexBoard.positions.forEach(d=>{
            hexBoard.block(d.index,true);
            hexBoard.block(d.index);
        }),
        //gen map:
        '.' : ()=>{
            if(generatedMap.current === null){ return; }
            let pathsPoints = generatedMap.edges[generatedMap.current].map(d=>[generatedMap.current,Number(d)]),
                paths = pathsPoints.map(p=>hexBoard.pathFind(p[0],p[1])),
                rings = _.values(generatedMap.edges)[0].map(d=>{
                    return hexBoard.getRing(Number(d),2);
                });
            //hexBoard.positions.forEach(d=>hexBoard.block(d.index,true));
            //hexBoard.positions.forEach(d=>hexBoard.block(d.index));
            //set each path
            paths.forEach(p=>{
                p.forEach(d=>hexBoard.positions[d].colour = "green");
            });
            rings.forEach(d=>d.forEach(e=>{
                hexBoard.positions[e].colour = "yellow";
            }));

            hexBoard.positions.forEach(d=>{
                if(d.colour === 'black'){
                    hexBoard.block(d.index);
                }
            });
            
        },
        'm' : ()=>{
            generatedMap = hexBoard.genMap3();
        },
        //set the size of a ring/area
        number : n=>ringRadius = n,
        //do something when the user clicks
        click : function(event,container){
            let pos = util.screenToElementPosition(event,container),
                index = hexBoard.screenToIndex(pos.x,pos.y);
            console.log(hexBoard.positions[index]);
            if(selectType === 'line'){
                drawLine(index);
            }else if(selectType === 'ring'){
                drawRing(index);
            }else if(selectType === 'path'){
                pathFind(index);
            }
        },
    };
    
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
            hexBoard.draw();
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
    function pathFind(index,target){
        //convert the mouse click to a position in the canvas
        //let pos = util.screenToElementPosition(event,element),
        //convert that to a board position
        //  index = hexBoard.screenToIndex(pos.x,pos.y),
        let colour = shift ? "blue" : "green";
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
            let path = hexBoard.pathFind(selectedNodes[0],selectedNodes[1]);
            if(shift){
                path.forEach(d=>hexBoard.block(d,true));
            }else{
                //remove the old path
                priorPath.forEach(d=>hexBoard.positions[d].colour = "black");
                //set the new path
                path.forEach(d=>hexBoard.positions[d].colour = colour);
                priorPath = path;
            }
        }
    };

    //Find a draw a line of cells 
    function drawLine(index){
        //let pos = util.screenToElementPosition(event,element),
        //    index = hexBoard.screenToIndex(pos.x,pos.y),
        let theLine = hexBoard.getLine(index,lineType);
        hexBoard.positions[index].colour = 'purple';
        console.log('found line',theLine,index);
        theLine.forEach(d=>hexBoard.block(d,true));
    };

    //Get an area of the board
    function drawRing(index){
        //let pos = util.screenToElementPosition(event,element),
        //    index = hexBoard.screenToIndex(pos.x,pos.y),
        let theRing = hexBoard.getRing(index,ringRadius);
        hexBoard.positions[index].colour = "grey";
        theRing.forEach(d=>hexBoard.block(d,shift));
    };
    //-----

    function createAgents(baseBTree,board,movements){
        if(!AGENTS) { return []; }
        console.log('Creating Agents');
        let agents = [];
        agents.push(baseBTree.newCharacter({
            name : "bob",
            colour : "black",
            q : 0,
            r : 0,
            board : board,
            movements : movements
        }));
        agents.push(baseBTree.newCharacter({
            name : "bill",
            colour : "black",
            q : 1,
            r : 1,
            board : board,
            movements : movements
        }));
        agents.push(baseBTree.newCharacter({
            name : "jill",
            colour : "black",
            q : 3,
            r : 5,
            board : board,
            movements : movements
        }));
        agents.push(baseBTree.newCharacter({
            name : "jim",
            colour : "black",
            q : 8,
            r : 2,
            board : board,
            movements : movements
        }));

        //set debug flags for bob:
        if(DEBUG){
            agents[0].setDebugFlags('binding');
            agents[0].setDebugFlags('actions','update','cleanup','preConflictSet','postConflictSet','failure','facts');
        }
                
        //Register the agents into the board:
        hexBoard.register(agents);
        return agents;
    };
        
    console.log(hexBoard);
});
