# AI On a Hex Board

Running some behaviour tree based agents on an html canvas [RedBlob](http://www.redblobgames.com/grids/hexagons/)
based hex board.

## Dependencies:
[lodash](https://lodash.com/)  
[NodeUnit](https://github.com/caolan/nodeunit) for unit tests  
[d3](https://d3js.org)  
[ExclusionLogic](https://github.com/jgrey4296/exclusionLogic)  
[BehTree](https://github.com/jgrey4296/behTree)  
[PriorityQueue](https://github.com/jgrey4296/priorityQueue.js)  

## Running the page
Use a python simple http server (`python -m SimpleHTTPServer 8888`) on the root directory, and open your web browser to `localhost:8888`. Press space to increment the ai.

## Behaviour Definitions
[`src/BehaviourDefinitions.js`](https://github.com/jgrey4296/aiOnHexBoard/blob/master/src/BehaviourDefinitions.js) is of primary interest, showing simple examples of defining behaviours for the agents to enact.
