/* jshint esversion : 6 */
/*
  A Behaviour Module,
  defines an array of definition functions, which will be called by the Behaviour Tree.
*/
define(['lodash'],function(_){
    "use strict";
    let BModule = [];

    //The initial tree
    BModule.push(function(bTree){
        bTree.Behaviour('initialTree')
            .type('parallel')
            .persistent(true)
            .subgoal('genColour','meetAndGreet');
    });

    //----------------------------------------
    //Note : Gen colour would be better as an entry action
    //Assert a colour, once
    BModule.push(function(bTree){
        bTree.Behaviour('genColour')
            .preference(5)
            .priority(2)
            .entryCondition(a=>`!!.${a.values.name}.colour?`)
            .performAction(a=>a.fb.parse(`.${a.values.name}.colour!${rndColour()}`))
            .subgoal('moveToRandomTarget');
    });

    //fallback gencolour
    BModule.push(function(bTree){
        bTree.Behaviour('genColour');
    });

    //----------------------------------------
    //Simple Move behaviour, goal less
    BModule.push(function(bTree){
        bTree.Behaviour('move')
        //entry: has a colour. bind to x
            .entryCondition(d=>`.${d.values.name}.colour![1]->x?`)
        //perform: get a movement direction, move in that direction. also colour cell
            .performAction((ctx,n)=>{
                let movement = _.sample(_.values(ctx.values.movements));
                console.log(`Moving : ${movement}`);
                ctx.values.board.positions[ctx.values.board.offsetToIndex(ctx.values)].colour = n.bindings.x;
                ctx.values.board.move(ctx.id,movement);
            });
    });

    //----------------------------------------
    //Pathfind to random locations:
    BModule.push(function(bTree){
        bTree.Behaviour('moveToRandomTarget')
            .persistent(true)
        //enter if no path chosen
        //and colour set
            .entryCondition(a=>`!!.${a.values.name}.pathChosen?`,
                            a=>`.${a.values.name}.colour![1]->x?`)
            .subgoal('followPath');
    });

    //fallback move behaviour
    BModule.push(function(bTree){
        bTree.Behaviour('followPath')
            .performAction((a,n)=>{
                let neighbours = a.values.board.neighbourCells(a.values).filter(d=>d.blocked === false);
                if(neighbours.length > 0){
                    let selected = _.sample(neighbours);
                    a.values.board.moveTo(a.id,selected.index);
                }
            });
    });

    //main follow path behaviour
    BModule.push(function(bTree){
        bTree.Behaviour('followPath')
            .preference(5)
        //ENTRY
            .entryCondition((a,n)=>n.parent.bindings.x !== undefined,
                            (a,n)=>n.parent.values.bypass === undefined)
            .entryAction((a,n)=>{
                //choose a random place to go to
                let randomIndex = Math.floor(Math.random() * a.values.board.positions.length-1);
                a.values.pathTarget = randomIndex;
                let currentIndex = a.values.board.offsetToIndex({
                    q : a.values.q,
                    r : a.values.r
                });
                //generate a path
                a.values.path = a.values.board.pathFind(currentIndex,randomIndex);
                //if the path is invalid fail early
                if(a.values.path.length === 0){
                    n.parent.values.bypass = true;
                    n.informParent(a.returnTypes.fail);
                }else{                
                    //store it
                    a.values.pathIndex = 0;
                    a.fb.parse(`.${a.values.name}.pathChosen`);
                }
            })
        //PERSISTENCE:
            .persistent(true)
        //persistent until the path has finished
            .persistCondition(a=>`!!.${a.values.name}.pathFollowed?`,
                              a=>`.${a.values.name}.pathChosen?`)
        //move along the path
            .performAction(a=>{
                a.values.board.moveTo(a.id,a.values.path[a.values.pathIndex++]);
                //Figure out when completed:
                if(a.values.pathIndex >= a.values.path.length){
                    a.fb.parse(`.${a.values.name}.pathFollowed`);
                }
            })
        //FINISH:
            .exitAction((a,n)=>{
                let currentPos = a.values.board.offsetToIndex(a.values);
                a.values.board.colour(currentPos,n.parent.bindings.x);
                a.fb.parse([`!!.${a.values.name}.pathChosen`,
                          `!!.${a.values.name}.pathFollowed`]);
                //get rid of the path/pathindex?
                //console.log("colouring",currentPos,n.parent.bindings.x);
            });
    });
    //--------------------

    //Meet and Greet
    BModule.push(function(bTree){
        bTree.Behaviour('meetAndGreet')
            .type('sequential')
        //entry //none / choose preferred greeting
            .entryCondition()
            .entryAction()
        //wait //if there are no agents nearby
            .waitCondition((a,n)=>{
                let neighbours = a.values.board.neighbourCells(a.values),
                    agents = _.flatten(neighbours.filter(d=>_.keys(d.agents).length > 0).map(d=>_.values(d.agents)));
                a.values.neighbourAgents = agents;
                return a.values.neighbourAgents.length === 0;
            })
        //persist //yes, no conditions
            .persistent(true)
            .persistCondition()
        //performance // print 'hello'
            .performAction((a,n)=>{
                let selectedAgent = _.sample(a.values.neighbourAgents).values;
                a.values.greetAgent = selectedAgent;
            })
        //subgoal to say hello:
            .subgoal('sayHello')
        //exit // set last person greeted
            .exitAction();
    });


    //Say Hello Behaviour
    BModule.push(function(bTree){
        bTree.Behaviour('sayHello')
            .type('sequential')
        //agent must have been selected
            .entryCondition((a,n)=>{
                return a.values.greetAgent !== undefined;
            })
        //print hello agentname for the moment:
            .performAction((a,n)=>{
                console.log(`${a.values.name} says "hello ${a.values.greetAgent.name}"`);                
            })
        //cleanup:
            .exitAction((a,n)=>{
                delete a.values.greetAgent;
            });
        
    });
    

    //utility function to generate a colour. from stack overflow
    function rndColour() {
        var r = ('0' + Math.floor(Math.random() * 256).toString(16)).substr(-2), // red
            g = ('0' + Math.floor(Math.random() * 256).toString(16)).substr(-2), // green
            b = ('0' + Math.floor(Math.random() * 256).toString(16)).substr(-2); // blue
        return '#' + r + g + b;
    }
    return BModule;
});

