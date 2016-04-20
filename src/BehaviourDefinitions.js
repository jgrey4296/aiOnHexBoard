/* jshint esversion : 6 */
/*
  A Behaviour Module,
  defines an array of definition functions, which will be called by the Behaviour Tree.
*/
define(['underscore'],function(_){
    "use strict";
    let BModule = [];

    //The initial tree
    BModule.push(function(bTree){
        bTree.Behaviour('initialTree')
            .type('sequential')
            .persistent(true)
            .children('genColour','moveToRandomTarget');
    });

    //----------------------------------------
    //Note : Gen colour would be better as an entry action
    //Assert a colour, once
    BModule.push(function(bTree){
        bTree.Behaviour('genColour')
            .specificity(5)
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
            .type('sequential')
            .children('pathFind','followPath','finishPath');
    });

    //generate the path:
    //note: this would be better as an entry condition
    BModule.push(function(bTree){
        bTree.Behaviour('pathFind')
        //a path hasnt been chosen
            .entryCondition(a=>`!!.${a.values.name}.pathChosen`)
        //pick a target, generate the path from the board
            .performAction(a=>{
                console.log('finding path');
                let randomIndex = Math.floor(Math.random() * a.values.board.positions.length-1);
                a.values.pathTarget = randomIndex;
                let currentIndex = a.values.board.offsetToIndex({
                    q : a.values.q,
                    r : a.values.r
                });
                //store the path
                a.values.path = a.values.board.pathFind(currentIndex,randomIndex);
                a.values.pathIndex = 0;
                a.assert(`.${a.values.name}.pathChosen`);
            });
    });
    

    BModule.push(function(bTree){
        bTree.Behaviour('followPath')
            .persistent(true)
            .entryCondition(a=>`.${a.values.name}.pathChosen`)
        //persistent until the path has finished
            .persistCondition(a=>`!!.${a.values.name}.pathFollowed`)
        //move along the path
            .performAction(a=>{
                a.values.board.moveTo(a.id,a.values.path[a.values.pathIndex++]);
                if(a.values.pathIndex >= a.values.path.length){
                    a.assert(`.${a.values.name}.pathFollowed`);
                }
            });

    });

    //cleanup the behaviour
    //note: this would be better as a finish action
    BModule.push(function(bTree){
        bTree.Behaviour('finishPath')
            .entryCondition(a=>`.${a.values.name}.colour!%{x}`)
            .performAction((a,n)=>{
                console.log('finishing path');
                let currentPos = a.values.board.offsetToIndex(a.values);
                a.values.board.colour(currentPos,n.bindings.x);
                a.retract(`.${a.values.name}.pathChosen`,
                          `.${a.values.name}.pathFollowed`);
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

