/* jshint esversion : 6 */
define(['underscore'],function(_){

    let BModule = [];

    BModule.push(function(bTree){
        bTree.Behaviour('initialTree')
            .type('parallel')
            .persistent(true)
            .children('move');
    });

    BModule.push(function(bTree){
        bTree.Behaviour('move')
        //no entry condition
            .performAction((ctx,n)=>{
                console.log('moving');
                ctx.values.board.move(ctx.id,_.sample(_.values(ctx.values.movements)));
            });
    });

    
    return BModule;
});
