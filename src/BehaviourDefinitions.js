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
            .type('sequential')
            .persistent(true)
            .subgoal('genColour','moveToRandomTarget');
    });

    //----------------------------------------
    //Note : Gen colour would be better as an entry action
    //Assert a colour, once
    BModule.push(function(bTree){
        bTree.Behaviour('genColour')
            .preference(5)
            .priority(2)
            .entryCondition(a=>`!!.${a.values.name}.colour`)
            .performAction(a=>a.assert(`.${a.values.name}.colour!${rndColour()}`));
    });

    //fallback gencolour
    BModule.push(function(bTree){
        bTree.Behaviour('genColour');
    });

    //----------------------------------------
    //Simple Move behaviour, goal less
    BModule.push(function(bTree){
        bTree.Behaviour('move')
            .priority(1)
            .entryCondition(d=>`.${d.values.name}.colour!%{x}`)
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
            .entryCondition(a=>`!!.${a.values.name}.pathChosen`,
                            a=>`.${a.values.name}.colour!%{x}`)
            .subgoal('followPath');
    });

    BModule.push(function(bTree){
        bTree.Behaviour('followPath')
        //ENTRY
            .entryCondition((a,n)=>n.parent.bindings.x !== undefined)
            .entryAction(a=>{
                //choose a random place to go to
                let randomIndex = Math.floor(Math.random() * a.values.board.positions.length-1);
                a.values.pathTarget = randomIndex;
                let currentIndex = a.values.board.offsetToIndex({
                    q : a.values.q,
                    r : a.values.r
                });
                //generate a path
                a.values.path = a.values.board.pathFind(currentIndex,randomIndex);
                //store it
                a.values.pathIndex = 0;
                a.assert(`.${a.values.name}.pathChosen`);
            })
        //PERSISTENCE:
            .persistent(true)
        //persistent until the path has finished
            .persistCondition(a=>`!!.${a.values.name}.pathFollowed`,
                              a=>`.${a.values.name}.pathChosen`)
        //move along the path
            .performAction(a=>{
                a.values.board.moveTo(a.id,a.values.path[a.values.pathIndex++]);
                //Figure out when completed:
                if(a.values.pathIndex >= a.values.path.length){
                    a.assert(`.${a.values.name}.pathFollowed`);
                }
            })
        //FINISH:
            .exitAction((a,n)=>{
                let currentPos = a.values.board.offsetToIndex(a.values);
                a.values.board.colour(currentPos,n.parent.bindings.x);
                a.retract(`.${a.values.name}.pathChosen`,
                          `.${a.values.name}.pathFollowed`);
                //get rid of the path/pathindex?
                console.log("colouring",currentPos,n.parent.bindings.x);
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

