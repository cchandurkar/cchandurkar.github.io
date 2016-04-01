// Create Trail
var trail = jstrails.create()
  .addControls()
  .renderTo('#controls');

// Disable Checkpoint
trail.checkpoint()._rules = [];

// Undo Redo
trail.undo(undo).redo(redo).done(function(){});

function undo(current, prev){
  addRemove(current);
}

function redo(current, next){
  addRemove(next);
}

// Undo
function addRemove(current){
  if(current.source && current.target){ // Link
    if(links.indexOf(current) > -1){ // Link was added Remove It
      removeLink(current);
    } else { // Add Link
      links.push(current);
      selected_link = link;
      selected_node = null;
      redraw();
    }
  } else { // Node
    if(nodes.indexOf(current.node) > -1){ // Node was added, remove it
      removeNode(current.node);
    } else {
      console.log(current);
      nodes.push(current.node);
      current.links.forEach(function(l){
        links.push(l);
      });
      selected_link = null;
      selected_node = current.node;
      redraw();
    }
  }
}


// Create Action
var addNodeAction = trail.createAction('addNode')
  .toString(function(d){ return 'Point Added'; })
  .inverse(function(){})
  .forward(function(){});

// Create Action
var removeNodeAction = trail.createAction('removeNode')
  .toString(function(d){ return 'Point Removed'; })
  .inverse(function(){})
  .forward(function(){});

// Add
var addLinkAction = trail.createAction('addLink')
  .toString(function(d){ return 'Link Added'; })
  .inverse(function(){})
  .forward(function(){});

// Add
var removeLinkAction = trail.createAction('removeLink')
  .toString(function(d){ return 'Link Removed'; })
  .inverse(function(){})
  .forward(function(){});

// Settings
var width = 960,
    height = 500,
    fill = d3.scale.category20(),
    nodeId = 1,
    linkId = 1;

// mouse event vars
var selected_node = null,
    selected_link = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseup_node = null;

// init svg
var outer = d3.select("#chart")
  .append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("pointer-events", "all");

var vis = outer
  .append('svg:g')
    .on("dblclick.zoom", null)
    .append('svg:g')
    .on('.zoom', rescale)
    .on("mousemove", mousemove)
    .on("mousedown", mousedown)
    .on("mouseup", mouseup)
    .call(d3.behavior.zoom());

vis.append('svg:rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'white');

// init force layout
var force = d3.layout.force()
    .size([width, height])
    .nodes([{}]) // initialize with a single node
    .linkDistance(50)
    .charge(-200)
    .on("tick", tick);

// line displayed when dragging new nodes
var drag_line = vis.append("line")
    .attr("class", "drag_line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 0);

// get layout properties
var nodes = force.nodes(),
    links = force.links(),
    node = vis.selectAll(".node"),
    link = vis.selectAll(".link");

// add keyboard callback
d3.select(window)
    .on("keydown", keydown);

redraw();

// focus on svg
// vis.node().focus();

function mousedown() {
  if (!mousedown_node && !mousedown_link) {
    // allow panning if nothing is selected
    vis.call(d3.behavior.zoom());
    vis.on('.zoom', rescale);
    return;
  }
}

function mousemove() {
  if (!mousedown_node) return;

  // update drag line
  drag_line
      .attr("x1", mousedown_node.x)
      .attr("y1", mousedown_node.y)
      .attr("x2", d3.mouse(this)[0])
      .attr("y2", d3.mouse(this)[1]);

}

function mouseup() {
  if (mousedown_node) {
    // hide drag line
    drag_line
      .attr("class", "drag_line_hidden");

    if (!mouseup_node) {

      // add node
      var point = d3.mouse(this),
        node = {x: point[0], y: point[1], id: ++nodeId},
        n = nodes.push(node);

      // select new node
      selected_node = node;
      selected_link = null;

      var link = { source: mousedown_node, target: node, id: ++linkId };

      // add link to mousedown node
      links.push(link);

      // Record Action
      trail.record(addNodeAction, {node:node, links:[link]}, null, true);

    }

    redraw();
  }
  // clear mouse event vars
  resetMouseVars();
}

function resetMouseVars() {
  mousedown_node = null;
  mouseup_node = null;
  mousedown_link = null;
}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x; })
      .attr("cy", function(d) { return d.y; });
}

// rescale g
function rescale() {
  trans=d3.event.translate;
  scale=d3.event.scale;
  vis.attr("transform", "translate(" + trans + ")" + " scale(" + scale + ")");
}

// redraw force layout
function redraw() {

  link = link.data(links, function(d){ return d.id; });

  link.enter().insert("line", ".node")
      .attr("class", "link")
      .on("mousedown",
        function(d) {
          mousedown_link = d;
          if (mousedown_link == selected_link) selected_link = null;
          else selected_link = mousedown_link;
          selected_node = null;
          redraw();
        })

  link.exit().remove();

  link.classed("link_selected", function(d) { return d === selected_link; });

  node = node.data(nodes, function(d){ return d.id; });

  node.enter().insert("circle")
      .attr("class", "node")
      .attr("r", 5)
      .on("mousedown",
        function(d) {
          // disable zoom
          vis.call(d3.behavior.zoom());
          vis.on('.zoom', null);

          mousedown_node = d;
          if (mousedown_node == selected_node) selected_node = null;
          else selected_node = mousedown_node;
          selected_link = null;

          // reposition drag line
          drag_line
              .attr("class", "link")
              .attr("x1", mousedown_node.x)
              .attr("y1", mousedown_node.y)
              .attr("x2", mousedown_node.x)
              .attr("y2", mousedown_node.y);

          redraw();
        })
      .on("mousedrag", function(d) {
          // redraw();
        })
      .on("mouseup", function(d) {
          if (mousedown_node) {
            mouseup_node = d;
            if (mouseup_node == mousedown_node) { resetMouseVars(); return; }

            // add link
            var link = {source: mousedown_node, target: mouseup_node, id:++linkId};
            links.push(link);

            // Record Action
            trail.record(addLinkAction, link, null, true);

            // select new link
            selected_link = link;
            selected_node = null;

            // enable zoom
            vis.call(d3.behavior.zoom());
            vis.on('.zoom', rescale);
            redraw();
          }
        })
    .transition()
      .duration(750)
      .ease("elastic")
      .attr("r", 6.5);

  node.exit().transition()
      .attr("r", 0)
    .remove();

  node
    .classed("node_selected", function(d) { return d === selected_node; });



  if (d3.event) {
    // prevent browser's default behavior
    d3.event.preventDefault();
  }

  force.start();

}

function spliceLinksForNode(node) {
  toSplice = links.filter(
    function(l) {
      return (l.source === node) || (l.target === node); });
      trail.record(removeNodeAction, {node: node, links: toSplice}, null, true);
  toSplice.map(
    function(l) {
      links.splice(links.indexOf(l), 1); });
}

function keydown() {
  if (!selected_node && !selected_link) return;
  switch (d3.event.keyCode) {
    case 8: // backspace
    case 46: { // delete
      if (selected_node) {
        removeNode(selected_node);
      }
      else if (selected_link) {
        removeLink(selected_link);
      }
      break;
    }
  }
}

function removeNode(selected_node){
  if (selected_node) {
    nodes.splice(nodes.indexOf(selected_node), 1);
    spliceLinksForNode(selected_node);
  }
  selected_link = null;
  selected_node = null;
  redraw();
}

function removeLink(selected_link){
  trail.record(removeLinkAction, selected_link, null, true);
  links.splice(links.indexOf(selected_link), 1);
  selected_link = null;
  selected_node = null;
  redraw();
}
