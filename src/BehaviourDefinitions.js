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
            .children('genColour','move');
    });

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

    //Move behaviour
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



    //utility function to generate a colour. from stack overflow
    function rndColour() {
        var r = ('0' + Math.floor(Math.random() * 256).toString(16)).substr(-2), // red
            g = ('0' + Math.floor(Math.random() * 256).toString(16)).substr(-2), // green
            b = ('0' + Math.floor(Math.random() * 256).toString(16)).substr(-2); // blue
        return '#' + r + g + b;
    }
    return BModule;
});

