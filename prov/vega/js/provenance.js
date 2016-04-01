


// swapById(1, 9);
// swapById(2, 15);
// swapById(6, 7);
// swapById(2, 15);
// swapById(6, 7);

var createProvenance = function(matrixChart){


  var swapByOrder = function(srcOrder, destOrder){

    console.log("CALLING SWAP BY ORDER:", srcOrder, destOrder);
    // Find src and dest orders for ids
    var srcNode, destNode = null;
    matrixChart.data().nodes.some(function(node){
      if(node.order == srcOrder){
        srcNode = node;
      } else if(node.order == destOrder){
        destNode = node;
      }
      if(srcNode && destNode) return true;
    });

    console.log("SWAPPING", srcNode.order, destNode.order, srcNode._id, destNode._id, srcNode.name, destNode.name);
    var tempSrcOrder = srcNode.order;
    srcNode.order = destNode.order;
    destNode.order = tempSrcOrder;

  };
  // swapByOrder(1, 2);
  // swapByOrder(2,3);
  // matrixChart.updateData();
  console.log("Chart", matrixChart);
  //
  //
  // return;

  var swapInState = function(state, srcOrder, destOrder){

    console.log("SWAP IN STATE", state, srcOrder, destOrder);
    
    // FIXME my clone
    state = state.map(function(d) { return d; });

    console.log("STATE BEFORE:", state);
    var srcIdx = state.indexOf(srcOrder);
    var destIdx = state.indexOf(destOrder);
    state[srcIdx] = destOrder;
    state[destIdx] = srcOrder;
    console.log("STATE AFTER:", state);
    
    return state;

  };

  // Create Trail
  var trail = jstrails.create()
    .attr('viz', 'matrix-reorder-shift')
    .addControls()
    .renderTo("#controls");

  // Undo redo
  trail.undo(function(current, prev){
    console.log("UNDO", current, prev);
    if (current.type == 'swaps') {
      // FIXME slow
      current.data.reverse();
      current.data.forEach(function(swap){ swapByOrder(swap.src, swap.dest); });
      current.data.reverse()
    } else if (!prev) {
      // at root
      matrixChart.signal('orderby', 'name');
    } else if (prev.type == 'orderby') {
      matrixChart.signal('orderby', prev.data)
    } else if (prev.type == 'swaps') {
      // FIXME don't use fullorder
      fullorder = prev.fullorder;
      matrixChart.data().nodes.forEach(function(d, i) { d.order = fullorder[i]; });
    }
  })
  .redo(function(current, next) {
    if (next.type == 'swaps') {
      next.data.forEach(function(swap){ swapByOrder(swap.dest, swap.src); });
    } else if (next.type == 'orderby') {
      matrixChart.signal('orderby', next.data);
    }
  })
    .done(function(){ matrixChart.update({'duration': 1000}); });

  // Add Rule
  trail.checkpoint().addRule(function(change){
    return change.nodeInMasterTrail().childNodes().length > 1;
  });

  // Get Checkpoint get checkpoint from viz
  trail.checkpoint().get(function(){
    console.log("NODES:", matrixChart.data().nodes);
    var checkData = matrixChart.data().nodes.map(function(d) { return d.order; });
    console.log("CHECK DATA", checkData);
    return checkData
  });

  // Sets checkpoint to viz
  trail.checkpoint().set(function(state) {
    //console.log("SETTING STATE:", state);
    //console.log("ORDER BEFORE:", matrixChart.data().nodes.map(function(d) { return d.order; }));
    matrixChart.data().nodes.forEach(function(d, i) { d.order = state[i]; });
    //console.log("ORDER AFTER:", matrixChart.data().nodes.map(function(d) { return d.order; }));
    // matrixChart.signal('fixedOrder', state);
    matrixChart.update({'duration': 1000});
  });

  // Create Actions - Add
  var swapAction = trail.createAction('swap')
    .toString(function(changeData){
      var statement = "Swapped " + changeData.data[0].src + '...' + changeData.data[changeData.data.length-1].dest;
      return statement;
      // changeData.data.forEach(function(d, i){
      //   statement += d.src + ' to ' + d.dest + ' & ';
      //   if(i == 3) return;
      // });
      // return statement.slice(0, -2);
    })
      .forward(function(state, changeData){
	changeData.data.forEach(function(swap){
	  state = swapInState(state, swap.dest, swap.src); });
	return state; })
      .inverse(function(state, changeData, prevData){
	console.log("INVERSE:", state, changeData, prevData);
	state = changeData.fullorder;
	// changeData.data.forEach(function(swap){
	//   state = swapInState(state, swap.src, swap.dest); });
	console.log("INVERSE DONE:", state);
	return state; });

  var orderReplay = function(orderby) {
    var state = null;
    console.log("MC:", matrixChart.data().nodes);
    if (orderby == 'name') {
      state = matrixChart.data().nodes.map(function(d) { return d.alpha; });
    } else if (orderby == 'frequency') {
      state = matrixChart.data().nodes.map(function(d) { return d.frequency; });
    } else if (orderby == 'cluster') {
      state = matrixChart.data().nodes.map(function(d) { return d.index; });
    } else if (orderby == 'user') {
      // FIXME likely wrong...
      state = matrixChart.data().nodes.map(function(d) { return d.order; });
    }
    console.log("RETURNING STATE", orderby, state);
    return state;
  }
  
  var orderbyAction = trail.createAction('orderby')
      .toString(function(changeData) {
	console.log("CHANGE DATA", changeData);
	var data = changeData.data;
	return data.charAt(0).toUpperCase() + data.slice(1) + " Ordering";
      })
      .forward(function(state, curData) {
	console.log("ORDERING FORWARD:", curData);
	//matrixChart.signal('ordering', curData.data);
	var orderby = curData.data;
	return orderReplay(orderby);
      })
      .inverse(function(state, curData, prevData) {
	if (prevData.type == 'swaps') {
	  return swapAction.inverse()(state, prevData);
	}
	console.log("ORDERING BACKWARD:", prevData, curData);
	var orderby = prevData.data;
	console.log("PREVDATA:", prevData);
	return orderReplay(orderby);
	//matrixChart.signal('orderby', prevData.data);
      });
  
  // Hold
  var swaps = [];

  matrixChart.onSignal('src', function(name, src){
    if(!src._id && swaps.length){
      var data = {'type': 'swaps',
		  'data': swaps,
		  // FIXME wasteful but don't have time to fix
		  'fullorder': matrixChart.data().nodes.map(function(d) { return d.order; })};
      console.log("RECORD:", matrixChart.data().nodes.map(function(d) { return d.order; }));
      trail.record(swapAction, data, function(change){
	setTimeout(function() { change.setThumbnail(matrixChart.toImageURL()) }, 1200);
      });
      console.log("Swap", swaps);
      swaps = [];
    }
  });

  // Update Order
  matrixChart.onSignal('destOrder', function(name, order){
    if(order){
      var srcOrder = matrixChart.signal('dest').order;
      var destOrder = matrixChart.signal('src').order;
      if(srcOrder !== destOrder)
      swaps.push({src: matrixChart.signal('dest').order, dest: matrixChart.signal('src').order});
    }
  });

  matrixChart.onSignal('orderby', function(name, orderby) {
    // orderby 'user' will be captured by the swap
    if (orderby != 'user') {
      var data = {'type': 'orderby',
		  'data': orderby};
      console.log("RECORD:", matrixChart.data().nodes.map(function(d) { return d.order; }));
      trail.record(orderbyAction, data, function(change) {
	setTimeout(function() { change.setThumbnail(matrixChart.toImageURL()) }, 1200);
      });
    }
  });

  console.log(trail);
  console.log(trail.currentChange());
  setTimeout(function() { trail.currentChange().setThumbnail(matrixChart.toImageURL()) }, 500);  

};
